import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Sparkles, Mail, Lock, ArrowRight, Chrome } from "lucide-react";
import { Blobs } from "@/components/Blobs";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Lumen" }] }),
  component: Auth,
});

function Auth() {
  const [mode, setMode] = useState<"login" | "signup" | "otp">("login");
  const nav = useNavigate();
  return (
    <div className="relative min-h-screen flex">
      <Blobs />
      <div className="hidden lg:flex flex-1 relative items-end p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-10">
            <div className="size-10 rounded-2xl gradient-primary grid place-items-center"><Sparkles className="size-5 text-primary-foreground" /></div>
            <span className="font-display text-3xl">Lumen</span>
          </Link>
          <h2 className="font-display text-5xl leading-tight">Money, but make it <span className="gradient-text">peaceful</span>.</h2>
          <p className="mt-4 text-muted-foreground">Join thousands building calmer financial lives, one beautiful insight at a time.</p>
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
          {mode === "otp" ? (
            <div>
              <h3 className="font-display text-2xl mb-2">Enter the code</h3>
              <p className="text-sm text-muted-foreground mb-6">We sent a 6-digit code to your email.</p>
              <div className="flex gap-2 mb-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <input key={i} maxLength={1} className="size-12 rounded-2xl glass text-center font-display text-xl outline-none focus:ring-2 ring-primary" />
                ))}
              </div>
              <button onClick={() => nav({ to: "/dashboard" })} className="w-full py-3 rounded-2xl gradient-primary text-primary-foreground font-medium">Verify & continue</button>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setMode("otp"); }} className="space-y-4">
              <h3 className="font-display text-2xl">{mode === "login" ? "Welcome back" : "Create your space"}</h3>
              {mode === "signup" && (
                <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
                  <Sparkles className="size-4 text-muted-foreground" />
                  <input placeholder="Your name" className="bg-transparent outline-none flex-1 text-sm" />
                </div>
              )}
              <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
                <Mail className="size-4 text-muted-foreground" />
                <input type="email" placeholder="you@email.com" className="bg-transparent outline-none flex-1 text-sm" />
              </div>
              <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
                <Lock className="size-4 text-muted-foreground" />
                <input type="password" placeholder="Password" className="bg-transparent outline-none flex-1 text-sm" />
              </div>
              <button type="submit" className="w-full py-3 rounded-2xl gradient-primary text-primary-foreground font-medium flex items-center justify-center gap-2 shadow-[var(--shadow-soft)]">
                Continue <ArrowRight className="size-4" />
              </button>
              <div className="flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border"/>or<div className="h-px flex-1 bg-border"/></div>
              <button type="button" onClick={() => nav({ to: "/dashboard" })} className="w-full py-3 rounded-2xl glass flex items-center justify-center gap-2 text-sm">
                <Chrome className="size-4" /> Continue with Google
              </button>
              <p className="text-xs text-muted-foreground text-center">By continuing you agree to our Terms & Privacy.</p>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
