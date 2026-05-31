import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck, LineChart, Wallet, Brain, Star } from "lucide-react";
import { Blobs } from "@/components/Blobs";
import { IncomeExpenseArea, CategoryPie } from "@/components/charts/Charts";
import { formatMoney } from "@/lib/finance";

const monthlySpend = [
  { month: "Jul", income: 95000, expense: 62000 },
  { month: "Aug", income: 98000, expense: 58000 },
  { month: "Sep", income: 102000, expense: 65000 },
  { month: "Oct", income: 99000, expense: 60000 },
  { month: "Nov", income: 105000, expense: 63000 },
  { month: "Dec", income: 110000, expense: 59000 },
];
const formatINR = (n: number) => formatCurrency(n, "INR");

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumen — Your money deserves clarity, not chaos." },
      { name: "description", content: "Lumen is an AI-powered personal finance studio. Calm dashboards, smart insights, and effortless control of your money." },
      { property: "og:title", content: "Lumen — Personal finance, beautifully clear." },
      { property: "og:description", content: "AI-powered finance studio. Track, budget, invest, save — without the anxiety." },
    ],
  }),
  component: Landing,
});

const pieData = [
  { name: "Food", value: 5840 }, { name: "Shopping", value: 11200 },
  { name: "Bills", value: 6300 }, { name: "Transport", value: 4280 },
  { name: "Entertainment", value: 1240 }, { name: "Subscriptions", value: 1547 },
];

