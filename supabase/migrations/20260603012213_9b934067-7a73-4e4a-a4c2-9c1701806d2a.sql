
CREATE TABLE public.cash_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_adjustments TO authenticated;
GRANT ALL ON public.cash_adjustments TO service_role;

ALTER TABLE public.cash_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ca_select_own" ON public.cash_adjustments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ca_insert_own" ON public.cash_adjustments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ca_update_own" ON public.cash_adjustments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ca_delete_own" ON public.cash_adjustments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_cash_adjustments_user ON public.cash_adjustments(user_id, created_at DESC);
