# Interview Room — real-time voice + video simulator

Rebuild `/assessment/mock-interview` into a live two-way interview call. Everything runs on Lovable Cloud + Lovable AI + browser-native APIs. No third-party services.

## 1. Voice assistant identity

- Voice picker before the session starts (also editable mid-session in Settings): **Elena** (female voice) or **Kira** (male voice).
- Preference saved per user in the cloud and restored on next visit.
- Speech synthesis picks the best-matching installed browser voice for the chosen gender; if none exists, falls back to the default voice with a small "limited voice support" note instead of failing.

## 2. Room layout (same dark minimal-luxury system)

```text
┌──────────────────────────────────────────────┐
│  candidate camera (main, 16:9)   ┌─────────┐ │
│                                  │ AI PiP  │ │
│                                  │ Elena   │ │
│                                  └─────────┘ │
│  [timer 04:12] [confidence 82]  [rec ●]      │
│ ┌──────────────────────────────────────────┐ │
│ │ Elena: Tell me about a time you…         │ │
│ │ ▁▃▅▇▅▃ speaking waveform                 │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
 [ Push to talk ] [ Hands-free ] [ Captions ] [ End interview ]
```

- Main stage: candidate `getUserMedia` feed, mirrored, red-glow border when eye contact is lost.
- PiP top-right: AI avatar with animated speaking ring, pulses only while the AI is talking.
- Bottom translucent **subtitle bar**: speaker label + live text for both sides (interim recognition text shown in a dimmer style, finalized text solid).
- Waveform bar under whoever is currently speaking (mic analyser for candidate, synthetic envelope for AI).
- Captions drawer: full scrollable transcript with timestamps.

## 3. Conversation loop

1. Session starts → AI greets and asks question 1 via speech synthesis.
2. Candidate answers by voice (push-to-talk, or hands-free with silence detection ending the turn).
3. Recognition text streams into the subtitle bar in real time.
4. On turn end, the answer is saved, then Lovable AI receives the full transcript plus the selected track/role/level (and resume highlights if provided) and returns the next question, a follow-up probe, or a delivery remark.
5. The AI can interrupt, push for metrics/numbers, ask for clarification, and comment naturally on delivery — including "I noticed you looked away, keep your eyes on me" when gaze warnings fire.
6. Loop continues until the question budget is reached or the user ends early.

## 4. Confidence & eye contact

- Confidence score 0–100 shown beside the timer, updated continuously from pacing, filler density, answer length, pause behaviour and gaze.
- Gaze estimation reuses the existing in-browser face/skin-region tracking (no external model). Losing the camera-facing region triggers: red border glow + toast "Warning: Please maintain eye contact with the interviewer."
- A "Test warning" button in settings triggers the same state for demos.

## 5. Recording

- MediaRecorder captures the session audio (candidate mic; AI voice mixed in where the browser permits).
- On session end, one audio file uploads to the private `user-uploads` bucket under the session id, so the session can be replayed later from the debrief.
- Upload failure degrades gracefully: transcript and debrief still complete, replay shows "audio unavailable".

## 6. Error handling

Full-screen modal on mic / camera / recognition / AI failure:
"Connection or device issue detected. Please check your microphone, camera, and network."
Buttons: **Retry** · **Switch to Text Mode** · **End Interview**. Text mode keeps subtitles, transcript and the same AI loop, just typed instead of spoken.

## 7. Session lifecycle & debrief

Status machine: `setup → in_progress → ended_early | completed → debrief_generating → done | failed`.

- Every turn persists with role, text and timestamp as it happens, so nothing is lost on a crash.
- Ending after one minute still produces a full debrief from whatever turns exist: STAR breakdown, delivery feedback (pacing, fillers, eye contact, confidence trend), per-question notes with stronger exemplar answers, and top tips.
- Zero-score / empty debrief is never shown when at least one Q&A turn exists.
- Existing 2-attempts-per-24h lockout is enforced server-side before a session can start.

## Technical notes

- New tables: `interview_sessions` (user, track/role/level, voice choice, status, timings, confidence summary, audio path, debrief JSON) and `transcript_turns` (session, speaker, text, timestamp, metrics snapshot). RLS scoped to `auth.uid()` with the required grants; sessions readable/writable only by their owner.
- Voice preference stored on the profile.
- New server functions in `src/lib/interview-room.functions.ts` (all `requireSupabaseAuth`): `startSession`, `appendTurn`, `nextTurn` (Lovable AI reply), `finalizeSession` (debrief generation), `getSession`. Attempt lockout reuses the existing guard in `ai-grader.functions.ts`.
- AI calls go through the Lovable AI Gateway with the existing key; rate-limit (429) and credit (402) errors surface as the error modal, not silent failures.
- Client split into focused components under `src/components/interview-room/`: `RoomStage`, `AiPipAvatar`, `SubtitleBar`, `Waveform`, `ConfidenceHud`, `CaptionsDrawer`, `DeviceErrorModal`, `VoicePicker`, plus hooks for speech recognition, speech synthesis, recording and gaze.
- `src/routes/assessment.mock-interview.tsx` becomes the room; existing setup controls (track / role / level / question count) move into a pre-session panel and Settings sheet. Navigation, global layout and design tokens are untouched.
- The older `/assessment/interview` studio stays as-is.
