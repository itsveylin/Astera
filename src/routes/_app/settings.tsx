import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/Topbar";
import { useTransactions, useProfile, useUpdateProfile } from "@/hooks/useFinanceData";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import { Moon, Sun, Download, User, Globe, Shield, LogOut, Bell } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Lumen" }] }),
  component: SettingsPage,
});

const CURRENCIES = [
  { code: "INR", label: "₹ Indian Rupee" }, { code: "USD", label: "$ US Dollar" },
  { code: "EUR", label: "€ Euro" }, { code: "GBP", label: "£ British Pound" },
  { code: "AED", label: "د.إ UAE Dirham" },
];

function SettingsPage() {
  const { data: profile } = useProfile();
  const { data: txns = [] } = useTransactions();
  const updateProfile = useUpdateProfile();
  const { signOut, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(profile?.display_name ?? "");
  const [income, setIncome] = useState(String(profile?.monthly_income ?? 0));
  const [goal, setGoal] = useState(String(profile?.savings_goal ?? 0));

  const saveProfile = async () => {
    try {
      await updateProfile.mutateAsync({
        display_name: name,
        monthly_income: Number(income) || 0,
        savings_goal: Number(goal) || 0,
      });
      toast.success("Saved");
    } catch (e: any) { toast.error(e.message); }
  };

  const exportCsv = () => {
    const rows = [["date", "merchant", "category", "amount", "payment_method", "notes"]];
    txns.forEach((t) => rows.push([t.occurred_at, t.merchant, t.category, String(t.amount), t.payment_method ?? "", t.notes ?? ""]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "lumen-transactions.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Topbar title="Settings" subtitle="Make Lumen feel like yours." />

      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4"><User className="size-4" /><h3 className="font-display text-xl">Profile</h3></div>
          <div className="space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
            <div className="text-xs text-muted-foreground">Signed in as {user?.email}</div>
            <input type="number" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="Monthly income" className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
            <input type="number" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Monthly savings goal" className="w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm" />
            <button onClick={saveProfile} disabled={updateProfile.isPending} className="w-full py-2.5 rounded-2xl gradient-primary text-primary-foreground text-sm disabled:opacity-60">Save</button>
          </div>
        </div>

        <div className="glass rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">{theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}<h3 className="font-display text-xl">Theme</h3></div>
          <div className="flex gap-2">
            <button onClick={() => setTheme("light")} className={`flex-1 p-4 rounded-2xl glass text-left ${theme === "light" ? "ring-2 ring-primary" : ""}`}>
              <Sun className="size-4 mb-2" /><div className="text-sm">Light pastel</div>
            </button>
            <button onClick={() => setTheme("dark")} className={`flex-1 p-4 rounded-2xl glass text-left ${theme === "dark" ? "ring-2 ring-primary" : ""}`}>
              <Moon className="size-4 mb-2" /><div className="text-sm">Dark aesthetic</div>
            </button>
          </div>
        </div>

        <div className="glass rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4"><Globe className="size-4" /><h3 className="font-display text-xl">Currency</h3></div>
          <select
            value={profile?.currency ?? "INR"}
            onChange={(e) => updateProfile.mutate({ currency: e.target.value })}
            className="w-full glass rounded-2xl px-3 py-2.5 text-sm bg-transparent outline-none">
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </div>

        <div className="glass rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4"><Download className="size-4" /><h3 className="font-display text-xl">Data</h3></div>
          <button onClick={exportCsv} className="w-full py-2.5 rounded-2xl glass text-sm flex items-center justify-center gap-2"><Download className="size-4" /> Export transactions (.csv)</button>
        </div>

        <div className="glass rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4"><Shield className="size-4" /><h3 className="font-display text-xl">Privacy</h3></div>
          <p className="text-sm text-muted-foreground">Your data lives in your private vault. Only you can read or change it.</p>
        </div>

        <div className="glass rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4"><Bell className="size-4" /><h3 className="font-display text-xl">Account</h3></div>
          <button onClick={() => signOut()} className="w-full py-2.5 rounded-2xl glass text-sm flex items-center justify-center gap-2 text-destructive"><LogOut className="size-4" /> Sign out</button>
        </div>
      </div>
    </div>
  );
}
