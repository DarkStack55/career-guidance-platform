import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, ArrowLeft, KeyRound, ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaApple, FaGithub, FaFacebook } from "react-icons/fa";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { persistCareerPilotSession } from "@/lib/auth-persistence";
import {
  startOtpChallenge,
  checkOtpChallenge,
  recordOtpFailure,
  clearOtpChallenge,
} from "@/lib/otp-guard.functions";

type LoginSearch = { next?: string; form?: string };

function sanitizeNext(v: unknown): string | undefined {
  if (typeof v !== "string" || !v.startsWith("/") || v.startsWith("//")) return undefined;
  return v;
}

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): LoginSearch => ({
    next: sanitizeNext(s.next),
    form: typeof s.form === "string" ? s.form : undefined,
  }),

  head: () => ({
    meta: [
      { title: "Sign in — CareerPilot AI" },
      { name: "description", content: "Sign in to CareerPilot AI — your intelligent career co-pilot." },
    ],
  }),
  component: LoginPage,
});

type Mode = "password" | "otp" | "forgot" | "signup";
type OtpStage = "request" | "verify";
const RESEND_SECONDS = 30;

function LoginPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const dest = next || "/dashboard";

  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<string | null>(null);

  const [otpStage, setOtpStage] = useState<OtpStage>("request");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [resendIn, setResendIn] = useState(0);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [forgotSent, setForgotSent] = useState(false);
  const [stay, setStay] = useState<boolean>(true);
  useEffect(() => {
    try { setStay(window.localStorage.getItem("cp_stay") !== "0"); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  // Auto-redirect if a session appears from an auth callback in another tab.
  useEffect(() => {
    let cancelled = false;
    const go = () => {
      if (cancelled) return;
      try { navigate({ to: dest, replace: true }); }
      catch { window.location.replace(dest); }
    };
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) go();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED")) {
        go();
      }
    });
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, [dest, navigate]);

  // Lockout countdown (ms epoch when the address unlocks).
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [lockRemaining, setLockRemaining] = useState(0);
  useEffect(() => {
    if (!lockUntil) { setLockRemaining(0); return; }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
      setLockRemaining(remaining);
      if (remaining <= 0) setLockUntil(null);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockUntil]);
  const isLocked = lockRemaining > 0;
  const fmtLock = (s: number) => {
    const mm = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };
  const applyLockFromResult = (r: { reason?: string; retryAfterSeconds?: number }) => {
    if (r.reason === "locked" && r.retryAfterSeconds && r.retryAfterSeconds > 0) {
      setLockUntil(Date.now() + r.retryAfterSeconds * 1000);
    }
  };

  const humanize = (raw: string) => {
    const m = raw.toLowerCase();
    if (m.includes("invalid login")) return "Wrong email or password.";
    if (m.includes("user already")) return "An account with this email already exists.";
    if (m.includes("email not confirmed")) return "Please confirm your email first.";
    if (m.includes("token has expired") || (m.includes("invalid") && m.includes("otp"))) return "That code is invalid or expired.";
    if (m.includes("rate") || m.includes("429")) return "Too many attempts. Please wait a moment.";
    if (m.includes("provider")) return "That sign-in provider isn't enabled yet.";
    return raw || "Something went wrong.";
  };

  const afterAuth = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) persistCareerPilotSession(data.session, { touchLastLogin: true });
    try { window.localStorage.setItem("cp_stay", stay ? "1" : "0"); } catch { /* ignore */ }
    toast.success("Welcome back!");
    navigate({ to: dest });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      await afterAuth();
    } catch (err) {
      toast.error(humanize(err instanceof Error ? err.message : "Sign in failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (password.length < 6) return toast.error("Password must be at least 6 characters.");
    if (password !== confirm) return toast.error("Passwords don't match.");
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: { emailRedirectTo: window.location.origin + "/auth/callback" },
      });
      if (error) throw error;
      if (data.session) await afterAuth();
      else { toast.success("Check your email to confirm your account."); setMode("password"); }
    } catch (err) {
      toast.error(humanize(err instanceof Error ? err.message : "Sign up failed"));
    } finally { setIsSubmitting(false); }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + "/reset-password",
      });
      if (error) throw error;
      setForgotSent(true);
      toast.success("Reset link sent — check your inbox.");
    } catch (err) {
      toast.error(humanize(err instanceof Error ? err.message : "Couldn't send reset link"));
    } finally { setIsSubmitting(false); }
  };

  const sendOtp = async () => {
    if (isSubmitting) return;
    if (isLocked) return toast.error(`Locked — try again in ${fmtLock(lockRemaining)}.`);
    if (!email.trim()) return toast.error("Enter your email first.");
    setIsSubmitting(true);
    try {
      // Pre-check: if this email is currently locked, block send and show countdown.
      try {
        const pre = await checkOtpChallenge({ data: { email: email.trim() } });
        if (!pre.ok && pre.reason === "locked") {
          applyLockFromResult(pre);
          toast.error(pre.message);
          setOtpStage("verify");
          return;
        }
      } catch { /* non-fatal */ }

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      // Reset server-side challenge window & attempt counter for this email.
      try { await startOtpChallenge({ data: { email: email.trim() } }); } catch { /* non-fatal */ }
      setOtpStage("verify"); setResendIn(RESEND_SECONDS); setOtp(Array(6).fill(""));
      toast.success("Code sent to your email.");
      setTimeout(() => otpRefs.current[0]?.focus(), 80);
    } catch (err) {
      toast.error(humanize(err instanceof Error ? err.message : "Couldn't send code"));
    } finally { setIsSubmitting(false); }
  };

  const verifyOtp = async (token: string) => {
    if (isSubmitting) return;
    if (isLocked) return toast.error(`Locked — try again in ${fmtLock(lockRemaining)}.`);
    const cleanEmail = email.trim();
    setIsSubmitting(true);
    try {
      // Server-side pre-check: expiry + lockout, independent of Supabase.
      const pre = await checkOtpChallenge({ data: { email: cleanEmail } });
      if (!pre.ok) {
        applyLockFromResult(pre);
        toast.error(pre.message);
        if (pre.reason === "expired" || pre.reason === "not_started") {
          setOtp(Array(6).fill(""));
        }
        return;
      }

      const { error } = await supabase.auth.verifyOtp({ email: cleanEmail, token, type: "email" });
      if (error) {
        // Record the failure server-side so attempts survive page reloads.
        try {
          const after = await recordOtpFailure({ data: { email: cleanEmail } });
          if (!after.ok) {
            applyLockFromResult(after);
            toast.error(after.message);
            setOtp(Array(6).fill(""));
            if (after.reason !== "locked") otpRefs.current[0]?.focus();
            return;
          }
        } catch { /* fall through to generic error */ }
        toast.error(humanize(error.message));
        setOtp(Array(6).fill(""));
        otpRefs.current[0]?.focus();
        return;
      }

      try { await clearOtpChallenge({ data: { email: cleanEmail } }); } catch { /* ignore */ }
      await afterAuth();
    } catch (err) {
      toast.error(humanize(err instanceof Error ? err.message : "Invalid code"));
    } finally { setIsSubmitting(false); }
  };


  const handleOtpChange = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "").slice(-1);
    const arr = [...otp]; arr[i] = clean; setOtp(arr);
    if (clean && i < 5) otpRefs.current[i + 1]?.focus();
    if (arr.every((c) => c) && arr.join("").length === 6) verifyOtp(arr.join(""));
  };
  const handleOtpKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const arr = text.split("").concat(Array(6).fill("")).slice(0, 6);
    setOtp(arr);
    if (text.length === 6) verifyOtp(text);
    else otpRefs.current[text.length]?.focus();
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    if (oauthBusy) return;
    setOauthBusy(provider);
    try { window.localStorage.setItem("cp_stay", stay ? "1" : "0"); } catch { /* ignore */ }
    try {
      const res = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin + "/auth/callback" });
      if (res.error) throw res.error instanceof Error ? res.error : new Error(String(res.error));
      if (res.redirected) return;
      await afterAuth();
    } catch (err) {
      toast.error(humanize(err instanceof Error ? err.message : "Sign-in failed"));
    } finally { setOauthBusy(null); }
  };

  const heading = mode === "signup" ? "Sign up" : mode === "forgot" ? "Reset" : mode === "otp" ? (otpStage === "verify" ? "Verify" : "Code") : "Login";

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden flex items-center justify-center px-4 py-10"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        background: "linear-gradient(135deg, #4c8dff 0%, #5d9bff 50%, #6ba6ff 100%)",
      }}
    >
      {/* Wavy blue background blobs */}
      <svg className="pointer-events-none absolute inset-0 w-full h-full" viewBox="0 0 400 800" preserveAspectRatio="none" aria-hidden>
        <path d="M0,140 C120,60 260,200 400,120 L400,0 L0,0 Z" fill="rgba(255,255,255,0.14)" />
        <path d="M0,220 C140,300 280,140 400,240 L400,180 C260,120 140,260 0,180 Z" fill="rgba(255,255,255,0.10)" />
        <path d="M0,680 C140,600 260,760 400,660 L400,800 L0,800 Z" fill="rgba(255,255,255,0.10)" />
        <path d="M0,720 C160,780 260,640 400,720 L400,800 L0,800 Z" fill="rgba(255,255,255,0.08)" />
      </svg>

      {/* Back button */}
      <button
        onClick={() => navigate({ to: "/" })}
        className="absolute top-5 right-5 z-20 inline-flex items-center gap-1.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 px-4 py-2 text-[13px] font-medium text-white transition cursor-pointer"
      >
        <ArrowLeft className="size-4" /> Back
      </button>

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-[420px] rounded-[28px] p-7 sm:p-8"
        style={{
          background: "rgba(255,255,255,0.18)",
          backdropFilter: "blur(24px) saturate(140%)",
          border: "1px solid rgba(255,255,255,0.35)",
          boxShadow: "0 30px 80px rgba(30, 60, 130, 0.35), inset 0 1px 0 rgba(255,255,255,0.4)",
        }}
      >
        <p className="text-white/80 text-[14px] font-medium mb-1">CareerPilot</p>
        <h1 className="text-white text-[44px] leading-none font-bold tracking-tight mb-6">{heading}</h1>

        {/* ========== PASSWORD ========== */}
        {mode === "password" && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <Field label="Email">
              <input
                type="email" required disabled={isSubmitting} value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="username@gmail.com" autoComplete="email"
                style={{ fontSize: "16px" }}
                className={inputCls}
              />
            </Field>
            <Field label="Password">
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"} required disabled={isSubmitting} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password" autoComplete="current-password"
                  style={{ fontSize: "16px" }}
                  className={inputCls + " pr-12"}
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} aria-label="Toggle password"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 cursor-pointer">
                  {showPw ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </Field>

            <div className="flex items-center justify-between text-[13px] text-white/90 pt-1">
              <button type="button" onClick={() => setMode("forgot")} className="hover:text-white underline-offset-4 hover:underline cursor-pointer">
                Forgot Password?
              </button>
              <button type="button" onClick={() => { setMode("otp"); setOtpStage("request"); }} className="inline-flex items-center gap-1 hover:text-white cursor-pointer">
                <KeyRound className="size-4" /> Use code instead
              </button>
            </div>

            <StayCheckbox stay={stay} setStay={setStay} />

            <PrimaryBtn busy={isSubmitting} label="Sign in" />
          </form>
        )}

        {/* ========== OTP ========== */}
        {mode === "otp" && (
          <div className="space-y-4">
            {otpStage === "request" ? (
              <>
                <Field label="Email">
                  <input
                    type="email" disabled={isSubmitting} value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="username@gmail.com" autoComplete="email"
                    style={{ fontSize: "16px" }} className={inputCls}
                  />
                </Field>
                <button onClick={sendOtp} disabled={isSubmitting} className={primaryCls}>
                  {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : <>Send code <ArrowRight className="size-4" /></>}
                </button>
              </>
            ) : (
              <>
                <p className="text-white/85 text-[13px] -mt-1">Enter the 6-digit code sent to {email}</p>
                {isLocked && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="rounded-2xl border border-red-300/40 bg-red-500/15 p-3.5 text-white"
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="size-4 shrink-0" />
                      <span className="text-[13.5px] font-semibold">Too many attempts</span>
                    </div>
                    <p className="mt-1 text-[12.5px] text-white/85">
                      For your security, this email is temporarily locked. Try again in{" "}
                      <span className="tabular-nums font-semibold text-white">{fmtLock(lockRemaining)}</span>.
                    </p>
                    <div
                      className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/20"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={lockUntil ? Math.round(100 - (lockRemaining * 1000 * 100) / Math.max(1, lockUntil - (lockUntil - lockRemaining * 1000 - 1))) : 0}
                    >
                      <div
                        className="h-full bg-red-300/80 transition-[width] duration-1000 ease-linear"
                        style={{ width: `${Math.max(0, Math.min(100, 100 - (lockRemaining / (15 * 60)) * 100))}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
                  {otp.map((v, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text" inputMode="numeric" maxLength={1} value={v}
                      disabled={isSubmitting || isLocked}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKey(i, e)}
                      style={{ fontSize: "20px" }}
                      className="w-12 h-12 text-center font-bold rounded-xl bg-white text-slate-900 border border-white/50 outline-none focus:ring-2 focus:ring-white/80 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  ))}
                </div>
                <p className="text-[12px] text-white/70 text-center leading-relaxed -mt-1">
                  Use only the 6-digit verification code from your email. Never share this code with anyone.
                </p>
                <StayCheckbox stay={stay} setStay={setStay} />
                <button onClick={() => verifyOtp(otp.join(""))} disabled={isSubmitting || isLocked || otp.join("").length !== 6} className={primaryCls}>
                  {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : isLocked ? <><Lock className="size-4" /> Locked · {fmtLock(lockRemaining)}</> : <>Verify code <ArrowRight className="size-4" /></>}
                </button>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={isSubmitting || resendIn > 0 || isLocked}
                    aria-live="polite"
                    aria-disabled={isSubmitting || resendIn > 0 || isLocked}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-white/40 bg-white/15 hover:bg-white/25 px-4 py-2.5 text-[13.5px] font-medium text-white transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-white/15"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="size-4 animate-spin" /> Sending…</>
                    ) : isLocked ? (
                      <><Lock className="size-4" /> Resend available in <span className="tabular-nums font-semibold">{fmtLock(lockRemaining)}</span></>
                    ) : resendIn > 0 ? (
                      <>Resend code in <span className="tabular-nums font-semibold">{resendIn}s</span></>
                    ) : (
                      <>Resend code</>
                    )}
                  </button>
                  {resendIn > 0 && (
                    <div
                      className="h-1 w-full overflow-hidden rounded-full bg-white/20"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={RESEND_SECONDS}
                      aria-valuenow={RESEND_SECONDS - resendIn}
                    >
                      <div
                        className="h-full bg-white/80 transition-[width] duration-1000 ease-linear"
                        style={{ width: `${((RESEND_SECONDS - resendIn) / RESEND_SECONDS) * 100}%` }}
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[12.5px] text-white/85">
                    <span className="opacity-80">
                      {resendIn > 0 ? "Check your inbox — email may take a moment." : "Didn't get it? Try again."}
                    </span>
                    <button type="button" onClick={() => setOtpStage("request")} className="hover:text-white cursor-pointer">Change email</button>
                  </div>
                </div>
              </>
            )}
            <button type="button" onClick={() => { setMode("password"); setOtpStage("request"); }} className="w-full py-2 text-[13px] text-white/85 hover:text-white cursor-pointer">
              Use password instead
            </button>
          </div>
        )}

        {/* ========== FORGOT ========== */}
        {mode === "forgot" && (
          <div className="space-y-4">
            {forgotSent ? (
              <div className="rounded-2xl bg-white/25 border border-white/40 p-4 text-white text-[13.5px] inline-flex items-start gap-2">
                <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
                <span>A password-reset link is on its way to <b>{email}</b>.</span>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="space-y-4">
                <Field label="Email">
                  <input
                    type="email" required disabled={isSubmitting} value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="username@gmail.com" autoComplete="email"
                    style={{ fontSize: "16px" }} className={inputCls}
                  />
                </Field>
                <PrimaryBtn busy={isSubmitting} label="Send reset link" />
              </form>
            )}
            <button type="button" onClick={() => { setMode("password"); setForgotSent(false); }}
              className="w-full py-2 text-[13px] text-white/90 hover:text-white cursor-pointer inline-flex items-center justify-center gap-1.5">
              <ArrowLeft className="size-4" /> Back to sign in
            </button>
          </div>
        )}

        {/* ========== SIGNUP ========== */}
        {mode === "signup" && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <Field label="Email">
              <input type="email" required disabled={isSubmitting} value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="username@gmail.com" autoComplete="email"
                style={{ fontSize: "16px" }} className={inputCls} />
            </Field>
            <Field label="Password">
              <div className="relative">
                <input type={showPw ? "text" : "password"} required disabled={isSubmitting} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters" autoComplete="new-password"
                  style={{ fontSize: "16px" }} className={inputCls + " pr-12"} />
                <button type="button" onClick={() => setShowPw((v) => !v)} aria-label="Toggle password"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 cursor-pointer">
                  {showPw ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </Field>
            <Field label="Confirm password">
              <input type={showPw ? "text" : "password"} required disabled={isSubmitting} value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password" autoComplete="new-password"
                style={{ fontSize: "16px" }} className={inputCls} />
            </Field>
            <PrimaryBtn busy={isSubmitting} label="Create account" />
          </form>
        )}

        {/* Divider */}
        <p className="text-center text-white/85 text-[13px] mt-6 mb-3">or continue with</p>

        {/* Social grid */}
        <div className="grid grid-cols-2 gap-3">
          <SocialButton
            provider="google"
            label="Google"
            icon={<FcGoogle className="size-5" />}
            busy={oauthBusy === "google"}
            onClick={() => handleOAuth("google")}
          />
          <SocialButton
            provider="apple"
            label="Apple"
            icon={<FaApple className="size-5 text-slate-800" />}
            busy={oauthBusy === "apple"}
            onClick={() => handleOAuth("apple")}
          />
          <SocialButton
            provider="github"
            label="GitHub"
            icon={<FaGithub className="size-5 text-white" />}
            disabled
            comingSoon
          />
          <SocialButton
            provider="facebook"
            label="Facebook"
            icon={<FaFacebook className="size-5 text-white" />}
            disabled
            comingSoon
          />
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-white/90 text-[13.5px]">
          {mode === "signup" ? (
            <>Already have an account?{" "}
              <button onClick={() => setMode("password")} className="text-white font-semibold hover:underline underline-offset-4 cursor-pointer">Sign in</button>
            </>
          ) : (
            <>Don't have an account?{" "}
              <button onClick={() => setMode("signup")} className="text-white font-semibold hover:underline underline-offset-4 cursor-pointer">Register for free</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

const inputCls =
  "w-full h-12 px-4 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 border border-white/40 outline-none focus:ring-2 focus:ring-white/80 transition disabled:opacity-60 shadow-[0_4px_14px_rgba(30,60,130,0.10)]";

const primaryCls =
  "w-full h-12 rounded-2xl font-semibold text-white text-[15px] bg-[#2b4a8f] hover:bg-[#25417e] active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(20,40,90,0.35)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-white text-[14px] font-medium mb-2">{label}</label>
      {children}
    </div>
  );
}

function PrimaryBtn({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button type="submit" disabled={busy} className={primaryCls}>
      {busy ? <Loader2 className="size-5 animate-spin" /> : <>{label} <ArrowRight className="size-4" /></>}
    </button>
  );
}

function StayCheckbox({ stay, setStay }: { stay: boolean; setStay: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-[13px] text-white/90 select-none cursor-pointer">
      <input
        type="checkbox"
        checked={stay}
        onChange={(e) => setStay(e.target.checked)}
        className="size-4 rounded border-white/60 accent-white cursor-pointer"
      />
      <span>Stay signed in</span>
    </label>
  );
}

function SocialButton({
  provider,
  label,
  icon,
  busy,
  disabled,
  comingSoon,
  onClick,
}: {
  provider: string;
  label: string;
  icon: React.ReactNode;
  busy?: boolean;
  disabled?: boolean;
  comingSoon?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || busy}
      aria-label={comingSoon ? `${label} — coming soon` : `Continue with ${label}`}
      className={`relative h-12 rounded-2xl inline-flex items-center justify-center gap-2 font-medium text-[13px] border transition active:scale-[0.99] ${
        provider === "google" || provider === "apple"
          ? "bg-white text-slate-800 hover:bg-white/95 border-white/40 shadow-[0_6px_18px_rgba(30,60,130,0.18)]"
          : "bg-white/10 text-white/70 border-white/20 cursor-not-allowed"
      }`}
    >
      {busy ? (
        <Loader2 className="size-5 animate-spin text-slate-600" />
      ) : (
        <>
          {icon}
          <span>{label}</span>
          {comingSoon && (
            <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-white/90 text-slate-900 text-[9px] font-bold shadow-sm">
              Soon
            </span>
          )}
        </>
      )}
    </button>
  );
}
