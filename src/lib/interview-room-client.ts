// Browser-native helpers for the live Interview Room: STT, TTS voice matching,
// mic level metering and MediaRecorder capture. No third-party services.

export type VoiceId = "elena" | "kira";
export const VOICE_NAME: Record<VoiceId, string> = { elena: "Elena", kira: "Kira" };

export type RecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onresult:
    | ((e: {
        resultIndex: number;
        results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
      }) => void)
    | null;
  onerror: ((e?: { error?: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

export function createRecognition(): RecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => RecognitionLike;
    webkitSpeechRecognition?: new () => RecognitionLike;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const r = new Ctor();
  r.continuous = true;
  r.interimResults = true;
  r.lang = "en-US";
  return r;
}

const FEMALE_HINTS = ["female", "samantha", "victoria", "karen", "moira", "tessa", "zira", "aria", "jenny", "serena", "fiona", "amelie", "elena"];
const MALE_HINTS = ["male", "daniel", "alex", "fred", "david", "george", "guy", "oliver", "thomas", "rishi", "arthur", "kira"];

export function pickVoice(voice: VoiceId): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const english = voices.filter((v) => v.lang?.toLowerCase().startsWith("en"));
  const pool = english.length ? english : voices;
  const hints = voice === "elena" ? FEMALE_HINTS : MALE_HINTS;
  const other = voice === "elena" ? MALE_HINTS : FEMALE_HINTS;
  const match = pool.find((v) => hints.some((h) => v.name.toLowerCase().includes(h)));
  if (match) return match;
  const notOther = pool.find((v) => !other.some((h) => v.name.toLowerCase().includes(h)));
  return notOther ?? pool[0] ?? null;
}

/** Speaks text and resolves when finished (or immediately if TTS is unavailable). */
export function speak(text: string, voice: VoiceId, onDone?: () => void): () => void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onDone?.();
    return () => undefined;
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice(voice);
  if (v) u.voice = v;
  u.rate = 1.02;
  u.pitch = voice === "elena" ? 1.12 : 0.88;
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    onDone?.();
  };
  u.onend = finish;
  u.onerror = finish;
  synth.speak(u);
  // Safety net: some browsers never fire onend for long utterances.
  const guard = window.setTimeout(finish, Math.max(4000, text.length * 90));
  return () => {
    window.clearTimeout(guard);
    synth.cancel();
    finish();
  };
}

export function ttsSupported(): boolean {
  return typeof window !== "undefined" && !!window.speechSynthesis;
}

/** Simple RMS meter over a MediaStream, used for the speaking waveform. */
export function createMeter(stream: MediaStream) {
  const Ctx = (window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) as typeof AudioContext;
  const ctx = new Ctx();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);
  const buf = new Uint8Array(analyser.frequencyBinCount);
  return {
    read() {
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const d = (buf[i] - 128) / 128;
        sum += d * d;
      }
      return Math.min(1, Math.sqrt(sum / buf.length) * 3.2);
    },
    close() {
      try {
        source.disconnect();
        void ctx.close();
      } catch {
        /* noop */
      }
    },
  };
}

export function createRecorder(stream: MediaStream): { stop: () => Promise<Blob | null> } | null {
  if (typeof MediaRecorder === "undefined") return null;
  const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((m) => MediaRecorder.isTypeSupported(m));
  let rec: MediaRecorder;
  try {
    rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  } catch {
    return null;
  }
  const chunks: BlobPart[] = [];
  rec.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };
  rec.start(1000);
  return {
    stop: () =>
      new Promise((resolve) => {
        if (rec.state === "inactive") {
          resolve(chunks.length ? new Blob(chunks, { type: mime ?? "audio/webm" }) : null);
          return;
        }
        rec.onstop = () => resolve(chunks.length ? new Blob(chunks, { type: mime ?? "audio/webm" }) : null);
        try {
          rec.stop();
        } catch {
          resolve(null);
        }
      }),
  };
}

/** Skin-region proxy for "is the candidate facing the camera" — no model downloads. */
export function analyzeGaze(data: Uint8ClampedArray, w: number, h: number) {
  let count = 0,
    sumX = 0,
    sumY = 0;
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const i = (y * w + x) * 4;
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      const max = Math.max(r, g, b),
        min = Math.min(r, g, b);
      if (r > 95 && g > 40 && b > 20 && max - min > 15 && Math.abs(r - g) > 15 && r > g && r > b) {
        count++;
        sumX += x;
        sumY += y;
      }
    }
  }
  const coverage = count / ((w * h) / 4);
  if (count < 40 || coverage < 0.01) return { facing: false, detected: false };
  const cx = sumX / count / w;
  const cy = sumY / count / h;
  return { facing: Math.abs(cx - 0.5) < 0.18 && cy > 0.06 && cy < 0.78, detected: true };
}

export function computeConfidence(input: {
  wpm: number;
  fillerRate: number;
  eyeContact: number;
  words: number;
}): number {
  const pace =
    input.wpm === 0 ? 55 : input.wpm < 90 ? 62 : input.wpm <= 170 ? 92 : input.wpm <= 195 ? 74 : 58;
  const filler = Math.max(40, 100 - input.fillerRate * 9);
  const gaze = 45 + input.eyeContact * 0.55;
  const depth = Math.min(100, 50 + input.words / 4);
  return Math.round(Math.max(0, Math.min(100, pace * 0.3 + filler * 0.25 + gaze * 0.3 + depth * 0.15)));
}
