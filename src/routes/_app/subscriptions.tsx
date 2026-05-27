import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/Topbar";
import { subscriptions, formatINR } from "@/lib/mock-data";
import { AlertTriangle, Calendar, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_app/subscriptions")({
  head: () => ({ meta: [{ title: "Subscriptions — Lumen" }] }),
  component: Subs,
});

function Subs() {
  const monthly = subscriptions.reduce((s, x) => s + (x.cycle === "Monthly" ? x.amount : x.amount / 12), 0);
  const unused = subscriptions.filter((s) => !s.used);
  const unusedTotal = unused.reduce((s, x) => s + (x.cycle === "Monthly" ? x.amount : x.amount / 12), 0);

  return (
    <div>
      <Topbar title="Subscriptions" subtitle="Catch silent leaks before they drain you." />

      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        <div className="glass rounded-3xl p-5">
          <div className="text-xs text-muted-foreground">Monthly burden</div>
          <div className="font-display text-3xl mt-1">{formatINR(Math.round(monthly))}</div>
        </div>
        <div className="glass rounded-3xl p-5">
          <div className="text-xs text-muted-foreground">Active subs</div>
          <div className="font-display text-3xl mt-1">{subscriptions.length}</div>
        </div>
        <div className="glass rounded-3xl p-5 border border-[var(--color-warning)]/40">
          <div className="text-xs text-[var(--color-warning)] flex items-center gap-1"><AlertTriangle className="size-3"/>Unused</div>
          <div className="font-display text-3xl mt-1">{formatINR(Math.round(unusedTotal))}/mo</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subscriptions.map((s, i) => (
          <div key={i} className="glass rounded-3xl p-5 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl grid place-items-center text-lg text-white font-bold" style={{ background: s.color }}>
                {s.name[0]}
              </div>
              <div className="flex-1">
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.category} · {s.cycle}</div>
              </div>
              <div className="text-right">
                <div className="font-display text-xl">{formatINR(s.amount)}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1"><Calendar className="size-3" /> Next {new Date(s.next).toLocaleDateString("en-IN",{month:"short",day:"numeric"})}</span>
              {!s.used ? (
                <span className="text-[var(--color-warning)] flex items-center gap-1"><Sparkles className="size-3"/>Cancel?</span>
              ) : (
                <span className="text-[var(--color-success)]">Active</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
