import { useEffect, useState } from "react";
import { subscribeChatGate } from "@/lib/chatGate";

/**
 * Full-screen loading gate shown briefly when any chat-opening button is
 * clicked. Visually mirrors the initial #cp-splash so users see a single
 * consistent loading state and never catch a flash of underlying content
 * while the chat surface (ChatWidget / Concierge / Aether) mounts.
 */
export function ChatOpenGate() {
  const [visible, setVisible] = useState(false);

  useEffect(() => subscribeChatGate(setVisible), []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!visible) return;
    const { body } = document;
    const prev = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = prev;
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="bg-background dark:bg-[#050505]"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100001,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 20,
        animation: "cpGateIn 180ms ease-out",
      }}
    >
      <style>{`
        @keyframes cpGateIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cpGateFloat { 0%,100% { transform: translateY(-6px) } 50% { transform: translateY(6px) } }
        @keyframes cpGatePulse { 0%,100% { opacity:.3; transform: scale(.8) } 50% { opacity:1; transform: scale(1) } }
      `}</style>
      <img
        src="/robot-avatar.png"
        alt=""
        style={{
          width: 96,
          height: 96,
          objectFit: "contain",
          filter: "drop-shadow(0 0 24px rgba(6,182,212,.45))",
          animation: "cpGateFloat 2.4s ease-in-out infinite",
        }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        {[0, 0.15, 0.3].map((d, i) => (
          <span
            key={i}
            className="bg-foreground/40"
            style={{
              width: 8,
              height: 8,
              borderRadius: 9999,
              animation: `cpGatePulse 1.2s ease-in-out ${d}s infinite`,
            }}
          />
        ))}
      </div>

    </div>
  );
}
