import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- Types ----------
export type ResumeDraft = {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  experience: Array<{ title: string; company: string; period: string; bullets: string[] }>;
  education: Array<{ degree: string; institution: string; period: string }>;
  projects: Array<{ name: string; description: string }>;
  certifications: string[];
};

export type GapPlan = {
  target_role: string;
  readiness_score: number;
  verdict: string;
  matched_skills: string[];
  gaps: Array<{ skill: string; importance: "critical" | "important" | "nice-to-have"; why: string; how: string }>;
  phases: Array<{ phase: string; timeframe: string; focus: string[]; actions: string[] }>;
  resume_rewrites: string[];
  suggested_roles: string[];
};

export const emptyDraft: ResumeDraft = {
  fullName: "",
  headline: "",
  email: "",
  phone: "",
  location: "",
  summary: "",
  skills: [],
  experience: [],
  education: [],
  projects: [],
  certifications: [],
};

// ---------- AI helper ----------
async function callAI(system: string, user: string): Promise<string> {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) throw new Error("AI gateway not configured");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai/gpt-5.6-sol",
      reasoning_effort: "none",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
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
  if (lower.endsWith(".txt")) return new TextDecoder().decode(bytes);
  throw new Error("Unsupported file type. Upload PDF, DOCX, or TXT.");
}

const PARSE_SCHEMA = `{
  "fullName":"","headline":"","email":"","phone":"","location":"","summary":"",
  "skills":["..."],
  "experience":[{"title":"","company":"","period":"","bullets":["..."]}],
  "education":[{"degree":"","institution":"","period":""}],
  "projects":[{"name":"","description":""}],
  "certifications":["..."]
}`;

function normalizeDraft(d: Partial<ResumeDraft> | null): ResumeDraft {
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  return {
    fullName: str(d?.fullName),
    headline: str(d?.headline),
    email: str(d?.email),
    phone: str(d?.phone),
    location: str(d?.location),
    summary: str(d?.summary),
    skills: arr<string>(d?.skills).filter((s) => typeof s === "string").slice(0, 60),
    experience: arr<ResumeDraft["experience"][number]>(d?.experience)
      .slice(0, 12)
      .map((e) => ({
        title: str(e?.title),
        company: str(e?.company),
        period: str(e?.period),
        bullets: arr<string>(e?.bullets).filter((b) => typeof b === "string").slice(0, 10),
      })),
    education: arr<ResumeDraft["education"][number]>(d?.education)
      .slice(0, 8)
      .map((e) => ({ degree: str(e?.degree), institution: str(e?.institution), period: str(e?.period) })),
    projects: arr<ResumeDraft["projects"][number]>(d?.projects)
      .slice(0, 10)
      .map((p) => ({ name: str(p?.name), description: str(p?.description) })),
    certifications: arr<string>(d?.certifications).filter((c) => typeof c === "string").slice(0, 20),
  };
}

// ---------- Parse an uploaded resume into an editable draft ----------
export const parseResumeToDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown): { filePath?: string; fileName?: string; rawText?: string } => {
    const d = (data ?? {}) as Record<string, unknown>;
    const filePath = typeof d['filePath'] === "string" ? (d['filePath'] as string) : undefined;
    const fileName = typeof d['fileName'] === "string" ? (d['fileName'] as string) : undefined;
    const rawText = typeof d['rawText'] === "string" ? (d['rawText'] as string).slice(0, 30000) : undefined;
    if (!rawText && !(filePath && fileName)) throw new Error("Provide a file or pasted resume text");
    return { filePath, fileName, rawText };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let text = data.rawText ?? "";

    if (!text && data.filePath && data.fileName) {
      if (!data.filePath.startsWith(`${userId}/`)) throw new Error("Access denied to this file");
      const dl = await supabase.storage.from("user-uploads").download(data.filePath);
      if (dl.error || !dl.data) throw new Error(`Could not read uploaded file: ${dl.error?.message ?? "unknown"}`);
      text = await extractText(new Uint8Array(await dl.data.arrayBuffer()), data.fileName);
    }

    text = text.trim().slice(0, 20000);
    if (text.length < 60) throw new Error("We couldn't read enough text. Paste your resume or upload a text-based file.");

    const raw = await callAI(
      "You extract structured resume data. Respond with ONLY valid minified JSON matching the given schema. Never invent facts that are not in the resume; leave fields empty instead.",
      `Extract this resume into JSON with EXACTLY this shape:\n${PARSE_SCHEMA}\n\nRESUME TEXT:\n"""\n${text}\n"""`,
    );
    const parsed = safeJson<Partial<ResumeDraft>>(raw);
    if (!parsed) throw new Error("AI returned an unreadable response. Please try again.");
    return { draft: normalizeDraft(parsed), rawText: text };
  });

// ---------- Skill-gap analysis + improvement plan ----------
export const generateGapPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown): { draft: ResumeDraft; targetRole: string; timeframeMonths: number } => {
    const d = (data ?? {}) as Record<string, unknown>;
    const targetRole = typeof d['targetRole'] === "string" ? d['targetRole'].trim().slice(0, 120) : "";
    if (targetRole.length < 2) throw new Error("Please enter the role you're targeting");
    const tf = Number(d['timeframeMonths']);
    return {
      draft: normalizeDraft((d['draft'] ?? null) as Partial<ResumeDraft> | null),
      targetRole,
      timeframeMonths: Number.isFinite(tf) ? Math.min(36, Math.max(3, Math.round(tf))) : 12,
    };
  })
  .handler(async ({ data }) => {
    const raw = await callAI(
      "You are a senior career coach who works across every industry (medicine, law, finance, design, trades, education, engineering, software, and more). Respond with ONLY valid minified JSON. Never default to tech/AI advice unless the target role is technical.",
      `Compare this candidate's resume against their target role and produce a skill-gap analysis and improvement plan for a ${data.timeframeMonths}-month timeframe.

TARGET ROLE: ${data.targetRole}

RESUME JSON:
${JSON.stringify(data.draft).slice(0, 16000)}

Return JSON with EXACTLY this shape:
{
  "readiness_score": 0-100,
  "verdict": "2-3 sentence honest assessment",
  "matched_skills": ["skills they already have that the role needs"],
  "gaps": [{"skill":"","importance":"critical|important|nice-to-have","why":"","how":"one concrete way to close it"}],
  "phases": [{"phase":"","timeframe":"","focus":["..."],"actions":["..."]}],
  "resume_rewrites": ["concrete rewrite instruction tied to this target role"],
  "suggested_roles": ["realistic adjacent roles"]
}

Rules: 4-8 gaps, 3-4 phases spanning the full ${data.timeframeMonths} months, 3-5 resume_rewrites, 3 suggested_roles. Be specific to the candidate's actual background.`,
    );
    const parsed = safeJson<Omit<GapPlan, "target_role">>(raw);
    if (!parsed || typeof parsed.readiness_score !== "number") {
      throw new Error("AI returned an unreadable response. Please try again.");
    }
    return {
      target_role: data.targetRole,
      readiness_score: Math.max(0, Math.min(100, Math.round(parsed.readiness_score))),
      verdict: parsed.verdict ?? "",
      matched_skills: parsed.matched_skills ?? [],
      gaps: parsed.gaps ?? [],
      phases: parsed.phases ?? [],
      resume_rewrites: parsed.resume_rewrites ?? [],
      suggested_roles: parsed.suggested_roles ?? [],
    } satisfies GapPlan;
  });
