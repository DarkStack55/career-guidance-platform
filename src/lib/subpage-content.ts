export type SubCard = { title: string; body: string; to?: string; href?: string };

/**
 * Unique content per subcategory route. Keyed by pathname so every
 * subcategory renders a distinct page instead of the same placeholder.
 */
export const subpageContent: Record<string, SubCard[]> = {
  // ---------- Dashboard ----------
  "/dashboard/profile": [
    { title: "Identity & headline", body: "Edit your name, headline, location and target role so matches stay accurate.", to: "/profile" },
    { title: "Skill inventory", body: "Review the skills we detected and top up the gaps that matter most.", to: "/skills" },
    { title: "Resume on file", body: "Upload or refresh the resume used for grading and job matching.", to: "/assessment/resume" },
  ],
  "/dashboard/applications": [
    { title: "Pipeline board", body: "Track every application from applied to offer in one live board.", to: "/jobs" },
    { title: "Follow-up reminders", body: "Nudges seven days after each application so nothing goes cold." },
    { title: "Interview prep", body: "Rehearse for the roles currently in your pipeline.", to: "/assessment/interview" },
  ],
  "/dashboard/saved": [
    { title: "Saved roles", body: "Everything you bookmarked while browsing jobs, in one list.", to: "/jobs" },
    { title: "Saved careers", body: "Career domains you starred, with roadmaps ready to open.", to: "/roadmap" },
    { title: "Saved scholarships", body: "Funding you shortlisted, sorted by deadline.", to: "/scholarships" },
  ],
  "/dashboard/analytics": [
    { title: "Readiness trend", body: "How your overall readiness score moved across assessments.", to: "/assessment" },
    { title: "Skill velocity", body: "Which skills grew fastest over the last 90 days.", to: "/skills" },
    { title: "Market comparison", body: "Your profile against salary bands for your target role." },
  ],
  "/dashboard/badges": [
    { title: "Assessment badges", body: "Earned by completing each of the four intelligence modules.", to: "/assessment" },
    { title: "Streak badges", body: "Awarded for consecutive days of roadmap task completion.", to: "/roadmap/milestones" },
    { title: "Mentor badges", body: "Unlocked after your first and fifth mentor sessions.", to: "/mentors/sessions" },
  ],
  "/dashboard/settings": [
    { title: "Account & security", body: "Password, sign-in methods, sessions and two-step verification.", to: "/profile" },
    { title: "Notifications", body: "Choose which emails and reminders CareerPilot sends you." },
    { title: "Data & privacy", body: "Export your assessment data or delete your account entirely." },
  ],

  // ---------- Blog ----------
  "/blog/advice": [
    { title: "Switching careers at 30+", body: "A practical 12-week plan for pivoting without starting from zero." },
    { title: "Resume lines that convert", body: "How to phrase impact so screeners stop skimming past you.", to: "/assessment/resume" },
    { title: "Negotiating your first offer", body: "Scripts and benchmarks for the salary conversation." },
  ],
  "/blog/news": [
    { title: "AI hiring shifts", body: "What automated screening means for applicants this year." },
    { title: "Sector demand report", body: "Which domains are adding headcount and which are freezing.", to: "/compare" },
    { title: "Pay transparency laws", body: "Where posted salary ranges are now mandatory." },
  ],
  "/blog/stories": [
    { title: "Mechanical to ML", body: "How Aarav moved from CAD work into an applied ML team in 14 months." },
    { title: "Non-tech into product", body: "A teacher's route into associate product management." },
    { title: "More journeys", body: "Read the full archive of member success stories.", to: "/success-stories" },
  ],

  // ---------- Mentors ----------
  "/mentors/find": [
    { title: "Search by domain", body: "Filter 400+ mentors by industry, seniority and language.", to: "/mentors" },
    { title: "Match to your goals", body: "We rank mentors against your assessment profile.", to: "/assessment" },
    { title: "Free intro call", body: "Most mentors offer a 15-minute no-cost first conversation." },
  ],
  "/mentors/top": [
    { title: "Highest rated this month", body: "Mentors rated 4.9+ across at least 40 completed sessions." },
    { title: "Fastest responders", body: "Replies within 6 hours, useful when you have an interview soon." },
    { title: "Rising mentors", body: "New mentors with strong early feedback and open slots.", to: "/mentors/book" },
  ],
  "/mentors/book": [
    { title: "Pick a slot", body: "See live availability in your own timezone and confirm instantly.", to: "/mentors/find" },
    { title: "Session agenda", body: "Send your goals in advance so the hour is spent on you." },
    { title: "Reschedule freely", body: "Move or cancel up to 12 hours before with no penalty.", to: "/mentors/sessions" },
  ],
  "/mentors/sessions": [
    { title: "Upcoming sessions", body: "Join links, agendas and prep notes for booked calls." },
    { title: "Past sessions", body: "Recordings, mentor notes and the action items you agreed." },
    { title: "Book another", body: "Continue with the same mentor or try a new perspective.", to: "/mentors/book" },
  ],
  "/mentors/become": [
    { title: "Eligibility", body: "3+ years of experience in your domain and a verified profile." },
    { title: "Set your terms", body: "Choose your hourly rate, session length and weekly capacity." },
    { title: "Apply", body: "Send us your background and we review within five working days.", to: "/contact" },
  ],

  // ---------- Roadmap ----------
  "/roadmap/tech": [
    { title: "Foundations", body: "Programming, data structures, version control and Linux basics." },
    { title: "Specialise", body: "Backend, frontend, data, DevOps or embedded — pick one lane." },
    { title: "Prove it", body: "Ship three portfolio projects and pass the technical sandbox.", to: "/assessment/technical" },
  ],
  "/roadmap/business": [
    { title: "Core literacy", body: "Finance, operations and market analysis fundamentals." },
    { title: "Tooling", body: "Excel modelling, SQL for analysts and BI dashboards.", to: "/courses" },
    { title: "Case practice", body: "Structured problem solving for consulting and PM interviews.", to: "/assessment/aptitude" },
  ],
  "/roadmap/creative": [
    { title: "Craft", body: "Typography, colour, composition and motion fundamentals." },
    { title: "Product thinking", body: "UX research, wireframes, design systems and handoff." },
    { title: "Portfolio", body: "Three case studies that show process, not just final screens.", to: "/resume" },
  ],
  "/roadmap/ai": [
    { title: "Math & Python", body: "Linear algebra, probability and numerical Python first." },
    { title: "Modelling", body: "Classical ML, then deep learning and transformer architectures." },
    { title: "Deploy", body: "Serving, evaluation and MLOps — the part most candidates skip.", to: "/courses" },
  ],
  "/roadmap/milestones": [
    { title: "Weekly targets", body: "Small checkpoints that keep a multi-year roadmap moving." },
    { title: "Streaks", body: "Daily task completion feeds your badge progress.", to: "/dashboard/badges" },
    { title: "Review cadence", body: "A monthly retro prompt to re-plan what stalled.", to: "/roadmap" },
  ],
  "/roadmap/resources": [
    { title: "Curated courses", body: "Vetted courses mapped to each roadmap stage.", to: "/courses" },
    { title: "Books & papers", body: "The short list worth your reading hours per domain." },
    { title: "Communities", body: "Where practitioners in your field actually answer questions.", to: "/resources" },
  ],

  // ---------- Scholarships ----------
  "/scholarships/browse": [
    { title: "Full database", body: "Every scholarship we track, filterable by level and country.", to: "/scholarships" },
    { title: "Deadline calendar", body: "Sorted by what closes next so you never miss a window." },
    { title: "Eligibility check", body: "Answer six questions to hide awards you cannot apply for.", to: "/assessment/career-fit" },
  ],
  "/scholarships/merit": [
    { title: "Academic excellence", body: "Awards keyed to GPA, rank and standardised test scores." },
    { title: "Competition wins", body: "Olympiad, hackathon and research-based funding routes." },
    { title: "Portfolio merit", body: "Design, music and sport awards judged on submitted work." },
  ],
  "/scholarships/need": [
    { title: "Income-linked grants", body: "Awards assessed on household income and dependants." },
    { title: "Documents to prepare", body: "Income proof, affidavits and bank statements checklist." },
    { title: "Combine with loans", body: "How need grants stack with education loans and stipends." },
  ],
  "/scholarships/abroad": [
    { title: "Country programmes", body: "Chevening, DAAD, MEXT, Fulbright and Erasmus routes.", to: "/scholarships" },
    { title: "Visa & funding proof", body: "What each consulate expects as evidence of finances." },
    { title: "Application timeline", body: "Work backwards 14 months from your intended intake." },
  ],
  "/scholarships/diversity": [
    { title: "Women in STEM", body: "Funding for under-represented students in technical fields." },
    { title: "First-generation", body: "Awards for the first in a family to attend university." },
    { title: "Regional & community", body: "Grants for rural, tribal and minority-community applicants." },
  ],

  // ---------- Internships ----------
  "/internships/summer": [
    { title: "Summer 2027 cohort", body: "8–12 week paid programmes opening from September." },
    { title: "Application windows", body: "Most close 6–9 months before the internship starts." },
    { title: "Live openings", body: "Browse internships accepting applications right now.", to: "/internships" },
  ],
  "/internships/remote": [
    { title: "Fully remote roles", body: "Work from anywhere internships with async-first teams." },
    { title: "Timezone overlap", body: "Filter roles by the hours you can realistically cover." },
    { title: "Home setup stipends", body: "Which companies pay for equipment and connectivity." },
  ],
  "/internships/startup": [
    { title: "Early-stage teams", body: "Seed to Series B startups hiring interns with real ownership." },
    { title: "Equity & stipends", body: "What compensation looks like outside big-company bands." },
    { title: "What they screen for", body: "Shipping speed and initiative over credentials." },
  ],
  "/internships/corporate": [
    { title: "Structured programmes", body: "Rotational internships at large employers with formal mentoring." },
    { title: "Assessment centres", body: "Group exercises, aptitude tests and case rounds explained.", to: "/assessment/aptitude" },
    { title: "Conversion to full-time", body: "Typical PPO rates and how to hit the bar." },
  ],
  "/internships/prep": [
    { title: "Resume screen", body: "Get your resume graded before you apply anywhere.", to: "/assessment/resume" },
    { title: "Mock interview", body: "Run a timed practice interview with live AI feedback.", to: "/assessment/interview" },
    { title: "Aptitude drills", body: "Timed logic and quant sets used by campus recruiters.", to: "/assessment/aptitude" },
  ],
};
