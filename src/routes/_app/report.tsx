import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Download, Sparkles, Trophy, TrendingUp } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { IncomeExpenseArea, CategoryPie } from "@/components/charts/Charts";
import { monthlySpend, transactions, formatINR } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/report")({
  head: () => ({ meta: [{ title: "Year-end Report — Lumen" }] }),
  component: Report,
});

function Report() {
  const income = monthlySpend.reduce((s, m) => s + m.income, 0);
  const expense = monthlySpend.reduce((s, m) => s + m.expense, 0);
  const savings = monthlySpend.reduce((s, m) => s + m.savings, 0);

  const byCat = transactions.filter(t=>t.amount<0).reduce<Record<string,number>>((a,t)=>{a[t.category]=(a[t.category]||0)+Math.abs(t.amount);return a;},{});
  const pieData = Object.entries(byCat).map(([name, value]) => ({ name, value }));

  const score = 82;

  return (
    <div>
      <Topbar title="Your 2026, in money" subtitle="A cinematic recap of your financial year." />

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="glass-strong rounded-[2rem] p-6 lg:col-span-2 relative overflow-hidden">
          <div className="absolute inset-0 gradient-primary opacity-10" />
          <div className="relative">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Total saved this year</div>
            <div className="font-display text-6xl gradient-text mt-2">{formatINR(savings)}</div>
            <div className="mt-2 text-sm text-muted-foreground">From {formatINR(income)} income and {formatINR(expense)} spent.</div>
          </div>
        </motion.div>
        <div className="glass rounded-3xl p-6 flex flex-col items-center text-center">
          <Trophy className="size-8 text-[var(--color-warning)]" />
          <div className="text-xs uppercase tracking-widest mt-2 text-muted-foreground">Financial health</div>
          <div className="font-display text-5xl mt-1 gradient-text">{score}</div>
          <div className="text-xs text-muted-foreground">Out of 100 · Excellent</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <h3 className="font-display text-2xl mb-3">A year in flow</h3>
          <IncomeExpenseArea data={monthlySpend} />
        </div>
        <div className="glass rounded-3xl p-6">
          <h3 className="font-display text-2xl mb-3">Where it went</h3>
          <CategoryPie data={pieData} />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-4">
        {[
          { t: "Strongest month", v: "December", s: formatINR(138000) + " saved" },
          { t: "Biggest category", v: "Shopping", s: formatINR(127000) + " spent" },
          { t: "Best habit", v: "12-month savings streak", s: "Kept it up all year" },
        ].map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="glass rounded-3xl p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{c.t}</div>
            <div className="font-display text-2xl mt-1">{c.v}</div>
            <div className="text-xs text-muted-foreground mt-1">{c.s}</div>
          </motion.div>
        ))}
      </div>

      <div className="glass rounded-3xl p-6 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="size-4 text-primary" /><h3 className="font-display text-2xl">AI year-end notes</h3>
        </div>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2"><TrendingUp className="size-4 text-[var(--color-success)] mt-0.5"/>Your savings rate climbed from 38% in Jan to 49% in Dec — a quiet, beautiful trend.</li>
          <li className="flex gap-2"><Sparkles className="size-4 text-primary mt-0.5"/>You cancelled 3 subscriptions this year and saved ₹14,400.</li>
          <li className="flex gap-2"><Trophy className="size-4 text-[var(--color-warning)] mt-0.5"/>You hit 2 savings goals: Emergency Fund and MacBook Pro.</li>
        </ul>
      </div>

      <button className="mt-4 px-6 py-3 rounded-2xl gradient-primary text-primary-foreground inline-flex items-center gap-2 shadow-[var(--shadow-elegant)]">
        <Download className="size-4" /> Download PDF recap
      </button>
    </div>
  );
}
