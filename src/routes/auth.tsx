import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Sparkles, Mail, Lock, ArrowRight, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Blobs } from "@/components/Blobs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/components/AuthProvider";
import { ThemeToggle } from "@/components/ThemeToggle";

function safePath(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  if (!value.startsWith("/") || value.startsWith("//")) return undefined;
  return value;
}

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Astera" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    next: safePath(s.next) ?? safePath(s.redirect),
  }),
  component: Auth,
});

function Auth() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  
  const { session } = useAuth();
  const { next } = Route.useSearch();
  const returnTo = next ?? "/dashboard";

  useEffect(() => {
    if (session) window.location.replace(returnTo);
  }, [session, returnTo]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + returnTo, data: { display_name: name } },
        });
        if (error) throw error;
        toast.success("Welcome to Astera ✨");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + returnTo,
      });
      if (result.error) toast.error("Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen flex">
      <Blobs />
      <div className="absolute top-4 right-4 z-10"><ThemeToggle /></div>
      <div className="hidden lg:flex flex-1 relative items-end p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-10">
            <div className="size-10 rounded-2xl gradient-primary grid place-items-center"><Sparkles className="size-5 text-primary-foreground" /></div>
            <span className="font-display text-3xl">Astera</span>
          </Link>
          <h2 className="font-display text-5xl leading-tight">Money, but make it <span className="gradient-text">peaceful</span>.</h2>
          <p className="mt-4 text-muted-foreground">A calmer way to track, budget, and grow what you have.</p>
        </motion.div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-[2rem] p-8 w-full max-w-md">
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-2xl mb-6 text-sm">
            {(["login", "signup"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-xl capitalize transition ${mode === m ? "gradient-primary text-primary-foreground" : "text-muted-foreground"}`}>
                {m === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <h3 className="font-display text-2xl">{mode === "login" ? "Welcome back" : "Create your space"}</h3>
            {mode === "signup" && (
              <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
                <UserIcon className="size-4 text-muted-foreground" />
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="bg-transparent outline-none flex-1 text-sm" />
              </div>
            )}
            <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
              <Mail className="size-4 text-muted-foreground" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="bg-transparent outline-none flex-1 text-sm" />
            </div>
            <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
              <Lock className="size-4 text-muted-foreground" />
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="bg-transparent outline-none flex-1 text-sm" />
            </div>
            <button type="submit" disabled={busy}
              className="w-full py-3 rounded-2xl gradient-primary text-primary-foreground font-medium flex items-center justify-center gap-2 shadow-[var(--shadow-soft)] disabled:opacity-60">
              {busy ? "..." : <>Continue <ArrowRight className="size-4" /></>}
            </button>
            <div className="flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />or<div className="h-px flex-1 bg-border" /></div>
            <button type="button" onClick={google} disabled={busy} className="w-full py-3 rounded-2xl glass flex items-center justify-center gap-2 text-sm disabled:opacity-60">
              <svg className="size-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.99.66-2.25 1.05-3.72 1.05-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" /></svg>
              Continue with Google
            </button>
            <p className="text-xs text-muted-foreground text-center">By continuing you agree to our Terms & Privacy.</p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
