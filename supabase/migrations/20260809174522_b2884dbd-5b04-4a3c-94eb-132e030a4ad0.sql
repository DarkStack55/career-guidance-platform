CREATE TABLE public.gap_plan_shares (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  target_role text NOT NULL,
  candidate_name text,
  plan jsonb NOT NULL,
  pdf_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gap_plan_shares TO authenticated;
GRANT SELECT ON public.gap_plan_shares TO anon;
GRANT ALL ON public.gap_plan_shares TO service_role;

ALTER TABLE public.gap_plan_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their own shared plans"
  ON public.gap_plan_shares FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone with the link can read a shared plan"
  ON public.gap_plan_shares FOR SELECT TO anon
  USING (true);

CREATE INDEX gap_plan_shares_user_idx ON public.gap_plan_shares (user_id, created_at DESC);