import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Receipt, BarChart3, Wallet, Target, TrendingUp,
  RefreshCw, FileText, Settings, Gem, LogOut, Repeat,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", icon: Receipt },
  { to: "/recurring", label: "Recurring", icon: Repeat },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/budgets", label: "Budgets", icon: Wallet },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/investments", label: "Investments", icon: TrendingUp },
  { to: "/subscriptions", label: "Subscriptions", icon: RefreshCw },
  { to: "/report", label: "Year Report", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { signOut } = useAuth();
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
            <Link key={to} to={to}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm transition-all ${
                active
                  ? "gradient-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
              }`}>
              <Icon className="size-4" />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
      <button onClick={() => signOut()} className="glass rounded-2xl p-3 text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
        <LogOut className="size-4" /> Sign out
      </button>
    </aside>
  );
}
