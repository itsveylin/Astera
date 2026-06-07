import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Pencil, Trash2, PiggyBank, Minus, History } from "lucide-react";
import { toast } from "sonner";
import { Topbar } from "@/components/Topbar";
import {
  useGoals, useSaveGoal, useDeleteGoal, useProfile,
  useGoalContributions, useAddGoalContribution, useDeleteGoalContribution,
} from "@/hooks/useFinanceData";
import { formatMoney, type Goal } from "@/lib/finance";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

export const Route = createFileRoute("/_app/goals")({
  head: () => ({ meta: [{ title: "Goals — Astera" }] }),
  component: GoalsPage,
});

const EMOJIS = ["🎯", "🛟", "🌴", "💻", "🏡", "🎓", "🚗", "💍", "📿", "🌱", "✈️", "🎨"];
const QUICK = [100, 500, 1000];

function GoalsPage() {
  const { data: profile } = useProfile();
  const { data: goals = [] } = useGoals();
  const save = useSaveGoal();
  const del = useDeleteGoal();
  const currency = profile?.currency ?? "INR";
  const [editing, setEditing] = useState<Partial<Goal> | null>(null);
  const [contributing, setContributing] = useState<Goal | null>(null);
  const [historyOf, setHistoryOf] = useState<Goal | null>(null);
  useBodyScrollLock(!!editing || !!contributing || !!historyOf);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const form = new FormData(e.target as HTMLFormElement);
    try {
      await save.mutateAsync({
        id: editing.id,
        name: String(form.get("name")),
        emoji: String(form.get("emoji")),
        target: Number(form.get("target")),
        // Saved is managed via contributions; only set on create (default 0).
        ...(editing.id ? {} : { saved: 0 }),
        deadline: String(form.get("deadline") || "") || null,
      });
      toast.success("Saved");
      setEditing(null);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <Topbar title="Savings Goals" subtitle="Contribute, don't edit. Watch your jars fill up." />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((g, i) => {
          const p = g.target > 0 ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0;
          const remaining = Math.max(0, g.target - g.saved);
          return (
            <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass rounded-3xl p-6 relative overflow-hidden group flex flex-col">
              <div className="flex items-center justify-between">
                <div className="text-4xl">{g.emoji}</div>
                <div className="flex items-center gap-2">
                  {g.deadline && <div className="text-xs text-muted-foreground">by {new Date(g.deadline).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</div>}
                  <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition">
                    <button onClick={() => setHistoryOf(g)} className="p-1 rounded hover:bg-accent/40" aria-label="History"><History className="size-3" /></button>
                    <button onClick={() => setEditing(g)} className="p-1 rounded hover:bg-accent/40" aria-label="Edit"><Pencil className="size-3" /></button>
                    <button onClick={() => { if (confirm("Delete goal? Contribution history will be lost.")) del.mutate(g.id); }} className="p-1 rounded hover:bg-destructive/20 text-destructive" aria-label="Delete"><Trash2 className="size-3" /></button>
                  </div>
                </div>
              </div>
              <div className="font-display text-2xl mt-3">{g.name}</div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                <div className="glass rounded-xl p-2">
                  <div className="text-muted-foreground uppercase tracking-wider">Saved</div>
                  <div className="font-semibold text-sm mt-0.5">{formatMoney(g.saved, currency)}</div>
                </div>
                <div className="glass rounded-xl p-2">
                  <div className="text-muted-foreground uppercase tracking-wider">Target</div>
                  <div className="font-semibold text-sm mt-0.5">{formatMoney(g.target, currency)}</div>
                </div>
                <div className="glass rounded-xl p-2">
                  <div className="text-muted-foreground uppercase tracking-wider">Left</div>
                  <div className="font-semibold text-sm mt-0.5">{formatMoney(remaining, currency)}</div>
                </div>
              </div>

              <div className="mt-4 relative h-32 rounded-2xl border border-border/70 bg-background/40 overflow-hidden">
                <motion.div initial={{ height: 0 }} animate={{ height: `${p}%` }} transition={{ duration: 1.2, ease: "easeOut" }}
                  className="absolute bottom-0 inset-x-0 gradient-primary opacity-80" />
                <div className="absolute inset-0 flex items-center justify-center font-display text-3xl text-foreground/90 mix-blend-difference">{p}%</div>
              </div>

              <button onClick={() => setContributing(g)}
                className="mt-4 w-full py-2.5 rounded-2xl gradient-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 hover:opacity-95 transition">
                <PiggyBank className="size-4" /> Add money
              </button>
            </motion.div>
          );
        })}
        <button onClick={() => setEditing({})}
          className="glass rounded-3xl p-6 border-dashed min-h-[280px] flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
          <Plus className="size-6" /> Create new goal
        </button>
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setEditing(null)} className="fixed inset-0 z-50 backdrop-blur-sm bg-foreground/20 grid place-items-center p-4">
            <motion.form onSubmit={submit} initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()} className="glass-strong rounded-[2rem] p-6 w-full max-w-md relative">
              <button type="button" onClick={() => setEditing(null)} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-accent/40"><X className="size-4" /></button>
              <h3 className="font-display text-2xl mb-1">{editing.id ? "Edit goal" : "New goal"}</h3>
              <p className="text-xs text-muted-foreground mb-4">Saved amount updates automatically from your contributions.</p>
              <div className="space-y-3">
                <input name="name" required defaultValue={editing.name ?? ""} placeholder="Goal name" className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
                <select name="emoji" defaultValue={editing.emoji ?? "🎯"} className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm">
                  {EMOJIS.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
                <input name="target" type="number" required min="0" step="any" defaultValue={editing.target ?? ""} placeholder="Target amount" className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
                <input name="deadline" type="date" defaultValue={editing.deadline ?? ""} className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
              </div>
              <button type="submit" disabled={save.isPending} className="mt-5 w-full py-3 rounded-2xl gradient-primary text-primary-foreground font-medium disabled:opacity-60">Save</button>
            </motion.form>
          </motion.div>
        )}

        {contributing && (
          <ContributeModal
            key={`c-${contributing.id}`}
            goal={contributing}
            currency={currency}
            onClose={() => setContributing(null)}
          />
        )}

        {historyOf && (
          <HistoryModal
            key={`h-${historyOf.id}`}
            goal={historyOf}
            currency={currency}
            onClose={() => setHistoryOf(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ContributeModal({ goal, currency, onClose }: { goal: Goal; currency: string; onClose: () => void }) {
  const add = useAddGoalContribution();
  const [mode, setMode] = useState<"add" | "withdraw">("add");
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return toast.error("Enter an amount greater than 0");
    const signed = mode === "withdraw" ? -n : n;
    if (mode === "withdraw" && goal.saved + signed < 0) {
      return toast.error("Cannot withdraw more than you've saved");
    }
    try {
      await add.mutateAsync({ goal_id: goal.id, amount: signed, note: note.trim() || null });
      toast.success(mode === "withdraw" ? "Withdrawn" : "Contribution added");
      onClose();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose} className="fixed inset-0 z-50 backdrop-blur-sm bg-foreground/20 grid place-items-center p-4">
      <motion.form onSubmit={submit} initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()} className="glass-strong rounded-[2rem] p-6 w-full max-w-md relative">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-accent/40"><X className="size-4" /></button>
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">{goal.emoji}</div>
          <div>
            <h3 className="font-display text-2xl leading-tight">{goal.name}</h3>
            <div className="text-xs text-muted-foreground">{formatMoney(goal.saved, currency)} of {formatMoney(goal.target, currency)}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <button type="button" onClick={() => setMode("add")}
            className={`py-2 rounded-2xl text-sm flex items-center justify-center gap-2 transition ${mode === "add" ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
            <Plus className="size-4" /> Add money
          </button>
          <button type="button" onClick={() => setMode("withdraw")}
            className={`py-2 rounded-2xl text-sm flex items-center justify-center gap-2 transition ${mode === "withdraw" ? "bg-destructive text-destructive-foreground" : "glass text-muted-foreground"}`}>
            <Minus className="size-4" /> Withdraw
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {QUICK.map((q) => (
            <button key={q} type="button" onClick={() => setAmount(String(q))}
              className="glass rounded-2xl py-2 text-sm hover:ring-1 hover:ring-border transition">
              +{formatMoney(q, currency)}
            </button>
          ))}
        </div>

        <input
          type="number" min="0" step="any" required autoFocus
          value={amount} onChange={(e) => setAmount(e.target.value)}
          placeholder="Custom amount"
          className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm mb-3"
        />
        <input
          value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional) — e.g. salary day"
          className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm"
        />

        <button type="submit" disabled={add.isPending}
          className={`mt-5 w-full py-3 rounded-2xl font-medium disabled:opacity-60 ${mode === "withdraw" ? "bg-destructive text-destructive-foreground" : "gradient-primary text-primary-foreground"}`}>
          {mode === "withdraw" ? "Withdraw" : "Add to goal"}
        </button>
      </motion.form>
    </motion.div>
  );
}

function HistoryModal({ goal, currency, onClose }: { goal: Goal; currency: string; onClose: () => void }) {
  const { data: items = [], isLoading } = useGoalContributions(goal.id);
  const del = useDeleteGoalContribution();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose} className="fixed inset-0 z-50 backdrop-blur-sm bg-foreground/20 grid place-items-center p-4">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()} className="glass-strong rounded-[2rem] p-6 w-full max-w-md relative max-h-[80vh] flex flex-col">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-accent/40"><X className="size-4" /></button>
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">{goal.emoji}</div>
          <div>
            <h3 className="font-display text-2xl leading-tight">{goal.name}</h3>
            <div className="text-xs text-muted-foreground">Contribution history</div>
          </div>
        </div>

        <div className="overflow-y-auto -mx-1 px-1 flex-1">
          {isLoading ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">No contributions yet. Tap "Add money" to start.</div>
          ) : (
            <ul className="space-y-2">
              {items.map((c) => {
                const positive = c.amount >= 0;
                return (
                  <li key={c.id} className="glass rounded-2xl p-3 flex items-center gap-3">
                    <div className={`size-8 rounded-xl grid place-items-center shrink-0 ${positive ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                      {positive ? <Plus className="size-4" /> : <Minus className="size-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{positive ? "+" : "−"}{formatMoney(Math.abs(c.amount), currency)}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {new Date(c.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                        {c.note ? ` · ${c.note}` : ""}
                      </div>
                    </div>
                    <button onClick={() => { if (confirm("Remove this entry?")) del.mutate({ id: c.id, goal_id: goal.id }); }}
                      className="p-1.5 rounded-lg hover:bg-destructive/20 text-destructive" aria-label="Delete entry">
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
