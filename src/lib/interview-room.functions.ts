import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type VoiceId = "elena" | "kira";
export type SessionStatus =
  | "setup"
  | "in_progress"
  | "ended_early"
  | "completed"
  | "debrief_generating"
  | "done"
  | "failed";

export type AiTurn = { text: string; kind: "question" | "followup" | "remark" | "closing"; done: boolean };

export type Debrief = {
  overall: number;
  verdict: string;
  star: { situation: number; task: number; action: number; result: number };
  delivery_feedback: string;
  per_question: Array<{ question: string; answer: string; score: number; feedback: string; exemplar: string }>;
  top_tips: string[];
  duration_sec: number;
};

export const getVoicePreference = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select("preferred_voice")
      .eq("id", context.userId)
      .maybeSingle();
    const v = (data as { preferred_voice?: string } | null)?.preferred_voice;
    return { voice: (v === "kira" ? "kira" : "elena") as VoiceId };
  });

export const saveVoicePreference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ({ voice: ((d as { voice?: string })?.voice === "kira" ? "kira" : "elena") as VoiceId }))
  .handler(async ({ data, context }) => {
    await context.supabase.from("profiles").update({ preferred_voice: data.voice }).eq("id", context.userId);
    return { voice: data.voice };
  });

export const getRoomAttempts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const since = new Date(Date.now() - 24 * 3600_000).toISOString();
    const { data } = await context.supabase
      .from("assessment_results")
      .select("created_at")
      .eq("kind", "interview")
      .gte("created_at", since)
      .order("created_at", { ascending: true });
    const used = data?.length ?? 0;
    const first = data?.[0]?.created_at ?? null;
    return {
      used,
      max: 2,
      remaining: Math.max(0, 2 - used),
      locked: used >= 2,
      unlocksAt: first ? new Date(new Date(first).getTime() + 24 * 3600_000).toISOString() : null,
    };
  });

