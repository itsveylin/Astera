import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { Topbar } from "@/components/Topbar";
import { CategoryPie } from "@/components/charts/Charts";
import { useInvestments, useSaveInvestment, useDeleteInvestment, useProfile } from "@/hooks/useFinanceData";
import { formatMoney, INVESTMENT_TYPES, type Investment } from "@/lib/finance";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

export const Route = createFileRoute("/_app/investments")({
  head: () => ({ meta: [{ title: "Investments — Lumen" }] }),
  component: InvestmentsPage,
});

function InvestmentsPage() {
  const { data: profile } = useProfile();
  const { data: investments = [] } = useInvestments();
  const save = useSaveInvestment();
  const del = useDeleteInvestment();
  const currency = profile?.currency ?? "INR";
  const [editing, setEditing] = useState<Partial<Investment> | null>(null);
  useBodyScrollLock(!!editing);

  const invested = investments.reduce((s, i) => s + i.invested, 0);
  const current = investments.reduce((s, i) => s + i.current_value, 0);
  const gain = current - invested;
  const gainPct = invested > 0 ? ((gain / invested) * 100).toFixed(2) : "0.00";

  const byType: Record<string, number> = {};
  investments.forEach((i) => { byType[i.type] = (byType[i.type] || 0) + i.current_value; });
  const pieData = Object.entries(byType).map(([name, value]) => ({ name, value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const form = new FormData(e.target as HTMLFormElement);
    try {
      await save.mutateAsync({
        id: editing.id,
        name: String(form.get("name")),
        type: String(form.get("type")),
        invested: Number(form.get("invested")),
        current_value: Number(form.get("current_value")),
        notes: String(form.get("notes") || "") || null,
      });
      toast.success("Saved");
      setEditing(null);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <Topbar title="Investments" subtitle="Track your portfolio manually. No live APIs, just clarity." />

      <div className="grid lg:grid-cols-4 gap-4 mb-4">
        <div className="glass rounded-3xl p-5 lg:col-span-2">
          <div className="text-xs text-muted-foreground">Portfolio value</div>
          <div className="font-display text-4xl mt-1">{formatMoney(current, currency)}</div>
          {invested > 0 && (
            <div className={`mt-2 text-sm flex items-center gap-2 ${gain >= 0 ? "text-[var(--color-success)]" : "text-destructive"}`}>
              {gain >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
              {gain >= 0 ? "+" : ""}{formatMoney(gain, currency)} ({gainPct}%)
            </div>
          )}
        </div>
        <div className="glass rounded-3xl p-5">
          <div className="text-xs text-muted-foreground">Invested</div>
          <div className="font-display text-2xl mt-1">{formatMoney(invested, currency)}</div>
        </div>
        <button onClick={() => setEditing({})} className="glass rounded-3xl p-5 border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
          <Plus className="size-5" /> Add holding
        </button>
      </div>

      {pieData.length > 0 && (
        <div className="glass rounded-3xl p-6 mb-4">
          <h3 className="font-display text-2xl mb-4">Allocation</h3>
          <CategoryPie data={pieData} currency={currency} />
        </div>
      )}

      {investments.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center text-muted-foreground">No holdings yet. Add your first investment.</div>
      ) : (
        <div className="glass rounded-3xl p-6">
          <h3 className="font-display text-2xl mb-4">Holdings</h3>
          <div className="divide-y divide-border/60">
            {investments.map((h) => {
              const pl = h.current_value - h.invested;
              const plp = h.invested > 0 ? ((pl / h.invested) * 100).toFixed(1) : "0.0";
              const up = pl >= 0;
              return (
                <div key={h.id} className="grid grid-cols-12 items-center gap-2 py-3 text-sm group">
                  <div className="col-span-5 sm:col-span-4">
                    <div className="font-medium">{h.name}</div>
                    <div className="text-xs text-muted-foreground">{h.type}</div>
                  </div>
                  <div className="col-span-3 hidden sm:block text-muted-foreground">{formatMoney(h.invested, currency)}</div>
                  <div className="col-span-3 tabular-nums">{formatMoney(h.current_value, currency)}</div>
                  <div className={`col-span-3 sm:col-span-2 text-right tabular-nums flex items-center justify-end gap-1 ${up ? "text-[var(--color-success)]" : "text-destructive"}`}>
                    {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}{plp}%
                  </div>
                  <div className="col-span-1 flex justify-end opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => setEditing(h)} className="p-1 rounded hover:bg-accent/40"><Pencil className="size-3" /></button>
                    <button onClick={() => { if (confirm("Delete?")) del.mutate(h.id); }} className="p-1 rounded hover:bg-destructive/20 text-destructive"><Trash2 className="size-3" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setEditing(null)} className="fixed inset-0 z-50 backdrop-blur-sm bg-foreground/20 grid place-items-center p-4">
            <motion.form onSubmit={submit} initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()} className="glass-strong rounded-[2rem] p-6 w-full max-w-md relative">
              <button type="button" onClick={() => setEditing(null)} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-accent/40"><X className="size-4" /></button>
              <h3 className="font-display text-2xl mb-4">{editing.id ? "Edit holding" : "New holding"}</h3>
              <div className="space-y-3">
                <input name="name" required defaultValue={editing.name ?? ""} placeholder="Name (e.g. Parag Parikh Flexi Cap)" className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
                <select name="type" required defaultValue={editing.type ?? "Mutual Fund"} className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm">
                  {INVESTMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <div className="flex gap-2">
                  <input name="invested" type="number" required min="0" step="any" defaultValue={editing.invested ?? ""} placeholder="Amount invested" className="flex-1 glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
                  <input name="current_value" type="number" required min="0" step="any" defaultValue={editing.current_value ?? ""} placeholder="Current value" className="flex-1 glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
                </div>
                <textarea name="notes" defaultValue={editing.notes ?? ""} placeholder="Notes (optional)" className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" rows={2} />
              </div>
              <button type="submit" disabled={save.isPending} className="mt-5 w-full py-3 rounded-2xl gradient-primary text-primary-foreground font-medium disabled:opacity-60">Save</button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
