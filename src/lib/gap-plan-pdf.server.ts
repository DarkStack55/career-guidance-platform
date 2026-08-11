import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { GapPlan } from "./resume-builder.functions";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 54;
const MAX_W = PAGE_W - MARGIN * 2;

function sanitize(text: string) {
  // StandardFonts are WinAnsi-only; strip anything they can't encode.
  return (text ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "");
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = sanitize(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

export type PdfBranding = {
  title: string;
  subtitle: string;
  accentColor: string;
  logoDataUrl: string | null;
};

export const defaultPdfBranding: PdfBranding = {
  title: "Skill-Gap Analysis & Improvement Plan",
  subtitle: "CareerPilot AI",
  accentColor: "#2563eb",
  logoDataUrl: null,
};

function hexToRgb(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex ?? "").trim());
  if (!m) return rgb(0.15, 0.39, 0.92);
  const n = parseInt(m[1]!, 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

function decodeDataUrl(dataUrl: string): { bytes: Uint8Array; type: "png" | "jpg" } | null {
  const m = /^data:image\/(png|jpeg);base64,([\s\S]+)$/i.exec(dataUrl.trim());
  if (!m) return null;
  try {
    const bin = atob(m[2]!.replace(/\s/g, ""));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { bytes, type: m[1]!.toLowerCase() === "png" ? "png" : "jpg" };
  } catch {
    return null;
  }
}

export async function buildGapPlanPdf(
  plan: GapPlan,
  candidateName: string,
  branding: PdfBranding = defaultPdfBranding,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const brandTitle = branding.title?.trim() || defaultPdfBranding.title;
  const brandSubtitle = branding.subtitle?.trim() || defaultPdfBranding.subtitle;

  const ink = rgb(0.07, 0.09, 0.13);
  const muted = rgb(0.42, 0.46, 0.53);
  const accent = hexToRgb(branding.accentColor);

  let page: PDFPage = pdf.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const newPage = () => {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
  };

  const text = (
    value: string,
    opts: { size?: number; f?: PDFFont; color?: ReturnType<typeof rgb>; indent?: number; gap?: number } = {},
  ) => {
    const size = opts.size ?? 10.5;
    const f = opts.f ?? font;
    const indent = opts.indent ?? 0;
    for (const line of wrap(value, f, size, MAX_W - indent)) {
      if (y < MARGIN + 40) newPage();
      page.drawText(line, { x: MARGIN + indent, y, size, font: f, color: opts.color ?? ink });
      y -= size + 4;
    }
    y -= opts.gap ?? 0;
  };

  const heading = (value: string) => {
    y -= 10;
    if (y < MARGIN + 60) newPage();
    text(value, { size: 14, f: bold, color: accent });
    if (y < MARGIN + 20) newPage();
    page.drawLine({
      start: { x: MARGIN, y: y + 6 },
      end: { x: PAGE_W - MARGIN, y: y + 6 },
      thickness: 0.6,
      color: rgb(0.85, 0.87, 0.9),
    });
    y -= 8;
  };

  // Header (optional logo)
  if (branding.logoDataUrl) {
    const decoded = decodeDataUrl(branding.logoDataUrl);
    if (decoded) {
      try {
        const img =
          decoded.type === "png" ? await pdf.embedPng(decoded.bytes) : await pdf.embedJpg(decoded.bytes);
        const maxH = 40;
        const maxW = 150;
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);
        const w = img.width * scale;
        const h = img.height * scale;
        page.drawImage(img, { x: MARGIN, y: y - h, width: w, height: h });
        y -= h + 14;
      } catch {
        // ignore unreadable logo, keep text header
      }
    }
  }

  text(brandSubtitle, { size: 10, f: bold, color: muted, gap: 8 });
  text(brandTitle, { size: 22, f: bold });
  text(
    `${candidateName ? `${candidateName} · ` : ""}Target role: ${plan.target_role} · ${new Date().toLocaleDateString()}`,
    { size: 10, color: muted, gap: 6 },
  );

  // Readiness
  const score = Math.max(0, Math.min(100, plan.readiness_score));
  if (y < MARGIN + 80) newPage();
  page.drawRectangle({ x: MARGIN, y: y - 34, width: MAX_W, height: 44, color: rgb(0.95, 0.96, 0.99) });
  page.drawText(`${score}/100`, { x: MARGIN + 14, y: y - 20, size: 22, font: bold, color: accent });
  page.drawText("Readiness score", { x: MARGIN + 110, y: y - 14, size: 10, font, color: muted });
  page.drawRectangle({ x: MARGIN + 110, y: y - 28, width: MAX_W - 130, height: 7, color: rgb(0.88, 0.9, 0.94) });
  page.drawRectangle({
    x: MARGIN + 110,
    y: y - 28,
    width: ((MAX_W - 130) * score) / 100,
    height: 7,
    color: accent,
  });
  y -= 56;

  if (plan.verdict) text(plan.verdict, { gap: 4 });

  if (plan.matched_skills.length) {
    heading("Skills you already match");
    text(plan.matched_skills.join(" · "), { color: muted });
  }

  if (plan.gaps.length) {
    heading("Priority skill gaps");
    for (const g of plan.gaps) {
      text(`${g.skill}  [${g.importance}]${g.estimated_weeks ? `  ~${g.estimated_weeks} weeks` : ""}`, { size: 11.5, f: bold });
      if (g.why) text(g.why, { size: 10, color: muted, indent: 10 });
      if (g.how) text(`How to close it: ${g.how}`, { size: 10, indent: 10, gap: g.actions?.length ? 2 : 6 });
      for (const a of g.actions ?? []) {
        text(`• ${a.timeline ? `${a.timeline}: ` : ""}${a.action}`, { size: 10, indent: 18 });
      }
      if (g.actions?.length) text("", { size: 2, gap: 4 });
    }
  }

  if (plan.phases.length) {
    heading("Improvement plan");
    for (const p of plan.phases) {
      text(`${p.phase} — ${p.timeframe}`, { size: 11.5, f: bold });
      if (p.focus?.length) text(`Focus: ${p.focus.join(", ")}`, { size: 10, color: muted, indent: 10 });
      for (const a of p.actions ?? []) text(`- ${a}`, { size: 10, indent: 10 });
      y -= 6;
    }
  }

  if (plan.resume_rewrites.length) {
    heading("Resume rewrites for this role");
    plan.resume_rewrites.forEach((r, i) => text(`${i + 1}. ${r}`, { size: 10, indent: 4 }));
  }

  if (plan.suggested_roles.length) {
    heading("Adjacent roles worth considering");
    text(plan.suggested_roles.join(" · "), { size: 10 });
  }

  // Footer on every page
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    p.drawText(`${brandSubtitle} · page ${i + 1} of ${pages.length}`, {
      x: MARGIN,
      y: 28,
      size: 8,
      font,
      color: muted,
    });
  });

  return pdf.save();
}
