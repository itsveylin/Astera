import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";
import { Blobs } from "@/components/Blobs";
import { useAuth } from "@/components/AuthProvider";
import { useProfile, useRecurringRunner } from "@/hooks/useFinanceData";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { session, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const nav = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!session) { nav({ to: "/auth", search: { redirect: pathname } as any }); return; }
    if (!profileLoading && profile && !profile.onboarded && pathname !== "/onboarding") {
      nav({ to: "/onboarding" });
    }
  }, [loading, session, profile, profileLoading, pathname, nav]);

  if (loading || !session) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Blobs />
        <div className="font-display text-3xl gradient-text animate-pulse">Lumen</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex">
      <Blobs />
      <AppSidebar />
      <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
}
