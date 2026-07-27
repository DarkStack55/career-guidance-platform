export type SectorId = "engineering" | "software" | "business" | "custom";

export type SectorDef = {
  id: SectorId;
  label: string;
  blurb: string;
  defaultRole: string;
  track: string;
  technicals: string[];
};

export const SECTORS: SectorDef[] = [
  {
    id: "engineering",
    label: "Engineering",
    blurb: "Mechanical Engineering / CAD / Design",
    defaultRole: "Graduate Mechanical Design Engineer",
    track: "mechanical",
    technicals: [
      "Walk me through the difference between the first and second laws of thermodynamics, and where you've actually applied one of them.",
      "Take a heat exchanger you've studied or designed — how did you decide on the flow arrangement and what limited its efficiency?",
      "How do you approach CAD modelling for a part that has to be manufactured at volume? Talk me through your feature tree discipline.",
      "You're selecting a material for a bracket that sees cyclic loading in a humid environment. How do you narrow it down, and to what?",
      "Explain how you'd run structural stress testing on that bracket — FEA setup, boundary conditions, and how you'd validate the result physically.",
      "A component fails in fatigue at half its predicted life. What are the first three things you check?",
      "How do you set tolerances on a mating assembly, and what happens to cost as you tighten them?",
      "Describe a design trade-off you made between weight, cost and manufacturability, with the numbers behind it.",
    ],
  },
  {
    id: "software",
    label: "Software & Tech",
    blurb: "Engineering, data and product tech roles",
    defaultRole: "Software Engineer",
    track: "software",
    technicals: [
      "Walk me through the architecture of the most complex system you've built, and the part you'd redesign today.",
      "How would you debug an endpoint that is fine at p50 but times out at p99 under production load?",
      "Explain how you decide between a relational and a document store for a new feature.",
      "Talk me through how you'd design rate limiting for a public API used by thousands of clients.",
      "What does your testing strategy look like, and where do you deliberately not write tests?",
      "Describe a production incident you were part of — what broke, what you did, and what changed afterwards.",
      "How do you keep a codebase maintainable when the team is shipping fast?",
    ],
  },
  {
    id: "business",
    label: "Business / Finance",
    blurb: "Strategy, finance, consulting and operations",
    defaultRole: "Business Analyst",
    track: "business",
    technicals: [
      "Walk me through the three financial statements and how a one-crore increase in inventory flows through them.",
      "A client's margins dropped four points in one quarter. How do you structure the diagnosis?",
      "How would you size the market for electric two-wheelers in a tier-two Indian city?",
      "What metrics would you put on the first page of a monthly business review, and why those?",
      "Explain how you'd build a simple DCF and which assumption you'd stress-test first.",
      "Describe an analysis you ran that changed a decision. What was the number that convinced people?",
    ],
  },
  {
    id: "custom",
    label: "Custom sector",
    blurb: "Type your own field or role",
    defaultRole: "",
    track: "custom",
    technicals: [
      "Walk me through the core technical skill your field depends on, and how deep your hands-on experience with it goes.",
      "Describe the hardest problem you've solved in this field, including the constraints you worked under.",
      "What tools or methods do you use day to day, and how did you learn them?",
      "How do you keep your knowledge current in this field?",
      "Give me a specific example where your work produced a measurable result. What was the number?",
      "Where do you think this field is heading in the next three years, and how are you preparing?",
    ],
  },
];

export const MIND_GAMES = [
  "Here's a tough one: if your manager takes full credit for your design right before a client presentation, how do you handle it on the spot?",
  "Suppose I told you that your last answer sounded rehearsed and I'm not convinced. Convince me now, differently.",
  "You realise, two hours before a deadline, that a number you gave the client last week was wrong. Walk me through exactly what you do.",
  "If a senior colleague overrules your technically correct decision, what do you do — and what if they're wrong and it ships?",
  "You're given a project you know will fail with the resources allocated. What do you say, and to whom?",
];

export const DURATIONS = [
  { minutes: 5, questions: 5, label: "5 minutes", hint: "~5 questions · quick warm-up" },
  { minutes: 10, questions: 8, label: "10 minutes", hint: "~8 questions · standard round" },
  { minutes: 15, questions: 12, label: "15 minutes", hint: "~12 questions · full loop" },
] as const;

export type QueuedQuestion = {
  text: string;
  stage: "intro" | "self" | "motivation" | "technical" | "mind-game" | "closing";
};

const FIXED_OPENERS: QueuedQuestion[] = [
  { text: "Tell me about yourself and your background.", stage: "intro" },
  { text: "What is your greatest strength, and what is your greatest weakness?", stage: "self" },
  { text: "Why do you want to work at this company?", stage: "motivation" },
];

const CLOSING: QueuedQuestion = {
  text: "Why should we hire you over other qualified candidates?",
  stage: "closing",
};

/**
 * Builds the full interview queue: 3 fixed openers → sector technicals with
 * 1–2 high-pressure mind games mixed in → fixed closing question.
 * `aiTechnicals` (when the AI plan call succeeds) replaces the local bank.
 */
export function buildQuestionQueue(
  sector: SectorId,
  total: number,
  aiTechnicals?: string[],
): QueuedQuestion[] {
  const def = SECTORS.find((s) => s.id === sector) ?? SECTORS[0];
  const middleCount = Math.max(1, total - FIXED_OPENERS.length - 1);
  const mindGameCount = middleCount >= 5 ? 2 : 1;
  const techCount = Math.max(1, middleCount - mindGameCount);

  const bank = (aiTechnicals?.filter((q) => q.trim().length > 12) ?? []).slice(0, techCount);
  const source = bank.length >= techCount ? bank : [...bank, ...def.technicals].slice(0, techCount);

  const middle: QueuedQuestion[] = source.map((text) => ({ text: text.trim(), stage: "technical" }));

  const games = MIND_GAMES.slice(0, mindGameCount);
  // Drop the mind games in after the candidate is warmed up, spaced apart.
  games.forEach((text, i) => {
    const at = Math.min(middle.length, Math.round(((i + 1) * middle.length) / (games.length + 1)) + i);
    middle.splice(at, 0, { text, stage: "mind-game" });
  });

  return [...FIXED_OPENERS, ...middle, CLOSING];
}

export function sectorRole(sector: SectorId, custom: string) {
  const def = SECTORS.find((s) => s.id === sector) ?? SECTORS[0];
  if (sector === "custom") return custom.trim() || "Custom role";
  return def.defaultRole;
}
