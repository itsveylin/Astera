import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { advanceDate } from "@/lib/finance";
import type { Transaction, Budget, Goal, Investment, Profile, RecurringTransaction, RecurringFrequency, CreditCard } from "@/lib/finance";

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user,
    queryKey: ["profile", user?.id],
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Profile>) => {
      const { error } = await supabase.from("profiles").update(patch as any).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useTransactions() {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user,
    queryKey: ["transactions", user?.id],
    queryFn: async (): Promise<Transaction[]> => {
      const { data, error } = await supabase
        .from("transactions").select("*").order("occurred_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((d: any) => ({ ...d, amount: Number(d.amount) }));
    },
  });
}
async function getVerifiedUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    await supabase.auth.signOut().catch(() => {});
    throw new Error("Your session has expired. Please sign in again.");
  }
  // Ensure a profile row exists for FK / app expectations
  const { data: prof } = await supabase.from("profiles").select("id").eq("id", data.user.id).maybeSingle();
  if (!prof) {
    await supabase.from("profiles").insert({
      id: data.user.id,
      display_name: (data.user.user_metadata as any)?.display_name ?? data.user.email?.split("@")[0] ?? "You",
    } as any);
  }
  return data.user.id;
}

export function useSaveTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      t: Partial<Transaction> & { id?: string; investment?: { name: string; type: string } | null },
    ) => {
      const uid = await getVerifiedUserId();
      let investment_id: string | null | undefined = t.investment_id ?? null;

      if (t.category === "Investments" && t.investment?.name) {
        const name = t.investment.name.trim();
        const type = (t.investment.type || "Mutual Fund").trim();
        const { data: existing } = await supabase
          .from("investments")
          .select("id")
          .eq("user_id", uid)
          .ilike("name", name)
          .maybeSingle();
        if (existing?.id) {
          investment_id = existing.id;
        } else {
          const { data: created, error: cErr } = await supabase
            .from("investments")
            .insert({ user_id: uid, name, type, invested: 0, current_value: 0 } as any)
            .select("id")
            .single();
          if (cErr) throw cErr;
          investment_id = created!.id;
        }
      } else if (t.category && t.category !== "Investments") {
        investment_id = null;
      }

      const { id, investment, ...rest } = t as any;
      const payload = { ...rest, investment_id };

      if (id) {
        const { error } = await supabase.from("transactions").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("transactions").insert({ ...payload, user_id: uid });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["budgets"] });
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["investments"] });
    },
  });
}
export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["investments"] });
    },
  });
}

export function useBudgets() {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user, queryKey: ["budgets", user?.id],
    queryFn: async (): Promise<Budget[]> => {
      const { data, error } = await supabase.from("budgets").select("*").order("category");
      if (error) throw error;
      return (data ?? []).map((d: any) => ({ ...d, monthly_limit: Number(d.monthly_limit) }));
    },
  });
}
export function useSaveBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (b: Partial<Budget> & { id?: string }) => {
      const uid = await getVerifiedUserId();
      if (b.id) {
        // Edit: never touch category/user_id — only update mutable fields by id.
        const patch: Record<string, unknown> = {};
        if (b.monthly_limit !== undefined) patch.monthly_limit = b.monthly_limit;
        const { error } = await supabase
          .from("budgets")
          .update(patch as any)
          .eq("id", b.id)
          .eq("user_id", uid);
        if (error) throw error;
      } else {
        // Create: if a budget for this category already exists, update it instead of inserting.
        const { data: existing } = await supabase
          .from("budgets")
          .select("id")
          .eq("user_id", uid)
          .eq("category", b.category as string)
          .maybeSingle();
        if (existing?.id) {
          const { error } = await supabase
            .from("budgets")
            .update({ monthly_limit: b.monthly_limit } as any)
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("budgets")
            .insert({ category: b.category, monthly_limit: b.monthly_limit, user_id: uid } as any);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}
export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}

export function useGoals() {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user, queryKey: ["goals", user?.id],
    queryFn: async (): Promise<Goal[]> => {
      const { data, error } = await supabase.from("goals").select("*").order("created_at");
      if (error) throw error;
      return (data ?? []).map((d: any) => ({ ...d, target: Number(d.target), saved: Number(d.saved) }));
    },
  });
}
export function useSaveGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (g: Partial<Goal> & { id?: string }) => {
      const uid = await getVerifiedUserId();
      if (g.id) {
        const { id, ...rest } = g;
        const { error } = await supabase.from("goals").update(rest as any).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("goals").insert({ ...(g as any), user_id: uid });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}
export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export interface GoalContribution {
  id: string;
  goal_id: string;
  user_id: string;
  amount: number;
  note: string | null;
  created_at: string;
}

export function useGoalContributions(goalId: string | undefined) {
  return useQuery({
    enabled: !!goalId,
    queryKey: ["goal_contributions", goalId],
    queryFn: async (): Promise<GoalContribution[]> => {
      const { data, error } = await supabase
        .from("goal_contributions" as any)
        .select("*")
        .eq("goal_id", goalId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as any[]).map((d) => ({ ...d, amount: Number(d.amount) }));
    },
  });
}

export function useAddGoalContribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: { goal_id: string; amount: number; note?: string | null }) => {
      const uid = await getVerifiedUserId();
      const { error } = await supabase
        .from("goal_contributions" as any)
        .insert({ goal_id: c.goal_id, amount: c.amount, note: c.note ?? null, user_id: uid } as any);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["goal_contributions", vars.goal_id] });
      qc.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

