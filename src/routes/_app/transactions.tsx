import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, X, Plus, Pencil, Trash2, Banknote } from "lucide-react";
import { toast } from "sonner";
import { Topbar } from "@/components/Topbar";
import {
  useTransactions, useSaveTransaction, useDeleteTransaction, useProfile,
  useCashAdjustments, useAddCashAdjustment, useDeleteCashAdjustment, useInvestments,
} from "@/hooks/useFinanceData";
import {
  categoryMeta, CATEGORIES, formatMoney, PAYMENT_METHODS, paymentMethodMeta, INVESTMENT_TYPES,
  type Category, type PaymentMethod, type Transaction,
} from "@/lib/finance";

import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

export const Route = createFileRoute("/_app/transactions")({
  head: () => ({ meta: [{ title: "Transactions — Lumen" }] }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const { data: profile } = useProfile();
  const { data: txns = [] } = useTransactions();
  const { data: cashAdjustments = [] } = useCashAdjustments();
  const { data: investments = [] } = useInvestments();
  const save = useSaveTransaction();
  const del = useDeleteTransaction();
  const addCash = useAddCashAdjustment();
  const delCash = useDeleteCashAdjustment();
  const currency = profile?.currency ?? "INR";

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | null>(null);
  const [editing, setEditing] = useState<Partial<Transaction> | null>(null);
  const [cashOpen, setCashOpen] = useState(false);
  const [formCategory, setFormCategory] = useState<Category>("Other");
  useBodyScrollLock(!!editing || cashOpen);

  const linkedInvestment = useMemo(
    () => (editing?.investment_id ? investments.find((i) => i.id === editing.investment_id) : null),
    [editing, investments],
  );

  const cashFromTx = txns.filter((t) => t.payment_method === "Cash").reduce((s, t) => s + t.amount, 0);
  const cashFromAdj = cashAdjustments.reduce((s, a) => s + a.amount, 0);
  const cashInHand = cashFromTx + cashFromAdj;

  const filtered = txns.filter((t) =>
    (!q || t.merchant.toLowerCase().includes(q.toLowerCase())) &&
    (!cat || t.category === cat)
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const form = new FormData(e.target as HTMLFormElement);
    const amount = Number(form.get("amount"));
    const isIncome = form.get("type") === "income";
    const pm = String(form.get("payment_method") || "");
    const category = String(form.get("category")) as Category;
    if (!pm) { toast.error("Please select a payment method"); return; }
    let investment: { name: string; type: string } | null = null;
    if (category === "Investments") {
      const invName = String(form.get("investment_name") || "").trim();
      const invType = String(form.get("investment_type") || "Mutual Fund");
      if (!invName) { toast.error("Please enter an investment name"); return; }
      investment = { name: invName, type: invType };
    }
    try {
      await save.mutateAsync({
        id: editing.id,
        merchant: String(form.get("merchant")),
        amount: isIncome ? Math.abs(amount) : -Math.abs(amount),
        category,
        payment_method: pm,
        notes: String(form.get("notes") || "") || null,
        occurred_at: String(form.get("date") || new Date().toISOString()),
        investment,
      });
      toast.success(editing.id ? "Updated" : "Added");
      setEditing(null);
    } catch (e: any) { toast.error(e.message); }
  };

  const submitCash = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData(e.target as HTMLFormElement);
    const amt = Math.abs(Number(form.get("cash_amount")));
    const op = String(form.get("cash_op"));
    if (!Number.isFinite(amt) || amt <= 0) { toast.error("Enter a valid amount"); return; }
    try {
      await addCash.mutateAsync({
        amount: op === "decrease" ? -amt : amt,
        note: String(form.get("cash_note") || "") || null,
      });
      toast.success("Cash balance updated");
      setCashOpen(false);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <Topbar title="Transactions" subtitle={`${filtered.length} entries`} />

      <div className="glass rounded-3xl p-4 flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-background/40 rounded-2xl px-3 py-2">
          <Search className="size-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search merchant..." className="bg-transparent outline-none text-sm flex-1" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="size-4 text-muted-foreground" />
          <button onClick={() => setCat(null)} className={`px-3 py-1.5 rounded-full text-xs ${!cat ? "gradient-primary text-primary-foreground" : "bg-background/40"}`}>All</button>
          {CATEGORIES.filter((c) => c !== "Income").map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1 ${cat === c ? "gradient-primary text-primary-foreground" : "bg-background/40"}`}>
              {categoryMeta[c].icon} {c}
            </button>
          ))}
        </div>
        <button onClick={() => setCashOpen(true)}
          className="px-4 py-2 rounded-2xl bg-background/40 hover:bg-background/60 text-sm flex items-center gap-1.5 border border-border/60">
          <Banknote className="size-4" /> Cash: <span className="tabular-nums font-medium">{formatMoney(cashInHand, currency)}</span>
        </button>
        <button onClick={() => { setFormCategory("Other"); setEditing({}); }}
          className="px-4 py-2 rounded-2xl gradient-primary text-primary-foreground text-sm flex items-center gap-1.5">
          <Plus className="size-4" /> Add
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center text-muted-foreground">
          No transactions yet. Click <strong>Add</strong> to log your first.
        </div>
      ) : (
        <div className="glass rounded-3xl divide-y divide-border/60">
          {filtered.map((t) => (
            <motion.div key={t.id} whileHover={{ x: 4 }} className="flex items-center gap-3 p-4 group">
              <div className="size-11 rounded-2xl grid place-items-center text-lg shrink-0" style={{ background: categoryMeta[t.category as Category]?.color + "33" }}>
                {categoryMeta[t.category as Category]?.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{t.merchant}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                  <span>{new Date(t.occurred_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
                  <span>·</span><span>{t.category}</span>
                  {t.payment_method ? (<><span>·</span><span>{paymentMethodMeta[t.payment_method as PaymentMethod]?.icon ?? ""} {t.payment_method}</span></>) : null}
                </div>
              </div>
              <div className={`text-sm font-medium tabular-nums ${t.amount > 0 ? "text-[var(--color-success)]" : ""}`}>
                {t.amount > 0 ? "+" : ""}{formatMoney(t.amount, currency)}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => { setFormCategory((t.category as Category) ?? "Other"); setEditing(t); }} className="p-1.5 rounded-lg hover:bg-accent/40"><Pencil className="size-3.5" /></button>
                <button onClick={() => { if (confirm("Delete?")) del.mutate(t.id); }} className="p-1.5 rounded-lg hover:bg-destructive/20 text-destructive"><Trash2 className="size-3.5" /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setEditing(null)} className="fixed inset-0 z-50 backdrop-blur-sm bg-foreground/20 grid place-items-center p-4">
            <motion.form onSubmit={submit} initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-[2rem] p-6 w-full max-w-md relative">
              <button type="button" onClick={() => setEditing(null)} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-accent/40"><X className="size-4" /></button>
              <h3 className="font-display text-2xl mb-4">{editing.id ? "Edit transaction" : "New transaction"}</h3>
              <div className="space-y-3">
                <input name="merchant" required defaultValue={editing.merchant ?? ""} placeholder="Merchant" className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
                <div className="flex gap-2">
                  <select name="type" defaultValue={(editing.amount ?? -1) > 0 ? "income" : "expense"}
                    className="glass rounded-2xl px-3 py-2.5 bg-transparent outline-none text-sm">
                    <option value="expense">Expense</option><option value="income">Income</option>
                  </select>
                  <input name="amount" type="number" step="0.01" required defaultValue={editing.amount ? Math.abs(editing.amount) : ""}
                    placeholder="Amount" className="flex-1 glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
                </div>
                <select name="category" required defaultValue={editing.category ?? "Other"}
                  className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{categoryMeta[c].icon} {c}</option>)}
                </select>
                <select name="payment_method" required defaultValue={editing.payment_method ?? ""}
                  className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm">
                  <option value="" disabled>Select payment method…</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{paymentMethodMeta[m].icon} {m}</option>
                  ))}
                </select>
                <input name="date" type="datetime-local"
                  defaultValue={(editing.occurred_at ? new Date(editing.occurred_at) : new Date()).toISOString().slice(0, 16)}
                  className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
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

      <AnimatePresence>
        {cashOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setCashOpen(false)} className="fixed inset-0 z-50 backdrop-blur-sm bg-foreground/20 grid place-items-center p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-[2rem] p-6 w-full max-w-md relative">
              <button type="button" onClick={() => setCashOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-accent/40"><X className="size-4" /></button>
              <h3 className="font-display text-2xl mb-1 flex items-center gap-2"><Banknote className="size-5" /> Cash Adjustment</h3>
              <p className="text-xs text-muted-foreground mb-4">Current cash in hand: <span className="tabular-nums font-medium text-foreground">{formatMoney(cashInHand, currency)}</span></p>
              <form onSubmit={submitCash} className="space-y-3">
                <div className="flex gap-2">
                  <select name="cash_op" defaultValue="increase" className="glass rounded-2xl px-3 py-2.5 bg-transparent outline-none text-sm">
                    <option value="increase">Increase</option>
                    <option value="decrease">Decrease</option>
                  </select>
                  <input name="cash_amount" type="number" step="0.01" min="0" required placeholder="Amount"
                    className="flex-1 glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
                </div>
                <input name="cash_note" placeholder="Note (optional, e.g. ATM withdrawal)"
                  className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
                <button type="submit" disabled={addCash.isPending}
                  className="w-full py-3 rounded-2xl gradient-primary text-primary-foreground font-medium disabled:opacity-60">
                  {addCash.isPending ? "Saving..." : "Save adjustment"}
                </button>
              </form>
              {cashAdjustments.length > 0 && (
                <div className="mt-5">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Recent adjustments</div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-border/60">
                    {cashAdjustments.slice(0, 10).map((a) => (
                      <div key={a.id} className="flex items-center gap-3 py-2 text-sm">
                        <div className="flex-1 min-w-0">
                          <div className={`tabular-nums font-medium ${a.amount > 0 ? "text-[var(--color-success)]" : "text-destructive"}`}>
                            {a.amount > 0 ? "+" : ""}{formatMoney(a.amount, currency)}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {new Date(a.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                            {a.note ? ` · ${a.note}` : ""}
                          </div>
                        </div>
                        <button onClick={() => { if (confirm("Delete adjustment?")) delCash.mutate(a.id); }}
                          className="p-1.5 rounded-lg hover:bg-destructive/20 text-destructive">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
