import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Topbar } from "@/components/Topbar";
import { useBudgets, useSaveBudget, useDeleteBudget, useTransactions, useProfile } from "@/hooks/useFinanceData";
import { CATEGORIES, categoryMeta, formatMoney, type Category, type Budget } from "@/lib/finance";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

export const Route = createFileRoute("/_app/budgets")({
  head: () => ({ meta: [
    { title: "Budgets — Astera" },
    { name: "description", content: "Manage category budgets and track your monthly spending limits in Astera." },
    { property: "og:title", content: "Budgets — Astera" },
    { property: "og:description", content: "Manage category budgets and track your monthly spending limits in Astera." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: BudgetsPage,
});

function statusColor(pct: number) {
  if (pct >= 100) return "var(--color-destructive)";
  if (pct >= 80) return "var(--color-warning)";
  return "var(--color-success)";
}

function BudgetsPage() {
  const { data: profile } = useProfile();
  const { data: budgets = [] } = useBudgets();
  const { data: txns = [] } = useTransactions();
  const save = useSaveBudget();
  const del = useDeleteBudget();
  const currency = profile?.currency ?? "INR";
  const [editing, setEditing] = useState<Partial<Budget> | null>(null);
  useBodyScrollLock(!!editing);

  const now = new Date();
  const spentBy: Record<string, number> = {};
  txns.filter((t) => {
    const d = new Date(t.occurred_at);
    return t.amount < 0 && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).forEach((t) => { spentBy[t.category] = (spentBy[t.category] || 0) + Math.abs(t.amount); });

  const total = budgets.reduce((s, b) => s + b.monthly_limit, 0);
  const spent = Object.values(spentBy).reduce((s, v) => s + v, 0);
  const pct = total > 0 ? Math.round((spent / total) * 100) : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const form = new FormData(e.target as HTMLFormElement);
    const limit = Number(form.get("limit"));
    if (!Number.isFinite(limit) || limit < 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      if (editing.id) {
        await save.mutateAsync({ id: editing.id, monthly_limit: limit });
      } else {
        await save.mutateAsync({
          category: String(form.get("category")) as Category,
          monthly_limit: limit,
        });
      }
      toast.success("Saved");
      setEditing(null);
    } catch (err: any) {
      toast.error(err?.message ?? "Could not save budget");
    }
  };

  return (
    <div>
      <Topbar title="Budgets" subtitle="Gentle caps, not strict rules." />

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-muted-foreground">Total monthly budget</div>
              <div className="font-display text-3xl">{formatMoney(total, currency)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Spent this month</div>
              <div className="font-display text-3xl">{formatMoney(spent, currency)}</div>
            </div>
          </div>
          <div className="h-3 rounded-full bg-background/60 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }} transition={{ duration: 1.1 }}
              className="h-full gradient-primary rounded-full" />
          </div>
          <div className="text-xs text-muted-foreground mt-2">{pct}% used · {formatMoney(Math.max(0, total - spent), currency)} remaining</div>
        </div>
        <button onClick={() => setEditing({})} className="glass rounded-3xl p-6 border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition">
          <Plus className="size-6" /> <span>Add budget</span>
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((b, i) => {
          const used = spentBy[b.category] || 0;
          const p = b.monthly_limit > 0 ? Math.round((used / b.monthly_limit) * 100) : 0;
          const over = used > b.monthly_limit;
          return (
            <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="glass rounded-3xl p-5 group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="size-10 rounded-2xl grid place-items-center text-lg" style={{ background: categoryMeta[b.category]?.color + "33" }}>
                    {categoryMeta[b.category]?.icon}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{b.category}</div>
                    <div className="text-xs text-muted-foreground">{formatMoney(used, currency)} of {formatMoney(b.monthly_limit, currency)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="text-sm font-medium" style={{ color: statusColor(p) }}>{p}%</div>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition ml-1">
                    <button onClick={() => setEditing(b)} className="p-1 rounded hover:bg-accent/40"><Pencil className="size-3" /></button>
                    <button onClick={() => del.mutate(b.id)} className="p-1 rounded hover:bg-destructive/20 text-destructive"><Trash2 className="size-3" /></button>
                  </div>
                </div>
              </div>
              <div className="h-2 rounded-full bg-background/60 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, p)}%` }} transition={{ duration: 0.9 }}
                  className="h-full rounded-full" style={{ background: statusColor(p) }} />
              </div>
              <div className="text-xs mt-2 text-muted-foreground">
                {over ? <span className="text-destructive">Over by {formatMoney(used - b.monthly_limit, currency)}</span> : `${formatMoney(b.monthly_limit - used, currency)} left`}
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setEditing(null)} className="fixed inset-0 z-50 backdrop-blur-sm bg-foreground/20 grid place-items-center p-4">
            <motion.form onSubmit={submit} initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()} className="glass-strong rounded-[2rem] p-6 w-full max-w-md relative">
              <button type="button" onClick={() => setEditing(null)} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-accent/40"><X className="size-4" /></button>
              <h3 className="font-display text-2xl mb-4">{editing.id ? "Edit budget" : "New budget"}</h3>
              <select name="category" required defaultValue={editing.category ?? "Food"}
                disabled={!!editing.id}
                className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm mb-3">
                {CATEGORIES.filter((c) => c !== "Income").map((c) => <option key={c} value={c}>{categoryMeta[c].icon} {c}</option>)}
              </select>
              <input name="limit" type="number" required min="0" step="any" defaultValue={editing.monthly_limit ?? ""}
                placeholder="Monthly limit" className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
              <button type="submit" disabled={save.isPending}
                className="mt-5 w-full py-3 rounded-2xl gradient-primary text-primary-foreground font-medium disabled:opacity-60">Save</button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
