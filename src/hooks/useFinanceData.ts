import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import type { Transaction, Budget, Goal, Investment, Profile } from "@/lib/finance";

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
export function useSaveTransaction() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: Partial<Transaction> & { id?: string }) => {
      if (t.id) {
        const { id, ...rest } = t;
        const { error } = await supabase.from("transactions").update(rest as any).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("transactions").insert({ ...(t as any), user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });
}
export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
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
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (b: Partial<Budget> & { id?: string }) => {
      if (b.id) {
        const { id, ...rest } = b;
        const { error } = await supabase.from("budgets").update(rest as any).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("budgets")
          .upsert({ ...(b as any), user_id: user!.id }, { onConflict: "user_id,category" });
        if (error) throw error;
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
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (g: Partial<Goal> & { id?: string }) => {
      if (g.id) {
        const { id, ...rest } = g;
        const { error } = await supabase.from("goals").update(rest as any).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("goals").insert({ ...(g as any), user_id: user!.id });
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
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (i: Partial<Investment> & { id?: string }) => {
      if (i.id) {
        const { id, ...rest } = i;
        const { error } = await supabase.from("investments").update(rest as any).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("investments").insert({ ...(i as any), user_id: user!.id });
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
