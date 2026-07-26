// Server-only helpers for the live Interview Room.

export type TurnRow = { speaker: string; text: string; turn_index: number };

export async function callAI(system: string, user: string, json = true): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI is not configured for this workspace.");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3.6-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("AI rate limit reached. Please wait a moment and retry.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please top up your workspace.");
    throw new Error(`AI service error (${res.status}): ${t.slice(0, 160)}`);
  }
  const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return body.choices?.[0]?.message?.content ?? "";
}

export function safeJson<T>(raw: string): T | null {
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

export function transcriptText(turns: TurnRow[], interviewer: string): string {
  return turns
    .map((t) => `${t.speaker === "ai" ? interviewer : "Candidate"}: ${t.text.trim()}`)
    .filter((l) => l.length > 12)
    .join("\n");
}

export function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, Math.round(Number.isFinite(n) ? n : 0)));
}

/** Deterministic fallback debrief so a finished session never shows empty scores. */
export function fallbackDebrief(turns: TurnRow[], durationSec: number) {
  const answers = turns.filter((t) => t.speaker === "candidate" && t.text.trim().length > 0);
  const words = answers.reduce((a, t) => a + t.text.trim().split(/\s+/).length, 0);
  const depth = clamp(35 + Math.min(45, words / 6));
  return {
    overall: depth,
    verdict:
      answers.length === 0
        ? "Session ended before any answer was captured."
        : "Partial session — scored on the answers captured so far.",
    star: { situation: depth, task: clamp(depth - 5), action: clamp(depth + 4), result: clamp(depth - 8) },
    delivery_feedback:
      "Automatic scoring was unavailable, so this is a length-and-structure estimate from your captured answers.",
    per_question: answers.map((a, i) => ({
      question: turns.filter((t) => t.speaker === "ai")[i]?.text ?? `Question ${i + 1}`,
      answer: a.text,
      score: depth,
      feedback: "Add a concrete situation, your specific actions, and a measurable result.",
      exemplar: "Situation → Task → Action → Result, closing with a number that proves the impact.",
    })),
    top_tips: [
      "Open every answer with a one-line situation so the interviewer has context.",
      "Name the tools, people and constraints involved — specificity reads as experience.",
      "Close with a measurable result, even an estimate.",
    ],
    duration_sec: durationSec,
  };
}
