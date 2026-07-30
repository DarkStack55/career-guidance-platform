import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, Loader2, RotateCcw, ThumbsUp, ThumbsDown, Sun, Moon } from "lucide-react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/lib/theme";
import { useIsMobile } from "@/hooks/use-mobile";


type Msg = { role: "user" | "assistant"; content: string };

const GUEST_LIMIT = 3;
const KEY_MSGS = "cp_guest_msgs";
const KEY_COUNT = "guest_chat_count";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function readMsgs(): Msg[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY_MSGS) || "[]"); } catch { return []; }
}
function readCount(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(KEY_COUNT) || "0");
}

function renderMd(text: string) {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escape(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-white/10 text-[11px] font-mono">$1</code>')
    .replace(/\n/g, "<br/>");
}

function TopRightControls() {
  const navigate = useNavigate();
  const [theme, , toggle] = useTheme();
  return (
    <div className="absolute top-6 right-8 z-[100] flex items-center gap-3">
      <button
        onClick={toggle}
        aria-label="Toggle theme"
        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white transition-all duration-300 cursor-pointer"
      >
        {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>
      <button
        onClick={() => {
          // Mount loader BEFORE navigation so the home page cannot leak
          // through as the Zoiee overlay unmounts.
          import("@/lib/nav-loader").then((m) => m.showPageLoader("Connecting..."));
          navigate({ to: "/login", search: { next: "/dashboard" } });
        }}
        className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white font-medium transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.1)] text-sm cursor-pointer"
      >
        Sign In / Sign Up
      </button>
    </div>
  );
}


