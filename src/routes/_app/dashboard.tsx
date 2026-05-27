import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Wallet, ArrowDownRight, ArrowUpRight, PiggyBank, TrendingUp, Banknote,
  Calendar, Sparkles, ChevronRight,
} from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { StatCard } from "@/components/StatCard";
import {
  IncomeExpenseArea, CategoryPie, CategoryBars, SavingsRing, Heatmap,
} from "@/components/charts/Charts";
import {
  totals, monthlySpend, transactions, insights, heatmapData,
  categoryMeta, formatINR,
} from "@/lib/mock-data";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Lumen" }] }),
  component: Dashboard,
});

function Dashboard() {
  const byCat = transactions
    .filter((t) => t.amount < 0)
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {});
  const pieData = Object.entries(byCat).map(([name, value]) => ({ name, value }));
  const barData = pieData.slice(0, 6);
  const savingsPct = Math.round((totals.savings / totals.income) * 100);

  return (
    <div>
      <Topbar title="Good morning, Aanya" subtitle="Here's a calm view of your money today." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Balance" value={totals.balance} delta={6.2} icon={Wallet} />
        <StatCard label="Monthly Income" value={totals.income} delta={4.1} icon={ArrowUpRight} accent="success" />
        <StatCard label="Monthly Expense" value={totals.expense} delta={-3.4} icon={ArrowDownRight} accent="warning" />
        <StatCard label="Savings" value={totals.savings} delta={9.8} icon={PiggyBank} accent="accent" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-2xl">Income vs Expense</h3>
              <p className="text-xs text-muted-foreground">Last 12 months</p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[oklch(0.72_0.18_155)]" />Income</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[oklch(0.7_0.2_295)]" />Expense</span>
            </div>
          </div>
          <IncomeExpenseArea data={monthlySpend} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 flex flex-col">
          <h3 className="font-display text-2xl mb-1">Savings rate</h3>
          <p className="text-xs text-muted-foreground mb-2">of monthly income</p>
          <div className="relative flex-1 flex items-center justify-center min-h-[200px]">
            <SavingsRing percent={savingsPct} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-display text-5xl gradient-text">{savingsPct}%</div>
              <div className="text-xs text-muted-foreground mt-1">{formatINR(totals.savings)} saved</div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <div className="glass rounded-3xl p-6">
          <h3 className="font-display text-2xl mb-4">Where it went</h3>
          <CategoryPie data={pieData} />
        </div>
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <h3 className="font-display text-2xl mb-4">Top categories</h3>
          <CategoryBars data={barData} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-2xl">Spending heatmap</h3>
            <span className="text-xs text-muted-foreground">12 weeks</span>
          </div>
          <Heatmap data={heatmapData} />
        </div>
        <div className="glass rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="size-8 rounded-xl gradient-primary grid place-items-center"><Sparkles className="size-4 text-primary-foreground" /></div>
            <h3 className="font-display text-2xl">AI Insights</h3>
          </div>
          <div className="space-y-3">
            {insights.map((i, k) => (
              <motion.div key={k} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: k * 0.08 }}
                className={`rounded-2xl p-3 text-sm border ${
                  i.tone === "warn" ? "border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10" :
                  i.tone === "good" ? "border-[var(--color-success)]/40 bg-[var(--color-success)]/10" :
                  "border-border bg-background/40"
                }`}>
                <div className="font-medium">{i.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{i.body}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-2xl">Recent transactions</h3>
            <Link to="/transactions" className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground">View all <ChevronRight className="size-3" /></Link>
          </div>
          <div className="divide-y divide-border/60">
            {transactions.slice(0, 6).map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-3">
                <div className="size-10 rounded-2xl grid place-items-center text-lg" style={{ background: categoryMeta[t.category].color + "33" }}>
                  {categoryMeta[t.category].icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{t.merchant}</div>
                  <div className="text-xs text-muted-foreground">{t.category} · {t.app}</div>
                </div>
                <div className={`text-sm font-medium ${t.amount > 0 ? "text-[var(--color-success)]" : ""}`}>
                  {t.amount > 0 ? "+" : ""}{formatINR(t.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-3xl p-6">
          <h3 className="font-display text-2xl mb-4">Upcoming</h3>
          <div className="space-y-3">
            {[
              { name: "Rent", amount: 28000, date: "Jun 1", icon: "🏠" },
              { name: "Credit Card", amount: 18420, date: "Jun 3", icon: "💳" },
              { name: "Netflix", amount: 649, date: "Jun 12", icon: "🎬" },
              { name: "Electricity", amount: 2100, date: "Jun 15", icon: "⚡" },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-3 glass rounded-2xl p-3">
                <div className="size-9 rounded-xl bg-background/60 grid place-items-center">{b.icon}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{b.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="size-3" />{b.date}</div>
                </div>
                <div className="text-sm">{formatINR(b.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <StatCard label="Investments" value={totals.investments} delta={11.4} icon={TrendingUp} accent="success" />
        <StatCard label="Net Worth" value={totals.netWorth} delta={8.2} icon={Banknote} accent="accent" />
        <StatCard label="Cash in hand" value={totals.cash} icon={Wallet} />
      </div>
    </div>
  );
}
