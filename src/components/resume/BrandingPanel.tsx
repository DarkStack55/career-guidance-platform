import { useRef } from "react";
import { ImagePlus, Palette, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";

export type PdfBranding = {
  title: string;
  subtitle: string;
  accentColor: string;
  logoDataUrl: string | null;
};

export const defaultBranding: PdfBranding = {
  title: "Skill-Gap Analysis & Improvement Plan",
  subtitle: "CareerPilot AI",
  accentColor: "#2563eb",
  logoDataUrl: null,
};

const swatches = ["#2563eb", "#0d9488", "#7c3aed", "#db2777", "#ea580c", "#0f172a"];

export function BrandingPanel({
  value,
  onChange,
}: {
  value: PdfBranding;
  onChange: (next: PdfBranding) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof PdfBranding>(key: K, v: PdfBranding[K]) =>
    onChange({ ...value, [key]: v });

  const pickLogo = (file?: File) => {
    if (!file) return;
    if (!/^image\/(png|jpeg)$/.test(file.type)) {
      toast.error("Logo must be a PNG or JPG image.");
      return;
    }
    if (file.size > 600 * 1024) {
      toast.error("Logo must be under 600 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set("logoDataUrl", String(reader.result));
    reader.onerror = () => toast.error("Couldn't read that image.");
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium flex items-center gap-2">
            <Palette className="size-4 text-primary" /> PDF branding
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Customize the cover title, subtitle, accent colour and logo before exporting.
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange(defaultBranding)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-secondary"
        >
          <RotateCcw className="size-3.5" /> Reset
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs text-muted-foreground">Title</span>
          <input
            value={value.title}
            maxLength={80}
            onChange={(e) => set("title", e.target.value)}
            className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 text-sm"
            placeholder="Skill-Gap Analysis & Improvement Plan"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs text-muted-foreground">Subtitle / brand name</span>
          <input
            value={value.subtitle}
            maxLength={60}
            onChange={(e) => set("subtitle", e.target.value)}
            className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 text-sm"
            placeholder="CareerPilot AI"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Accent</span>
          {swatches.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Accent ${c}`}
              onClick={() => set("accentColor", c)}
              style={{ backgroundColor: c }}
              className={`size-6 rounded-full border-2 ${
                value.accentColor.toLowerCase() === c ? "border-foreground" : "border-transparent"
              }`}
            />
          ))}
          <input
            type="color"
            aria-label="Custom accent colour"
            value={value.accentColor}
            onChange={(e) => set("accentColor", e.target.value)}
            className="size-7 rounded-md border border-border bg-background p-0.5"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => pickLogo(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs hover:bg-secondary"
          >
            <ImagePlus className="size-3.5" /> {value.logoDataUrl ? "Change logo" : "Upload logo"}
          </button>
          {value.logoDataUrl && (
            <span className="inline-flex items-center gap-2 rounded-lg border border-border px-2 py-1">
              <img src={value.logoDataUrl} alt="Logo preview" className="h-6 w-auto max-w-24 object-contain" />
              <button
                type="button"
                aria-label="Remove logo"
                onClick={() => set("logoDataUrl", null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background p-4">
        <div className="flex items-center gap-3">
          {value.logoDataUrl && (
            <img src={value.logoDataUrl} alt="" className="h-7 w-auto max-w-28 object-contain" />
          )}
          <div>
            <div className="text-[10px] uppercase tracking-widest" style={{ color: value.accentColor }}>
              {value.subtitle || "CareerPilot AI"}
            </div>
            <div className="text-base font-semibold text-foreground">
              {value.title || "Skill-Gap Analysis & Improvement Plan"}
            </div>
          </div>
        </div>
        <div className="mt-3 h-1 w-full rounded-full" style={{ backgroundColor: value.accentColor }} />
      </div>
    </div>
  );
}
