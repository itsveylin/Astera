import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { Wallet, ArrowDownRight, ArrowUpRight, PiggyBank, TrendingUp, ChevronRight, Plus, Banknote } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { StatCard } from "@/components/StatCard";
import { IncomeExpenseArea, CategoryPie, SavingsRing } from "@/components/charts/Charts";
import { useTransactions, useProfile, useInvestments, useGoals, useCashAdjustments } from "@/hooks/useFinanceData";
import { categoryMeta, formatMoney, type Category } from "@/lib/finance";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Lumen" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: profile } = useProfile();
  const { data: txns = [] } = useTransactions();
  const { data: investments = [] } = useInvestments();
  const { data: goals = [] } = useGoals();
  const { data: cashAdjustments = [] } = useCashAdjustments();
  const currency = profile?.currency ?? "INR";
  const fmt = (n: number) => formatMoney(n, currency);

  const stats = useMemo(() => {
    const now = new Date();
    const monthTx = txns.filter((t) => {
      const d = new Date(t.occurred_at);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const income = monthTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expense = monthTx.filter((t) => t.amount < 0).reduce((s, t) => s - t.amount, 0);
    const savings = income - expense;
    const investedValue = investments.reduce((s, i) => s + i.current_value, 0);
    const balance = txns.reduce((s, t) => s + t.amount, 0);
    const cashFromTx = txns
      .filter((t) => t.payment_method === "Cash")
      .reduce((s, t) => s + t.amount, 0);
    const cashFromAdj = cashAdjustments.reduce((s, a) => s + a.amount, 0);
    const cashInHand = cashFromTx + cashFromAdj;
    return { income, expense, savings, investedValue, balance, cashInHand };
  }, [txns, investments, cashAdjustments]);

  const monthly = useMemo(() => {
    const arr: { month: string; income: number; expense: number; savings: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-US", { month: "short" });
      const month = txns.filter((t) => {
        const td = new Date(t.occurred_at);
        return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth();
      });
      const inc = month.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const exp = month.filter((t) => t.amount < 0).reduce((s, t) => s - t.amount, 0);
      arr.push({ month: label, income: inc, expense: exp, savings: inc - exp });
    }
    return arr;
  }, [txns]);

  const byCat = useMemo(() => {
    const o: Record<string, number> = {};
    txns.filter((t) => t.amount < 0).forEach((t) => { o[t.category] = (o[t.category] || 0) + Math.abs(t.amount); });
    return Object.entries(o).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [txns]);

  const savingsPct = stats.income > 0 ? Math.round((stats.savings / stats.income) * 100) : 0;
  const greet = profile?.display_name ? `, ${profile.display_name.split(" ")[0]}` : "";

  if (txns.length === 0) {
    return (
      <div>
        <Topbar title={`Welcome${greet}`} subtitle="Your calm money space is ready." />
        <div className="glass-strong rounded-[2rem] p-10 text-center max-w-xl mx-auto mt-12">
          <div className="text-5xl mb-4">✨</div>
          <h2 className="font-display text-3xl mb-2">Add your first transaction</h2>
          <p className="text-muted-foreground mb-6">Lumen comes alive once you start logging your spending. It only takes a moment.</p>
          <Link to="/transactions" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl gradient-primary text-primary-foreground shadow-[var(--shadow-elegant)]">
            <Plus className="size-4" /> Add transaction
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Topbar title={`Good day${greet}`} subtitle="A calm view of your money today." />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Net Balance" value={stats.balance} delta={undefined} icon={Wallet} currency={currency} />
        <StatCard label="Cash in Hand" value={stats.cashInHand} icon={Banknote} accent="accent" currency={currency} />
        <StatCard label="Income (mo)" value={stats.income} icon={ArrowUpRight} accent="success" currency={currency} />
        <StatCard label="Expense (mo)" value={stats.expense} icon={ArrowDownRight} accent="warning" currency={currency} />
        <StatCard label="Saved (mo)" value={stats.savings} icon={PiggyBank} accent="accent" currency={currency} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-2xl">Income vs Expense</h3>
              <p className="text-xs text-muted-foreground">Last 6 months</p>
            </div>
          </div>
          <IncomeExpenseArea data={monthly} currency={currency} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 flex flex-col">
          <h3 className="font-display text-2xl mb-1">Savings rate</h3>
          <p className="text-xs text-muted-foreground mb-2">this month</p>
          <div className="relative flex-1 flex items-center justify-center min-h-[200px]">
            <SavingsRing percent={Math.max(0, Math.min(100, savingsPct))} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-display text-5xl gradient-text">{savingsPct}%</div>
              <div className="text-xs text-muted-foreground mt-1">{fmt(stats.savings)}</div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <div className="glass rounded-3xl p-6">
          <h3 className="font-display text-2xl mb-4">Where it went</h3>
          {byCat.length ? <CategoryPie data={byCat} currency={currency} /> : <p className="text-sm text-muted-foreground">No expenses yet.</p>}
        </div>
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-2xl">Recent transactions</h3>
            <Link to="/transactions" className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground">View all <ChevronRight className="size-3" /></Link>
          </div>
          <div className="divide-y divide-border/60">
            {txns.slice(0, 6).map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-3">
                <div className="size-10 rounded-2xl grid place-items-center text-lg" style={{ background: categoryMeta[t.category as Category]?.color + "33" }}>
                  {categoryMeta[t.category as Category]?.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{t.merchant}</div>
                  <div className="text-xs text-muted-foreground">{t.category}{t.subcategory ? ` › ${t.subcategory}` : ""}</div>
                </div>
                <div className={`text-sm font-medium tabular-nums ${t.amount > 0 ? "text-[var(--color-success)]" : "text-destructive"}`}>
                  {t.amount > 0 ? "+" : ""}{fmt(t.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <StatCard label="Investments" value={stats.investedValue} icon={TrendingUp} accent="success" currency={currency} />
        <div className="glass rounded-3xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-xl">Active goals</h3>
            <Link to="/goals" className="text-xs text-muted-foreground hover:text-foreground">Manage</Link>
          </div>
          {goals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Create your first savings goal.</p>
          ) : (
            <div className="space-y-3">
              {goals.slice(0, 3).map((g) => {
                const p = Math.round((g.saved / g.target) * 100);
                return (
                  <div key={g.id} className="flex items-center gap-3">
                    <span className="text-xl">{g.emoji}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm"><span>{g.name}</span><span className="text-muted-foreground">{p}%</span></div>
                      <div className="h-1.5 mt-1 bg-background/60 rounded-full overflow-hidden">
                        <div className="h-full gradient-primary" style={{ width: `${Math.min(100, p)}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
