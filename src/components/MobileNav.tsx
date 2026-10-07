import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, ChevronRight, UserRound, Shield, Download, Trash2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/components/AuthProvider";
import { financeNavigation, mobilePrimaryNavigation, navigationGroups } from "@/lib/navigation";

const accountShortcuts = [
  { label: "Account Management", hash: "profile", icon: UserRound },
  { label: "Security Settings", hash: "security", icon: Shield },
  { label: "Data Export", hash: "data-export", icon: Download },
  { label: "Delete Account", hash: "danger-zone", icon: Trash2 },
] as const;

export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const { signOut } = useAuth();
  const moreActive = !mobilePrimaryNavigation.some((item) => pathname.startsWith(item.to));

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <nav aria-label="Mobile navigation" className="mobile-navigation lg:hidden fixed inset-x-3 z-40 glass-strong rounded-3xl p-2 grid grid-cols-5">
      {mobilePrimaryNavigation.map((item) => {
        const { to, icon: Icon } = item;
        const active = pathname.startsWith(to);
        return (
          <Link key={to} to={to} aria-current={active ? "page" : undefined} className={`min-w-0 min-h-12 flex flex-col justify-center items-center gap-1 py-2 rounded-2xl text-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? "gradient-primary text-primary-foreground" : "text-muted-foreground"}`}>
            <Icon className="size-4" />
            {item.mobileLabel}
          </Link>
        );
      })}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" aria-label="More" className={`h-auto min-h-12 min-w-0 rounded-2xl flex-col gap-1 px-0 py-2 text-[10px] ${open || moreActive ? "gradient-primary text-primary-foreground" : "text-muted-foreground"}`}>
            <Menu className="size-4" /> More
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" aria-describedby={undefined} className="mobile-more-sheet mx-auto flex w-full max-w-xl flex-col gap-0 rounded-t-3xl border-border bg-popover p-0 text-popover-foreground shadow-[var(--shadow-elegant)] [&>button]:size-11 [&>button]:rounded-2xl [&>button]:top-3 motion-reduce:animate-none motion-reduce:transition-none">
          <SheetHeader className="shrink-0 border-b border-border px-5 py-5 text-left">
            <SheetTitle className="font-display text-3xl font-normal">More</SheetTitle>
          </SheetHeader>
          <nav aria-label="All Astera sections" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 scrollbar-thin">
            {navigationGroups.map((group) => (
              <section key={group} aria-label={group} className="mb-4 last:mb-0">
                <h2 className="px-3 pb-2 pt-1 text-xs font-medium text-muted-foreground">{group}</h2>
                {financeNavigation.filter((item) => item.group === group).map(({ to, label, icon: Icon }) => (
                  <Link key={to} to={to} onClick={() => setOpen(false)} aria-current={pathname === to ? "page" : undefined}
                    className={`flex min-h-12 items-center gap-3 rounded-2xl px-3 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${pathname === to ? "bg-primary/10 text-primary" : "hover:bg-accent/40"}`}>
                    <Icon className="size-5 shrink-0 text-primary" /><span className="min-w-0 flex-1">{label}</span><ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
                {group === "Account & privacy" && accountShortcuts.map(({ label, hash, icon: Icon }) => (
                  <Link key={hash} to="/settings" hash={hash} onClick={() => setOpen(false)}
                    className={`flex min-h-12 items-center gap-3 rounded-2xl px-3 py-3 text-sm hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${hash === "danger-zone" ? "text-destructive" : ""}`}>
                    <Icon className="size-5 shrink-0" /><span className="min-w-0 flex-1">{label}</span><ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </section>
            ))}
          </nav>
          <div className="mobile-more-footer shrink-0 border-t border-border px-4 pt-3">
            <Button variant="ghost" className="min-h-12 w-full justify-start rounded-2xl text-muted-foreground" onClick={async () => { setOpen(false); await signOut(); }}><LogOut /> Sign out</Button>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
