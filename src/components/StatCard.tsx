import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/finance";
import type { LucideIcon } from "lucide-react";

function useCounter(target: number, duration = 1000) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

export function StatCard({
  label, value, delta, icon: Icon, accent = "primary", currency = "INR",
}: {
  label: string; value: number; delta?: number; icon: LucideIcon;
  accent?: "primary" | "accent" | "success" | "warning"; currency?: string;
}) {
  const v = useCounter(value);
  const display = formatMoney(Math.round(v), currency);
  const accentBg =
    accent === "success" ? "bg-[var(--color-success)]/15 text-[var(--color-success)]" :
    accent === "warning" ? "bg-[var(--color-warning)]/15 text-[var(--color-warning)]" :
    accent === "accent" ? "gradient-accent text-primary-foreground" :
    "gradient-primary text-primary-foreground";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
      className="glass rounded-3xl p-5 relative overflow-hidden"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="font-display text-3xl mt-2 break-words">{display}</div>
        </div>
        <div className={`size-10 shrink-0 rounded-2xl grid place-items-center ${accentBg}`}>
          <Icon className="size-5" />
        </div>
      </div>
      {delta !== undefined && (
        <div className={`mt-3 text-xs ${delta >= 0 ? "text-[var(--color-success)]" : "text-destructive"}`}>
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}% vs last month
        </div>
      )}
    </motion.div>
  );
}
