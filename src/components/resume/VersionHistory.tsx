import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { History, Save, RotateCcw, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ResumeDraft } from "@/lib/resume-builder.functions";
import {
  listResumeVersions,
  saveResumeVersion,
  deleteResumeVersion,
  type ResumeVersion,
} from "@/lib/resume-versions.functions";

function countItems(d: ResumeDraft) {
  return {
    skills: d.skills.length,
    experience: d.experience.length,
    education: d.education.length,
    projects: d.projects.length,
    certifications: d.certifications.length,
  };
}

/** Short human diff between a saved version and the current draft. */
function diffSummary(version: ResumeDraft, current: ResumeDraft): string {
  const a = countItems(version);
  const b = countItems(current);
  const parts: string[] = [];
  (Object.keys(a) as Array<keyof typeof a>).forEach((k) => {
    const delta = b[k] - a[k];
    if (delta !== 0) parts.push(`${delta > 0 ? "+" : ""}${delta} ${k}`);
  });
  const fields: Array<[string, keyof ResumeDraft]> = [
    ["name", "fullName"],
    ["headline", "headline"],
    ["summary", "summary"],
    ["location", "location"],
  ];
  fields.forEach(([label, key]) => {
    if ((version[key] as string) !== (current[key] as string)) parts.push(`${label} edited`);
  });
  return parts.length ? parts.join(" · ") : "Identical to current draft";
}

export function VersionHistory({
  draft,
  onRestore,
}: {
  draft: ResumeDraft;
  onRestore: (d: ResumeDraft) => void;
}) {
  const listFn = useServerFn(listResumeVersions);
  const saveFn = useServerFn(saveResumeVersion);
  const deleteFn = useServerFn(deleteResumeVersion);

  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = (await listFn()) as ResumeVersion[];
        if (alive) setVersions(rows);
      } catch {
        /* history is optional — stay quiet on first load */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [listFn]);

  const save = async () => {
    setSaving(true);
    try {
      const row = (await saveFn({ data: { draft, label, source: "manual" } })) as ResumeVersion;
      setVersions((v) => [row, ...v]);
      setLabel("");
      toast.success(`Saved ${row.label}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const prev = versions;
    setVersions((v) => v.filter((x) => x.id !== id));
    try {
      await deleteFn({ data: { id } });
    } catch (e) {
      setVersions(prev);
      toast.error((e as Error).message);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <History className="size-4 text-primary" /> Version history
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Snapshot your resume before big edits, compare what changed, and revert any time — then regenerate the plan.
          </p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label this version (optional)"
          className="flex-1 min-w-[200px] rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground px-3 py-2 text-sm outline-none focus:border-primary/60"
        />
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save version
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading history…</div>
      ) : versions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No saved versions yet. Save one before your next round of edits.
        </div>
      ) : (
        <ul className="space-y-2">
          {versions.map((v) => (
            <li
              key={v.id}
              className="rounded-xl border border-border bg-background/60 p-4 flex items-start justify-between gap-4 flex-wrap"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                  v{v.versionNumber} · {v.label || "Untitled"}
                  <span className="ml-2 text-[11px] uppercase tracking-wide text-muted-foreground">{v.source}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(v.createdAt).toLocaleString()} — {diffSummary(v.draft, draft)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onRestore(v.draft);
                    toast.success(`Reverted to v${v.versionNumber}`);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary"
                >
                  <RotateCcw className="size-3.5" /> Revert
                </button>
                <button
                  onClick={() => remove(v.id)}
                  aria-label={`Delete version ${v.versionNumber}`}
                  className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-destructive hover:bg-secondary"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
