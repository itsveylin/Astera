ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS subcategory text;
CREATE INDEX IF NOT EXISTS idx_transactions_subcategory ON public.transactions(subcategory);