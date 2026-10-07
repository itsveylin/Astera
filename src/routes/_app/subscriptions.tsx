import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/Topbar";
import { useTransactions, useProfile } from "@/hooks/useFinanceData";
import { formatMoney } from "@/lib/finance";
import { useMemo } from "react";
import { AlertTriangle, Calendar, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_app/subscriptions")({
  head: () => ({ meta: [
    { title: "Subscriptions — Astera" },
    { name: "description", content: "Review subscription costs and recurring charges in Astera." },
    { property: "og:title", content: "Subscriptions — Astera" },
    { property: "og:description", content: "Review subscription costs and recurring charges in Astera." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Subs,
});

function Subs() {
  const { data: profile } = useProfile();
  const { data: txns = [] } = useTransactions();
  const currency = profile?.currency ?? "INR";

  const subs = useMemo(() => {
    const recurring = txns.filter((t) => t.category === "Subscriptions" && t.amount < 0);
    const map: Record<string, { name: string; amount: number; count: number; last: string }> = {};
    recurring.forEach((t) => {
      const key = t.merchant.toLowerCase();
      const e = map[key] ?? { name: t.merchant, amount: 0, count: 0, last: t.occurred_at };
      e.amount += Math.abs(t.amount);
      e.count += 1;
      if (new Date(t.occurred_at) > new Date(e.last)) e.last = t.occurred_at;
      map[key] = e;
    });
    return Object.values(map).map((s) => ({ ...s, avg: s.amount / s.count }));
  }, [txns]);

  const monthly = subs.reduce((s, x) => s + x.avg, 0);

  return (
    <div>
      <Topbar title="Subscriptions" subtitle="Tag recurring payments with the 'Subscriptions' category to track them here." />

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div className="glass rounded-3xl p-5">
          <div className="text-xs text-muted-foreground">Monthly burden (est.)</div>
          <div className="font-display text-3xl mt-1">{formatMoney(Math.round(monthly), currency)}</div>
        </div>
        <div className="glass rounded-3xl p-5">
          <div className="text-xs text-muted-foreground">Active subscriptions</div>
          <div className="font-display text-3xl mt-1">{subs.length}</div>
        </div>
      </div>

      {subs.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center text-muted-foreground">
          <RefreshCw className="size-6 mx-auto mb-3 opacity-50" />
          Add a transaction with the <strong>Subscriptions</strong> category to start tracking recurring charges.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subs.map((s, i) => (
            <div key={i} className="glass rounded-3xl p-5">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl grid place-items-center text-lg font-bold gradient-primary text-primary-foreground">{s.name[0]}</div>
                <div className="flex-1">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.count} payments tracked</div>
                </div>
                <div className="font-display text-xl">{formatMoney(Math.round(s.avg), currency)}</div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="size-3" /> Last on {new Date(s.last).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </div>
              {s.count >= 3 && s.avg > 500 && (
                <div className="mt-2 text-xs text-[var(--color-warning)] flex items-center gap-1"><AlertTriangle className="size-3" /> Review if still using</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
