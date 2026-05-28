import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { Blobs } from "@/components/Blobs";
import { useAuth } from "@/components/AuthProvider";
import { useProfile, useUpdateProfile, useSaveBudget, useSaveGoal } from "@/hooks/useFinanceData";
import { CATEGORIES, type Category } from "@/lib/finance";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — Lumen" }] }),
  component: Onboarding,
});

const CURRENCIES = [
  { code: "INR", label: "₹ Indian Rupee" }, { code: "USD", label: "$ US Dollar" },
  { code: "EUR", label: "€ Euro" }, { code: "GBP", label: "£ British Pound" },
  { code: "AED", label: "د.إ UAE Dirham" },
];

const DEFAULT_CATS: Category[] = ["Food", "Groceries", "Transport", "Bills", "Subscriptions", "Shopping"];

function Onboarding() {
  const nav = useNavigate();
  const { session, loading } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const saveBudget = useSaveBudget();
  const saveGoal = useSaveGoal();

  useEffect(() => { if (!loading && !session) nav({ to: "/auth" }); }, [loading, session, nav]);
  useEffect(() => { if (profile?.onboarded) nav({ to: "/dashboard" }); }, [profile, nav]);

  const [step, setStep] = useState(0);
  const [income, setIncome] = useState("");
  const [savingsGoal, setSavingsGoal] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [cats, setCats] = useState<Category[]>(DEFAULT_CATS);
  const [name, setName] = useState(profile?.display_name ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (profile?.display_name) setName(profile.display_name); }, [profile]);

  const finish = async () => {
    setBusy(true);
    try {
      await updateProfile.mutateAsync({
        display_name: name || "Friend",
        currency,
        monthly_income: Number(income) || 0,
        savings_goal: Number(savingsGoal) || 0,
        onboarded: true,
      });
      const inc = Number(income) || 0;
      const perCat = inc > 0 ? Math.round((inc * 0.4) / Math.max(cats.length, 1)) : 0;
      await Promise.all(cats.map((c) => saveBudget.mutateAsync({ category: c, monthly_limit: perCat })));
      if (Number(savingsGoal) > 0) {
        await saveGoal.mutateAsync({
          name: "Savings goal", emoji: "🎯", target: Number(savingsGoal) * 12, saved: 0,
        });
      }
      toast.success("All set. Welcome to Lumen ✨");
      nav({ to: "/dashboard" });
    } catch (e: any) {
      toast.error(e.message);
    } finally { setBusy(false); }
  };

  const steps = [
    {
      title: `Hi${name ? `, ${name.split(" ")[0]}` : ""} 👋`,
      sub: "Let's set up your calm money space. Just 4 quick questions.",
      body: (
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="What should we call you?"
          className="w-full glass rounded-2xl px-5 py-4 text-lg outline-none focus:ring-2 ring-primary bg-transparent" />
      ),
    },
    {
      title: "What's your monthly income?",
      sub: "Approximate is fine. You can change this anytime.",
      body: (
        <div className="flex gap-3">
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}
            className="glass rounded-2xl px-3 py-4 outline-none bg-transparent">
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
          </select>
          <input type="number" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="0"
            className="flex-1 glass rounded-2xl px-5 py-4 text-lg outline-none focus:ring-2 ring-primary bg-transparent" />
        </div>
      ),
    },
    {
      title: "How much would you love to save each month?",
      sub: "A gentle target — we'll celebrate every step.",
      body: (
        <input type="number" value={savingsGoal} onChange={(e) => setSavingsGoal(e.target.value)} placeholder="0"
          className="w-full glass rounded-2xl px-5 py-4 text-lg outline-none focus:ring-2 ring-primary bg-transparent" />
      ),
    },
    {
      title: "Where does your money usually go?",
      sub: "Pick the categories that matter to you. We'll create gentle budgets.",
      body: (
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.filter((c) => c !== "Income").map((c) => {
            const on = cats.includes(c);
            return (
              <button key={c} type="button" onClick={() =>
                setCats(on ? cats.filter((x) => x !== c) : [...cats, c])}
                className={`px-4 py-2 rounded-2xl text-sm border transition ${on ? "gradient-primary text-primary-foreground border-transparent" : "glass border-border"}`}>
                {on && <Check className="size-3 inline mr-1" />} {c}
              </button>
            );
          })}
        </div>
      ),
    },
  ];

  const last = step === steps.length - 1;

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6">
      <Blobs />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-[2rem] p-8 md:p-10 w-full max-w-xl">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="size-4 text-primary" />
          <div className="flex-1 flex gap-1.5">
            {steps.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition ${i <= step ? "gradient-primary" : "bg-muted"}`} />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{step + 1}/{steps.length}</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
            <h1 className="font-display text-3xl md:text-4xl">{steps[step].title}</h1>
            <p className="text-sm text-muted-foreground mt-2 mb-6">{steps[step].sub}</p>
            {steps[step].body}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between items-center mt-8">
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
            className="text-sm text-muted-foreground disabled:opacity-30">Back</button>
          <button
            onClick={() => (last ? finish() : setStep((s) => s + 1))}
            disabled={busy}
            className="px-6 py-3 rounded-2xl gradient-primary text-primary-foreground font-medium inline-flex items-center gap-2 shadow-[var(--shadow-soft)] disabled:opacity-60">
            {last ? (busy ? "Setting up..." : "Enter Lumen") : "Continue"} <ArrowRight className="size-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
