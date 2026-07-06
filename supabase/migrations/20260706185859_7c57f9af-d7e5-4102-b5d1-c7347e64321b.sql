
DROP POLICY IF EXISTS gc_insert_own ON public.goal_contributions;
CREATE POLICY gc_insert_own ON public.goal_contributions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.goals
      WHERE id = goal_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS t_insert_own ON public.transactions;
CREATE POLICY t_insert_own ON public.transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      investment_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.investments
        WHERE id = investment_id AND user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS t_update_own ON public.transactions;
CREATE POLICY t_update_own ON public.transactions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      investment_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.investments
        WHERE id = investment_id AND user_id = auth.uid()
      )
    )
  );
