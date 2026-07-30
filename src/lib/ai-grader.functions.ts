import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- Types ----------
export type ResumeAnalysis = {
  id: string;
  file_path: string;
  file_name: string;
  overall_score: number;
  ats_score: number;
  sections: Record<string, { score: number; feedback: string }>;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  suggested_roles: string[];
  summary: string;
  created_at: string;
};

type GraderResult = Omit<ResumeAnalysis, "id" | "file_path" | "file_name" | "created_at">;

// ---------- AI call helper ----------
async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI gateway not configured");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3.6-flash",
      messages: [
        {
          role: "system",
          content:
            "You are a senior technical recruiter and resume coach. You MUST respond with ONLY valid minified JSON (no markdown, no code fences, no prose). Follow the schema in the user prompt exactly.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("AI rate limit reached. Please try again in a minute.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please top up your workspace.");
    throw new Error(`AI gateway error (${res.status}): ${t.slice(0, 200)}`);
  }
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content ?? "";
}

function safeJson<T>(raw: string): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    // try to extract first {...}
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]) as T;
    } catch {
      return null;
    }
  }
}

async function extractText(bytes: Uint8Array, fileName: string): Promise<string> {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) {
    const { extractText: pdfExtract, getDocumentProxy } = await import("unpdf");
    const doc = await getDocumentProxy(bytes);
    const { text } = await pdfExtract(doc, { mergePages: true });
    return Array.isArray(text) ? text.join("\n") : String(text ?? "");
  }
  if (lower.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    return result.value;
  }
  if (lower.endsWith(".txt")) {
    return new TextDecoder().decode(bytes);
  }
  throw new Error("Unsupported file type. Upload PDF, DOCX, or TXT.");
}

// ---------- analyzeResume ----------
export const analyzeResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: unknown): { filePath: string; fileName: string } => {
      if (!data || typeof data !== "object") throw new Error("Invalid input");
      const d = data as Record<string, unknown>;
      if (typeof d.filePath !== "string" || typeof d.fileName !== "string")
        throw new Error("filePath and fileName required");
      return { filePath: d.filePath, fileName: d.fileName };
    },
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Ensure the path belongs to this user
    if (!data.filePath.startsWith(`${userId}/`)) {
      throw new Error("Access denied to this file");
    }

    // Download file (respects storage RLS as user)
    const dl = await supabase.storage.from("user-uploads").download(data.filePath);
    if (dl.error || !dl.data) throw new Error(`Could not read uploaded file: ${dl.error?.message ?? "unknown"}`);
    const bytes = new Uint8Array(await dl.data.arrayBuffer());

    let text = "";
    try {
      text = await extractText(bytes, data.fileName);
    } catch (e) {
      throw new Error((e as Error).message);
    }
    text = text.trim().slice(0, 20000); // cap for the model
    if (text.length < 80) {
      throw new Error("We couldn't read enough text from that file. Please upload a text-based resume.");
    }

    const prompt = `You are a senior recruiter who reviews resumes across EVERY field (medicine, law, finance, design, teaching, hospitality, marketing, trades, engineering, software, aviation, sports, arts, and more).

CRITICAL: Judge ONLY the resume text below. First infer the candidate's actual industry and seniority from their education, job titles, tools, and vocabulary. "suggested_roles" MUST be realistic next roles inside (or immediately adjacent to) that industry — never default to tech/AI titles unless the resume itself is clearly technical. A nurse should get nursing roles, an accountant accounting roles, a graphic designer design roles.

Return JSON with EXACTLY this shape:
{
  "overall_score": 0-100,
  "ats_score": 0-100,
  "summary": "2-3 sentence overview of this candidate",
  "sections": {
    "contact":   {"score":0-100,"feedback":"..."},
    "summary":   {"score":0-100,"feedback":"..."},
    "experience":{"score":0-100,"feedback":"..."},
    "skills":    {"score":0-100,"feedback":"..."},
    "education": {"score":0-100,"feedback":"..."}
  },
  "strengths":     ["...", "...", "..."],
  "weaknesses":    ["...", "...", "..."],
  "suggestions":   ["Actionable rewrite tip 1", "...", "...", "...", "..."],
  "suggested_roles": ["Role Title 1","Role Title 2","Role Title 3"]
}

Scoring rules:
- overall_score reflects overall recruiter impression.
- ats_score reflects keyword density, standard sections, and machine-parseability.
- Each section score is independent (0 if the section is missing).
- Give 3-5 items per array. Suggestions must be concrete rewrite instructions.

RESUME TEXT:
"""
${text}
"""`;

    const raw = await callGemini(prompt);
    const parsed = safeJson<GraderResult>(raw);
    if (!parsed || typeof parsed.overall_score !== "number") {
      throw new Error("AI returned an unreadable response. Please try again.");
    }

    // Persist
    const insert = await supabase
      .from("resume_analyses")
      .insert({
        user_id: userId,
        file_path: data.filePath,
        file_name: data.fileName,
        overall_score: Math.max(0, Math.min(100, Math.round(parsed.overall_score))),
        ats_score: Math.max(0, Math.min(100, Math.round(parsed.ats_score ?? 0))),
        sections: parsed.sections ?? {},
        strengths: parsed.strengths ?? [],
        weaknesses: parsed.weaknesses ?? [],
        suggestions: parsed.suggestions ?? [],
        suggested_roles: parsed.suggested_roles ?? [],
        summary: parsed.summary ?? "",
      })
      .select("*")
      .single();

    if (insert.error) throw new Error(insert.error.message);
    return insert.data as unknown as ResumeAnalysis;
  });

