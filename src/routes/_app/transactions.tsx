import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, X } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { transactions, categoryMeta, formatINR, type Transaction } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/transactions")({
  head: () => ({ meta: [{ title: "Transactions — Lumen" }] }),
  component: Transactions,
});

const allCats = Array.from(new Set(transactions.map((t) => t.category)));

function Transactions() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [open, setOpen] = useState<Transaction | null>(null);

  const filtered = transactions.filter((t) =>
    (!q || t.merchant.toLowerCase().includes(q.toLowerCase())) &&
    (!cat || t.category === cat)
  );

  return (
    <div>
      <Topbar title="Transactions" subtitle={`${filtered.length} entries across all your accounts`} />

      <div className="glass rounded-3xl p-4 flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-background/40 rounded-2xl px-3 py-2">
          <Search className="size-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search merchant..." className="bg-transparent outline-none text-sm flex-1" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="size-4 text-muted-foreground" />
          <button onClick={() => setCat(null)} className={`px-3 py-1.5 rounded-full text-xs ${!cat ? "gradient-primary text-primary-foreground" : "bg-background/40"}`}>All</button>
          {allCats.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1 ${cat === c ? "gradient-primary text-primary-foreground" : "bg-background/40"}`}>
              {categoryMeta[c].icon} {c}
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-3xl divide-y divide-border/60">
        {filtered.map((t) => (
          <motion.button key={t.id} onClick={() => setOpen(t)}
            whileHover={{ x: 4 }} className="w-full text-left flex items-center gap-3 p-4">
            <div className="size-11 rounded-2xl grid place-items-center text-lg shrink-0" style={{ background: categoryMeta[t.category].color + "33" }}>
              {categoryMeta[t.category].icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{t.merchant}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {t.category} · {t.app}
              </div>
            </div>
            <div className={`text-sm font-medium tabular-nums ${t.amount > 0 ? "text-[var(--color-success)]" : ""}`}>
              {t.amount > 0 ? "+" : ""}{formatINR(t.amount)}
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(null)} className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm grid place-items-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-[2rem] p-8 w-full max-w-md">
              <button onClick={() => setOpen(null)} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-accent/40"><X className="size-4" /></button>
              <div className="size-16 rounded-3xl grid place-items-center text-3xl mx-auto mb-4" style={{ background: categoryMeta[open.category].color + "33" }}>
                {categoryMeta[open.category].icon}
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">{open.merchant}</div>
                <div className={`font-display text-4xl mt-1 ${open.amount > 0 ? "text-[var(--color-success)]" : ""}`}>
                  {open.amount > 0 ? "+" : ""}{formatINR(open.amount)}
                </div>
              </div>
              <div className="mt-6 space-y-3 text-sm">
                <Row k="Category" v={`${categoryMeta[open.category].icon} ${open.category}`} />
                <Row k="Payment" v={`${open.paymentMethod} · ${open.app}`} />
                <Row k="Date" v={new Date(open.date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} />
                <Row k="Transaction ID" v={open.id} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between glass rounded-2xl px-4 py-2.5"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>;
}
