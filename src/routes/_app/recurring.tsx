import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Repeat, Play, Pause, Pencil, Trash2, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { Topbar } from "@/components/Topbar";
import {
  useRecurringTransactions, useSaveRecurring, useDeleteRecurring, useToggleRecurringPause,
  useProfile,
} from "@/hooks/useFinanceData";
import {
  categoryMeta, CATEGORIES, formatMoney, PAYMENT_METHODS, paymentMethodMeta,
  RECURRING_FREQUENCIES, getSubcategories, INVESTMENT_TYPES,
  type Category, type RecurringTransaction, type RecurringFrequency,
} from "@/lib/finance";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

export const Route = createFileRoute("/_app/recurring")({
  head: () => ({ meta: [
    { title: "Recurring — Astera" },
    { name: "description", content: "Manage scheduled transactions, frequencies, and payment rules in Astera." },
    { property: "og:title", content: "Recurring — Astera" },
    { property: "og:description", content: "Manage scheduled transactions, frequencies, and payment rules in Astera." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: RecurringPage,
});

function RecurringPage() {
  const { data: profile } = useProfile();
  const { data: rules = [] } = useRecurringTransactions();
  const save = useSaveRecurring();
  const del = useDeleteRecurring();
  const toggle = useToggleRecurringPause();
  const currency = profile?.currency ?? "INR";

  const [editing, setEditing] = useState<Partial<RecurringTransaction> | null>(null);
  const [formCategory, setFormCategory] = useState<Category>("Other");
  useBodyScrollLock(!!editing);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const form = new FormData(e.target as HTMLFormElement);
    const amount = Number(form.get("amount"));
    const isIncome = form.get("type") === "income";
    const category = String(form.get("category")) as Category;
    const pm = String(form.get("payment_method") || "");
    if (!pm) { toast.error("Payment method required"); return; }
    const startRaw = String(form.get("start_date") || "");
    const endRaw = String(form.get("end_date") || "");
    const start = startRaw ? new Date(startRaw).toISOString() : new Date().toISOString();
    const end = endRaw ? new Date(endRaw).toISOString() : null;
    try {
      await save.mutateAsync({
        id: editing.id,
        merchant: String(form.get("merchant")),
        amount: isIncome ? Math.abs(amount) : -Math.abs(amount),
        category,
        subcategory: String(form.get("subcategory") || "") || null,
        payment_method: pm,
        notes: String(form.get("notes") || "") || null,
        investment_name: category === "Investments" ? String(form.get("investment_name") || "") || null : null,
        investment_type: category === "Investments" ? String(form.get("investment_type") || "Mutual Fund") : null,
        frequency: String(form.get("frequency")) as RecurringFrequency,
        start_date: start,
        end_date: end,
        next_run: editing.id ? (editing.next_run ?? start) : start,
        paused: editing.paused ?? false,
      } as any);
      toast.success(editing.id ? "Updated" : "Created");
      setEditing(null);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <Topbar title="Recurring Transactions" subtitle={`${rules.length} rule${rules.length === 1 ? "" : "s"}`} />

      <div className="flex justify-end mb-4">
        <button onClick={() => { setFormCategory("Other"); setEditing({}); }}
          className="px-4 py-2 rounded-2xl gradient-primary text-primary-foreground text-sm flex items-center gap-1.5">
          <Plus className="size-4" /> New recurring
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center text-muted-foreground">
          <Repeat className="size-6 mx-auto mb-3 opacity-50" />
          No recurring transactions yet. Mark a transaction as recurring when adding it, or create one here.
        </div>
      ) : (
        <div className="glass rounded-3xl divide-y divide-border/60">
          {rules.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-4 group">
              <div className="size-11 rounded-2xl grid place-items-center text-lg shrink-0"
                style={{ background: (categoryMeta[r.category]?.color ?? "#999") + "33" }}>
                {categoryMeta[r.category]?.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate flex items-center gap-2">
                  {r.merchant}
                  {r.paused && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Paused</span>}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                  <span>{r.frequency}</span>
                  <span>·</span><span>{r.category}{r.subcategory ? ` › ${r.subcategory}` : ""}</span>
                  {r.payment_method && <><span>·</span><span>{paymentMethodMeta[r.payment_method as keyof typeof paymentMethodMeta]?.icon} {r.payment_method}</span></>}
                  <span>·</span><span>Next: {new Date(r.next_run).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
              </div>
              <div className={`text-sm font-medium tabular-nums ${r.amount > 0 ? "text-[var(--color-success)]" : ""}`}>
                {r.amount > 0 ? "+" : ""}{formatMoney(r.amount, currency)}
              </div>
              <div className="flex gap-1">
                <button onClick={() => toggle.mutate({ id: r.id, paused: !r.paused })}
                  className="p-1.5 rounded-lg hover:bg-accent/40" title={r.paused ? "Resume" : "Pause"}>
                  {r.paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
                </button>
                <button onClick={() => { setFormCategory(r.category); setEditing(r); }}
                  className="p-1.5 rounded-lg hover:bg-accent/40"><Pencil className="size-3.5" /></button>
                <button onClick={() => { if (confirm("Delete this recurring rule? Existing transactions stay.")) del.mutate(r.id); }}
                  className="p-1.5 rounded-lg hover:bg-destructive/20 text-destructive"><Trash2 className="size-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setEditing(null)} className="fixed inset-0 z-50 backdrop-blur-sm bg-foreground/20 grid place-items-center p-4">
            <motion.form onSubmit={submit} initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-[2rem] p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
              <button type="button" onClick={() => setEditing(null)} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-accent/40"><X className="size-4" /></button>
              <h3 className="font-display text-2xl mb-4">{editing.id ? "Edit recurring" : "New recurring"}</h3>
              <div className="space-y-3">
                <input name="merchant" required defaultValue={editing.merchant ?? ""} placeholder="Merchant" className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
                <div className="flex gap-2">
                  <select name="type" defaultValue={(editing.amount ?? -1) > 0 ? "income" : "expense"} className="glass rounded-2xl px-3 py-2.5 bg-transparent outline-none text-sm">
                    <option value="expense">Expense</option><option value="income">Income</option>
                  </select>
                  <input name="amount" type="number" step="0.01" required defaultValue={editing.amount ? Math.abs(editing.amount) : ""} placeholder="Amount" className="flex-1 glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
                </div>
                <select name="category" required value={formCategory} onChange={(e) => setFormCategory(e.target.value as Category)}
                  className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{categoryMeta[c].icon} {c}</option>)}
                </select>
                {getSubcategories(formCategory).length > 0 && (
                  <select name="subcategory" required defaultValue={editing.subcategory ?? ""} key={`sub-${formCategory}`}
                    className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm">
                    <option value="" disabled>Select subcategory…</option>
                    {getSubcategories(formCategory).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
                {formCategory === "Investments" && (
                  <div className="space-y-2 p-3 rounded-2xl bg-background/40 border border-border/60">
                    <input name="investment_name" required defaultValue={editing.investment_name ?? ""} placeholder="Investment name"
                      className="w-full glass rounded-2xl px-4 py-2 bg-transparent outline-none text-sm" />
                    <select name="investment_type" defaultValue={editing.investment_type ?? "Mutual Fund"}
                      className="w-full glass rounded-2xl px-4 py-2 bg-transparent outline-none text-sm">
                      {INVESTMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                )}
                <select name="payment_method" required defaultValue={editing.payment_method ?? ""}
                  className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm">
                  <option value="" disabled>Select payment method…</option>
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{paymentMethodMeta[m].icon} {m}</option>)}
                </select>
                <select name="frequency" required defaultValue={editing.frequency ?? "Monthly"}
                  className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm">
                  {RECURRING_FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
                <div className="flex gap-2">
                  <label className="flex-1 text-xs text-muted-foreground">
                    Start
                    <input name="start_date" type="date" defaultValue={editing.start_date ? new Date(editing.start_date).toISOString().slice(0, 10) : ""}
                      className="mt-1 w-full glass rounded-2xl px-3 py-2 bg-transparent outline-none text-sm" />
                  </label>
                  <label className="flex-1 text-xs text-muted-foreground">
                    End (optional)
                    <input name="end_date" type="date" defaultValue={editing.end_date ? new Date(editing.end_date).toISOString().slice(0, 10) : ""}
                      className="mt-1 w-full glass rounded-2xl px-3 py-2 bg-transparent outline-none text-sm" />
                  </label>
                </div>
                <textarea name="notes" defaultValue={editing.notes ?? ""} placeholder="Notes (optional)"
                  className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" rows={2} />
              </div>
              <button type="submit" disabled={save.isPending}
                className="mt-5 w-full py-3 rounded-2xl gradient-primary text-primary-foreground font-medium disabled:opacity-60">
                {save.isPending ? "Saving..." : "Save"}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
