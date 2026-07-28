## Assessment Hub at `/assessment`

Replace the 8-step questionnaire on `src/routes/assessment.index.tsx` with an interactive assessment matrix dashboard. Global navbar untouched (the `/assessment` route is a plain `<Outlet />` layout).

### Header
- Hero: eyebrow "Assessment Matrix", H1 "AI-Powered Career Intelligence Engine", supporting line.
- Animated radial "Overall Readiness Score" ring (reusing `ScoreRing`) with four animated sub-score bars: Workplace DNA, Technical Mastery, Cognitive Speed, Market Fit.
- Scores come from the user's saved results when signed in (`getLatestByKind`), falling back to a demo 68/100 profile for guests — no new backend work.

### 2x2 card grid
Each card: glass panel, animated visual preview, badge, subtitle, status pill (top-right), CTA button, hover state (lift, glare, border glow).

1. **Immersive Scenario Simulator** — swipeable stacked scenario cards motif · "Workplace DNA Matrix" · Launch Simulator → `/assessment/personality`
2. **Live Application Sandbox** — split terminal / CAD-grid preview · "Real-Time AI Grading" · Enter Sandbox → `/assessment/technical`
3. **Cognitive Radar & Pressure Test** — mini animated SVG radar (spatial / numerical / deductive) · "Gamified Speed Test" · Start Pressure Test → `/assessment/aptitude`
4. **Career Constellation Map** — SVG node-graph skill tree · "Predictive Skill Tree" · Explore Constellation → `/assessment/career-fit`

Status pill = Complete when a saved result exists for that kind, otherwise Unlocked (In Progress shown for partially-scored kinds).

Below the grid: a slim secondary row linking the existing Resume Grader and Mock Interview Studio so those stay reachable.

### Technical notes
- Edit only `src/routes/assessment.index.tsx`; add small presentational components under `src/components/assessment/` (`ReadinessPanel`, `AssessmentCard`, and the four SVG previews).
- Framer Motion for entrance, hover and radar/constellation animation; existing dark-glass tokens, no hardcoded color utilities beyond the established `white/xx` glass pattern used across assessment pages.
- The old questionnaire is removed; no sub-module logic is built.
- Route-specific `head()` metadata updated for the hub.
