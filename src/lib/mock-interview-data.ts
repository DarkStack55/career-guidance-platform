// Static content + simulated telemetry for the Mock Interview Setup & Session page.
// Frontend-only: no backend, no Web Speech API.

export type TrackId =
  | "mechanical"
  | "software"
  | "electrical"
  | "civil"
  | "data"
  | "business";

export const TRACKS: Array<{ id: TrackId; label: string; defaultRole: string }> = [
  { id: "mechanical", label: "Mechanical Engineering", defaultRole: "Design Engineer (Mechanical)" },
  { id: "software", label: "Software Engineering", defaultRole: "Software Engineer" },
  { id: "electrical", label: "Electrical Engineering", defaultRole: "Electrical Design Engineer" },
  { id: "civil", label: "Civil Engineering", defaultRole: "Site / Structural Engineer" },
  { id: "data", label: "Data & Analytics", defaultRole: "Data Analyst" },
  { id: "business", label: "Business & Management", defaultRole: "Business Analyst" },
];

export const PERSONAS = [
  { id: "hr", label: "Friendly HR", blurb: "Warm, conversational, focuses on motivation and fit." },
  { id: "tech", label: "Technical Lead", blurb: "Probes depth, follows up on every claim you make." },
  { id: "panel", label: "Panel Chair", blurb: "Structured panel format with rotating question styles." },
  { id: "stress", label: "Stress Tester", blurb: "Fast, interrupt-heavy, tests composure under pressure." },
] as const;

export type PersonaId = (typeof PERSONAS)[number]["id"];

export const LEVELS = ["Entry", "Mid", "Senior"] as const;
export type Level = (typeof LEVELS)[number];

export type QA = { q: string; ideal: string; yours: string; gaps: string[] };

