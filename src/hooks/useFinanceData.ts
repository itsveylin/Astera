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
    mutationFn: async (t: Partial<Transaction> & { id?: string }) => {
      const uid = await getVerifiedUserId();
      if (t.id) {
        const { id, ...rest } = t;
        const { error } = await supabase.from("transactions").update(rest as any).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("transactions").insert({ ...(t as any), user_id: uid });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["budgets"] });
      qc.invalidateQueries({ queryKey: ["goals"] });
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
