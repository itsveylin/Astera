
CREATE TABLE public.recurring_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  merchant TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  payment_method TEXT,
  notes TEXT,
  investment_name TEXT,
  investment_type TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('Daily','Weekly','Monthly','Quarterly','Yearly')),
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  next_run TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_run TIMESTAMPTZ,
  paused BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recurring_transactions TO authenticated;
GRANT ALL ON public.recurring_transactions TO service_role;

ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own recurring" ON public.recurring_transactions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_recurring_user_next ON public.recurring_transactions(user_id, next_run) WHERE paused = false;

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS recurring_id UUID REFERENCES public.recurring_transactions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_recurring ON public.transactions(recurring_id);
