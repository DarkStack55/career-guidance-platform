import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { GapPlan } from "@/lib/resume-builder.functions";

export type SharedGapPlan = {
  id: string;
  targetRole: string;
  candidateName: string;
  createdAt: string;
  plan: GapPlan;
  pdfUrl: string | null;
};

function normalizePlan(value: unknown): GapPlan {
  const p = (value ?? {}) as Partial<GapPlan>;
  const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  return {
    target_role: typeof p.target_role === "string" ? p.target_role : "",
    readiness_score: Number.isFinite(Number(p.readiness_score))
      ? Math.max(0, Math.min(100, Math.round(Number(p.readiness_score))))
      : 0,
    verdict: typeof p.verdict === "string" ? p.verdict : "",
    matched_skills: arr<string>(p.matched_skills).slice(0, 40),
    gaps: arr<GapPlan["gaps"][number]>(p.gaps).slice(0, 15),
    phases: arr<GapPlan["phases"][number]>(p.phases).slice(0, 8),
    resume_rewrites: arr<string>(p.resume_rewrites).slice(0, 12),
    suggested_roles: arr<string>(p.suggested_roles).slice(0, 10),
  };
}

type Branding = {
  title: string;
  subtitle: string;
  accentColor: string;
  logoDataUrl: string | null;
};

function normalizeBranding(value: unknown): Branding {
  const b = (value ?? {}) as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const accent = str(b['accentColor'], 9);
  const logo = typeof b['logoDataUrl'] === "string" ? b['logoDataUrl'] : "";
  const logoOk =
    /^data:image\/(png|jpeg);base64,/i.test(logo) && logo.length <= 1_200_000 ? logo : null;
  return {
    title: str(b['title'], 80) || "Skill-Gap Analysis & Improvement Plan",
    subtitle: str(b['subtitle'], 60) || "CareerPilot AI",
    accentColor: /^#[0-9a-f]{6}$/i.test(accent) ? accent : "#2563eb",
    logoDataUrl: logoOk,
  };
}

/** Renders the plan to PDF, stores it, and creates a shareable record. */
export const exportGapPlanPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown): { plan: GapPlan; candidateName: string; branding: Branding } => {
    const d = (data ?? {}) as Record<string, unknown>;
    const plan = normalizePlan(d['plan']);
    if (!plan.target_role) throw new Error("Generate a plan before exporting");
    return {
      plan,
      candidateName: typeof d['candidateName'] === "string" ? d['candidateName'].trim().slice(0, 120) : "",
      branding: normalizeBranding(d['branding']),
    };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { buildGapPlanPdf } = await import("@/lib/gap-plan-pdf.server");

    const bytes = await buildGapPlanPdf(data.plan, data.candidateName, data.branding);


    const { data: row, error: insertError } = await supabase
      .from("gap_plan_shares")
      .insert({
        user_id: userId,
        target_role: data.plan.target_role,
        candidate_name: data.candidateName || null,
        plan: JSON.parse(JSON.stringify(data.plan)),
      })
      .select("id, created_at")
      .single();
    if (insertError || !row) throw new Error(insertError?.message ?? "Could not save the plan");

    const path = `${userId}/gap-plans/${row.id}.pdf`;
    const up = await supabase.storage.from("user-uploads").upload(path, bytes, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (up.error) throw new Error(`Could not store the PDF: ${up.error.message}`);

    await supabase.from("gap_plan_shares").update({ pdf_path: path }).eq("id", row.id);

    const signed = await supabase.storage.from("user-uploads").createSignedUrl(path, 60 * 60, {
      download: `skill-gap-plan-${data.plan.target_role.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`,
    });

    return {
      id: row.id as string,
      sharePath: `/plan/${row.id}`,
      downloadUrl: signed.data?.signedUrl ?? null,
    };
  });

/** Public read for a shared plan link. */
export const getSharedGapPlan = createServerFn({ method: "GET" })
  .inputValidator((data: unknown): { id: string } => {
    const d = (data ?? {}) as Record<string, unknown>;
    const id = typeof d['id'] === "string" ? d['id'] : "";
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid share link");
    return { id };
  })
  .handler(async ({ data }): Promise<SharedGapPlan | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row } = await supabaseAdmin
      .from("gap_plan_shares")
      .select("id, target_role, candidate_name, plan, pdf_path, created_at")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) return null;

    let pdfUrl: string | null = null;
    if (row.pdf_path) {
      const signed = await supabaseAdmin.storage
        .from("user-uploads")
        .createSignedUrl(row.pdf_path, 60 * 60 * 24);
      pdfUrl = signed.data?.signedUrl ?? null;
    }

    return {
      id: row.id,
      targetRole: row.target_role,
      candidateName: row.candidate_name ?? "",
      createdAt: row.created_at,
      plan: normalizePlan(row.plan),
      pdfUrl,
    };
  });
