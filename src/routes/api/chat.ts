import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Msg = { role: "system" | "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are Pilot, the AI career advisor for CareerPilot AI — a futuristic career platform.

You help people across EVERY domain: technology, AI/ML, cybersecurity, design, business, finance, medicine, law, aviation, sports, gaming, music, film, hospitality, agriculture, creative writing, freelancing, entrepreneurship, and more.

Your style:
- Concise, warm, specific. Use markdown (headings, bullet lists, **bold**, code blocks).
- When asked for a roadmap, return a clear phased plan (Phase 1/2/3) with weekly tasks, free resources, and a portfolio project per phase.
- When asked about a career, include: typical salary range, growth outlook, day-to-day tasks, must-have skills, recommended starter project, and 2–3 free learning resources.
- Never refuse career questions. Never repeat the same boilerplate twice.
- If the user is vague, ask ONE crisp clarifying question, then give a useful answer anyway.
- Always end long answers with a "Next step" line the user can do today.`;

// Server-enforced per-user daily quota (defense against abuse of the paid gateway).
const DAILY_LIMIT = 60;

const jsonError = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }),
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!apiKey || !SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
          return jsonError(500, "AI gateway not configured");
        }

        // ---- Session is optional: guests get a small free allowance ----
        const authHeader = request.headers.get("authorization") ?? "";
        let userId: string | undefined;
        if (authHeader.toLowerCase().startsWith("bearer ")) {
          const token = authHeader.slice(7).trim();
          if (token) {
            const supabaseAuth = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
              auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
            });
            const { data: claimsData } = await supabaseAuth.auth.getClaims(token);
            userId = claimsData?.claims?.sub;
          }
        }


        // ---- Parse and validate body ----
        let body: { messages?: Msg[] };
        try {
          body = await request.json();
        } catch {
          return jsonError(400, "Invalid JSON");
        }
        const raw = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
        const messages = raw
          .filter((m): m is Msg => !!m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
          .map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));
        if (messages.length === 0) {
          return jsonError(400, "No messages provided");
        }

        // ---- Guests: small free allowance, no DB accounting ----
        if (!userId) {
          if (messages.filter((m) => m.role === "user").length > 3) {
            return jsonError(401, "Free guest questions used up. Please sign in to continue.");
          }
        } else {
          // ---- Enforce server-side per-user daily quota via service role ----
          // (RLS on public.chat_usage is enabled; only service_role writes.)
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // Paying subscribers get unlimited Zoiee counselling.
          const paymentsEnv = (import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined)
            ?.startsWith("test_")
            ? "sandbox"
            : "live";
          const { data: isSubscriber } = await supabaseAdmin.rpc("has_active_subscription", {
            user_uuid: userId,
            check_env: paymentsEnv,
          });

          const today = new Date().toISOString().slice(0, 10); // UTC yyyy-mm-dd
          const { data: usageRow, error: usageErr } = await supabaseAdmin
            .from("chat_usage")
            .select("count")
            .eq("user_id", userId)
            .eq("day", today)
            .maybeSingle();
          if (usageErr) {
            console.error("chat_usage read failed", usageErr);
            return jsonError(500, "Usage check failed");
          }
          const current = usageRow?.count ?? 0;
          if (!isSubscriber && current >= DAILY_LIMIT) {
            return jsonError(
              429,
              `Daily limit reached (${DAILY_LIMIT} messages). Upgrade to Pro for unlimited Zoiee counselling.`,
            );
          }
          // Reserve one request BEFORE calling the paid gateway.
          const { error: upsertErr } = await supabaseAdmin
            .from("chat_usage")
            .upsert(
              { user_id: userId, day: today, count: current + 1, updated_at: new Date().toISOString() },
              { onConflict: "user_id,day" },
            );
          if (upsertErr) {
            console.error("chat_usage upsert failed", upsertErr);
            return jsonError(500, "Usage recording failed");
          }
        }


        // ---- Forward to Lovable AI gateway (streaming) ----
        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
            stream: true,
          }),
        });

        if (!upstream.ok) {
          if (upstream.status === 429) {
            return jsonError(429, "Rate limit reached. Please wait a moment and try again.");
          }
          if (upstream.status === 402) {
            return jsonError(402, "AI credits exhausted. Please top up your Lovable workspace.");
          }
          const t = await upstream.text().catch(() => "");
          console.error("AI gateway error", upstream.status, t);
          return jsonError(502, "AI gateway error");
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Access-Control-Allow-Origin": "*",
          },
        });
      },
    },
  },
});
