CREATE TABLE public.interview_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  track TEXT NOT NULL DEFAULT 'software',
  role TEXT NOT NULL DEFAULT '',
  level TEXT NOT NULL DEFAULT 'Entry',
  voice TEXT NOT NULL DEFAULT 'elena',
  highlights TEXT NOT NULL DEFAULT '',
  question_budget INTEGER NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'setup',
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_sec INTEGER NOT NULL DEFAULT 0,
  confidence_avg INTEGER NOT NULL DEFAULT 0,
  eye_contact_avg INTEGER NOT NULL DEFAULT 0,
  audio_path TEXT,
  debrief JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_sessions TO authenticated;
GRANT ALL ON public.interview_sessions TO service_role;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own interview sessions" ON public.interview_sessions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.transcript_turns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  speaker TEXT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  turn_index INTEGER NOT NULL DEFAULT 0,
  metrics JSONB,
  spoken_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.transcript_turns TO authenticated;
GRANT ALL ON public.transcript_turns TO service_role;
ALTER TABLE public.transcript_turns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own transcript turns" ON public.transcript_turns FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX transcript_turns_session_idx ON public.transcript_turns (session_id, turn_index);
CREATE INDEX interview_sessions_user_idx ON public.interview_sessions (user_id, created_at DESC);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_voice TEXT;

CREATE TRIGGER interview_sessions_set_updated_at
  BEFORE UPDATE ON public.interview_sessions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();