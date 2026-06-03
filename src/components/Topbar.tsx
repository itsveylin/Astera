import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useProfile } from "@/hooks/useFinanceData";
import { useAuth } from "@/components/AuthProvider";

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { theme, toggle } = useTheme();
  const { data: profile } = useProfile();
  const { user } = useAuth();
  const avatarUrl = (user?.user_metadata as any)?.avatar_url as string | undefined;
  const initial = (profile?.display_name ?? user?.email ?? "L")[0].toUpperCase();
  return (
    <header className="flex flex-wrap items-center gap-4 mb-6">
      <div className="flex-1 min-w-0">
        <h1 className="font-display text-3xl md:text-4xl">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <button onClick={toggle} aria-label="Toggle theme" className="glass rounded-2xl p-2.5 hover:scale-105 transition">
        {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>
      <div className="size-10 rounded-2xl overflow-hidden gradient-accent grid place-items-center text-sm font-semibold text-primary-foreground">
        {avatarUrl ? <img src={avatarUrl} alt="" className="size-full object-cover" /> : initial}
      </div>
    </header>
  );
}