// ---------- List / delete history ----------
export const listResumeAnalyses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("resume_analyses")
      .select("id, file_name, overall_score, ats_score, summary, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteResumeAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown): { id: string } => {
    if (!data || typeof (data as { id?: unknown }).id !== "string") throw new Error("id required");
    return { id: (data as { id: string }).id };
  })
  .handler(async ({ data, context }) => {
    // fetch to get file_path (RLS scoped)
    const { data: row } = await context.supabase
      .from("resume_analyses")
      .select("file_path")
      .eq("id", data.id)
      .maybeSingle();
    if (row?.file_path) {
      await context.supabase.storage.from("user-uploads").remove([row.file_path]);
    }
    const { error } = await context.supabase.from("resume_analyses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Interview: attempts guard ----------
const MAX_ATTEMPTS = 2;
const WINDOW_HOURS = 24;

export const getInterviewAttempts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const since = new Date(Date.now() - WINDOW_HOURS * 3600_000).toISOString();
    const { data, error } = await context.supabase
      .from("assessment_results")
      .select("created_at")
      .eq("kind", "interview")
      .gte("created_at", since)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    const used = data?.length ?? 0;
    const first = data?.[0]?.created_at ?? null;
    return {
      used,
      max: MAX_ATTEMPTS,
      remaining: Math.max(0, MAX_ATTEMPTS - used),
      locked: used >= MAX_ATTEMPTS,
      unlocksAt: first ? new Date(new Date(first).getTime() + WINDOW_HOURS * 3600_000).toISOString() : null,
    };
  });

// ---------- Interview: questions + scoring ----------
export const generateInterviewQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown): { role: string; difficulty: string } => {
    const d = data as { role?: unknown; difficulty?: unknown };
    if (typeof d.role !== "string" || d.role.trim().length < 2) throw new Error("role required");
    const allowed = ["entry", "mid", "senior"];
    const difficulty = typeof d.difficulty === "string" && allowed.includes(d.difficulty) ? d.difficulty : "mid";
    return { role: d.role.slice(0, 120), difficulty };
  })
  .handler(async ({ data, context }) => {
    // Hard lockout is enforced here too, so the UI cannot be bypassed.
    const since = new Date(Date.now() - WINDOW_HOURS * 3600_000).toISOString();
    const { count } = await context.supabase
      .from("assessment_results")
      .select("id", { count: "exact", head: true })
      .eq("kind", "interview")
      .gte("created_at", since);
    if ((count ?? 0) >= MAX_ATTEMPTS) {
      throw new Error("Attempt limit reached. You can take 2 mock interviews per 24 hours.");
    }

    const level =
      data.difficulty === "entry"
        ? "entry-level (0-2 years); focus on fundamentals, motivation and learning ability"
        : data.difficulty === "senior"
          ? "senior/lead (7+ years); focus on system-level tradeoffs, ownership, conflict, and mentoring"
          : "mid-level (3-6 years); balance depth of execution with collaboration";

    const raw = await callGemini(
      `Generate 5 realistic interview questions for a candidate applying to a "${data.role}" role at ${level}.
Include at least 3 behavioral questions that can be answered with the STAR framework, and 2 role-specific technical/domain questions.
Return JSON: {"questions":[{"text":"...","type":"behavioral|technical"}, ... 5 items]}`,
    );
    const parsed = safeJson<{ questions: Array<{ text: string; type: string } | string> }>(raw);
    if (!parsed?.questions?.length) throw new Error("Could not generate questions. Try again.");
    const questions = parsed.questions.slice(0, 5).map((q) =>
      typeof q === "string"
        ? { text: q, type: "behavioral" }
        : { text: String(q.text ?? ""), type: q.type === "technical" ? "technical" : "behavioral" },
    );
    return { questions, difficulty: data.difficulty };
  });

