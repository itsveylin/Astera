import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Topbar } from "@/components/Topbar";
import { IncomeExpenseArea, CategoryBars, CategoryPie, GrowthLine, WeeklyBars } from "@/components/charts/Charts";
import { useTransactions, useProfile } from "@/hooks/useFinanceData";
import { formatMoney, PAYMENT_METHODS, paymentMethodMeta, type PaymentMethod } from "@/lib/finance";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Lumen" }] }),
  component: Analytics,
});

function Analytics() {
  const { data: profile } = useProfile();
  const { data: txns = [] } = useTransactions();
  const currency = profile?.currency ?? "INR";

  const monthly = useMemo(() => {
    const arr: { month: string; income: number; expense: number; savings: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-US", { month: "short" });
      const m = txns.filter((t) => {
        const td = new Date(t.occurred_at);
        return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth();
      });
      const inc = m.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const exp = m.filter((t) => t.amount < 0).reduce((s, t) => s - t.amount, 0);
      arr.push({ month: label, income: inc, expense: exp, savings: inc - exp });
    }
    return arr;
  }, [txns]);

  const byCat = useMemo(() => {
    const o: Record<string, number> = {};
    txns.filter((t) => t.amount < 0).forEach((t) => { o[t.category] = (o[t.category] || 0) + Math.abs(t.amount); });
    return Object.entries(o).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [txns]);

  const growth = monthly.map((m) => ({ month: m.month, value: m.savings }));

  const weekly = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const totals = [0, 0, 0, 0, 0, 0, 0];
    const now = Date.now();
    const wk = 7 * 24 * 3600 * 1000;
    txns.forEach((t) => {
      const d = new Date(t.occurred_at);
      if (now - d.getTime() > wk * 4) return;
      if (t.amount >= 0) return;
      const dow = (d.getDay() + 6) % 7;
      totals[dow] += Math.abs(t.amount);
    });
    return days.map((d, i) => ({ day: d, value: Math.round(totals[i] / 4) }));
  }, [txns]);

  const byPayment = useMemo(() => {
    const o: Record<string, number> = {};
    txns.filter((t) => t.amount < 0).forEach((t) => {
      const k = (t.payment_method as PaymentMethod) || "Other";
      o[k] = (o[k] || 0) + Math.abs(t.amount);
    });
    return PAYMENT_METHODS
      .map((m) => ({ name: m, value: o[m] || 0 }))
      .filter((x) => x.value > 0);
  }, [txns]);

  const bySub = useMemo(() => {
    const o: Record<string, number> = {};
    txns.filter((t) => t.amount < 0 && t.subcategory).forEach((t) => {
      const k = `${t.category} › ${t.subcategory}`;
      o[k] = (o[k] || 0) + Math.abs(t.amount);
    });
    return Object.entries(o).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [txns]);


  const totalSaved = monthly.reduce((s, m) => s + m.savings, 0);

  if (txns.length === 0) {
    return (
      <div>
        <Topbar title="Analytics" subtitle="Insights appear as you log transactions." />
        <div className="glass rounded-3xl p-12 text-center text-muted-foreground">No data yet — head to Transactions to add a few.</div>
      </div>
    );
  }

  return (
    <div>
      <Topbar title="Analytics" subtitle="Your money story, calmly told." />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <h3 className="font-display text-2xl mb-1">Income vs Expense</h3>
          <p className="text-xs text-muted-foreground mb-4">Total saved {formatMoney(totalSaved, currency)}</p>
          <IncomeExpenseArea data={monthly} currency={currency} />
        </div>
        <div className="glass rounded-3xl p-6">
          <h3 className="font-display text-2xl mb-4">Category mix</h3>
          {byCat.length ? <CategoryPie data={byCat} currency={currency} /> : <p className="text-sm text-muted-foreground">No expenses.</p>}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <div className="glass rounded-3xl p-6">
          <h3 className="font-display text-2xl mb-4">Savings growth</h3>
          <GrowthLine data={growth} currency={currency} />
        </div>
        <div className="glass rounded-3xl p-6">
          <h3 className="font-display text-2xl mb-4">Weekly rhythm</h3>
          <p className="text-xs text-muted-foreground -mt-2 mb-3">Average expense by weekday (last 4 weeks)</p>
          <WeeklyBars data={weekly} currency={currency} />
        </div>
      </div>

      <div className="glass rounded-3xl p-6 mt-4">
        <h3 className="font-display text-2xl mb-4">Top categories</h3>
        <CategoryBars data={byCat.slice(0, 6)} currency={currency} />
      </div>

      {bySub.length > 0 && (
        <div className="glass rounded-3xl p-6 mt-4">
          <h3 className="font-display text-2xl mb-1">Subcategory breakdown</h3>
          <p className="text-xs text-muted-foreground mb-4">Where your money actually goes — down to the subcategory.</p>
          <CategoryBars data={bySub.slice(0, 10)} currency={currency} />
        </div>
      )}


      <div className="glass rounded-3xl p-6 mt-4">
        <h3 className="font-display text-2xl mb-1">Spending by payment method</h3>
        <p className="text-xs text-muted-foreground mb-4">How your money leaves — cash, UPI, card, bank transfer, other.</p>
        {byPayment.length === 0 ? (
          <p className="text-sm text-muted-foreground">No spending logged yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <CategoryBars data={byPayment} currency={currency} />
            <div className="space-y-2">
              {byPayment.map((p) => {
                const total = byPayment.reduce((s, x) => s + x.value, 0) || 1;
                const pct = Math.round((p.value / total) * 100);
                const meta = paymentMethodMeta[p.name as PaymentMethod];
                return (
                  <div key={p.name} className="flex items-center gap-3">
                    <div className="size-9 rounded-2xl grid place-items-center text-base shrink-0"
                      style={{ background: (meta?.color ?? "oklch(0.7 0.05 280)") + "33" }}>
                      {meta?.icon ?? "•"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm">
                        <span>{p.name}</span>
                        <span className="text-muted-foreground tabular-nums">{formatMoney(p.value, currency)} · {pct}%</span>
                      </div>
                      <div className="h-1.5 mt-1 bg-background/60 rounded-full overflow-hidden">
                        <div className="h-full" style={{ width: `${pct}%`, background: meta?.color ?? "oklch(0.7 0.1 280)" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
