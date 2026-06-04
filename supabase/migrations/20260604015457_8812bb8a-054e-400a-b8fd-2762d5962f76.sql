REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_goal_saved() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_investment_invested() FROM PUBLIC, anon, authenticated;