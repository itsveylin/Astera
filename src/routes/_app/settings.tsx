import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Topbar } from "@/components/Topbar";
import { Moon, Sun, Download, Upload, Bell, Globe, Shield, User } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Lumen" }] }),
  component: Settings,
});

function Settings() {
  const [dark, setDark] = useState(false);
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);

  return (
    <div>
      <Topbar title="Settings" subtitle="Make Lumen feel like yours." />

      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4"><User className="size-4"/><h3 className="font-display text-xl">Profile</h3></div>
          <div className="flex items-center gap-3">
            <div className="size-14 rounded-2xl gradient-accent grid place-items-center text-xl text-primary-foreground font-display">A</div>
            <div>
              <div className="font-medium">Aanya Rao</div>
              <div className="text-xs text-muted-foreground">aanya@lumen.app</div>
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">{dark ? <Sun className="size-4"/> : <Moon className="size-4"/>}<h3 className="font-display text-xl">Theme</h3></div>
          <div className="flex gap-2">
            <button onClick={() => setDark(false)} className={`flex-1 p-4 rounded-2xl glass ${!dark ? "ring-2 ring-primary" : ""}`}>
              <Sun className="size-4 mb-2" /><div className="text-sm">Light pastel</div>
            </button>
            <button onClick={() => setDark(true)} className={`flex-1 p-4 rounded-2xl glass ${dark ? "ring-2 ring-primary" : ""}`}>
              <Moon className="size-4 mb-2" /><div className="text-sm">Dark aesthetic</div>
            </button>
          </div>
        </div>

        <div className="glass rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4"><Globe className="size-4"/><h3 className="font-display text-xl">Currency & locale</h3></div>
          <select className="w-full glass rounded-2xl px-3 py-2 text-sm bg-transparent">
            <option>INR · ₹ Indian Rupee</option><option>USD · $ US Dollar</option><option>EUR · € Euro</option>
          </select>
        </div>

        <div className="glass rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4"><Bell className="size-4"/><h3 className="font-display text-xl">Notifications</h3></div>
          {[
            "Weekly money digest", "Budget warnings", "Bill reminders", "AI insights",
          ].map((l, i) => (
            <label key={i} className="flex items-center justify-between py-2 text-sm">
              <span>{l}</span>
              <input type="checkbox" defaultChecked className="accent-[oklch(0.62_0.18_295)] size-4" />
            </label>
          ))}
        </div>

        <div className="glass rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4"><Shield className="size-4"/><h3 className="font-display text-xl">Privacy</h3></div>
          <p className="text-sm text-muted-foreground">Your data is end-to-end encrypted. No third-party analytics. Ever.</p>
        </div>

        <div className="glass rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4"><Download className="size-4"/><h3 className="font-display text-xl">Data</h3></div>
          <div className="flex gap-2">
            <button className="flex-1 py-2 rounded-2xl glass text-sm flex items-center justify-center gap-2"><Download className="size-4"/>Export</button>
            <button className="flex-1 py-2 rounded-2xl glass text-sm flex items-center justify-center gap-2"><Upload className="size-4"/>Import CSV</button>
          </div>
        </div>
      </div>
    </div>
  );
}