export function useDeleteGoalContribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; goal_id: string }) => {
      const { error } = await supabase.from("goal_contributions" as any).delete().eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["goal_contributions", vars.goal_id] });
      qc.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}


export function useInvestments() {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user, queryKey: ["investments", user?.id],
    queryFn: async (): Promise<Investment[]> => {
      const { data, error } = await supabase.from("investments").select("*").order("created_at");
      if (error) throw error;
      return (data ?? []).map((d: any) => ({ ...d, invested: Number(d.invested), current_value: Number(d.current_value) }));
    },
  });
}
export function useSaveInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (i: Partial<Investment> & { id?: string }) => {
      const uid = await getVerifiedUserId();
      if (i.id) {
        const { id, ...rest } = i;
        const { error } = await supabase.from("investments").update(rest as any).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("investments").insert({ ...(i as any), user_id: uid });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investments"] }),
  });
}
export function useDeleteInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("investments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investments"] }),
  });
}

export interface CashAdjustment {
  id: string;
  user_id: string;
  amount: number;
  note: string | null;
  created_at: string;
}

export function useCashAdjustments() {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user,
    queryKey: ["cash_adjustments", user?.id],
    queryFn: async (): Promise<CashAdjustment[]> => {
      const { data, error } = await supabase
        .from("cash_adjustments" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as any[]).map((d) => ({ ...d, amount: Number(d.amount) }));
    },
  });
}

export function useAddCashAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: { amount: number; note?: string | null }) => {
      const uid = await getVerifiedUserId();
      const { error } = await supabase
        .from("cash_adjustments" as any)
        .insert({ amount: c.amount, note: c.note ?? null, user_id: uid } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cash_adjustments"] }),
  });
}

export function useDeleteCashAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cash_adjustments" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cash_adjustments"] }),
  });
}

export function useRecurringTransactions() {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user,
    queryKey: ["recurring", user?.id],
    queryFn: async (): Promise<RecurringTransaction[]> => {
      const { data, error } = await supabase
        .from("recurring_transactions" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as any[]).map((d) => ({ ...d, amount: Number(d.amount) }));
    },
  });
}

export function useSaveRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: Partial<RecurringTransaction> & { id?: string }) => {
      const uid = await getVerifiedUserId();
      if (r.id) {
        const { id, user_id, created_at, updated_at, last_run, ...rest } = r as any;
        const { error } = await supabase.from("recurring_transactions" as any).update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const payload = { ...r, user_id: uid, next_run: r.next_run ?? r.start_date ?? new Date().toISOString() };
        const { error } = await supabase.from("recurring_transactions" as any).insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring"] }),
  });
}

export function useDeleteRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recurring_transactions" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useToggleRecurringPause() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; paused: boolean }) => {
      const { error } = await supabase.from("recurring_transactions" as any)
        .update({ paused: vars.paused } as any).eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring"] }),
  });
}

/**
 * Runs once when the user logs in. Looks for active recurring rules whose
 * next_run is in the past and materializes the missed occurrences into
 * the transactions table, advancing next_run/last_run as it goes.
 */