export type InterviewMetricsInput = {
  wpm: number;
  fillerCount: number;
  fillerRate: number;
  eyeContact: number;
  smile: number;
  stability: number;
  durationSec: number;
  cameraUsed: boolean;
};

export const scoreInterviewAnswers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (
      data: unknown,
    ): {
      role: string;
      difficulty: string;
      qa: Array<{ question: string; answer: string }>;
      metrics: InterviewMetricsInput;
    } => {
      const d = data as { role?: unknown; difficulty?: unknown; qa?: unknown; metrics?: unknown };
      if (typeof d.role !== "string" || !Array.isArray(d.qa)) throw new Error("Invalid input");
      const qa = d.qa
        .filter(
          (x): x is { question: string; answer: string } =>
            !!x && typeof (x as { question?: unknown }).question === "string" &&
            typeof (x as { answer?: unknown }).answer === "string",
        )
        .slice(0, 8)
        .map((x) => ({ question: x.question.slice(0, 500), answer: x.answer.slice(0, 3000) }));
      if (qa.length === 0) throw new Error("Provide at least one answer");
      const m = (d.metrics ?? {}) as Record<string, unknown>;
      const num = (v: unknown, fallback = 0) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
      return {
        role: d.role.slice(0, 120),
        difficulty: typeof d.difficulty === "string" ? d.difficulty.slice(0, 20) : "mid",
        qa,
        metrics: {
          wpm: Math.round(num(m.wpm)),
          fillerCount: Math.round(num(m.fillerCount)),
          fillerRate: Number(num(m.fillerRate).toFixed(2)),
          eyeContact: Math.round(num(m.eyeContact)),
          smile: Math.round(num(m.smile)),
          stability: Math.round(num(m.stability)),
          durationSec: Math.round(num(m.durationSec)),
          cameraUsed: Boolean(m.cameraUsed),
        },
      };
    },
  )
  .handler(async ({ data, context }) => {
    const since = new Date(Date.now() - WINDOW_HOURS * 3600_000).toISOString();
    const { count } = await context.supabase
      .from("assessment_results")
      .select("id", { count: "exact", head: true })
      .eq("kind", "interview")
      .gte("created_at", since);
    if ((count ?? 0) >= MAX_ATTEMPTS) {
      throw new Error("Attempt limit reached. You can take 2 mock interviews per 24 hours.");
    }

    const prompt = `You are a senior interviewer scoring a mock interview for a "${data.role}" role at ${data.difficulty}-level.
For each question+answer: score 0-100, rate the STAR framework coverage, and give specific coaching feedback.
STAR ratings are 0-100 each: situation, task, action, result. For purely technical questions still rate STAR (structure of the explanation) and set "applicable": false.

Delivery telemetry captured during the session (use it in your tips, do not invent numbers):
${JSON.stringify(data.metrics)}

Return JSON:
{
 "overall": 0-100,
 "verdict": "Ready | Almost there | Needs work",
 "star_overall": {"situation":0-100,"task":0-100,"action":0-100,"result":0-100},
 "delivery_feedback": "2-3 sentences on pacing, filler words, and body language based on the telemetry",
 "per_question": [
   {"question":"...","answer_score":0-100,"star":{"situation":0-100,"task":0-100,"action":0-100,"result":0-100,"applicable":true},"feedback":"...","exemplar":"a stronger 3-4 sentence STAR answer"}
 ],
 "top_tips": ["...","...","..."]
}

DATA:
${JSON.stringify(data.qa)}`;
    const raw = await callGemini(prompt);
    const parsed = safeJson<{
      overall: number;
      verdict: string;
      star_overall?: { situation: number; task: number; action: number; result: number };
      delivery_feedback?: string;
      per_question: Array<{
        question: string;
        answer_score: number;
        star?: { situation: number; task: number; action: number; result: number; applicable?: boolean };
        feedback: string;
        exemplar: string;
      }>;
      top_tips: string[];
    }>(raw);
    if (!parsed) throw new Error("AI returned an unreadable response.");

    const { error } = await context.supabase.from("assessment_results").insert({
      user_id: context.userId,
      kind: "interview",
      score: Math.round(parsed.overall ?? 0),
      details: { role: data.role, difficulty: data.difficulty, metrics: data.metrics, ...parsed },
    });
    if (error) throw new Error(error.message);

    return {
      ...parsed,
      metrics: data.metrics,
      attemptsRemaining: Math.max(0, MAX_ATTEMPTS - ((count ?? 0) + 1)),
    };
  });

