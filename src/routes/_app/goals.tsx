import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Topbar } from "@/components/Topbar";
import { useGoals, useSaveGoal, useDeleteGoal, useProfile } from "@/hooks/useFinanceData";
import { formatMoney, type Goal } from "@/lib/finance";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

export const Route = createFileRoute("/_app/goals")({
  head: () => ({ meta: [{ title: "Goals — Lumen" }] }),
  component: GoalsPage,
});

const EMOJIS = ["🎯", "🛟", "🌴", "💻", "🏡", "🎓", "🚗", "💍", "📿", "🌱", "✈️", "🎨"];

function GoalsPage() {
  const { data: profile } = useProfile();
  const { data: goals = [] } = useGoals();
  const save = useSaveGoal();
  const del = useDeleteGoal();
  const currency = profile?.currency ?? "INR";
  const [editing, setEditing] = useState<Partial<Goal> | null>(null);
  useBodyScrollLock(!!editing);

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
        saved: Number(form.get("saved")),
        deadline: String(form.get("deadline") || "") || null,
      });
      toast.success("Saved");
      setEditing(null);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <Topbar title="Savings Goals" subtitle="Watch your jars fill up." />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((g, i) => {
          const p = g.target > 0 ? Math.round((g.saved / g.target) * 100) : 0;
          return (
            <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass rounded-3xl p-6 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <div className="text-4xl">{g.emoji}</div>
                <div className="flex items-center gap-2">
                  {g.deadline && <div className="text-xs text-muted-foreground">by {new Date(g.deadline).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</div>}
                  <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition">
                    <button onClick={() => setEditing(g)} className="p-1 rounded hover:bg-accent/40"><Pencil className="size-3" /></button>
                    <button onClick={() => { if (confirm("Delete goal?")) del.mutate(g.id); }} className="p-1 rounded hover:bg-destructive/20 text-destructive"><Trash2 className="size-3" /></button>
                  </div>
                </div>
              </div>
              <div className="font-display text-2xl mt-3">{g.name}</div>
              <div className="text-xs text-muted-foreground">{formatMoney(g.saved, currency)} of {formatMoney(g.target, currency)}</div>
              <div className="mt-4 relative h-40 rounded-2xl border border-border/70 bg-background/40 overflow-hidden">
                <motion.div initial={{ height: 0 }} animate={{ height: `${Math.min(100, p)}%` }} transition={{ duration: 1.2, ease: "easeOut" }}
                  className="absolute bottom-0 inset-x-0 gradient-primary opacity-80" />
                <div className="absolute inset-0 flex items-center justify-center font-display text-4xl text-foreground/90 mix-blend-difference">{p}%</div>
              </div>
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
              <h3 className="font-display text-2xl mb-4">{editing.id ? "Edit goal" : "New goal"}</h3>
              <div className="space-y-3">
                <input name="name" required defaultValue={editing.name ?? ""} placeholder="Goal name" className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
                <select name="emoji" defaultValue={editing.emoji ?? "🎯"} className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm">
                  {EMOJIS.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
                <div className="flex gap-2">
                  <input name="target" type="number" required min="0" step="any" defaultValue={editing.target ?? ""} placeholder="Target" className="flex-1 glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
                  <input name="saved" type="number" min="0" step="any" defaultValue={editing.saved ?? 0} placeholder="Saved so far" className="flex-1 glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
                </div>
                <input name="deadline" type="date" defaultValue={editing.deadline ?? ""} className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
              </div>
              <button type="submit" disabled={save.isPending} className="mt-5 w-full py-3 rounded-2xl gradient-primary text-primary-foreground font-medium disabled:opacity-60">Save</button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
