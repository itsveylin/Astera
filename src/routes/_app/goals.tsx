import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus, Sparkles } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { goals, formatINR } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/goals")({
  head: () => ({ meta: [{ title: "Savings Goals — Lumen" }] }),
  component: Goals,
});

function Goals() {
  return (
    <div>
      <Topbar title="Savings Goals" subtitle="Watch your jars fill up. Celebrate every milestone." />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((g, i) => {
          const p = Math.round((g.saved / g.target) * 100);
          return (
            <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="glass rounded-3xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="text-4xl">{g.emoji}</div>
                <div className="text-xs text-muted-foreground">by {new Date(g.deadline).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</div>
              </div>
              <div className="font-display text-2xl mt-3">{g.name}</div>
              <div className="text-xs text-muted-foreground">{formatINR(g.saved)} of {formatINR(g.target)}</div>

              {/* Jar */}
              <div className="mt-4 relative h-40 rounded-2xl border border-border/70 bg-background/40 overflow-hidden">
                <motion.div initial={{ height: 0 }} animate={{ height: `${p}%` }} transition={{ duration: 1.2, ease: "easeOut" }}
                  className="absolute bottom-0 inset-x-0 gradient-primary opacity-80">
                  <div className="absolute -top-2 inset-x-0 h-4 bg-background/30 blur-sm" />
                </motion.div>
                <div className="absolute inset-0 flex items-center justify-center font-display text-4xl text-foreground/90 mix-blend-difference">
                  {p}%
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="size-3 text-primary" /> Save {formatINR(Math.round((g.target - g.saved) / 6))} / mo to hit it on time
              </div>
            </motion.div>
          );
        })}
        <button className="glass rounded-3xl p-6 border-dashed min-h-[280px] flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
          <Plus className="size-6" /> Create new goal
        </button>
      </div>
    </div>
  );
}
