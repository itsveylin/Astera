
CREATE TABLE public.credit_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  bank text,
  credit_limit numeric NOT NULL DEFAULT 0,
  billing_day int,
  due_day int,
  color text,
  icon text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_cards TO authenticated;
GRANT ALL ON public.credit_cards TO service_role;

ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY cc_select_own ON public.credit_cards FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY cc_insert_own ON public.credit_cards FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY cc_update_own ON public.credit_cards FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY cc_delete_own ON public.credit_cards FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX credit_cards_user_idx ON public.credit_cards(user_id);

ALTER TABLE public.transactions
  ADD COLUMN credit_card_id uuid,
  ADD COLUMN is_cc_payment boolean NOT NULL DEFAULT false;

CREATE INDEX transactions_credit_card_idx ON public.transactions(credit_card_id);
