import { Bell, Search, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return (
    <header className="flex flex-wrap items-center gap-4 mb-6">
      <div className="flex-1 min-w-0">
        <h1 className="font-display text-3xl md:text-4xl">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <div className="hidden md:flex items-center gap-2 glass rounded-2xl px-3 py-2 w-72">
        <Search className="size-4 text-muted-foreground" />
        <input placeholder="Search anything..." className="bg-transparent text-sm outline-none flex-1 placeholder:text-muted-foreground" />
      </div>
      <button onClick={() => setDark(!dark)} className="glass rounded-2xl p-2.5 hover:scale-105 transition">
        {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>
      <button className="glass rounded-2xl p-2.5 relative hover:scale-105 transition">
        <Bell className="size-4" />
        <span className="absolute top-1.5 right-1.5 size-2 rounded-full gradient-primary" />
      </button>
      <div className="size-10 rounded-2xl gradient-accent grid place-items-center text-sm font-semibold text-primary-foreground">A</div>
    </header>
  );
}
