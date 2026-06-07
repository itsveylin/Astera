import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  User, Globe, Shield, LogOut, Bell, Moon, Sun, Download, Camera, Mail,
  Wallet, Target, TrendingUp, Receipt, CalendarDays, KeyRound, AlertTriangle,
  Trash2, FileJson, FileSpreadsheet, CheckCircle2, Database, Sparkles,
} from "lucide-react";
import { Topbar } from "@/components/Topbar";
import {
  useTransactions, useProfile, useUpdateProfile,
  useBudgets, useGoals, useInvestments,
} from "@/hooks/useFinanceData";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/integrations/supabase/client";
import { wipeFinancialData, deleteAccount } from "@/lib/account.functions";
import { formatMoney } from "@/lib/finance";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Astera" }] }),
  component: SettingsPage,
});

const CURRENCIES = [
  { code: "INR", label: "₹ Indian Rupee" },
  { code: "USD", label: "$ US Dollar" },
  { code: "EUR", label: "€ Euro" },
  { code: "GBP", label: "£ British Pound" },
  { code: "AED", label: "د.إ UAE Dirham" },
];

function Section({
  icon: Icon, title, description, children, tone = "default",
}: {
  icon: any; title: string; description?: string; children: React.ReactNode;
  tone?: "default" | "danger";
}) {
  const ring = tone === "danger" ? "ring-1 ring-destructive/30" : "";
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 24 }}
      className={`glass rounded-3xl p-6 md:p-7 ${ring}`}
    >
      <header className="flex items-start gap-3 mb-5">
        <div className={`size-10 rounded-2xl grid place-items-center shrink-0 ${
          tone === "danger" ? "bg-destructive/15 text-destructive" : "gradient-primary text-primary-foreground"
        }`}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-2xl leading-tight">{title}</h2>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </header>
      {children}
    </motion.section>
  );
}

function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-foreground/80 mb-1.5">{label}</div>
      {children}
      {hint && <div className="text-[11px] text-muted-foreground mt-1.5">{hint}</div>}
    </label>
  );
}

const inputCls =
  "w-full glass rounded-2xl px-4 py-2.5 bg-transparent outline-none text-sm focus:ring-2 focus:ring-primary/40 transition";

function MiniStat({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className="font-display text-2xl mt-1.5">{value}</div>
    </div>
  );
}

