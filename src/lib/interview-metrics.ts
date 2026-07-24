// Pure, client-safe speech / pacing analytics used by the mock interview studio.

export const FILLER_WORDS = [
  "um",
  "uh",
  "erm",
  "hmm",
  "like",
  "basically",
  "actually",
  "literally",
  "you know",
  "i mean",
  "sort of",
  "kind of",
  "so yeah",
  "right?",
] as const;

export type SpeechStats = {
  words: number;
  wpm: number;
  fillerCount: number;
  fillerRate: number; // fillers per 100 words
  fillerHits: Array<{ word: string; count: number }>;
  durationSec: number;
};

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function analyzeSpeech(text: string, durationSec: number): SpeechStats {
  const words = countWords(text);
  const lower = ` ${text.toLowerCase().replace(/[^a-z?'\s]/g, " ").replace(/\s+/g, " ")} `;
  const hits: Array<{ word: string; count: number }> = [];
  let fillerCount = 0;
  for (const filler of FILLER_WORDS) {
    const needle = filler.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?<=\\s)${needle}(?=\\s)`, "g");
    const count = (lower.match(re) ?? []).length;
    if (count > 0) {
      fillerCount += count;
      hits.push({ word: filler, count });
    }
  }
  const safeDuration = Math.max(1, durationSec);
  return {
    words,
    wpm: durationSec > 0 ? Math.round((words / safeDuration) * 60) : 0,
    fillerCount,
    fillerRate: words > 0 ? Number(((fillerCount / words) * 100).toFixed(1)) : 0,
    fillerHits: hits.sort((a, b) => b.count - a.count),
    durationSec: Math.round(durationSec),
  };
}

/** Conversational sweet spot is roughly 130-160 wpm. */
export function pacingVerdict(wpm: number): { label: string; tone: "good" | "warn" | "bad" } {
  if (wpm === 0) return { label: "No timing captured", tone: "warn" };
  if (wpm < 100) return { label: "Too slow — add energy", tone: "warn" };
  if (wpm < 130) return { label: "Slightly slow", tone: "warn" };
  if (wpm <= 165) return { label: "Ideal pace", tone: "good" };
  if (wpm <= 190) return { label: "Slightly fast", tone: "warn" };
  return { label: "Too fast — slow down", tone: "bad" };
}

export function fillerVerdict(rate: number): { label: string; tone: "good" | "warn" | "bad" } {
  if (rate <= 1.5) return { label: "Crisp delivery", tone: "good" };
  if (rate <= 4) return { label: "Some filler words", tone: "warn" };
  return { label: "Heavy filler usage", tone: "bad" };
}

export function highlightFillers(text: string): Array<{ text: string; filler: boolean }> {
  const parts = text.split(/(\s+)/);
  const set = new Set<string>(FILLER_WORDS as readonly string[]);
  return parts.map((p) => ({ text: p, filler: set.has(p.toLowerCase().replace(/[^a-z']/g, "")) }));
}
