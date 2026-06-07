import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Receipt, BarChart3, Target, Settings } from "lucide-react";

const items = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/transactions", label: "Txns", icon: Receipt },
  { to: "/analytics", label: "Stats", icon: BarChart3 },
  { to: "/goals", label: "Goals", icon: Target },
 { to: "/settings", label: "More", icon: Settings },
];

export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="lg:hidden fixed bottom-3 inset-x-3 z-40 glass-strong rounded-3xl p-2 flex justify-around">
      {items.map(({ to, label, icon: Icon }) => {
        const active = pathname.startsWith(to);
        return (
          <Link key={to} to={to} className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-2xl text-[10px] ${active ? "gradient-primary text-primary-foreground" : "text-muted-foreground"}`}>
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