export const startSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => {
    const x = (d ?? {}) as Record<string, unknown>;
    return {
      track: typeof x.track === "string" ? x.track.slice(0, 40) : "software",
      role: typeof x.role === "string" ? x.role.slice(0, 120) : "",
      level: typeof x.level === "string" ? x.level.slice(0, 20) : "Entry",
      voice: (x.voice === "kira" ? "kira" : "elena") as VoiceId,
      highlights: typeof x.highlights === "string" ? x.highlights.slice(0, 2000) : "",
      questionBudget: Math.max(3, Math.min(10, Number(x.questionBudget) || 5)),
    };
  })
  .handler(async ({ data, context }) => {
    const since = new Date(Date.now() - 24 * 3600_000).toISOString();
    const { count } = await context.supabase
      .from("assessment_results")
      .select("id", { count: "exact", head: true })
      .eq("kind", "interview")
      .gte("created_at", since);
    if ((count ?? 0) >= 2) {
      throw new Error("Attempt limit reached. You can run 2 interviews per 24 hours.");
    }

    const { data: row, error } = await context.supabase
      .from("interview_sessions")
      .insert({
        user_id: context.userId,
        track: data.track,
        role: data.role,
        level: data.level,
        voice: data.voice,
        highlights: data.highlights,
        question_budget: data.questionBudget,
        status: "in_progress",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const name = data.voice === "kira" ? "Kira" : "Elena";
    const opening = `Hi, I'm ${name} and I'll be running your interview for the ${data.role || data.track} role today. Take a breath — when you're ready, tell me about yourself and why this role fits you.`;

    await context.supabase.from("transcript_turns").insert({
      session_id: row.id,
      user_id: context.userId,
      speaker: "ai",
      text: opening,
      turn_index: 0,
    });

    return { sessionId: row.id as string, opening, voice: data.voice };
  });

export const appendTurn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => {
    const x = (d ?? {}) as Record<string, unknown>;
    if (typeof x.sessionId !== "string") throw new Error("sessionId required");
    return {
      sessionId: x.sessionId,
      speaker: x.speaker === "ai" ? "ai" : "candidate",
      text: String(x.text ?? "").slice(0, 6000),
      turnIndex: Number(x.turnIndex) || 0,
      metrics: (x.metrics ?? null) as never,
    };
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("transcript_turns").insert({
      session_id: data.sessionId,
      user_id: context.userId,
      speaker: data.speaker,
      text: data.text,
      turn_index: data.turnIndex,
      metrics: data.metrics,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const nextTurn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => {
    const x = (d ?? {}) as Record<string, unknown>;
    if (typeof x.sessionId !== "string") throw new Error("sessionId required");
    return {
      sessionId: x.sessionId,
      gazeWarning: Boolean(x.gazeWarning),
      pacing: Number(x.pacing) || 0,
      fillerRate: Number(x.fillerRate) || 0,
    };
  })
  .handler(async ({ data, context }): Promise<AiTurn> => {
    const { callAI, safeJson, transcriptText } = await import("@/lib/interview-room.server");

    const { data: session } = await context.supabase
      .from("interview_sessions")
      .select("track, role, level, voice, highlights, question_budget")
      .eq("id", data.sessionId)
      .maybeSingle();
    if (!session) throw new Error("Session not found");

    const { data: turns } = await context.supabase
      .from("transcript_turns")
      .select("speaker, text, turn_index")
      .eq("session_id", data.sessionId)
      .order("turn_index", { ascending: true });

    const list = (turns ?? []) as Array<{ speaker: string; text: string; turn_index: number }>;
    const asked = list.filter((t) => t.speaker === "ai").length;
    const name = session.voice === "kira" ? "Kira" : "Elena";
    const budget = session.question_budget ?? 5;

    const system = `You are ${name}, a sharp but human interviewer running a live voice interview for a "${session.role || session.track}" role at ${session.level} level. You speak one short conversational turn at a time (max 45 words), as if on a video call. You probe vague claims, push for numbers and specifics, ask for clarification when an answer is thin, and occasionally comment on delivery. Never use markdown or lists. Respond with ONLY minified JSON: {"text":"...","kind":"question|followup|remark|closing","done":true|false}`;

    const user = `Candidate background notes: ${session.highlights || "none provided"}
Questions asked so far: ${asked} of ${budget}.
Live delivery signals: speaking pace ${Math.round(data.pacing)} wpm, filler rate ${data.fillerRate}%${data.gazeWarning ? ", candidate keeps looking away from the camera" : ""}.
${data.gazeWarning ? "Naturally mention the eye contact once, briefly, before continuing." : ""}
Transcript so far:
${transcriptText(list, name) || "(no answers yet)"}

Give your next spoken turn. If ${asked} >= ${budget}, wrap up warmly and set done=true.`;

    let parsed: AiTurn | null = null;
    try {
      parsed = safeJson<AiTurn>(await callAI(system, user));
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "AI service unavailable");
    }

    const text = (parsed?.text ?? "").trim();
    const turn: AiTurn = {
      text: text || "Thanks — could you walk me through a specific example with the outcome you achieved?",
      kind: parsed?.kind ?? "question",
      done: Boolean(parsed?.done) || asked >= budget,
    };

    await context.supabase.from("transcript_turns").insert({
      session_id: data.sessionId,
      user_id: context.userId,
      speaker: "ai",
      text: turn.text,
      turn_index: list.length,
    });

    return turn;
  });

export const finalizeSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => {
    const x = (d ?? {}) as Record<string, unknown>;
    if (typeof x.sessionId !== "string") throw new Error("sessionId required");
    return {
      sessionId: x.sessionId,
      endedEarly: Boolean(x.endedEarly),
      durationSec: Math.max(0, Number(x.durationSec) || 0),
      confidenceAvg: Math.max(0, Math.min(100, Number(x.confidenceAvg) || 0)),
      eyeContactAvg: Math.max(0, Math.min(100, Number(x.eyeContactAvg) || 0)),
      pacing: Number(x.pacing) || 0,
      fillerRate: Number(x.fillerRate) || 0,
      audioPath: typeof x.audioPath === "string" ? x.audioPath.slice(0, 300) : null,
    };
  })
  .handler(async ({ data, context }) => {
    const { callAI, safeJson, transcriptText, fallbackDebrief, clamp } = await import("@/lib/interview-room.server");

    const { data: session } = await context.supabase
      .from("interview_sessions")
      .select("track, role, level, voice")
      .eq("id", data.sessionId)
      .maybeSingle();

    const { data: turns } = await context.supabase
      .from("transcript_turns")
      .select("speaker, text, turn_index")
      .eq("session_id", data.sessionId)
      .order("turn_index", { ascending: true });
    const list = (turns ?? []) as Array<{ speaker: string; text: string; turn_index: number }>;

    await context.supabase
      .from("interview_sessions")
      .update({
        status: "debrief_generating",
        ended_at: new Date().toISOString(),
        duration_sec: data.durationSec,
        confidence_avg: data.confidenceAvg,
        eye_contact_avg: data.eyeContactAvg,
        audio_path: data.audioPath,
      })
      .eq("id", data.sessionId);

    const name = session?.voice === "kira" ? "Kira" : "Elena";
    let debrief = fallbackDebrief(list, data.durationSec);

    const hasAnswer = list.some((t) => t.speaker === "candidate" && t.text.trim().length > 3);
    if (hasAnswer) {
      try {
        const raw = await callAI(
          `You are an interview coach. Score the candidate honestly but constructively. Respond with ONLY minified JSON matching: {"overall":0-100,"verdict":"one sentence","star":{"situation":0-100,"task":0-100,"action":0-100,"result":0-100},"delivery_feedback":"2-3 sentences","per_question":[{"question":"","answer":"","score":0-100,"feedback":"","exemplar":"a stronger model answer"}],"top_tips":["","",""]}`,
          `Role: ${session?.role || session?.track || "general"} (${session?.level ?? "Entry"} level). Interviewer: ${name}.
Session length: ${data.durationSec} seconds${data.endedEarly ? " (candidate ended early — score only what exists, never return zeros)" : ""}.
Delivery telemetry: pace ${Math.round(data.pacing)} wpm, filler rate ${data.fillerRate}%, eye contact ${data.eyeContactAvg}%, confidence ${data.confidenceAvg}/100.
Transcript:
${transcriptText(list, name)}`,
        );
        const parsed = safeJson<Debrief>(raw);
        if (parsed && Array.isArray(parsed.per_question) && parsed.per_question.length > 0) {
          debrief = {
            ...parsed,
            overall: clamp(parsed.overall || 0) || debrief.overall,
            star: {
              situation: clamp(parsed.star?.situation ?? debrief.star.situation),
              task: clamp(parsed.star?.task ?? debrief.star.task),
              action: clamp(parsed.star?.action ?? debrief.star.action),
              result: clamp(parsed.star?.result ?? debrief.star.result),
            },
            duration_sec: data.durationSec,
          };
        }
      } catch {
        // keep fallback debrief — never fail the session over the AI call
      }
    }

    await context.supabase
      .from("interview_sessions")
      .update({ status: "done", debrief })
      .eq("id", data.sessionId);

    await context.supabase.from("assessment_results").insert({
      user_id: context.userId,
      kind: "interview",
      score: debrief.overall,
      details: { session_id: data.sessionId, mode: "interview_room", ended_early: data.endedEarly },
    });

    return { status: "done" as SessionStatus, debrief };
  });

export const markSessionFailed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => {
    const x = (d ?? {}) as Record<string, unknown>;
    if (typeof x.sessionId !== "string") throw new Error("sessionId required");
    return { sessionId: x.sessionId, message: String(x.message ?? "").slice(0, 400) };
  })
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("interview_sessions")
      .update({ status: "failed", error_message: data.message, ended_at: new Date().toISOString() })
      .eq("id", data.sessionId);
    return { ok: true };
  });
