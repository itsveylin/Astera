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
  head: () => ({ meta: [{ title: "Investments — Astera" }] }),
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
      const payload: any = {
        id: editing.id,
        name: String(form.get("name")),
        type: String(form.get("type")),
        current_value: Number(form.get("current_value")),
        notes: String(form.get("notes") || "") || null,
      };
      // Only allow manual edits to "invested" for holdings without any linked transactions yet.
      if (!editing.id) payload.invested = Number(form.get("invested") || 0);
      await save.mutateAsync(payload);
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
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-[2rem] w-full max-w-md relative flex flex-col max-h-[90dvh] overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-6 pb-3 shrink-0">
                <h3 className="font-display text-2xl">{editing.id ? "Edit holding" : "New holding"}</h3>
                <button type="button" aria-label="Close" onClick={() => setEditing(null)} className="p-1.5 rounded-full hover:bg-accent/40"><X className="size-4" /></button>
              </div>
              <div className="px-6 pb-4 overflow-y-auto flex-1 space-y-3">
                <label className="block text-xs text-muted-foreground">
                  Investment name
                  <input name="name" required defaultValue={editing.name ?? ""} placeholder="e.g. Parag Parikh Flexi Cap" className="mt-1 w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
                </label>
                <label className="block text-xs text-muted-foreground">
                  Investment type
                  <select name="type" required defaultValue={editing.type ?? "Mutual Fund"} className="mt-1 w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm">
                    {INVESTMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                {editing.id ? (
                  <>
                    <div className="glass rounded-2xl px-4 py-2.5 text-sm flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Total invested</span>
                      <span className="tabular-nums font-medium">{formatMoney(editing.invested ?? 0, currency)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground -mt-1">Auto-calculated from your Investment transactions. To change it, add or edit an Investment transaction.</p>
                    <label className="block text-xs text-muted-foreground">
                      Current value
                      <input name="current_value" type="number" required min="0" step="any" defaultValue={editing.current_value ?? ""} placeholder="0" className="mt-1 w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
                    </label>
                  </>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block text-xs text-muted-foreground min-w-0">
                      Amount invested
                      <input name="invested" type="number" required min="0" step="any" defaultValue={editing.invested ?? ""} placeholder="0" className="mt-1 w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
                    </label>
                    <label className="block text-xs text-muted-foreground min-w-0">
                      Current value
                      <input name="current_value" type="number" required min="0" step="any" defaultValue={editing.current_value ?? ""} placeholder="0" className="mt-1 w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
                    </label>
                  </div>
                )}
                <label className="block text-xs text-muted-foreground">
                  Notes
                  <textarea name="notes" defaultValue={editing.notes ?? ""} placeholder="Optional" className="mt-1 w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" rows={2} />
                </label>
              </div>
              <div className="px-6 py-4 border-t border-border/60 bg-background/60 backdrop-blur shrink-0 flex gap-2">
                <button type="button" onClick={() => setEditing(null)}
                  className="flex-1 py-3 rounded-2xl border border-border/60 bg-background/40 text-sm font-medium hover:bg-background/60">
                  Cancel
                </button>
                <button type="submit" disabled={save.isPending}
                  className="flex-[2] py-3 rounded-2xl gradient-primary text-primary-foreground font-medium disabled:opacity-60">
                  {save.isPending ? "Saving..." : "Save holding"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
