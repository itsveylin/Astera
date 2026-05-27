import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Receipt, BarChart3, Wallet, Target, TrendingUp,
  RefreshCw, Sparkles, FileText, Settings, Gem,
} from "lucide-react";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", icon: Receipt },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/budgets", label: "Budgets", icon: Wallet },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/investments", label: "Investments", icon: TrendingUp },
  { to: "/subscriptions", label: "Subscriptions", icon: RefreshCw },
  { to: "/assistant", label: "AI Assistant", icon: Sparkles },
  { to: "/report", label: "Year Report", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col gap-2 p-4 sticky top-0 h-screen">
      <Link to="/" className="flex items-center gap-2 px-3 py-4">
        <div className="size-9 rounded-2xl gradient-primary grid place-items-center shadow-[var(--shadow-elegant)]">
          <Gem className="size-5 text-primary-foreground" />
        </div>
        <div className="font-display text-2xl">Lumen</div>
      </Link>
      <nav className="glass rounded-3xl p-2 flex-1 flex flex-col gap-1">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm transition-all ${
                active
                  ? "gradient-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
              }`}
            >
              <Icon className="size-4" />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="glass rounded-3xl p-4 text-xs text-muted-foreground">
        <div className="font-medium text-foreground mb-1">✨ AI Pro</div>
        Unlock predictive forecasts and smart auto-budgets.
      </div>
    </aside>
  );
}
