import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus, Sparkles } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { budgets, categoryMeta, formatINR } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/budgets")({
  head: () => ({ meta: [{ title: "Budgets — Lumen" }] }),
  component: Budgets,
});

function statusColor(pct: number) {
  if (pct >= 100) return "var(--color-destructive)";
  if (pct >= 80) return "var(--color-warning)";
  return "var(--color-success)";
}

function Budgets() {
  const total = budgets.reduce((s, b) => s + b.limit, 0);
  const spent = budgets.reduce((s, b) => s + b.spent, 0);
  const pct = Math.round((spent / total) * 100);

  return (
    <div>
      <Topbar title="Budgets" subtitle="Gentle caps and smart nudges, not strict rules." />

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-muted-foreground">Total monthly budget</div>
              <div className="font-display text-3xl">{formatINR(total)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Spent so far</div>
              <div className="font-display text-3xl">{formatINR(spent)}</div>
            </div>
          </div>
          <div className="h-3 rounded-full bg-background/60 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.1 }}
              className="h-full gradient-primary rounded-full" />
          </div>
          <div className="text-xs text-muted-foreground mt-2">{pct}% used · {formatINR(total - spent)} remaining</div>
        </div>
        <div className="glass rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="size-4 text-primary" /> <span className="text-sm font-medium">AI suggestion</span>
          </div>
          <p className="text-sm text-muted-foreground">Lowering Shopping by 15% would put you back on track this month. Want Lumen to set it?</p>
          <button className="mt-4 w-full py-2 rounded-2xl gradient-primary text-primary-foreground text-sm">Apply suggestion</button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((b, i) => {
          const p = Math.min(100, Math.round((b.spent / b.limit) * 100));
          const over = b.spent > b.limit;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass rounded-3xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="size-10 rounded-2xl grid place-items-center text-lg" style={{ background: categoryMeta[b.category].color + "33" }}>
                    {categoryMeta[b.category].icon}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{b.category}</div>
                    <div className="text-xs text-muted-foreground">Monthly</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">{formatINR(b.limit)}</div>
                  <div className="text-sm font-medium" style={{ color: statusColor(p) }}>{p}%</div>
                </div>
              </div>
              <div className="h-2 rounded-full bg-background/60 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, p)}%` }} transition={{ duration: 0.9 }}
                  className="h-full rounded-full" style={{ background: statusColor(p) }} />
              </div>
              <div className="text-xs mt-2 text-muted-foreground">
                {over ? <span className="text-destructive">Over by {formatINR(b.spent - b.limit)}</span> : `${formatINR(b.limit - b.spent)} left`}
              </div>
            </motion.div>
          );
        })}
        <button className="glass rounded-3xl p-5 border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition">
          <Plus className="size-5" /> Add budget
        </button>
      </div>
    </div>
  );
}
