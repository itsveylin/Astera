
-- =========================================================================
-- 1. Add missing user_id FKs with ON DELETE CASCADE
-- =========================================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cash_adjustments_user_id_fkey') THEN
    ALTER TABLE public.cash_adjustments
      ADD CONSTRAINT cash_adjustments_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'goal_contributions_user_id_fkey') THEN
    ALTER TABLE public.goal_contributions
      ADD CONSTRAINT goal_contributions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recurring_transactions_user_id_fkey') THEN
    ALTER TABLE public.recurring_transactions
      ADD CONSTRAINT recurring_transactions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'credit_cards_user_id_fkey') THEN
    ALTER TABLE public.credit_cards
      ADD CONSTRAINT credit_cards_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_investment_id_fkey') THEN
    ALTER TABLE public.transactions
      ADD CONSTRAINT transactions_investment_id_fkey
      FOREIGN KEY (investment_id) REFERENCES public.investments(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_credit_card_id_fkey') THEN
    ALTER TABLE public.transactions
      ADD CONSTRAINT transactions_credit_card_id_fkey
      FOREIGN KEY (credit_card_id) REFERENCES public.credit_cards(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =========================================================================
-- 2. import_jobs
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('pdf','csv','xlsx','sms')),
  filename TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','completed','cancelled')),
  notes TEXT,
  row_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.import_jobs TO authenticated;
GRANT ALL ON public.import_jobs TO service_role;

ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ij_select_own" ON public.import_jobs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ij_insert_own" ON public.import_jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ij_update_own" ON public.import_jobs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ij_delete_own" ON public.import_jobs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =========================================================================
-- 3. imported_transactions
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.imported_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  import_job_id UUID NOT NULL REFERENCES public.import_jobs(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ NOT NULL,
  description TEXT NOT NULL,
  debit NUMERIC(14,2),
  credit NUMERIC(14,2),
  balance NUMERIC(14,2),
  category TEXT,
  subcategory TEXT,
  payment_method TEXT,
  confidence NUMERIC(4,3) NOT NULL DEFAULT 1.0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','imported')),
  dedupe_hash TEXT NOT NULL,
  raw_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.imported_transactions TO authenticated;
GRANT ALL ON public.imported_transactions TO service_role;

ALTER TABLE public.imported_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "it_select_own" ON public.imported_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "it_insert_own" ON public.imported_transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.import_jobs j WHERE j.id = import_job_id AND j.user_id = auth.uid()));
CREATE POLICY "it_update_own" ON public.imported_transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "it_delete_own" ON public.imported_transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS imported_transactions_user_status_idx ON public.imported_transactions(user_id, status);
CREATE INDEX IF NOT EXISTS imported_transactions_job_idx ON public.imported_transactions(import_job_id);

-- Prevent the same user from importing the same transaction twice
CREATE UNIQUE INDEX IF NOT EXISTS imported_transactions_dedupe_unique
  ON public.imported_transactions(user_id, dedupe_hash)
  WHERE status IN ('pending','imported');

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS import_jobs_touch ON public.import_jobs;
CREATE TRIGGER import_jobs_touch BEFORE UPDATE ON public.import_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS imported_transactions_touch ON public.imported_transactions;
CREATE TRIGGER imported_transactions_touch BEFORE UPDATE ON public.imported_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
