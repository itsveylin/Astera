import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Pencil, Trash2, CreditCard as CardIcon, AlertTriangle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Topbar } from "@/components/Topbar";
import {
  useCreditCards, useSaveCreditCard, useDeleteCreditCard,
  useTransactions, usePayCreditCardBill, useProfile,
} from "@/hooks/useFinanceData";
import {
  formatMoney, computeCardUsage, nextDueDate, CARD_COLORS, PAYMENT_METHODS,
  type CreditCard,
} from "@/lib/finance";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

export const Route = createFileRoute("/_app/credit-cards")({
  head: () => ({ meta: [{ title: "Credit Cards — Lumen" }] }),
  component: CreditCardsPage,
});

function CreditCardsPage() {
  const { data: profile } = useProfile();
  const { data: cards = [] } = useCreditCards();
  const { data: txns = [] } = useTransactions();
  const save = useSaveCreditCard();
  const del = useDeleteCreditCard();
  const pay = usePayCreditCardBill();
  const currency = profile?.currency ?? "INR";

  const [editing, setEditing] = useState<Partial<CreditCard> | null>(null);
  const [paying, setPaying] = useState<CreditCard | null>(null);
  useBodyScrollLock(!!editing || !!paying);

  const today = useMemo(() => new Date(), []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const form = new FormData(e.target as HTMLFormElement);
    try {
      await save.mutateAsync({
        id: editing.id,
        name: String(form.get("name")),
        bank: String(form.get("bank") || "") || null,
        credit_limit: Number(form.get("credit_limit") || 0),
        billing_day: Number(form.get("billing_day")) || null,
        due_day: Number(form.get("due_day")) || null,
        color: String(form.get("color") || "") || null,
        icon: String(form.get("icon") || "") || null,
        notes: String(form.get("notes") || "") || null,
      });
      toast.success(editing.id ? "Updated" : "Card added");
      setEditing(null);
    } catch (e: any) { toast.error(e.message); }
  };

  const submitPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paying) return;
    const form = new FormData(e.target as HTMLFormElement);
    const amount = Number(form.get("amount"));
    if (!Number.isFinite(amount) || amount <= 0) { toast.error("Enter a valid amount"); return; }
    try {
      await pay.mutateAsync({
        card_id: paying.id,
        card_name: paying.name,
        amount,
        payment_method: String(form.get("payment_method") || "Bank Transfer"),
        note: String(form.get("note") || "") || null,
      });
      toast.success("Bill payment recorded");
      setPaying(null);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <Topbar title="Credit Cards" subtitle="Track usage, available credit, and due dates" />

      <div className="flex justify-end mb-4">
        <button onClick={() => setEditing({})}
          className="px-4 py-2 rounded-2xl gradient-primary text-primary-foreground text-sm flex items-center gap-1.5">
          <Plus className="size-4" /> Add card
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center text-muted-foreground">
          No credit cards yet. Add one to start tracking usage and bills.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {cards.map((card) => {
            const usage = computeCardUsage(card, txns);
            const due = nextDueDate(card.due_day, today);
            const dueInDays = due ? Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
            const highUtil = usage.utilization > 80;
            const soonDue = dueInDays !== null && dueInDays <= 5 && usage.outstanding > 0;
            const color = card.color || "oklch(0.65 0.18 260)";
            return (
              <div key={card.id} className="glass rounded-3xl p-5 flex flex-col gap-4 group">
                <div className="rounded-2xl p-5 text-white relative overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${color}, oklch(from ${color} calc(l - 0.15) c h))` }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs opacity-80">{card.bank || "Credit Card"}</div>
                      <div className="font-display text-xl mt-0.5 flex items-center gap-2">
                        <span className="text-lg">{card.icon || "💳"}</span> {card.name}
                      </div>
                    </div>
                    <CardIcon className="size-6 opacity-70" />
                  </div>
                  <div className="mt-6 text-xs opacity-80">Outstanding</div>
                  <div className="font-display text-2xl tabular-nums">{formatMoney(usage.outstanding, currency)}</div>
                </div>

                {(highUtil || soonDue) && (
                  <div className="flex flex-col gap-1.5">
                    {highUtil && (
                      <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl bg-destructive/15 text-destructive">
                        <AlertTriangle className="size-3.5" /> High utilization ({usage.utilization.toFixed(0)}%)
                      </div>
                    )}
                    {soonDue && (
                      <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl bg-[color-mix(in_oklab,var(--color-success)_15%,transparent)] text-foreground">
                        <Calendar className="size-3.5" /> Due in {dueInDays} day{dueInDays === 1 ? "" : "s"}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="glass rounded-2xl p-2.5">
                    <div className="text-muted-foreground">Limit</div>
                    <div className="font-medium tabular-nums">{formatMoney(card.credit_limit, currency)}</div>
                  </div>
                  <div className="glass rounded-2xl p-2.5">
                    <div className="text-muted-foreground">Available</div>
                    <div className="font-medium tabular-nums text-[var(--color-success)]">{formatMoney(usage.available, currency)}</div>
                  </div>
                  <div className="glass rounded-2xl p-2.5">
                    <div className="text-muted-foreground">Usage</div>
                    <div className={`font-medium tabular-nums ${highUtil ? "text-destructive" : ""}`}>{usage.utilization.toFixed(0)}%</div>
                  </div>
                </div>

                <div className="h-2 rounded-full bg-background/60 overflow-hidden">
                  <div className={`h-full ${highUtil ? "bg-destructive" : "gradient-primary"}`}
                    style={{ width: `${Math.min(100, usage.utilization)}%` }} />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{card.billing_day ? `Bills on ${ord(card.billing_day)}` : "—"}</span>
                  <span>{due ? `Due ${due.toLocaleDateString(undefined, { day: "numeric", month: "short" })}` : "No due day set"}</span>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setPaying(card)}
                    className="flex-1 py-2 rounded-2xl gradient-primary text-primary-foreground text-sm font-medium">
                    Pay bill
                  </button>
                  <button onClick={() => setEditing(card)}
                    className="px-3 py-2 rounded-2xl bg-background/40 border border-border/60 text-sm hover:bg-background/60">
                    <Pencil className="size-4" />
                  </button>
                  <button onClick={() => { if (confirm("Delete this card? Linked transactions will remain.")) del.mutate(card.id); }}
                    className="px-3 py-2 rounded-2xl bg-background/40 border border-border/60 text-sm hover:bg-destructive/20 text-destructive">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setEditing(null)} className="fixed inset-0 z-50 backdrop-blur-sm bg-foreground/20 grid place-items-center p-4">
            <motion.form onSubmit={submit} initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-[2rem] w-full max-w-md flex flex-col max-h-[90dvh] overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-6 pb-3 shrink-0">
                <h3 className="font-display text-2xl">{editing.id ? "Edit card" : "New credit card"}</h3>
                <button type="button" onClick={() => setEditing(null)} className="p-1.5 rounded-full hover:bg-accent/40"><X className="size-4" /></button>
              </div>
              <div className="px-6 pb-4 overflow-y-auto flex-1 space-y-3">
                <input name="name" required defaultValue={editing.name ?? ""} placeholder="Card name (e.g. HDFC Millennia)"
                  className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
                <input name="bank" defaultValue={editing.bank ?? ""} placeholder="Bank name (optional)"
                  className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
                <label className="block text-xs text-muted-foreground">
                  Credit limit
                  <input name="credit_limit" type="number" min="0" step="any" required defaultValue={editing.credit_limit ?? ""}
                    className="mt-1 w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs text-muted-foreground min-w-0">
                    Billing day
                    <input name="billing_day" type="number" min="1" max="31" defaultValue={editing.billing_day ?? ""}
                      placeholder="1–31" className="mt-1 w-full glass rounded-2xl px-3 py-2.5 bg-transparent outline-none text-sm" />
                  </label>
                  <label className="block text-xs text-muted-foreground min-w-0">
                    Due day
                    <input name="due_day" type="number" min="1" max="31" defaultValue={editing.due_day ?? ""}
                      placeholder="1–31" className="mt-1 w-full glass rounded-2xl px-3 py-2.5 bg-transparent outline-none text-sm" />
                  </label>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1.5">Color</div>
                  <div className="flex gap-2 flex-wrap">
                    {CARD_COLORS.map((c) => (
                      <label key={c} className="cursor-pointer">
                        <input type="radio" name="color" value={c} defaultChecked={editing.color === c || (!editing.color && c === CARD_COLORS[0])} className="peer sr-only" />
                        <span className="block size-8 rounded-full ring-offset-2 ring-offset-background peer-checked:ring-2 ring-primary"
                          style={{ background: c }} />
                      </label>
                    ))}
                  </div>
                </div>
                <label className="block text-xs text-muted-foreground">
                  Icon (emoji, optional)
                  <input name="icon" defaultValue={editing.icon ?? ""} placeholder="💳"
                    className="mt-1 w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
                </label>
                <textarea name="notes" defaultValue={editing.notes ?? ""} placeholder="Notes (optional)"
                  className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" rows={2} />
              </div>
              <div className="px-6 py-4 border-t border-border/60 bg-background/60 backdrop-blur shrink-0 flex gap-2">
                <button type="button" onClick={() => setEditing(null)}
                  className="flex-1 py-3 rounded-2xl border border-border/60 bg-background/40 text-sm font-medium hover:bg-background/60">Cancel</button>
                <button type="submit" disabled={save.isPending}
                  className="flex-[2] py-3 rounded-2xl gradient-primary text-primary-foreground font-medium disabled:opacity-60">
                  {save.isPending ? "Saving..." : "Save card"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {paying && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setPaying(null)} className="fixed inset-0 z-50 backdrop-blur-sm bg-foreground/20 grid place-items-center p-4">
            <motion.form onSubmit={submitPay} initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-[2rem] w-full max-w-sm flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-6 pb-3">
                <h3 className="font-display text-2xl">Pay {paying.name}</h3>
                <button type="button" onClick={() => setPaying(null)} className="p-1.5 rounded-full hover:bg-accent/40"><X className="size-4" /></button>
              </div>
              <div className="px-6 pb-4 space-y-3">
                <div className="text-xs text-muted-foreground">
                  Outstanding: <span className="font-medium text-foreground">{formatMoney(computeCardUsage(paying, txns).outstanding, currency)}</span>
                </div>
                <input name="amount" type="number" required min="0" step="any"
                  defaultValue={computeCardUsage(paying, txns).outstanding || ""}
                  placeholder="Amount to pay"
                  className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
                <select name="payment_method" defaultValue="Bank Transfer"
                  className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm">
                  {PAYMENT_METHODS.filter((m) => m !== "Card").map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <input name="note" placeholder="Note (optional)"
                  className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
              </div>
              <div className="px-6 py-4 border-t border-border/60 bg-background/60 backdrop-blur flex gap-2">
                <button type="button" onClick={() => setPaying(null)}
                  className="flex-1 py-3 rounded-2xl border border-border/60 bg-background/40 text-sm font-medium hover:bg-background/60">Cancel</button>
                <button type="submit" disabled={pay.isPending}
                  className="flex-[2] py-3 rounded-2xl gradient-primary text-primary-foreground font-medium disabled:opacity-60">
                  {pay.isPending ? "Saving..." : "Record payment"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ord(n: number) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
