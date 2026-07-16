import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import type { ParsedRow } from "@/lib/import";

export interface ImportJob {
  id: string;
  user_id: string;
  source: "pdf" | "csv" | "xlsx" | "sms";
  filename: string | null;
  status: "pending" | "reviewed" | "completed" | "cancelled";
  notes: string | null;
  row_count: number;
  created_at: string;
  updated_at: string;
}

export interface ImportedTransaction {
  id: string;
  user_id: string;
  import_job_id: string;
  occurred_at: string;
  description: string;
  debit: number | null;
  credit: number | null;
  balance: number | null;
  category: string | null;
  subcategory: string | null;
  payment_method: string | null;
  confidence: number;
  status: "pending" | "approved" | "rejected" | "imported";
  dedupe_hash: string;
  raw_text: string | null;
  created_at: string;
  updated_at: string;
}

export function useImportJobs() {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user,
    queryKey: ["import_jobs", user?.id],
    queryFn: async (): Promise<ImportJob[]> => {
      const { data, error } = await supabase
        .from("import_jobs" as any)
        .select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any;
    },
  });
}

export function useImportedTransactions(status: "pending" | "all" = "pending") {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user,
    queryKey: ["imported_transactions", user?.id, status],
    queryFn: async (): Promise<ImportedTransaction[]> => {
      let q = supabase.from("imported_transactions" as any).select("*").order("occurred_at", { ascending: false });
      if (status === "pending") q = q.eq("status", "pending");
      const { data, error } = await q;
      if (error) throw error;
      return ((data ?? []) as any[]).map((d) => ({
        ...d,
        debit: d.debit === null ? null : Number(d.debit),
        credit: d.credit === null ? null : Number(d.credit),
        balance: d.balance === null ? null : Number(d.balance),
        confidence: Number(d.confidence),
      }));
    },
  });
}

export function useCreateImport() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (vars: { source: ImportJob["source"]; filename?: string | null; rows: ParsedRow[] }) => {
      if (!user) throw new Error("Not signed in");
      const { data: job, error: jErr } = await supabase.from("import_jobs" as any)
        .insert({ user_id: user.id, source: vars.source, filename: vars.filename ?? null, row_count: vars.rows.length } as any)
        .select("id").single();
      if (jErr) throw jErr;
      const jobId = (job as any).id;
      if (vars.rows.length) {
        // Filter existing dedupe hashes to prevent duplicate imports
        const hashes = vars.rows.map((r) => r.dedupe_hash);
        const { data: existing } = await supabase.from("imported_transactions" as any)
          .select("dedupe_hash").in("dedupe_hash", hashes).in("status", ["pending", "imported"]);
        const seen = new Set(((existing ?? []) as any[]).map((e) => e.dedupe_hash));
        const payload = vars.rows.filter((r) => !seen.has(r.dedupe_hash)).map((r) => ({
          user_id: user.id, import_job_id: jobId,
          occurred_at: r.occurred_at, description: r.description,
          debit: r.debit, credit: r.credit, balance: r.balance,
          category: r.category, subcategory: r.subcategory,
          payment_method: r.payment_method, confidence: r.confidence,
          dedupe_hash: r.dedupe_hash, raw_text: r.raw_text,
        }));
        const duplicates = vars.rows.length - payload.length;
        if (payload.length) {
          const { error: iErr } = await supabase.from("imported_transactions" as any).insert(payload as any);
          if (iErr) throw iErr;
        }
        return { jobId, inserted: payload.length, duplicates };
      }
      return { jobId, inserted: 0, duplicates: 0 };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["import_jobs"] });
      qc.invalidateQueries({ queryKey: ["imported_transactions"] });
    },
  });
}

export function useUpdateImported() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; patch: Partial<ImportedTransaction> }) => {
      const { error } = await supabase.from("imported_transactions" as any).update(vars.patch as any).eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["imported_transactions"] }),
  });
}

export function useDeleteImported() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("imported_transactions" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["imported_transactions"] }),
  });
}

export function useApproveImported() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (rows: ImportedTransaction[]) => {
      if (!user) throw new Error("Not signed in");
      if (!rows.length) return { count: 0 };
      const payload = rows.map((r) => {
        const amt = r.credit && r.credit > 0 ? r.credit : -(r.debit || 0);
        return {
          user_id: user.id,
          merchant: r.description,
          amount: amt,
          category: r.category || "Other",
          subcategory: r.subcategory,
          payment_method: r.payment_method,
          notes: r.raw_text,
          occurred_at: r.occurred_at,
        };
      });
      const { error } = await supabase.from("transactions").insert(payload as any);
      if (error) throw error;
      const ids = rows.map((r) => r.id);
      const { error: uErr } = await supabase.from("imported_transactions" as any)
        .update({ status: "imported" } as any).in("id", ids);
      if (uErr) throw uErr;
      return { count: rows.length };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["imported_transactions"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["budgets"] });
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["investments"] });
    },
  });
}
