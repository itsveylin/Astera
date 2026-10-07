import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Sparkles } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { IncomeExpenseArea, CategoryPie } from "@/components/charts/Charts";
import { useTransactions, useProfile, useGoals } from "@/hooks/useFinanceData";
import { formatMoney } from "@/lib/finance";
import { useMemo } from "react";

export const Route = createFileRoute("/_app/report")({
  head: () => ({ meta: [
    { title: "Year Report — Astera" },
    { name: "description", content: "Review your annual income, spending, savings, and category breakdowns in Astera." },
    { property: "og:title", content: "Year Report — Astera" },
    { property: "og:description", content: "Review your annual income, spending, savings, and category breakdowns in Astera." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Report,
});

function Report() {
  const { data: profile } = useProfile();
  const { data: txns = [] } = useTransactions();
  const { data: goals = [] } = useGoals();
  const currency = profile?.currency ?? "INR";
  const year = new Date().getFullYear();

  const yearTx = useMemo(() => txns.filter((t) => new Date(t.occurred_at).getFullYear() === year), [txns, year]);
  const income = yearTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expense = yearTx.filter((t) => t.amount < 0).reduce((s, t) => s - t.amount, 0);
  const savings = income - expense;

  const monthly = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(year, i, 1).toLocaleDateString("en-US", { month: "short" }),
      income: 0, expense: 0, savings: 0,
    }));
    yearTx.forEach((t) => {
      const m = new Date(t.occurred_at).getMonth();
      if (t.amount > 0) months[m].income += t.amount; else months[m].expense -= t.amount;
    });
    months.forEach((m) => (m.savings = m.income - m.expense));
    return months;
  }, [yearTx, year]);

  const byCat: Record<string, number> = {};
  yearTx.filter((t) => t.amount < 0).forEach((t) => { byCat[t.category] = (byCat[t.category] || 0) + Math.abs(t.amount); });
  const pieData = Object.entries(byCat).map(([name, value]) => ({ name, value }));

  const bySub: Record<string, number> = {};
  yearTx.filter((t) => t.amount < 0 && t.subcategory).forEach((t) => {
    const k = `${t.category} › ${t.subcategory}`;
    bySub[k] = (bySub[k] || 0) + Math.abs(t.amount);
  });
  const topSubs = Object.entries(bySub).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);

  const score = Math.min(100, Math.max(0, Math.round((income > 0 ? (savings / income) : 0) * 100 + 30)));
  const completedGoals = goals.filter((g) => g.saved >= g.target).length;

  return (
    <div>
      <Topbar title={`Your ${year}, in money`} subtitle="A calm recap of the year so far." />

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="glass-strong rounded-[2rem] p-6 lg:col-span-2 relative overflow-hidden">
          <div className="absolute inset-0 gradient-primary opacity-10" />
          <div className="relative">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Total saved</div>
            <div className="font-display text-6xl gradient-text mt-2">{formatMoney(savings, currency)}</div>
            <div className="mt-2 text-sm text-muted-foreground">From {formatMoney(income, currency)} earned and {formatMoney(expense, currency)} spent.</div>
          </div>
        </motion.div>
        <div className="glass rounded-3xl p-6 flex flex-col items-center text-center">
          <Trophy className="size-8 text-[var(--color-warning)]" />
          <div className="text-xs uppercase tracking-widest mt-2 text-muted-foreground">Financial vibe</div>
          <div className="font-display text-5xl mt-1 gradient-text">{score}</div>
          <div className="text-xs text-muted-foreground">Out of 100</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <h3 className="font-display text-2xl mb-3">A year in flow</h3>
          <IncomeExpenseArea data={monthly} currency={currency} />
        </div>
        <div className="glass rounded-3xl p-6">
          <h3 className="font-display text-2xl mb-3">Where it went</h3>
          {pieData.length ? <CategoryPie data={pieData} currency={currency} /> : <p className="text-sm text-muted-foreground">No expenses logged.</p>}
        </div>
      </div>

      {topSubs.length > 0 && (
        <div className="glass rounded-3xl p-6 mt-4">
          <h3 className="font-display text-2xl mb-4">Top subcategories</h3>
          <div className="space-y-2">
            {topSubs.map((s) => {
              const total = topSubs.reduce((a, b) => a + b.value, 0) || 1;
              const pct = Math.round((s.value / total) * 100);
              return (
                <div key={s.name} className="text-sm">
                  <div className="flex justify-between">
                    <span>{s.name}</span>
                    <span className="text-muted-foreground tabular-nums">{formatMoney(s.value, currency)} · {pct}%</span>
                  </div>
                  <div className="h-1.5 mt-1 bg-background/60 rounded-full overflow-hidden">
                    <div className="h-full gradient-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="glass rounded-3xl p-6 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="size-4 text-primary" /><h3 className="font-display text-2xl">Reflections</h3>
        </div>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2"><TrendingUp className="size-4 text-[var(--color-success)] mt-0.5" />You saved {income > 0 ? Math.round((savings / income) * 100) : 0}% of what you earned this year.</li>
          <li className="flex gap-2"><Trophy className="size-4 text-[var(--color-warning)] mt-0.5" />{completedGoals} of {goals.length} savings goals reached so far.</li>
        </ul>
      </div>
    </div>
  );
}
