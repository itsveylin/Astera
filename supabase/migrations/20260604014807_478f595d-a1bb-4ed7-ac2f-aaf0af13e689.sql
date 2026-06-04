ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS investment_id uuid;
CREATE INDEX IF NOT EXISTS idx_transactions_investment_id ON public.transactions(investment_id);

CREATE OR REPLACE FUNCTION public.sync_investment_invested()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_new uuid;
  target_old uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_old := OLD.investment_id;
  ELSIF TG_OP = 'UPDATE' THEN
    target_old := OLD.investment_id;
    target_new := NEW.investment_id;
  ELSE
    target_new := NEW.investment_id;
  END IF;

  IF target_old IS NOT NULL AND (target_new IS NULL OR target_old <> target_new) THEN
    UPDATE public.investments
    SET invested = COALESCE((SELECT SUM(-amount) FROM public.transactions WHERE investment_id = target_old), 0)
    WHERE id = target_old;
  END IF;

  IF target_new IS NOT NULL THEN
    UPDATE public.investments
    SET invested = COALESCE((SELECT SUM(-amount) FROM public.transactions WHERE investment_id = target_new), 0)
    WHERE id = target_new;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_tx_investment_sync ON public.transactions;
CREATE TRIGGER trg_tx_investment_sync
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.sync_investment_invested();