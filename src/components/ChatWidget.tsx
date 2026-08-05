import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Send, X, Sparkles, RotateCcw, Mic, Volume2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { trackVoiceEvent } from "@/lib/voice-telemetry";
const chatbotLogo = "/robot-avatar.png";
const CONVERSATION_ID = "default";


type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTED = [
  "Build me a 90-day roadmap to become an AI Engineer",
  "Compare UX Designer vs Product Manager careers",
  "How do I break into cybersecurity with no degree?",
  "Suggest 3 portfolio projects for a freelance video editor",
];

const seed: Msg[] = [
  { role: "assistant", content: "Hi — I'm **Zoiee**, your AI career advisor. Ask me about any career, roadmap, skill gap, or interview prep." },
];

function renderMd(text: string) {
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escape(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-neutral-200 text-neutral-900 dark:bg-white/10 dark:text-white/90 text-[11px] font-mono">$1</code>')
    .replace(/\n/g, "<br/>");
}

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onresult:
    | ((e: {
        resultIndex: number;
        results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
      }) => void)
    | null;
};


export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, loading: isAuthLoading } = useAuth();
  const [msgs, setMsgs] = useState<Msg[]>(seed);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollRafRef = useRef<number | null>(null);
  const loadedForUserRef = useRef<string | null>(null);
  const guestHydratedRef = useRef(false);
  const userId = user?.id ?? null;
  // Hide the floating chat while the guest concierge overlay owns the screen.
  // Concierge shows for unauthenticated visitors once auth has resolved.
  const hidden = !isAuthLoading && !isAuthenticated;
  const messageSignature = useMemo(() => {
    const last = msgs[msgs.length - 1];
    return `${msgs.length}:${last?.role ?? "none"}:${last?.content.length ?? 0}:${streaming ? 1 : 0}`;
  }, [msgs, streaming]);

  // Auth/database hydration: runs only after auth finishes and only once per user.
  useEffect(() => {
    if (isAuthLoading || !isAuthenticated || !userId) return;
    if (loadedForUserRef.current === userId) return;
    loadedForUserRef.current = userId;

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("role,content,created_at")
        .eq("user_id", userId)
        .eq("conversation_id", CONVERSATION_ID)
        .order("created_at", { ascending: true });
      if (cancelled || error || !data) return;

      // Merge any lingering guest messages into DB on first login
      let guestPrior: Msg[] = [];
      try {
        const raw = localStorage.getItem("cp_guest_msgs");
        if (raw) {
          const prior = JSON.parse(raw) as Msg[];
          if (Array.isArray(prior) && prior.length > 0) {
            guestPrior = prior;
            const rows = prior.map((m) => ({
              user_id: userId,
              conversation_id: CONVERSATION_ID,
              role: m.role,
              content: m.content,
            }));
            await supabase.from("chat_messages").insert(rows);
            localStorage.removeItem("cp_guest_msgs");
            localStorage.removeItem("guest_chat_count");
          }
        }
      } catch { /* ignore */ }
      const persisted: Msg[] = data.map((r) => ({ role: r.role as "user" | "assistant", content: r.content }));
      const combined = [...persisted, ...guestPrior];
      if (!cancelled && combined.length > 0) setMsgs([...seed, ...combined]);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, isAuthenticated, userId]);

  // Guest hydration: wait for auth to settle, then read localStorage once.
  useEffect(() => {
    if (isAuthLoading || isAuthenticated || guestHydratedRef.current) return;
    if (typeof window === "undefined") return;
    guestHydratedRef.current = true;
    try {
      const raw = localStorage.getItem("cp_guest_msgs");
      if (!raw) return;
      const prior = JSON.parse(raw) as Msg[];
      if (Array.isArray(prior) && prior.length > 0) {
        setMsgs([...seed, ...prior]);
      }
    } catch { /* ignore */ }
  }, [isAuthLoading, isAuthenticated]);


  // Body scroll lock: no state updates inside this effect, only reversible DOM writes.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Auto-scroll: use a stable signature and one RAF so scrolling never creates a render loop.
  useEffect(() => {
    if (!open) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;

    if (scrollRafRef.current !== null) {
      window.cancelAnimationFrame(scrollRafRef.current);
    }

    scrollRafRef.current = window.requestAnimationFrame(() => {
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: "auto" });
      scrollRafRef.current = null;
    });

    return () => {
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
    };
  }, [open, messageSignature]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current);
      }
    };
  }, []);

  const send = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming) return;
    setInput("");
    const next: Msg[] = [...msgs, { role: "user", content }, { role: "assistant", content: "" }];
    setMsgs(next);
    setStreaming(true);
    abortRef.current = new AbortController();

    try {
      const { data: sessionData } = await supabase.auth.getSession().catch(() => ({ data: { session: null } as { session: null } }));
      const token = sessionData.session?.access_token;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: next.slice(0, -1).map((m) => ({ role: m.role, content: m.content })) }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let assistant = "";
      let done = false;

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              assistant += delta;
              setMsgs((cur) => {
                const copy = cur.slice();
                copy[copy.length - 1] = { role: "assistant", content: assistant };
                return copy;
              });
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
      // Persist completed exchange to DB for signed-in users
      if (isAuthenticated && userId && assistant) {
        await supabase.from("chat_messages").insert([
          { user_id: userId, conversation_id: CONVERSATION_ID, role: "user", content },
          { user_id: userId, conversation_id: CONVERSATION_ID, role: "assistant", content: assistant },
        ]);
      } else if (!isAuthenticated) {
        try {
          const persisted = [...next.slice(1, -1), { role: "assistant" as const, content: assistant }];
          localStorage.setItem("cp_guest_msgs", JSON.stringify(persisted));
        } catch { /* ignore */ }
      }

    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast.error(msg);
      setMsgs((cur) => {
        const copy = cur.slice();
        if (copy[copy.length - 1].role === "assistant" && copy[copy.length - 1].content === "") {
          copy[copy.length - 1] = { role: "assistant", content: `_${msg}_` };
        }
        return copy;
      });
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [input, isAuthenticated, msgs, streaming, userId]);

  const retry = useCallback(() => {
    const lastUser = [...msgs].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    setMsgs((cur) => cur.slice(0, -1));
    setTimeout(() => send(lastUser.content), 50);
  }, [msgs, send]);

  const startVoice = useCallback(async () => {
    if (recRef.current) {
      try { recRef.current.stop(); } catch { /* noop */ }
      recRef.current = null;
      setListening(false);
      trackVoiceEvent("voice_toggle_off");
      return;
    }
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      trackVoiceEvent("voice_unsupported", { ua: navigator.userAgent });
      toast.message("Voice input isn't supported in this browser. Try Chrome or Edge.");
      return;
    }
    if (!window.isSecureContext) {
      trackVoiceEvent("voice_insecure_context", { origin: window.location.origin });
      toast.error("Voice input needs a secure (https) connection.");
      return;
    }

    // Explicitly request mic permission first — Safari/Chrome silently abort otherwise.
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getTracks().forEach((t) => t.stop());
      trackVoiceEvent("voice_permission_granted");
    } catch (err) {
      trackVoiceEvent("voice_permission_denied", {
        name: err instanceof Error ? err.name : "unknown",
        message: err instanceof Error ? err.message : String(err),
      });
      toast.error("Microphone blocked. Allow mic access in your browser settings.");
      return;
    }

    const r = new SR();
    recRef.current = r;
    r.lang = "en-US";
    r.continuous = false;
    r.interimResults = true;
    let finalText = "";
    let resultCount = 0;
    const startedAt = Date.now();
    r.onstart = () => {
      setListening(true);
      trackVoiceEvent("voice_start", { lang: r.lang });
    };
    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const txt = res[0]?.transcript ?? "";
        if (res.isFinal) finalText += txt;
        else interim += txt;
      }
      resultCount += 1;
      trackVoiceEvent("voice_result", {
        isFinal: finalText.length > 0 && interim.length === 0,
        chars: (finalText + interim).length,
      });
      setInput((finalText + interim).trim());
    };
    r.onerror = (ev) => {
      const code = ev?.error;
      trackVoiceEvent("voice_error", { code: code ?? "unknown", elapsedMs: Date.now() - startedAt });
      if (code === "no-speech") toast.message("Didn't catch that — try speaking again.");
      else if (code === "not-allowed" || code === "service-not-allowed") toast.error("Microphone permission denied.");
      else if (code !== "aborted") toast.error("Voice input failed. Please try again.");
      recRef.current = null;
      setListening(false);
    };
    r.onend = () => {
      trackVoiceEvent("voice_end", {
        durationMs: Date.now() - startedAt,
        resultCount,
        transcribedChars: finalText.length,
      });
      recRef.current = null;
      setListening(false);
    };
    try {
      r.start();
    } catch (err) {
      trackVoiceEvent("voice_start_failed", {
        message: err instanceof Error ? err.message : String(err),
      });
      recRef.current = null;
      setListening(false);
    }
  }, []);


  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text.replace(/[*`_#>-]/g, ""));
    u.rate = 1.02; u.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }, []);

  if (hidden) return null;

  return (
    <div className="z-[9999]">
      {/* Floating toggle button — living AI orb */}
      <motion.button
        onClick={() => { if (!open) { void import("@/lib/chatGate").then(m => m.openChatGate()); } setOpen((v) => !v); }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.92 }}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ scale: { duration: 2.6, repeat: Infinity, ease: "easeInOut" } }}
        className="fixed bottom-6 right-6 z-[9999] size-14 rounded-full flex items-center justify-center overflow-hidden gpu bg-card border border-border dark:bg-white/[0.08] dark:border-white/20"
        style={{
          backdropFilter: "blur(24px) saturate(160%)",
          boxShadow: "0 8px 32px -4px rgba(16,185,129,0.45), 0 0 0 1px rgba(255,255,255,0.05) inset",
        }}
        aria-label={open ? "Close chat" : "Open Zoiee AI"}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "close" : "open"}
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.25 }}
            className="flex items-center justify-center"
          >
            {open ? (
              <X className="size-6 text-foreground" />
            ) : (
              <img src={chatbotLogo} alt="Zoiee AI" width={512} height={512} loading="lazy" className="size-11 object-contain drop-shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
            )}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{ transformOrigin: "bottom right" }}
            className="fixed z-[9999] inset-0 sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[380px] sm:max-w-[calc(100vw-3rem)] sm:h-[min(600px,calc(100dvh-8rem))] sm:rounded-2xl bg-white/95 dark:bg-white/[0.03] backdrop-blur-3xl border border-neutral-200 dark:border-white/10 shadow-[0_20px_60px_0_rgba(0,0,0,0.15)] dark:shadow-[0_8px_32px_0_rgba(255,255,255,0.05),0_20px_60px_0_rgba(0,0,0,0.6)] flex flex-col overflow-hidden gpu"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.03]">

              <div className="flex items-center gap-2">
                <div className="relative size-7 rounded-lg overflow-hidden border border-neutral-200 dark:border-white/20 bg-neutral-100 dark:bg-white/5 flex items-center justify-center">
                  <img src={chatbotLogo} alt="" width={512} height={512} className="size-full object-contain" />
                  <Sparkles className="absolute -top-1 -right-1 size-2.5 text-emerald-500 dark:text-emerald-300" />
                </div>
                <div>
                  <div className="text-sm font-bold text-neutral-900 dark:text-white">Zoiee Assistant</div>
                  <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">● {streaming ? "TYPING" : "ONLINE"}</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-neutral-500 hover:text-neutral-900 dark:text-white/60 dark:hover:text-white transition-colors" aria-label="Close">
                <X className="size-4" />
              </button>
            </div>

            <div
              ref={scrollerRef}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 space-y-3 touch-pan-y"
              style={{ overscrollBehavior: "contain" }}
            >
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} group`}>
                  <div className={`max-w-[88%] text-xs leading-relaxed px-3 py-2 rounded-2xl ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-neutral-100 text-neutral-900 border border-neutral-200 dark:bg-white/5 dark:text-white/90 dark:border-white/10 rounded-bl-sm"
                  }`}>
                    <div dangerouslySetInnerHTML={{ __html: renderMd(m.content || (streaming && i === msgs.length - 1 ? "▍" : "")) }} />
                    {m.role === "assistant" && m.content && !streaming && (
                      <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => speak(m.content)} className="text-[10px] text-neutral-500 hover:text-primary dark:text-white/50 inline-flex items-center gap-1"><Volume2 className="size-3"/> Speak</button>
                        {i === msgs.length - 1 && (
                          <button onClick={retry} className="text-[10px] text-neutral-500 hover:text-primary dark:text-white/50 inline-flex items-center gap-1"><RotateCcw className="size-3"/> Retry</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {msgs.length <= 1 && (
                <div className="pt-2">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 dark:text-white/40 mb-2">Try asking</div>
                  <div className="flex flex-col gap-1.5">
                    {SUGGESTED.map((s) => (
                      <button key={s} onClick={() => send(s)} className="text-left text-[11px] px-3 py-2 rounded-lg bg-neutral-100 border border-neutral-200 hover:border-primary/60 hover:bg-neutral-200 text-neutral-800 dark:bg-white/5 dark:border-white/10 dark:hover:border-primary/60 dark:hover:bg-white/10 dark:text-white/80 transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.03] flex gap-2">
              <button onClick={() => void startVoice()} className={`size-9 rounded-lg border flex items-center justify-center transition-colors ${listening ? "border-rose-400 bg-rose-500/15 text-rose-500 animate-pulse" : "border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] dark:hover:border-white/30 dark:text-white/70"}`} aria-label={listening ? "Stop voice input" : "Voice input"} aria-pressed={listening}>
                <Mic className="size-4" />
              </button>

              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask about your future..."
                className="flex-1 bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-500 dark:bg-white/[0.03] dark:border-white/10 dark:text-white dark:placeholder:text-white/40 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-400/40"

                disabled={streaming}
              />
              <motion.button
                onClick={() => send()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={streaming || !input.trim()}
                className="size-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
                aria-label="Send"
              >
                <Send className="size-4" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