function Modal({
  open, onClose, children,
}: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 grid place-items-center p-4 backdrop-blur-sm bg-foreground/20"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong rounded-3xl p-6 w-full max-w-md"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SettingsPage() {
  const { data: profile } = useProfile();
  const { data: txns = [] } = useTransactions();
  const { data: budgets = [] } = useBudgets();
  const { data: goals = [] } = useGoals();
  const { data: investments = [] } = useInvestments();
  const updateProfile = useUpdateProfile();
  const { signOut, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const wipeFn = useServerFn(wipeFinancialData);
  const deleteFn = useServerFn(deleteAccount);

  // Profile form
  const [name, setName] = useState("");
  const [income, setIncome] = useState("0");
  const [goal, setGoal] = useState("0");
  const [currency, setCurrency] = useState("INR");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile) return;
    setName(profile.display_name ?? "");
    setIncome(String(profile.monthly_income ?? 0));
    setGoal(String(profile.savings_goal ?? 0));
    setCurrency(profile.currency ?? "INR");
  }, [profile]);

  useEffect(() => {
    setAvatarUrl((user?.user_metadata as any)?.avatar_url ?? "");
  }, [user]);

  // Password
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);

  // Danger zone state
  const [wipeStep, setWipeStep] = useState<0 | 1 | 2>(0);
  const [delStep, setDelStep] = useState<0 | 1 | 2>(0);
  const [wipeConfirm, setWipeConfirm] = useState("");
  const [delConfirm, setDelConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const provider = user?.app_metadata?.provider ?? "email";
  const isGoogle = provider === "google";
  const createdAt = user?.created_at ? new Date(user.created_at) : null;
  const lastSignIn = user?.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
  const accountAgeDays = createdAt ? Math.max(1, Math.floor((Date.now() - +createdAt) / 86400000)) : 0;
  const initial = (name || user?.email || "L")[0].toUpperCase();

  const saveProfile = async () => {
    const inc = Number(income);
    const sav = Number(goal);
    if (!name.trim()) return toast.error("Display name is required");
    if (Number.isNaN(inc) || inc < 0) return toast.error("Income must be a positive number");
    if (Number.isNaN(sav) || sav < 0) return toast.error("Savings goal must be a positive number");
    try {
      await updateProfile.mutateAsync({
        display_name: name.trim(),
        monthly_income: inc,
        savings_goal: sav,
        currency,
      });
      toast.success("Profile saved");
    } catch (e: any) { toast.error(e.message); }
  };

  const onPickPhoto = () => fileRef.current?.click();
  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("Please choose an image");
    if (f.size > 512 * 1024) return toast.error("Image must be under 512 KB");
    const reader = new FileReader();
    reader.onload = async () => {
      const url = String(reader.result);
      const { error } = await supabase.auth.updateUser({ data: { avatar_url: url } });
      if (error) toast.error(error.message);
      else { setAvatarUrl(url); toast.success("Profile photo updated"); }
    };
    reader.readAsDataURL(f);
  };

  const changePassword = async () => {
    if (pwd.length < 8) return toast.error("Password must be at least 8 characters");
    if (pwd !== pwd2) return toast.error("Passwords don't match");
    setPwdBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwd });
      if (error) throw error;
      setPwd(""); setPwd2("");
      toast.success("Password updated");
    } catch (e: any) { toast.error(e.message); }
    finally { setPwdBusy(false); }
  };

  const downloadFile = (filename: string, blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportJson = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      profile, transactions: txns, budgets, goals, investments,
    };
    downloadFile(`Astera-export-${Date.now()}.json`,
      new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    toast.success("Export ready");
  };

  const exportCsv = () => {
    const toCsv = (rows: (string | number)[][]) =>
      rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const sections: string[] = [];
    sections.push("# Transactions");
    sections.push(toCsv([
      ["date", "merchant", "category", "amount", "payment_method", "notes"],
      ...txns.map((t) => [t.occurred_at, t.merchant, t.category, t.amount, t.payment_method ?? "", t.notes ?? ""]),
    ]));
    sections.push("\n# Budgets");
    sections.push(toCsv([["category", "monthly_limit"], ...budgets.map((b) => [b.category, b.monthly_limit])]));
    sections.push("\n# Goals");
    sections.push(toCsv([
      ["name", "emoji", "target", "saved", "deadline"],
      ...goals.map((g) => [g.name, g.emoji, g.target, g.saved, g.deadline ?? ""]),
    ]));
    sections.push("\n# Investments");
    sections.push(toCsv([
      ["name", "type", "invested", "current_value", "notes"],
      ...investments.map((i) => [i.name, i.type, i.invested, i.current_value, i.notes ?? ""]),
    ]));
    downloadFile(`Astera-export-${Date.now()}.csv`,
      new Blob([sections.join("\n")], { type: "text/csv" }));
    toast.success("Export ready");
  };

  const totalInvested = investments.reduce((s, i) => s + i.invested, 0);

  const doWipe = async () => {
    if (wipeConfirm !== "DELETE") return toast.error('Type DELETE to confirm');
    setBusy(true);
    try {
      await wipeFn();
      toast.success("All financial data deleted");
      setWipeStep(0); setWipeConfirm("");
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const doDelete = async () => {
    if (delConfirm !== "DELETE ACCOUNT") return toast.error('Type DELETE ACCOUNT to confirm');
    setBusy(true);
    try {
      await deleteFn();
      await supabase.auth.signOut();
      toast.success("Account deleted");
      navigate({ to: "/" });
    } catch (e: any) { toast.error(e.message); setBusy(false); }
  };

  return (
    <div className="pb-12">
      <Topbar title="Settings" subtitle="Your account, your money, your rules." />

      <div className="grid gap-5 max-w-4xl">
        {/* PROFILE */}
        <Section icon={User} title="Profile" description="How you appear in Astera.">
          <div className="flex items-center gap-5 mb-6">
            <div className="relative">
              <div className="size-20 rounded-3xl overflow-hidden gradient-accent grid place-items-center text-2xl font-display text-primary-foreground">
                {avatarUrl ? <img src={avatarUrl} alt="" className="size-full object-cover" /> : initial}
              </div>
              <button onClick={onPickPhoto}
                className="absolute -bottom-1 -right-1 size-8 rounded-full gradient-primary text-primary-foreground grid place-items-center shadow-lg hover:scale-110 transition"
                aria-label="Change photo">
                <Camera className="size-4" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-xl truncate">{name || "Unnamed"}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                <Mail className="size-3" /> {user?.email}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-[11px] glass rounded-full px-2 py-0.5 flex items-center gap-1">
                  {isGoogle ? <Sparkles className="size-3" /> : <KeyRound className="size-3" />}
                  Signed in via {isGoogle ? "Google" : "Email"}
                </span>
                {createdAt && (
                  <span className="text-[11px] glass rounded-full px-2 py-0.5 flex items-center gap-1">
                    <CalendarDays className="size-3" /> Member since {createdAt.toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Display name" hint="Shown in the topbar and reports.">
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex Morgan" />
            </Field>
            <Field label="Email address" hint="Email is managed by your auth provider.">
              <input className={`${inputCls} opacity-60`} value={user?.email ?? ""} disabled />
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={saveProfile} disabled={updateProfile.isPending}
              className="px-5 py-2.5 rounded-2xl gradient-primary text-primary-foreground text-sm disabled:opacity-60 flex items-center gap-2">
              <CheckCircle2 className="size-4" /> Save profile
            </button>
          </div>
        </Section>

        {/* FINANCIAL PREFERENCES */}
        <Section icon={Wallet} title="Financial preferences" description="Powers your dashboard, budgets and forecasts.">
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Monthly income" hint="After-tax take-home, in your currency.">
              <input type="number" min={0} className={inputCls} value={income} onChange={(e) => setIncome(e.target.value)} placeholder="0" />
            </Field>
            <Field label="Monthly savings goal" hint="What you aim to set aside each month.">
              <input type="number" min={0} className={inputCls} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="0" />
            </Field>
            <Field label="Preferred currency" hint="Used across all of Astera.">
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls}>
                {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={saveProfile} disabled={updateProfile.isPending}
              className="px-5 py-2.5 rounded-2xl gradient-primary text-primary-foreground text-sm disabled:opacity-60 flex items-center gap-2">
              <CheckCircle2 className="size-4" /> Save preferences
            </button>
          </div>
        </Section>

        {/* FINANCIAL OVERVIEW */}
        <Section icon={TrendingUp} title="Financial overview" description="A snapshot of everything tracked in Astera.">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <MiniStat icon={Receipt} label="Transactions" value={txns.length} />
            <MiniStat icon={Wallet} label="Active budgets" value={budgets.length} />
            <MiniStat icon={Target} label="Active goals" value={goals.length} />
            <MiniStat icon={TrendingUp} label="Invested" value={formatMoney(totalInvested, currency)} />
            <MiniStat icon={CalendarDays} label="Account age" value={`${accountAgeDays}d`} />
          </div>
        </Section>

        {/* APPEARANCE */}
        <Section icon={theme === "dark" ? Moon : Sun} title="Appearance" description="Theme preference syncs across the app.">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setTheme("light")}
              className={`p-4 rounded-2xl glass text-left transition ${theme === "light" ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-border"}`}>
              <Sun className="size-5 mb-2" />
              <div className="font-medium text-sm">Light</div>
              <div className="text-xs text-muted-foreground">Soft pastel palette</div>
            </button>
            <button onClick={() => setTheme("dark")}
              className={`p-4 rounded-2xl glass text-left transition ${theme === "dark" ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-border"}`}>
              <Moon className="size-5 mb-2" />
              <div className="font-medium text-sm">Dark</div>
              <div className="text-xs text-muted-foreground">Calm, low-contrast night mode</div>
            </button>
          </div>
        </Section>

        {/* DATA MANAGEMENT */}
        <Section icon={Database} title="Data management" description="Download a copy of everything in your vault.">
          <div className="grid sm:grid-cols-2 gap-3">
            <button onClick={exportCsv}
              className="p-4 rounded-2xl glass text-left flex items-start gap-3 hover:ring-1 hover:ring-border transition">
              <div className="size-10 rounded-xl bg-primary/15 text-primary grid place-items-center"><FileSpreadsheet className="size-5" /></div>
              <div className="min-w-0">
                <div className="font-medium text-sm flex items-center gap-2">Export as CSV <Download className="size-3.5" /></div>
                <div className="text-xs text-muted-foreground mt-0.5">Spreadsheet-friendly, one section per type.</div>
              </div>
            </button>
            <button onClick={exportJson}
              className="p-4 rounded-2xl glass text-left flex items-start gap-3 hover:ring-1 hover:ring-border transition">
              <div className="size-10 rounded-xl bg-accent/40 text-accent-foreground grid place-items-center"><FileJson className="size-5" /></div>
              <div className="min-w-0">
                <div className="font-medium text-sm flex items-center gap-2">Export as JSON <Download className="size-3.5" /></div>
                <div className="text-xs text-muted-foreground mt-0.5">Full structured backup of every record.</div>
              </div>
            </button>
          </div>
        </Section>

        {/* PRIVACY & SECURITY */}
        <Section icon={Shield} title="Privacy & security" description="Account access and sign-in.">
          <div className="grid sm:grid-cols-3 gap-3 mb-5">
            <MiniStat icon={KeyRound} label="Auth method" value={isGoogle ? "Google" : "Email"} />
            <MiniStat icon={CalendarDays} label="Last login" value={lastSignIn ? lastSignIn.toLocaleDateString() : "—"} />
            <MiniStat icon={CheckCircle2} label="Status" value="Active" />
          </div>

          {!isGoogle ? (
            <div className="glass rounded-2xl p-4">
              <div className="text-sm font-medium mb-3 flex items-center gap-2"><KeyRound className="size-4" /> Change password</div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="New password" hint="At least 8 characters.">
                  <input type="password" className={inputCls} value={pwd} onChange={(e) => setPwd(e.target.value)} />
                </Field>
                <Field label="Confirm password">
                  <input type="password" className={inputCls} value={pwd2} onChange={(e) => setPwd2(e.target.value)} />
                </Field>
              </div>
              <div className="mt-3 flex justify-end">
                <button onClick={changePassword} disabled={pwdBusy}
                  className="px-4 py-2 rounded-2xl gradient-primary text-primary-foreground text-sm disabled:opacity-60">
                  {pwdBusy ? "Updating..." : "Update password"}
                </button>
              </div>
            </div>
          ) : (
            <div className="glass rounded-2xl p-4 flex items-start gap-3">
              <Sparkles className="size-5 text-primary mt-0.5" />
              <div className="text-sm">
                <div className="font-medium">Connected to Google</div>
                <div className="text-muted-foreground text-xs mt-0.5">
                  Manage your password and 2FA from your Google Account.
                </div>
                <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer"
                  className="text-xs text-primary underline mt-1 inline-block">Open Google security →</a>
              </div>
            </div>
          )}

          <div className="mt-4">
            <button onClick={() => signOut()} className="px-4 py-2 rounded-2xl glass text-sm flex items-center gap-2">
              <LogOut className="size-4" /> Sign out of this device
            </button>
          </div>
        </Section>

        {/* DANGER ZONE */}
        <Section icon={AlertTriangle} title="Danger zone" description="Irreversible actions. Please proceed with care." tone="danger">
          <div className="space-y-3">
            <div className="rounded-2xl border border-destructive/30 p-4 flex flex-wrap items-center gap-3 justify-between">
              <div className="min-w-0">
                <div className="font-medium text-sm">Delete all financial data</div>
                <div className="text-xs text-muted-foreground mt-0.5">Wipes every transaction, budget, goal and investment. Keeps your account.</div>
              </div>
              <button onClick={() => setWipeStep(1)} className="px-4 py-2 rounded-2xl bg-destructive/15 text-destructive text-sm flex items-center gap-2 hover:bg-destructive/25">
                <Trash2 className="size-4" /> Delete All My Financial Data
              </button>
            </div>
            <div className="rounded-2xl border border-destructive/30 p-4 flex flex-wrap items-center gap-3 justify-between">
              <div className="min-w-0">
                <div className="font-medium text-sm">Delete my account</div>
                <div className="text-xs text-muted-foreground mt-0.5">Permanently removes your account and all associated data.</div>
              </div>
              <button onClick={() => setDelStep(1)} className="px-4 py-2 rounded-2xl bg-destructive text-destructive-foreground text-sm flex items-center gap-2 hover:opacity-90">
                <Trash2 className="size-4" /> Delete My Account
              </button>
            </div>
          </div>
        </Section>
      </div>

      {/* Wipe data — step 1 */}
      <Modal open={wipeStep === 1} onClose={() => setWipeStep(0)}>
        <div className="flex items-center gap-3 mb-3">
          <div className="size-10 rounded-2xl bg-destructive/15 text-destructive grid place-items-center"><AlertTriangle className="size-5" /></div>
          <h3 className="font-display text-2xl">Delete Financial Data?</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          This action will permanently delete all transactions, budgets, goals, investments, and financial records.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setWipeStep(0)} className="px-4 py-2 rounded-2xl glass text-sm">Cancel</button>
          <button onClick={() => setWipeStep(2)} className="px-4 py-2 rounded-2xl bg-destructive text-destructive-foreground text-sm">Continue</button>
        </div>
      </Modal>

      {/* Wipe data — step 2 */}
      <Modal open={wipeStep === 2} onClose={() => !busy && setWipeStep(0)}>
        <div className="flex items-center gap-3 mb-3">
          <div className="size-10 rounded-2xl bg-destructive/15 text-destructive grid place-items-center"><AlertTriangle className="size-5" /></div>
          <h3 className="font-display text-2xl">Are You Absolutely Sure?</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">This action cannot be undone. Type <span className="font-mono font-semibold text-foreground">DELETE</span> to confirm.</p>
        <input autoFocus value={wipeConfirm} onChange={(e) => setWipeConfirm(e.target.value)} placeholder="DELETE" className={`${inputCls} mb-4 font-mono`} />
        <div className="flex justify-end gap-2">
          <button onClick={() => { setWipeStep(0); setWipeConfirm(""); }} disabled={busy} className="px-4 py-2 rounded-2xl glass text-sm">Cancel</button>
          <button onClick={doWipe} disabled={busy || wipeConfirm !== "DELETE"} className="px-4 py-2 rounded-2xl bg-destructive text-destructive-foreground text-sm disabled:opacity-50">
            {busy ? "Deleting..." : "Delete everything"}
          </button>
        </div>
      </Modal>

      {/* Delete account — step 1 */}
      <Modal open={delStep === 1} onClose={() => setDelStep(0)}>
        <div className="flex items-center gap-3 mb-3">
          <div className="size-10 rounded-2xl bg-destructive/15 text-destructive grid place-items-center"><AlertTriangle className="size-5" /></div>
          <h3 className="font-display text-2xl">Delete Your Account?</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          This permanently deletes your profile, transactions, budgets, goals and investments, and signs you out.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setDelStep(0)} className="px-4 py-2 rounded-2xl glass text-sm">Cancel</button>
          <button onClick={() => setDelStep(2)} className="px-4 py-2 rounded-2xl bg-destructive text-destructive-foreground text-sm">Continue</button>
        </div>
      </Modal>

      {/* Delete account — step 2 */}
      <Modal open={delStep === 2} onClose={() => !busy && setDelStep(0)}>
        <div className="flex items-center gap-3 mb-3">
          <div className="size-10 rounded-2xl bg-destructive/15 text-destructive grid place-items-center"><AlertTriangle className="size-5" /></div>
          <h3 className="font-display text-2xl">Are You Absolutely Sure?</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">This action cannot be undone. Type <span className="font-mono font-semibold text-foreground">DELETE ACCOUNT</span> to confirm.</p>
        <input autoFocus value={delConfirm} onChange={(e) => setDelConfirm(e.target.value)} placeholder="DELETE ACCOUNT" className={`${inputCls} mb-4 font-mono`} />
        <div className="flex justify-end gap-2">
          <button onClick={() => { setDelStep(0); setDelConfirm(""); }} disabled={busy} className="px-4 py-2 rounded-2xl glass text-sm">Cancel</button>
          <button onClick={doDelete} disabled={busy || delConfirm !== "DELETE ACCOUNT"} className="px-4 py-2 rounded-2xl bg-destructive text-destructive-foreground text-sm disabled:opacity-50">
            {busy ? "Deleting..." : "Delete account"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
