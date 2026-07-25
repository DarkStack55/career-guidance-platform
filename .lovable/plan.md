## Mock Interview Setup & Session — new dedicated page

A single, comprehensive practice page added as a **new route**, leaving the existing AI Mock Interview Studio (`/assessment/interview`) untouched. Global navbar, footer, and layout stay exactly as-is; the Mock Interview entry in the Assessment mega-menu gains one new sub-link pointing at the new page.

### New route
`/assessment/mock-interview` — "Mock Interview Setup & Session", with its own head() metadata (unique title, description, og:title, og:description).

### Layout

```text
+---------------------------------------------------+  +-----------------+
|  Resume & Role Settings  (accordion, collapsed)   |  |  LIVE ANALYTICS |
+---------------------------------------------------+  |  (dark sidebar) |
|                                                   |  |                 |
|            VIDEO STAGE  (16:9)                    |  |  Pacing gauge   |
|      idle -> "Camera off" / active -> live feed    |  |  WPM arc        |
|                                                   |  |                 |
+---------------------------------------------------+  |  Filler words   |
|  [Start Session]   Interviewer Persona  [select]  |  |  counter + chips|
+---------------------------------------------------+  |                 |
|  EVALUATION  [ STAR | Ideal Answer | Report ]     |  |  Face stability |
|  tab content ...                                  |  |  status pill    |
+---------------------------------------------------+  +-----------------+
```
Sidebar sits right on desktop, stacks below the stage on mobile.

### 1. Interaction area
- 16:9 video stage, rounded, subtle shadow. Idle state: muted camera icon + "Camera preview will appear here" copy.
- **Start Session** requests the real webcam (`getUserMedia`) and shows the mirrored live feed with a pulsing red "Camera Active" badge, a session timer, and question progress ("Question 2 of 5").
- Permission denied / no device → graceful inline notice, session still runnable in audio-off practice mode.
- **End Session** stops all tracks, releases the camera, and reveals the evaluation section.
- Control bar: Start/End button, **Interviewer Persona** dropdown (Friendly HR, Technical Lead, Panel Chair, Stress Tester), plus a Skip-question control while live.
- Current question card under the stage, driven by a local question bank per track.

### 2. Live analytics sidebar (dark)
- Animates in on mount (staggered fade/slide, respects reduced motion).
- **Speech Pacing Gauge** — semicircular arc with WPM needle and zone bands (slow / ideal 130-165 / fast) plus verdict text.
- **Filler-Word Counter** — running total, per-100-words rate, and top offender chips ("um ×3").
- **Face Stability** — status pill (Stable / Drifting / No face) with a small bar meter.
- Values are **simulated live ticking**: a smooth random-walk driver updates every ~1s only while a session is active; idle shows a clear "—" empty state.

### 3. Post-interview evaluation (tabs)
- **STAR Scoring** — per-dimension bars (Situation, Task, Action, Result) with an overall readiness ring and one-line coaching note each.
- **Ideal Answer** — side-by-side panels: "Your answer" (transcript placeholder text) vs "Ideal answer" for the same question, with a question switcher; differences highlighted as bullet callouts.
- **Report** — summary metrics + **Download Report Card**, which generates a real file client-side (a formatted, print-ready HTML/PDF-style report containing role, persona, STAR scores, pacing, fillers, stability, and coaching notes) and triggers a download.
- Before any session completes, tabs show a friendly locked/empty state.

### 4. Smart personalization
- **Resume & Role Settings** accordion (collapsed by default): Track select (Mechanical Engineering, Software Engineering, Electrical, Civil, Data/Analytics, Business/Management), target role text input, experience level (Entry / Mid / Senior), question count, and a resume-highlights textarea with a drop-to-attach placeholder (no upload wiring).
- Track choice swaps the question bank and the Ideal Answer content so a Mechanical student sees mechanical questions.

### Design
Clean and minimal on the existing theme tokens: light cards with subtle shadows and rounded corners, dark analytics sidebar in both modes, cyan accents matching the current studio. Fully responsive; light and dark mode both verified.

### Technical notes
- New files: `src/routes/assessment.mock-interview.tsx` (page), `src/components/mock-interview/` (VideoStage, ControlBar, AnalyticsSidebar, PacingGauge, EvaluationTabs, RoleSettings), `src/lib/mock-interview-data.ts` (question banks, personas, ideal answers, simulated-metric driver).
- Reuses the existing pure helpers in `src/lib/interview-metrics.ts` for pacing/filler verdict labels.
- No Web Speech API, no server functions, no database or storage writes — camera preview and simulated metrics only. Existing `/assessment/interview`, its server functions, and the navbar structure are not modified beyond adding the single new sub-menu link.