const BANK: Record<TrackId, QA[]> = {
  mechanical: [
    {
      q: "Walk me through a mechanical design project you owned end to end.",
      ideal:
        "Situation: final-year FSAE suspension upright. Task: cut 22% mass without losing stiffness. Action: parameterised the geometry in SolidWorks, ran 6 static FEA load cases in ANSYS, moved from 6061-T6 to a topology-optimised 7075 pocketed design, validated with a bench rig at 1.5x design load. Result: 24% lighter, deflection within 0.3 mm of target, adopted on the 2024 car.",
      yours:
        "I worked on a suspension part for our college car team. We made it lighter using CAD and simulation and it worked well on the car.",
      gaps: [
        "Name the tools and the load cases you actually ran",
        "Quantify the result (mass saved, deflection, factor of safety)",
        "State your personal role vs the team's",
      ],
    },
    {
      q: "How do you choose between a welded and a bolted joint for a load-bearing bracket?",
      ideal:
        "Frame it as a trade study: load type (static vs fatigue/cyclic), serviceability, tolerance stack-up, cost and process capability. Welded wins on stiffness and part count but adds HAZ, distortion and inspection cost, and it is permanent. Bolted wins on serviceability and repeatable assembly but needs preload control, thread engagement and fatigue checks on the fastener. Close with the deciding factor for your case.",
      yours: "Welding is stronger, so I would weld it unless we needed to take it apart.",
      gaps: [
        "Distinguish static strength from fatigue behaviour",
        "Mention preload, distortion and inspection cost",
        "State an explicit deciding criterion",
      ],
    },
    {
      q: "A production line rejects 8% of parts for dimensional variation. How do you attack it?",
      ideal:
        "Measure first: pull the inspection data, build a Pareto by feature, check Cp/Cpk on the failing dimension. Then separate special from common cause with a control chart, run a fishbone across machine, material, method, measurement, and confirm gauge R&R before blaming the process. Fix with a targeted change, then verify with a capability re-run.",
      yours: "I would check the machine settings and retrain the operators to reduce the errors.",
      gaps: ["Lead with data, not a hypothesis", "Mention Cp/Cpk and gauge R&R", "Describe how you would verify the fix"],
    },
    {
      q: "Tell me about a time a design of yours failed a test.",
      ideal:
        "Own the failure plainly, explain the root-cause work (fracture surface, load path re-check, boundary-condition error in the FEA), the change you made, and the process you added so the class of error cannot recur.",
      yours: "One bracket cracked during testing. We made it thicker and it passed after that.",
      gaps: ["Give the actual root cause, not the symptom", "Say what process changed afterwards", "Add the measured outcome"],
    },
    {
      q: "Why this role, and where do you want to be in three years?",
      ideal:
        "Tie a concrete part of the job description to something you have already done, then a specific growth path: from detail design to owning a subsystem, with a named capability you want to build (GD&T mastery, DFM ownership, supplier development).",
      yours: "I want to grow as an engineer and learn a lot from your company.",
      gaps: ["Reference the actual role scope", "Name one specific capability to build", "Avoid generic 'learn a lot' phrasing"],
    },
  ],
  software: [
    {
      q: "Describe a system you built and the hardest trade-off you made.",
      ideal:
        "Give the shape of the system (traffic, data volume, latency budget), then one honest trade-off with numbers: e.g. chose read-through cache over denormalisation, accepted 30 s staleness to cut p95 from 600 ms to 90 ms, and describe the guardrail you added.",
      yours: "I built a web app with React and a database. It was fast and users liked it.",
      gaps: ["Quantify scale and latency", "Name the trade-off and what you gave up", "Describe monitoring or guardrails"],
    },
    {
      q: "How do you debug an intermittent production failure you cannot reproduce locally?",
      ideal:
        "Narrow with signal before code: correlate logs/traces by request id, check deploy and config diffs against the failure window, look for concurrency and timeout boundaries, add targeted instrumentation behind a flag, then reproduce under load rather than locally.",
      yours: "I would add logs and try to reproduce it until I find the bug.",
      gaps: ["Mention tracing and correlation ids", "Check deploys/config as a first-class suspect", "Reproduce under load, not just locally"],
    },
    {
      q: "Tell me about a disagreement with a teammate on a technical decision.",
      ideal:
        "Show that you converted opinion into evidence: wrote down both options with cost/risk, ran a small spike or benchmark, committed fully to the outcome even when it was not your option.",
      yours: "We disagreed about the framework but eventually agreed on one and moved on.",
      gaps: ["Show how the decision was resolved with evidence", "State the outcome and your commitment to it"],
    },
    {
      q: "How would you design rate limiting for a public API?",
      ideal:
        "Pick an algorithm and justify it (token bucket for burst tolerance), decide the key (user, IP, API key), where state lives (Redis with atomic ops), what happens on limit (429 + Retry-After), and how you degrade when the limiter itself is down (fail open with a circuit breaker).",
      yours: "I would count requests per user and block them if they go over the limit.",
      gaps: ["Name the algorithm and why", "Say where counter state lives", "Cover failure of the limiter itself"],
    },
    {
      q: "Why this role, and where do you want to be in three years?",
      ideal:
        "Connect your strongest recent work to the team's actual problem space, then a specific arc: from feature delivery to owning a service and mentoring, with one named skill to deepen.",
      yours: "I like your product and want to become a better developer.",
      gaps: ["Reference the team's problem space", "Name a concrete ownership step"],
    },
  ],
  electrical: [
    {
      q: "Walk me through a circuit or power system you designed.",
      ideal:
        "State the spec (input range, load, efficiency, thermal limit), the topology you chose and why, the components you sized with margin, and the bench results against spec.",
      yours: "I designed a power supply circuit for a project and it worked.",
      gaps: ["Give the spec envelope", "Justify the topology", "Report measured efficiency and thermals"],
    },
    {
      q: "How do you approach EMI problems on a board that fails compliance?",
      ideal:
        "Identify the source-path-victim chain, measure with a near-field probe, then work the return path: ground plane continuity, loop area, decoupling placement, edge rate control, and only then add filtering or shielding.",
      yours: "I would add filters and shielding until the emissions pass.",
      gaps: ["Diagnose before mitigating", "Talk about return paths and loop area"],
    },
    {
      q: "Explain a time you found a fault others had missed.",
      ideal: "Describe the measurement that broke the deadlock, the root cause, and the design or process change that followed.",
      yours: "I found a wiring mistake that nobody noticed and fixed it.",
      gaps: ["Explain how you found it", "State the follow-up change"],
    },
    {
      q: "How do you size protection for a motor circuit?",
      ideal:
        "Start from load characteristics and starting current, apply the relevant code tables for conductor and overload device, coordinate short-circuit protection with the breaker curve, and verify selectivity with upstream devices.",
      yours: "I would pick a breaker slightly bigger than the motor current.",
      gaps: ["Separate overload from short-circuit protection", "Mention coordination/selectivity"],
    },
    {
      q: "Why this role, and where do you want to be in three years?",
      ideal: "Link a specific project to the team's domain and name the capability you want to own next.",
      yours: "I want to work in a good company and grow.",
      gaps: ["Be specific about the domain", "Name a concrete next capability"],
    },
  ],
  civil: [
    {
      q: "Describe a structure or site problem you worked on.",
      ideal: "Give loads and codes used, your analysis approach, the constraint that shaped the design, and the delivered outcome with numbers.",
      yours: "I helped design a building slab as part of my project.",
      gaps: ["Name the code and load cases", "State your specific contribution", "Quantify the outcome"],
    },
    {
      q: "How do you keep a project on schedule when material delivery slips?",
      ideal: "Re-baseline against the critical path, resequence non-dependent work, escalate with a quantified impact, and document the change order rather than absorbing it silently.",
      yours: "I would try to work faster on other tasks and talk to the supplier.",
      gaps: ["Reference critical path logic", "Quantify the schedule impact", "Mention documentation/change order"],
    },
    {
      q: "Tell me about a safety issue you raised.",
      ideal: "State the hazard, the control hierarchy you applied, who you escalated to, and the permanent change to the method statement.",
      yours: "I saw an unsafe scaffold and reported it to the supervisor.",
      gaps: ["Apply the hierarchy of control", "Describe the permanent fix"],
    },
    {
      q: "How do you review a contractor's quantity claim?",
      ideal: "Check against drawings and the bill of quantities, re-measure the disputed items, verify against site records and photographs, then negotiate from the measured position.",
      yours: "I would check the numbers and see if they look correct.",
      gaps: ["Reference BOQ and site records", "Describe your re-measurement method"],
    },
    {
      q: "Why this role, and where do you want to be in three years?",
      ideal: "Tie your site or design experience to the firm's project type and name the qualification or ownership step you are targeting.",
      yours: "I want experience on big projects.",
      gaps: ["Reference the firm's project type", "Name a concrete milestone"],
    },
  ],
  data: [
    {
      q: "Walk me through an analysis that changed a decision.",
      ideal: "State the question, the data and its limits, the method, the effect size with uncertainty, and the decision that actually changed as a result.",
      yours: "I made a dashboard that the team used to track performance.",
      gaps: ["Name the decision that changed", "Give effect size and uncertainty", "Acknowledge data limitations"],
    },
    {
      q: "A key metric drops 15% overnight. What do you do?",
      ideal: "Rule out instrumentation first, then segment by platform, geography and cohort to localise, check releases and external events, and only then build a causal story you can test.",
      yours: "I would look at the data and try to find the reason for the drop.",
      gaps: ["Check tracking/instrumentation first", "Describe systematic segmentation"],
    },
    {
      q: "How do you decide whether an A/B result is real?",
      ideal: "Pre-registered metric and duration, power check, guardrail metrics, one primary metric, and a stated minimum detectable effect — plus scepticism about peeking and multiple comparisons.",
      yours: "I would check if the p-value is below 0.05.",
      gaps: ["Mention power and MDE", "Address peeking and multiple comparisons"],
    },
    {
      q: "Tell me about a time your analysis was wrong.",
      ideal: "Own it, name the specific error (join fan-out, survivorship, leakage), and the check you added to your workflow afterwards.",
      yours: "Once my numbers were off because of a data issue and I fixed them.",
      gaps: ["Name the specific class of error", "State the permanent safeguard"],
    },
    {
      q: "Why this role, and where do you want to be in three years?",
      ideal: "Connect a past analysis to the company's decision surface and name the step from analyst to owning a metric area.",
      yours: "I enjoy working with data and want to grow in analytics.",
      gaps: ["Reference the company's decisions", "Name a concrete ownership step"],
    },
  ],
  business: [
    {
      q: "Describe a project where you drove a measurable business outcome.",
      ideal: "Frame baseline, intervention, and result with numbers, plus how you attributed the change and what you would do differently.",
      yours: "I worked on a project that improved our process a lot.",
      gaps: ["Give baseline and result numbers", "Explain attribution", "Add a reflection"],
    },
    {
      q: "How would you evaluate whether we should enter a new market?",
      ideal: "Size the market bottom-up, assess the right to win against incumbents, model unit economics and payback, then define the cheapest test that would falsify the thesis.",
      yours: "I would research the market and see if there is demand for our product.",
      gaps: ["Do a bottom-up sizing", "Cover unit economics and payback", "Name the falsifying test"],
    },
    {
      q: "Tell me about influencing a stakeholder without authority.",
      ideal: "Show that you found their metric, framed your ask in their terms, and used a small pilot to convert scepticism into evidence.",
      yours: "I convinced my manager to try my idea and it worked out.",
      gaps: ["Name the stakeholder's incentive", "Describe the pilot and its result"],
    },
    {
      q: "How do you prioritise when everything is urgent?",
      ideal: "Apply an explicit frame (impact x confidence / effort or a reversibility test), make the trade-off visible to stakeholders, and state what you deliberately dropped.",
      yours: "I make a list and start with the most important things.",
      gaps: ["Use an explicit prioritisation frame", "Say what you dropped and why"],
    },
    {
      q: "Why this role, and where do you want to be in three years?",
      ideal: "Anchor on the company's stated strategy and name the scope you want to own next.",
      yours: "I am interested in business strategy and your company looks great.",
      gaps: ["Reference the actual strategy", "Name the next scope of ownership"],
    },
  ],
};

