import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/Topbar";
import { CategoryPie, GrowthLine } from "@/components/charts/Charts";
import { investments, monthlySpend, formatINR } from "@/lib/mock-data";
import { TrendingUp, TrendingDown } from "lucide-react";

export const Route = createFileRoute("/_app/investments")({
  head: () => ({ meta: [{ title: "Investments — Lumen" }] }),
  component: Investments,
});

function Investments() {
  const invested = investments.reduce((s, i) => s + i.invested, 0);
  const current = investments.reduce((s, i) => s + i.current, 0);
  const gain = current - invested;
  const gainPct = ((gain / invested) * 100).toFixed(2);

  const pieData = investments.map((i) => ({ name: i.type, value: i.current }));
  const growth = monthlySpend.map((m, i) => ({ month: m.month, value: 800000 + i * 28000 + (i % 3) * 12000 }));

  return (
    <div>
      <Topbar title="Investments" subtitle="Your wealth, growing quietly in the background." />

      <div className="grid lg:grid-cols-4 gap-4 mb-4">
        <div className="glass rounded-3xl p-5 lg:col-span-2">
          <div className="text-xs text-muted-foreground">Portfolio value</div>
          <div className="font-display text-4xl mt-1">{formatINR(current)}</div>
          <div className="mt-2 text-sm flex items-center gap-2 text-[var(--color-success)]">
            <TrendingUp className="size-4" /> +{formatINR(gain)} ({gainPct}%)
          </div>
        </div>
        <div className="glass rounded-3xl p-5">
          <div className="text-xs text-muted-foreground">Invested</div>
          <div className="font-display text-2xl mt-1">{formatINR(invested)}</div>
        </div>
        <div className="glass rounded-3xl p-5">
          <div className="text-xs text-muted-foreground">CAGR (est.)</div>
          <div className="font-display text-2xl mt-1 gradient-text">14.2%</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <h3 className="font-display text-2xl mb-4">Portfolio growth</h3>
          <GrowthLine data={growth} />
        </div>
        <div className="glass rounded-3xl p-6">
          <h3 className="font-display text-2xl mb-4">Allocation</h3>
          <CategoryPie data={pieData} />
        </div>
      </div>

      <div className="glass rounded-3xl p-6 mt-4">
        <h3 className="font-display text-2xl mb-4">Holdings</h3>
        <div className="divide-y divide-border/60">
          {investments.map((h, i) => {
            const pl = h.current - h.invested;
            const plp = ((pl / h.invested) * 100).toFixed(1);
            const up = pl >= 0;
            return (
              <div key={i} className="grid grid-cols-12 items-center gap-2 py-3 text-sm">
                <div className="col-span-5 sm:col-span-4">
                  <div className="font-medium">{h.name}</div>
                  <div className="text-xs text-muted-foreground">{h.type}</div>
                </div>
                <div className="col-span-3 hidden sm:block text-muted-foreground">{formatINR(h.invested)}</div>
                <div className="col-span-3 tabular-nums">{formatINR(h.current)}</div>
                <div className={`col-span-4 sm:col-span-2 text-right tabular-nums flex items-center justify-end gap-1 ${up ? "text-[var(--color-success)]" : "text-destructive"}`}>
                  {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}{plp}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