export function useRecurringRunner() {
  const { user } = useAuth();
  const qc = useQueryClient();
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const now = new Date();
      const { data: rules } = await supabase
        .from("recurring_transactions" as any)
        .select("*")
        .eq("paused", false)
        .lte("next_run", now.toISOString());
      if (cancelled || !rules?.length) return;

      let generated = 0;
      for (const raw of rules as any[]) {
        const rule = raw as RecurringTransaction;
        let next = new Date(rule.next_run);
        const end = rule.end_date ? new Date(rule.end_date) : null;
        let last: Date | null = rule.last_run ? new Date(rule.last_run) : null;
        const inserts: any[] = [];
        // safety cap so a stale rule can't insert thousands of rows in one go
        let guard = 0;
        while (next <= now && (!end || next <= end) && guard < 365) {
          let investment_id: string | null = null;
          if (rule.category === "Investments" && rule.investment_name) {
            const { data: existing } = await supabase.from("investments")
              .select("id").eq("user_id", user.id).ilike("name", rule.investment_name).maybeSingle();
            if (existing?.id) investment_id = existing.id;
            else {
              const { data: created } = await supabase.from("investments")
                .insert({ user_id: user.id, name: rule.investment_name, type: rule.investment_type || "Mutual Fund", invested: 0, current_value: 0 } as any)
                .select("id").single();
              investment_id = created?.id ?? null;
            }
          }
          inserts.push({
            user_id: user.id,
            merchant: rule.merchant,
            amount: rule.amount,
            category: rule.category,
            subcategory: rule.subcategory,
            payment_method: rule.payment_method,
            notes: rule.notes,
            occurred_at: next.toISOString(),
            investment_id,
            recurring_id: rule.id,
          });
          last = next;
          next = advanceDate(next, rule.frequency as RecurringFrequency);
          guard++;
        }
        if (inserts.length) {
          const { error } = await supabase.from("transactions").insert(inserts as any);
          if (!error) {
            generated += inserts.length;
            await supabase.from("recurring_transactions" as any)
              .update({ next_run: next.toISOString(), last_run: last?.toISOString() ?? null } as any)
              .eq("id", rule.id);
          }
        }
      }
      if (generated > 0) {
        qc.invalidateQueries({ queryKey: ["transactions"] });
        qc.invalidateQueries({ queryKey: ["recurring"] });
        qc.invalidateQueries({ queryKey: ["investments"] });
        qc.invalidateQueries({ queryKey: ["budgets"] });
        qc.invalidateQueries({ queryKey: ["goals"] });
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);
}

export function useCreditCards() {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user,
    queryKey: ["credit_cards", user?.id],
    queryFn: async (): Promise<CreditCard[]> => {
      const { data, error } = await supabase
        .from("credit_cards" as any)
        .select("*")
        .order("created_at");
      if (error) throw error;
      return ((data ?? []) as any[]).map((d) => ({ ...d, credit_limit: Number(d.credit_limit) }));
    },
  });
}

export function useSaveCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: Partial<CreditCard> & { id?: string }) => {
      const uid = await getVerifiedUserId();
      if (c.id) {
        const { id, user_id, created_at, updated_at, ...rest } = c as any;
        const { error } = await supabase.from("credit_cards" as any).update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("credit_cards" as any).insert({ ...c, user_id: uid } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["credit_cards"] }),
  });
}

export function useDeleteCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("credit_cards" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["credit_cards"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function usePayCreditCardBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { card_id: string; amount: number; payment_method?: string; note?: string | null; card_name?: string }) => {
      const uid = await getVerifiedUserId();
      const amt = Math.abs(vars.amount);
      const { error } = await supabase.from("transactions").insert({
        user_id: uid,
        merchant: vars.card_name ? `Bill payment · ${vars.card_name}` : "Credit card bill payment",
        amount: -amt,
        category: "Bills",
        subcategory: "EMI / Loan Payment",
        payment_method: vars.payment_method ?? "Bank Transfer",
        notes: vars.note ?? null,
        occurred_at: new Date().toISOString(),
        credit_card_id: vars.card_id,
        is_cc_payment: true,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["credit_cards"] });
    },
  });
}
