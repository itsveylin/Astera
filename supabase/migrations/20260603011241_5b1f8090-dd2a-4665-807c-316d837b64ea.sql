CREATE TABLE public.goal_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_goal_contributions_goal ON public.goal_contributions(goal_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.goal_contributions TO authenticated;
GRANT ALL ON public.goal_contributions TO service_role;

ALTER TABLE public.goal_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY gc_select_own ON public.goal_contributions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY gc_insert_own ON public.goal_contributions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY gc_update_own ON public.goal_contributions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY gc_delete_own ON public.goal_contributions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trigger to keep goals.saved in sync
CREATE OR REPLACE FUNCTION public.sync_goal_saved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_goal UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_goal := OLD.goal_id;
  ELSE
    target_goal := NEW.goal_id;
  END IF;

  UPDATE public.goals
  SET saved = COALESCE((
    SELECT SUM(amount) FROM public.goal_contributions WHERE goal_id = target_goal
  ), 0)
  WHERE id = target_goal;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_goal_contributions_sync
AFTER INSERT OR UPDATE OR DELETE ON public.goal_contributions
FOR EACH ROW EXECUTE FUNCTION public.sync_goal_saved();