export function questionsFor(track: TrackId, count: number): QA[] {
  const bank = BANK[track] ?? BANK.mechanical;
  return bank.slice(0, Math.max(1, Math.min(count, bank.length)));
}

export type LiveMetrics = {
  wpm: number;
  words: number;
  fillerCount: number;
  fillers: Array<{ word: string; count: number }>;
  stability: number;
  faceState: "stable" | "drifting" | "none";
};

export const EMPTY_METRICS: LiveMetrics = {
  wpm: 0,
  words: 0,
  fillerCount: 0,
  fillers: [],
  stability: 0,
  faceState: "none",
};

const FILLER_POOL = ["um", "like", "you know", "basically", "actually"];

/** Smooth random-walk step used while a session is running (simulated telemetry). */
export function stepMetrics(prev: LiveMetrics, tickSeconds: number): LiveMetrics {
  const targetWpm = 148;
  const drift = (targetWpm - (prev.wpm || 120)) * 0.12;
  const wpm = Math.max(70, Math.min(210, Math.round((prev.wpm || 120) + drift + (Math.random() - 0.5) * 22)));
  const words = prev.words + Math.max(0, Math.round((wpm / 60) * tickSeconds));

  let fillers = prev.fillers.map((f) => ({ ...f }));
  let fillerCount = prev.fillerCount;
  if (Math.random() < 0.35) {
    const word = FILLER_POOL[Math.floor(Math.random() * FILLER_POOL.length)];
    const found = fillers.find((f) => f.word === word);
    if (found) found.count += 1;
    else fillers.push({ word, count: 1 });
    fillerCount += 1;
    fillers = fillers.sort((a, b) => b.count - a.count);
  }

  const stability = Math.max(
    28,
    Math.min(99, Math.round((prev.stability || 82) + (86 - (prev.stability || 82)) * 0.15 + (Math.random() - 0.5) * 12)),
  );
  const faceState: LiveMetrics["faceState"] = stability >= 72 ? "stable" : stability >= 50 ? "drifting" : "none";

  return { wpm, words, fillerCount, fillers, stability, faceState };
}

export type StarScores = { situation: number; task: number; action: number; result: number };

export function deriveStar(m: LiveMetrics, level: Level): StarScores {
  const base = level === "Senior" ? 62 : level === "Mid" ? 68 : 72;
  const pacing = m.wpm >= 130 && m.wpm <= 165 ? 10 : m.wpm === 0 ? 0 : -6;
  const fillerPenalty = Math.min(14, Math.round(m.fillerCount * 1.4));
  const poise = Math.round((m.stability - 70) / 5);
  const clamp = (n: number) => Math.max(20, Math.min(96, Math.round(n)));
  return {
    situation: clamp(base + 6 + poise),
    task: clamp(base + 2 - fillerPenalty / 2),
    action: clamp(base + pacing - fillerPenalty / 2),
    result: clamp(base - 4 + pacing - fillerPenalty / 3),
  };
}

export const STAR_NOTES: Record<keyof StarScores, string> = {
  situation: "Set the scene in two sentences — where, when, who, and the stake.",
  task: "Say explicitly what you owned versus what the team owned.",
  action: "Lead with the decision you made, then the steps and the tools.",
  result: "Always land a number and a lesson — a result without a metric reads as a story.",
};
