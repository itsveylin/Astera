import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Topbar } from "@/components/Topbar";
import { IncomeExpenseArea, CategoryBars, CategoryPie, GrowthLine, Heatmap } from "@/components/charts/Charts";
import { monthlySpend, transactions, heatmapData, formatINR } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Lumen" }] }),
  component: Analytics,
});

function Analytics() {
  const [range, setRange] = useState<"W" | "M" | "Q" | "H" | "Y">("M");
  const byCat = transactions.filter(t => t.amount < 0).reduce<Record<string, number>>((a, t) => {
    a[t.category] = (a[t.category] || 0) + Math.abs(t.amount); return a;
  }, {});
  const pieData = Object.entries(byCat).map(([name, value]) => ({ name, value }));
  const growth = monthlySpend.map((m) => ({ month: m.month, value: m.savings }));

  return (
    <div>
      <Topbar title="Analytics" subtitle="Your spending, in cinematic detail." />
      <div className="flex flex-wrap items-center gap-2 glass rounded-2xl p-1.5 w-fit mb-4">
        {([["W","Weekly"],["M","Monthly"],["Q","Quarterly"],["H","Half-year"],["Y","Yearly"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setRange(k)}
            className={`px-4 py-1.5 rounded-xl text-xs ${range === k ? "gradient-primary text-primary-foreground" : "text-muted-foreground"}`}>{l}</button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <h3 className="font-display text-2xl mb-1">Income vs Expense trend</h3>
          <p className="text-xs text-muted-foreground mb-4">Total saved {formatINR(monthlySpend.reduce((s, m) => s + m.savings, 0))}</p>
          <IncomeExpenseArea data={monthlySpend} />
        </div>
        <div className="glass rounded-3xl p-6">
          <h3 className="font-display text-2xl mb-4">Category mix</h3>
          <CategoryPie data={pieData} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <div className="glass rounded-3xl p-6">
          <h3 className="font-display text-2xl mb-4">Savings growth</h3>
          <GrowthLine data={growth} />
        </div>
        <div className="glass rounded-3xl p-6">
          <h3 className="font-display text-2xl mb-4">Category comparison</h3>
          <CategoryBars data={pieData.slice(0, 6)} />
        </div>
      </div>

      <div className="glass rounded-3xl p-6 mt-4">
        <h3 className="font-display text-2xl mb-4">12-week spending heatmap</h3>
        <Heatmap data={heatmapData} />
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-4">
        {[
          { t: "Highest day", v: "Sat ₹6,240" },
          { t: "Lowest day", v: "Tue ₹240" },
          { t: "Avg / day", v: formatINR(124000 / 30) },
        ].map((s, i) => (
          <div key={i} className="glass rounded-3xl p-6">
            <div className="text-xs text-muted-foreground">{s.t}</div>
            <div className="font-display text-3xl mt-2">{s.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