function Landing() {
  return (
    <div className="relative min-h-screen">
      <Blobs />
      {/* Nav */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/40 border-b border-border/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-8 rounded-xl gradient-primary grid place-items-center">
              <Sparkles className="size-4 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl">Lumen</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#insights" className="hover:text-foreground transition">AI Insights</a>
            <a href="#testimonials" className="hover:text-foreground transition">Loved by</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="text-sm px-4 py-2 rounded-2xl hover:bg-accent/40 transition">Sign in</Link>
            <Link to="/dashboard" className="text-sm px-4 py-2 rounded-2xl gradient-primary text-primary-foreground shadow-[var(--shadow-soft)]">
              Open app
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 text-xs mb-6">
              <Sparkles className="size-3.5" /> Powered by ambient AI
            </div>
            <h1 className="font-display text-5xl md:text-7xl leading-[1.05]">
              Your money deserves <span className="gradient-text">clarity</span>, not chaos.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              Lumen turns scattered spending into calm, beautiful insight. Budgets that breathe.
              Goals that feel reachable. An AI that quietly helps you save.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/dashboard" className="group px-6 py-3 rounded-2xl gradient-primary text-primary-foreground font-medium shadow-[var(--shadow-elegant)] flex items-center gap-2">
                Open the app <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </Link>
              <Link to="/auth" className="px-6 py-3 rounded-2xl glass">Create account</Link>
            </div>
            <div className="mt-10 flex items-center gap-6 text-xs text-muted-foreground">
              <div className="flex -space-x-2">
                {["A","R","K","S"].map((c,i) => (
                  <div key={i} className="size-7 rounded-full grid place-items-center text-[10px] text-primary-foreground gradient-primary border-2 border-background">{c}</div>
                ))}
              </div>
              Loved by 12,000+ thoughtful spenders
            </div>
          </motion.div>

          {/* Floating dashboard mock */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative">
            <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="glass-strong rounded-[2rem] p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs text-muted-foreground">Net worth</div>
                  <div className="font-display text-3xl">{formatINR(1633220)}</div>
                </div>
                <div className="text-xs text-[var(--color-success)]">▲ 8.4% this month</div>
              </div>
              <IncomeExpenseArea data={monthlySpend.slice(-6)} />
            </motion.div>
            <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-8 -left-6 glass-strong rounded-3xl p-4 w-56 hidden md:block">
              <div className="text-xs text-muted-foreground mb-1">Top categories</div>
              <CategoryPie data={pieData.slice(0,4)} />
            </motion.div>
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -top-4 -right-2 glass-strong rounded-2xl p-4 hidden md:block">
              <div className="flex items-center gap-2 text-xs">
                <div className="size-8 rounded-xl gradient-accent grid place-items-center"><Brain className="size-4 text-primary-foreground" /></div>
                <div>
                  <div className="font-medium">AI Insight</div>
                  <div className="text-muted-foreground">Save ₹4,200/mo by cutting 2 subs</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Built for calm</div>
          <h2 className="font-display text-4xl md:text-5xl">Everything your money needs, none of the noise.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: LineChart, title: "Beautiful analytics", body: "Animated graphs that turn numbers into stories you actually want to read." },
            { icon: Brain, title: "Ambient AI", body: "Quiet, helpful insights surfaced exactly when you need them — never spammy." },
            { icon: Wallet, title: "Budgets that breathe", body: "Soft caps, gentle warnings, smart suggestions. Money management that feels kind." },
            { icon: ShieldCheck, title: "Private by default", body: "Your data stays yours. Bank-grade encryption with zero ad targeting." },
            { icon: Sparkles, title: "Goal vaults", body: "Watch your savings fill up beautiful jars. Celebrate every milestone." },
            { icon: Star, title: "Year in money", body: "An end-of-year recap so beautiful, you'll actually want to share it." },
          ].map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="glass rounded-3xl p-6 hover:-translate-y-1 transition">
              <div className="size-11 rounded-2xl gradient-primary grid place-items-center mb-4">
                <f.icon className="size-5 text-primary-foreground" />
              </div>
              <div className="font-display text-xl mb-1">{f.title}</div>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Insights preview */}
      <section id="insights" className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Quietly intelligent</div>
            <h2 className="font-display text-4xl md:text-5xl">An AI that whispers, never shouts.</h2>
            <p className="mt-4 text-muted-foreground max-w-lg">
              Lumen notices the small things — the subscription you forgot, the spending creep on weekends,
              the day you finally hit your savings streak. Then it tells you, kindly.
            </p>
            <div className="mt-6 space-y-3">
              {[
                "You spent 18% more on food this week — try cooking Wednesdays in.",
                "Your transport spending is trending down. Nice rhythm.",
                "Cancelling Adobe + Notion AI could save you ₹4,200/month.",
              ].map((t, i) => (
                <div key={i} className="glass rounded-2xl p-4 text-sm flex gap-3">
                  <Sparkles className="size-4 text-primary shrink-0 mt-0.5" /> {t}
                </div>
              ))}
            </div>
          </div>
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity }}
            className="glass-strong rounded-[2rem] p-6">
            <div className="text-xs text-muted-foreground mb-2">This month</div>
            <CategoryPie data={pieData} />
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="font-display text-4xl md:text-5xl text-center mb-12">Loved by thoughtful spenders.</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { n: "Aanya R.", r: "Designer", q: "First finance app that doesn't make me anxious. The pastel graphs are addictive." },
            { n: "Kabir S.", r: "Founder", q: "Lumen's AI caught two recurring charges I'd forgotten about. Paid for itself in a week." },
            { n: "Mira T.", r: "Doctor", q: "The year-end report made me cry, in a good way. I finally understand my money." },
          ].map((t, i) => (
            <div key={i} className="glass rounded-3xl p-6">
              <div className="flex gap-0.5 mb-3">{Array.from({length:5}).map((_,k)=>(<Star key={k} className="size-3.5 fill-[var(--color-warning)] text-[var(--color-warning)]" />))}</div>
              <p className="text-sm">"{t.q}"</p>
              <div className="mt-4 text-xs text-muted-foreground">{t.n} · {t.r}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="glass-strong rounded-[2.5rem] p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 gradient-primary opacity-10" />
          <h2 className="font-display text-4xl md:text-6xl relative">Start the calmest money habit of your life.</h2>
          <p className="mt-4 text-muted-foreground relative">Free forever for personal use. Three minutes to set up.</p>
          <Link to="/dashboard" className="mt-8 inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl gradient-primary text-primary-foreground font-medium shadow-[var(--shadow-elegant)] relative">
            Open Lumen <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-6 py-12 text-sm text-muted-foreground flex flex-wrap items-center justify-between gap-4 border-t border-border/50">
        <div className="flex items-center gap-2"><Sparkles className="size-4" /> Lumen © 2026</div>
        <div className="flex gap-5"><a>Privacy</a><a>Terms</a><a>Press</a><a>Careers</a></div>
      </footer>
    </div>
  );
}
