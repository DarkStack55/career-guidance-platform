CREATE TABLE public.resume_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  label text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'manual',
  draft jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX resume_versions_user_created_idx ON public.resume_versions (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.resume_versions TO authenticated;
GRANT ALL ON public.resume_versions TO service_role;

ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own resume versions" ON public.resume_versions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own resume versions" ON public.resume_versions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own resume versions" ON public.resume_versions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own resume versions" ON public.resume_versions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER resume_versions_set_updated_at
  BEFORE UPDATE ON public.resume_versions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DROP POLICY IF EXISTS "Anyone with the link can read a shared plan" ON public.gap_plan_shares;
REVOKE SELECT ON public.gap_plan_shares FROM anon;
GRANT ALL ON public.gap_plan_shares TO service_role;