export function GuestConcierge() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const formParam = useRouterState({ select: (s) => (s.location.search as Record<string, unknown>)?.form ?? null });
  const loginShowingForm = pathname === "/login" && formParam === "1";
  const onAuthRoute = pathname === "/admin-login" || pathname.startsWith("/auth") || loginShowingForm;
  const [hydrated, setHydrated] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [count, setCount] = useState(0);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatScrollerRef = useRef<HTMLDivElement>(null);
  const hydrationStartedRef = useRef(false);
  const scrollRafRef = useRef<number | null>(null);
  const lastScrollSignatureRef = useRef<string>("");
  const openingMsg = useMemo(
    () => `${greeting()}! Hey! I'm Zoiee, your friendly learning buddy. Ready to discover your perfect career today? 🤩`,
    [],
  );

  const openLoginPage = useCallback(() => {
    import("@/lib/nav-loader").then((m) => m.showPageLoader("Opening secure login..."));
    navigate({ to: "/login", search: { next: "/dashboard" } });
  }, [navigate]);

  // ✅ Corrected mobile viewport effect: no React state updates here.
  // It freezes the overlay to a stable height on phones, so iOS/Android URL-bar
  // resize events cannot repeatedly re-layout the chat and look like flicker.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    const desktopQuery = window.matchMedia("(min-width: 768px)");
    let orientationTimer: number | null = null;

    const writeViewportHeight = () => {
      root.style.setProperty("--zoiee-vh", `${window.innerHeight}px`);
    };

    const onResize = () => {
      // Mobile browser chrome fires resize while scrolling; ignore those.
      if (desktopQuery.matches) writeViewportHeight();
    };

    const onOrientationChange = () => {
      if (orientationTimer !== null) window.clearTimeout(orientationTimer);
      orientationTimer = window.setTimeout(writeViewportHeight, 250);
    };

    writeViewportHeight();
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onOrientationChange);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onOrientationChange);
      if (orientationTimer !== null) window.clearTimeout(orientationTimer);
      root.style.removeProperty("--zoiee-vh");
    };
  }, []);

  // ✅ Corrected one-shot hydration effect: guarded by a ref and never depends
  // on auth/loading, so it cannot bounce with auth checks on mobile.
  useEffect(() => {
    if (hydrationStartedRef.current) return;
    hydrationStartedRef.current = true;

    const storedMsgs = readMsgs();
    const storedCount = readCount();
    const safeMsgs = Array.isArray(storedMsgs) ? storedMsgs : [];
    const safeCount = Number.isFinite(storedCount) ? storedCount : 0;
    setMsgs((current) => (current.length === safeMsgs.length ? current : safeMsgs));
    setCount((current) => (current === safeCount ? current : safeCount));
    setHydrated((current) => current || true);

    return () => {
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
    };
  }, []);

  const authResolving = !hydrated || loading;
  const active = hydrated && !loading && !isAuthenticated && !onAuthRoute;
  const showLoadingGate = authResolving && !onAuthRoute;

  // ✅ Corrected overlay body lock: reversible DOM writes only; no state updates.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!active) return;
    const { body } = document;
    const root = document.documentElement;
    const prevOverflow = body.style.overflow;
    const prevOverscroll = body.style.overscrollBehavior;
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    root.classList.add("zoiee-overlay-active");

    const focusTimer = window.setTimeout(() => {
      const canAutofocus = window.matchMedia("(min-width: 768px)").matches;
      if (canAutofocus) inputRef.current?.focus({ preventScroll: true });
    }, 120);

    return () => {
      window.clearTimeout(focusTimer);
      body.style.overflow = prevOverflow;
      body.style.overscrollBehavior = prevOverscroll;
      root.classList.remove("zoiee-overlay-active");
    };
  }, [active]);

  const scrollSignature = useMemo(() => {
    const last = msgs[msgs.length - 1];
    return `${msgs.length}:${last?.content.length ?? 0}:${streaming ? 1 : 0}`;
  }, [msgs, streaming]);

  // ✅ Corrected auto-scroll effect: it is keyed by a stable signature, cancels
  // stale RAF work, and never writes React state from inside the effect.
  useEffect(() => {
    if (!active) return;
    if (lastScrollSignatureRef.current === scrollSignature) return;
    lastScrollSignatureRef.current = scrollSignature;

    const scroller = chatScrollerRef.current;
    if (!scroller) return;

    if (scrollRafRef.current !== null) {
      window.cancelAnimationFrame(scrollRafRef.current);
    }

    scrollRafRef.current = window.requestAnimationFrame(() => {
      const bottom = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      if (Math.abs(scroller.scrollTop - bottom) > 2) {
        scroller.scrollTop = bottom;
      }
      scrollRafRef.current = null;
    });

    return () => {
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
    };
  }, [active, scrollSignature]);

  const send = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming) return;

    if (count >= GUEST_LIMIT) {
      toast.info("You've used your 3 free guest questions! Sign in now to unlock your full career dashboard.");
      openLoginPage();
      return;
    }

    setInput("");
    const nextCount = count + 1;
    const history: Msg[] = [...msgs, { role: "user", content }];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setCount(nextCount);
    localStorage.setItem(KEY_COUNT, String(nextCount));
    setStreaming(true);

    try {
      const { data: sessionData } = await supabase.auth
        .getSession()
        .catch(() => ({ data: { session: null } as { session: null } }));
      const token = sessionData.session?.access_token;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = ""; let assistant = ""; let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl); buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const p = JSON.parse(json);
            const delta = p.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              assistant += delta;
              setMsgs((cur) => {
                const c = cur.slice();
                c[c.length - 1] = { role: "assistant", content: assistant };
                return c;
              });
            }
          } catch { buf = line + "\n" + buf; break; }
        }
      }
      const final: Msg[] = [...history, { role: "assistant", content: assistant }];
      localStorage.setItem(KEY_MSGS, JSON.stringify(final));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setStreaming(false);
    }
  }, [count, input, msgs, openLoginPage, streaming]);

  const resetChat = useCallback(() => {
    setMsgs([]);
    setCount(0);
    localStorage.removeItem(KEY_MSGS);
    localStorage.removeItem(KEY_COUNT);
    toast.success("Conversation cleared.");
  }, []);

  const remaining = Math.max(0, GUEST_LIMIT - count);

  const overlayMotionProps = isMobile
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 1 }, transition: { duration: 0 } }
    : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.4 } };

  return (
    <>
      {showLoadingGate && (
        <div className="fixed inset-0 z-[9999] bg-[#050505] flex items-center justify-center">
          <Loader2 className="size-6 animate-spin text-white/60" />
        </div>
      )}
      <AnimatePresence>
        {active && (
        <motion.div
          data-zoiee-overlay="true"
          key="guest-overlay"
          {...overlayMotionProps}
          className="fixed inset-0 z-[9998] bg-[#050b18] w-full flex flex-col md:flex-row overflow-hidden"
          style={{ height: "var(--zoiee-vh, 100svh)" }}
        >
          <style>{`
            @keyframes zoieeFloatStable {
              0%, 100% { transform: translate3d(0, -10px, 0); }
              50% { transform: translate3d(0, 10px, 0); }
            }
          `}</style>
          {/* Ambient glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 20% 30%, rgba(34,211,238,0.15), transparent 55%), radial-gradient(ellipse at 80% 75%, rgba(139,92,246,0.18), transparent 55%)",
            }}
          />

          {/* Top-right controls */}
          <TopRightControls />

          {/* LEFT — mascot column (stacked on mobile, side on md+) */}
          <div className="w-full h-1/3 md:w-1/2 md:h-full shrink-0 flex flex-col items-center justify-center pt-8 md:pt-0 relative">
            <img
              src="/robot-avatar.png"
              alt="CareerPilot AI Mascot"
              className="w-40 h-40 md:w-72 md:h-72 object-contain drop-shadow-[0_0_30px_rgba(6,182,212,0.4)] z-10"
              style={{ animation: "zoieeFloatStable 5s ease-in-out infinite", willChange: "transform" }}
            />
            <div className="w-24 md:w-32 h-3 md:h-4 bg-black/40 blur-md rounded-[100%] mt-4 md:mt-6" />
            <div className="mt-4 md:mt-8 text-center px-6">
              <div className="text-[10px] md:text-[11px] uppercase tracking-[0.28em] text-cyan-300/80">Zoiee · AI counselor</div>
              <div className="mt-2 text-white/70 text-xs md:text-sm">
                Free Questions Remaining:{" "}
                <span className="text-white font-semibold">{remaining}/{GUEST_LIMIT}</span>
              </div>
            </div>
          </div>

          {/* RIGHT — chat column */}
          <div className="w-full flex-1 md:w-1/2 md:h-full flex flex-col relative px-4 md:px-8 pb-4 pt-4 md:pt-16 min-h-0">
              {/* Chat history */}
              <div
                ref={chatScrollerRef}
                className="flex-1 min-h-0 w-full overflow-y-auto flex flex-col gap-4"
                style={{ scrollbarWidth: "none" }}
              >
                <div className="self-start bg-[#0b132b] border border-white/10 text-white p-4 rounded-2xl rounded-tl-sm shadow-lg max-w-[90%] md:max-w-[85%] text-sm leading-relaxed">
                  {openingMsg}
                  <div className="mt-2 flex items-center gap-3 text-white/40">
                    <button className="hover:text-cyan-300 transition-colors" aria-label="Like"><ThumbsUp className="size-3.5" /></button>
                    <button className="hover:text-red-300 transition-colors" aria-label="Dislike"><ThumbsDown className="size-3.5" /></button>
                  </div>
                </div>

                {msgs.map((m, i) => (
                  <div
                    key={i}
                    className={
                      m.role === "user"
                        ? "self-end bg-white text-gray-900 p-3 rounded-2xl rounded-tr-sm shadow-md max-w-[90%] md:max-w-[75%] text-sm leading-relaxed"
                        : "self-start bg-[#0b132b] border border-white/10 text-white p-4 rounded-2xl rounded-tl-sm shadow-lg max-w-[90%] md:max-w-[85%] text-sm leading-relaxed"
                    }
                  >
                    {m.role === "assistant" ? (
                      <>
                        <div dangerouslySetInnerHTML={{ __html: renderMd(m.content || "Thinking…") }} />
                        {m.content && (
                          <div className="mt-2 flex items-center gap-3 text-white/40">
                            <button className="hover:text-cyan-300 transition-colors" aria-label="Like"><ThumbsUp className="size-3.5" /></button>
                            <button className="hover:text-red-300 transition-colors" aria-label="Dislike"><ThumbsDown className="size-3.5" /></button>
                          </div>
                        )}
                      </>
                    ) : (
                      m.content
                    )}
                  </div>
                ))}
              </div>

              {/* Input bar wrapper */}
              <div className="w-full mt-4 shrink-0">
                <form
                  onSubmit={(e) => { e.preventDefault(); send(); }}
                  className="w-full flex items-center gap-2 bg-white rounded-lg p-1 shadow-2xl"
                >
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask Zoiee..."
                    disabled={streaming}
                    className="flex-1 min-w-0 bg-transparent border-none text-gray-900 px-3 md:px-4 py-3 focus:outline-none focus:ring-0 text-sm placeholder-gray-500"
                  />
                  <button
                    type="submit"
                    disabled={streaming || !input.trim()}
                    className="bg-[#0a0f1c] text-white p-3 rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-60 shrink-0"
                    aria-label="Send"
                  >
                    {streaming ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={resetChat}
                    className="bg-[#0a0f1c] text-white p-3 rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center cursor-pointer shrink-0"
                    aria-label="Restart"
                  >
                    <RotateCcw className="size-4" />
                  </button>
                </form>
              </div>
            </div>
        </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
