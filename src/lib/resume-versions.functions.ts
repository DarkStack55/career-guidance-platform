import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ResumeDraft } from "@/lib/resume-builder.functions";

export type ResumeVersion = {
  id: string;
  versionNumber: number;
  label: string;
  source: string;
  createdAt: string;
  draft: ResumeDraft;
};

function str(v: unknown) {
  return typeof v === "string" ? v : "";
}
function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export function normalizeDraftValue(value: unknown): ResumeDraft {
  const d = (value ?? {}) as Partial<ResumeDraft>;
  return {
    fullName: str(d.fullName),
    headline: str(d.headline),
    email: str(d.email),
    phone: str(d.phone),
    location: str(d.location),
    summary: str(d.summary),
    skills: arr<string>(d.skills).filter((s) => typeof s === "string").slice(0, 60),
    experience: arr<ResumeDraft["experience"][number]>(d.experience).slice(0, 12).map((e) => ({
      title: str(e?.title),
      company: str(e?.company),
      period: str(e?.period),
      bullets: arr<string>(e?.bullets).slice(0, 10),
    })),
    education: arr<ResumeDraft["education"][number]>(d.education).slice(0, 8).map((e) => ({
      degree: str(e?.degree),
      institution: str(e?.institution),
      period: str(e?.period),
    })),
    projects: arr<ResumeDraft["projects"][number]>(d.projects).slice(0, 10).map((p) => ({
      name: str(p?.name),
      description: str(p?.description),
    })),
    certifications: arr<string>(d.certifications).slice(0, 20),
  };
}

/** List the signed-in user's saved resume versions, newest first. */
export const listResumeVersions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ResumeVersion[]> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("resume_versions")
      .select("id, version_number, label, source, draft, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id as string,
      versionNumber: Number(r.version_number ?? 1),
      label: r.label ?? "",
      source: r.source ?? "manual",
      createdAt: r.created_at as string,
      draft: normalizeDraftValue(r.draft),
    }));
  });

/** Snapshot the current resume draft as a new version. */
export const saveResumeVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown): { draft: ResumeDraft; label: string; source: string } => {
    const d = (data ?? {}) as Record<string, unknown>;
    const source = str(d['source']);
    return {
      draft: normalizeDraftValue(d['draft']),
      label: str(d['label']).trim().slice(0, 80),
      source: ["upload", "paste", "manual", "auto"].includes(source) ? source : "manual",
    };
  })
  .handler(async ({ data, context }): Promise<ResumeVersion> => {
    const { supabase, userId } = context;

    const { data: last } = await supabase
      .from("resume_versions")
      .select("version_number")
      .eq("user_id", userId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextNumber = Number(last?.version_number ?? 0) + 1;

    const { data: row, error } = await supabase
      .from("resume_versions")
      .insert({
        user_id: userId,
        version_number: nextNumber,
        label: data.label || `Version ${nextNumber}`,
        source: data.source,
        draft: JSON.parse(JSON.stringify(data.draft)),
      })
      .select("id, version_number, label, source, draft, created_at")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Could not save this version");

    return {
      id: row.id as string,
      versionNumber: Number(row.version_number),
      label: row.label ?? "",
      source: row.source ?? "manual",
      createdAt: row.created_at as string,
      draft: normalizeDraftValue(row.draft),
    };
  });

/** Delete one of the user's saved versions. */
export const deleteResumeVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown): { id: string } => {
    const id = str((data as Record<string, unknown>)?.['id']);
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid version");
    return { id };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("resume_versions")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
