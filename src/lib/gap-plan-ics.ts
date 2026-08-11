import type { GapPlan } from "@/lib/resume-builder.functions";

/** Builds an .ics calendar of every tailored action milestone in a gap plan. */

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toDateValue(d: Date) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
}

function addDays(base: Date, days: number) {
  const d = new Date(base.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** "Weeks 2-5" / "Week 3" / "weeks 2 - 5" -> { startWeek, endWeek } */
function parseTimeline(timeline: string): { startWeek: number; endWeek: number } | null {
  const m = timeline.match(/weeks?\s*(\d{1,2})\s*(?:[-–—to]+\s*(\d{1,2}))?/i);
  if (!m) return null;
  const start = Number(m[1]);
  const end = m[2] ? Number(m[2]) : start;
  if (!Number.isFinite(start) || start < 1) return null;
  return { startWeek: start, endWeek: Math.max(start, Number.isFinite(end) ? end : start) };
}

function escapeText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function fold(line: string) {
  if (line.length <= 73) return line;
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 73) {
    parts.push(rest.slice(0, 73));
    rest = rest.slice(73);
  }
  parts.push(rest);
  return parts.join("\r\n ");
}

export type IcsMilestone = {
  title: string;
  description: string;
  start: Date;
  /** exclusive end date for the all-day event */
  end: Date;
};

export function buildMilestones(plan: GapPlan, from: Date = new Date()): IcsMilestone[] {
  const base = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const milestones: IcsMilestone[] = [];
  let cursorWeek = 1;

  for (const gap of plan.gaps ?? []) {
    const actions = gap.actions ?? [];
    if (actions.length === 0) {
      const weeks = gap.estimated_weeks && gap.estimated_weeks > 0 ? gap.estimated_weeks : 2;
      milestones.push({
        title: `Close skill gap: ${gap.skill}`,
        description: [gap.why, gap.how].filter(Boolean).join("\n\n"),
        start: addDays(base, (cursorWeek - 1) * 7),
        end: addDays(base, (cursorWeek - 1 + weeks) * 7),
      });
      cursorWeek += weeks;
      continue;
    }

    for (const action of actions) {
      const parsed = parseTimeline(action.timeline ?? "");
      const startWeek = parsed ? parsed.startWeek : cursorWeek;
      const endWeek = parsed ? parsed.endWeek : cursorWeek;
      milestones.push({
        title: `${gap.skill}: ${action.action}`.slice(0, 160),
        description: [
          action.timeline ? `Timeline: ${action.timeline}` : "",
          gap.why ? `Why it matters: ${gap.why}` : "",
          gap.how ? `How to close it: ${gap.how}` : "",
          plan.target_role ? `Target role: ${plan.target_role}` : "",
        ]
          .filter(Boolean)
          .join("\n\n"),
        start: addDays(base, (startWeek - 1) * 7),
        end: addDays(base, endWeek * 7),
      });
      if (!parsed) cursorWeek += 1;
      else cursorWeek = Math.max(cursorWeek, parsed.endWeek + 1);
    }
  }

  return milestones;
}

export function buildGapPlanIcs(plan: GapPlan, from: Date = new Date()): string {
  const stamp = `${toDateValue(new Date())}T000000Z`;
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CareerPilot AI//Skill Gap Plan//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(`${plan.target_role || "Career"} action plan`)}`,
  ];

  buildMilestones(plan, from).forEach((m, i) => {
    lines.push(
      "BEGIN:VEVENT",
      `UID:careerpilot-${toDateValue(m.start)}-${i}@careerpilot.ai`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toDateValue(m.start)}`,
      `DTEND;VALUE=DATE:${toDateValue(m.end)}`,
      `SUMMARY:${escapeText(m.title)}`,
      `DESCRIPTION:${escapeText(m.description)}`,
      "TRANSP:TRANSPARENT",
      "BEGIN:VALARM",
      "TRIGGER:-P1D",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeText(m.title)}`,
      "END:VALARM",
      "END:VEVENT",
    );
  });

  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n");
}

export function downloadGapPlanIcs(plan: GapPlan) {
  const ics = buildGapPlanIcs(plan);
  const slug = (plan.target_role || "career-plan").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug || "career-plan"}-milestones.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
