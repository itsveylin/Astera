import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, X, Plus, Pencil, Trash2, Banknote, Repeat } from "lucide-react";
import { toast } from "sonner";
import { Topbar } from "@/components/Topbar";
import {
  useTransactions, useSaveTransaction, useDeleteTransaction, useProfile,
  useCashAdjustments, useAddCashAdjustment, useDeleteCashAdjustment, useInvestments,
  useSaveRecurring,
} from "@/hooks/useFinanceData";
import {
  categoryMeta, CATEGORIES, formatMoney, PAYMENT_METHODS, paymentMethodMeta, INVESTMENT_TYPES, getSubcategories,
  RECURRING_FREQUENCIES, advanceDate,
  type Category, type PaymentMethod, type Transaction, type RecurringFrequency,
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
  const saveRecurring = useSaveRecurring();
  const currency = profile?.currency ?? "INR";

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | null>(null);
  const [editing, setEditing] = useState<Partial<Transaction> | null>(null);
  const [cashOpen, setCashOpen] = useState(false);
  const [formCategory, setFormCategory] = useState<Category>("Other");
  const [isRecurring, setIsRecurring] = useState(false);
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
    let invName = "", invType = "Mutual Fund";
    if (category === "Investments") {
      invName = String(form.get("investment_name") || "").trim();
      invType = String(form.get("investment_type") || "Mutual Fund");
      if (!invName) { toast.error("Please enter an investment name"); return; }
      investment = { name: invName, type: invType };
    }
    const signedAmount = isIncome ? Math.abs(amount) : -Math.abs(amount);
    const subcategory = String(form.get("subcategory") || "") || null;
    const notes = String(form.get("notes") || "") || null;
    const merchant = String(form.get("merchant"));
    const occurred_at = String(form.get("date") || new Date().toISOString());

    try {
      await save.mutateAsync({
        id: editing.id, merchant, amount: signedAmount, category, subcategory,
        payment_method: pm, notes, occurred_at, investment,
      });
      // Only attach recurring on NEW transactions (avoid duplicate rules on edit).
      if (!editing.id && isRecurring) {
        const frequency = String(form.get("frequency") || "Monthly") as RecurringFrequency;
        const startRaw = String(form.get("rec_start") || "");
        const endRaw = String(form.get("rec_end") || "");
        const start = startRaw ? new Date(startRaw).toISOString() : new Date(occurred_at).toISOString();
        const end = endRaw ? new Date(endRaw).toISOString() : null;
        // Next run is one period after the just-created transaction so we don't double-post today.
        const next = advanceDate(new Date(start), frequency).toISOString();
        await saveRecurring.mutateAsync({
          merchant, amount: signedAmount, category, subcategory,
          payment_method: pm, notes,
          investment_name: invName || null, investment_type: category === "Investments" ? invType : null,
          frequency, start_date: start, end_date: end, next_run: next, paused: false,
        } as any);
      }
      toast.success(editing.id ? "Updated" : "Added");
      setEditing(null);
      setIsRecurring(false);
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
        <button onClick={() => { setFormCategory("Other"); setIsRecurring(false); setEditing({}); }}
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
                <div className="text-sm font-medium truncate flex items-center gap-1.5">
                  {t.merchant}
                  {t.recurring_id ? <span title="Recurring" className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary"><Repeat className="size-2.5" />Recurring</span> : null}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                  <span title={new Date(t.occurred_at).toLocaleString()}>{new Date(t.occurred_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })} · {new Date(t.occurred_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                  <span>·</span><span>{t.category}{t.subcategory ? ` › ${t.subcategory}` : ""}</span>
                  {t.payment_method ? (<><span>·</span><span>{paymentMethodMeta[t.payment_method as PaymentMethod]?.icon ?? ""} {t.payment_method}</span></>) : null}
                </div>
              </div>
              <div className={`text-sm font-medium tabular-nums ${t.amount > 0 ? "text-[var(--color-success)]" : "text-destructive"}`}>
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
              className="glass-strong rounded-[2rem] w-full max-w-md relative flex flex-col max-h-[90dvh] overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-6 pb-3 shrink-0">
                <h3 className="font-display text-2xl">{editing.id ? "Edit transaction" : "New transaction"}</h3>
                <button type="button" aria-label="Close" onClick={() => setEditing(null)} className="p-1.5 rounded-full hover:bg-accent/40"><X className="size-4" /></button>
              </div>
              <div className="px-6 pb-4 overflow-y-auto flex-1 space-y-3">
                <input name="merchant" required defaultValue={editing.merchant ?? ""} placeholder="Merchant" className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
                <div className="flex gap-2">
                  <select name="type" defaultValue={(editing.amount ?? -1) > 0 ? "income" : "expense"}
                    className="glass rounded-2xl px-3 py-2.5 bg-transparent outline-none text-sm">
                    <option value="expense">Expense</option><option value="income">Income</option>
                  </select>
                  <input name="amount" type="number" step="0.01" required defaultValue={editing.amount ? Math.abs(editing.amount) : ""}
                    placeholder="Amount" className="flex-1 min-w-0 glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
                </div>
                <select name="category" required value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as Category)}
                  className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{categoryMeta[c].icon} {c}</option>)}
                </select>
                {getSubcategories(formCategory).length > 0 && (
                  <select name="subcategory" required defaultValue={editing.subcategory ?? ""}
                    key={`sub-${formCategory}`}
                    className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm">
                    <option value="" disabled>Select subcategory…</option>
                    {getSubcategories(formCategory).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                )}
                {formCategory === "Investments" && (
                  <div className="space-y-3 p-3 rounded-2xl bg-background/40 border border-border/60">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Investment details</div>
                    <input name="investment_name" required list="investment-names"
                      defaultValue={linkedInvestment?.name ?? ""}
                      placeholder="Investment name (e.g. Parag Parikh Flexi Cap)"
                      className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
                    <datalist id="investment-names">
                      {investments.map((i) => <option key={i.id} value={i.name} />)}
                    </datalist>
                    <select name="investment_type" required
                      defaultValue={linkedInvestment?.type ?? "Mutual Fund"}
                      className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm">
                      {INVESTMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Automatically tracked in your Investments portfolio. If the name matches an existing holding, the invested total is increased.
                    </p>
                  </div>
                )}
                <select name="payment_method" required defaultValue={editing.payment_method ?? ""}
                  className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm">
                  <option value="" disabled>Select payment method…</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{paymentMethodMeta[m].icon} {m}</option>
                  ))}
                </select>
                <textarea name="notes" defaultValue={editing.notes ?? ""} placeholder="Notes (optional)"
                  className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" rows={2} />
                <details className="rounded-2xl bg-background/40 border border-border/60 group">
                  <summary className="cursor-pointer list-none px-4 py-2.5 text-sm flex items-center justify-between">
                    <span className="text-muted-foreground">Advanced options</span>
                    <span className="text-xs text-muted-foreground group-open:hidden">Date &amp; time auto-set</span>
                  </summary>
                  <div className="px-3 pb-3 pt-1">
                    <label className="text-xs text-muted-foreground">
                      Custom date &amp; time
                      <input name="date" type="datetime-local"
                        defaultValue={(() => {
                          const d = editing.occurred_at ? new Date(editing.occurred_at) : new Date();
                          const tz = d.getTimezoneOffset() * 60000;
                          return new Date(d.getTime() - tz).toISOString().slice(0, 16);
                        })()}
                        className="mt-1 w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
                    </label>
                  </div>
                </details>
                {!editing.id && (
                  <div className="space-y-3 p-3 rounded-2xl bg-background/40 border border-border/60">
                    <label className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2"><Repeat className="size-4" /> Recurring transaction?</span>
                      <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="size-4" />
                    </label>
                    {isRecurring && (
                      <div className="space-y-2">
                        <select name="frequency" defaultValue="Monthly"
                          className="w-full glass rounded-2xl px-4 py-2 bg-transparent outline-none text-sm">
                          {RECURRING_FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <div className="flex gap-2">
                          <label className="flex-1 min-w-0 text-xs text-muted-foreground">
                            Start
                            <input name="rec_start" type="date" className="mt-1 w-full glass rounded-2xl px-3 py-2 bg-transparent outline-none text-sm" />
                          </label>
                          <label className="flex-1 min-w-0 text-xs text-muted-foreground">
                            End (optional)
                            <input name="rec_end" type="date" className="mt-1 w-full glass rounded-2xl px-3 py-2 bg-transparent outline-none text-sm" />
                          </label>
                        </div>
                        <p className="text-xs text-muted-foreground">Future occurrences post automatically when you next open the app.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-border/60 bg-background/60 backdrop-blur shrink-0 flex gap-2">
                <button type="button" onClick={() => setEditing(null)}
                  className="flex-1 py-3 rounded-2xl border border-border/60 bg-background/40 text-sm font-medium hover:bg-background/60">
                  Cancel
                </button>
                <button type="submit" disabled={save.isPending}
                  className="flex-[2] py-3 rounded-2xl gradient-primary text-primary-foreground font-medium disabled:opacity-60">
                  {save.isPending ? "Saving..." : "Save Transaction"}
                </button>
              </div>
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
