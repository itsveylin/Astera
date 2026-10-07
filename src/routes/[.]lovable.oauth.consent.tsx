import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Gem } from "lucide-react";
import { Blobs } from "@/components/Blobs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/.lovable/oauth/consent")({
  head: () => ({ meta: [{ title: "Authorize a connection — Astera" }, { name: "description", content: "Review and authorize agent access to your Astera account." }, { property: "og:title", content: "Authorize a connection — Astera" }, { property: "og:description", content: "Review and authorize agent access to your Astera account." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ to: "/auth", search: { next } as never });
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await (supabase.auth as any).oauth.getAuthorizationDetails(authorizationId);
    if (error) throw error;
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <div className="relative min-h-screen grid place-items-center p-6">
      <Blobs />
      <div className="glass-strong rounded-[2rem] p-8 max-w-md text-center">
        <h1 className="font-display text-2xl">Couldn't load this request</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {String((error as Error)?.message ?? error)}
        </p>
      </div>
    </div>
  ),
});

function Consent() {
  const details = Route.useLoaderData() as any;
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "this app";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const oauth = (supabase.auth as any).oauth;
    const { data, error: err } = approve
      ? await oauth.approveAuthorization(authorization_id)
      : await oauth.denyAuthorization(authorization_id);
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <div className="relative min-h-screen grid place-items-center p-6">
      <Blobs />
      <main className="glass-strong rounded-[2rem] p-8 w-full max-w-md">
        <div className="flex items-center gap-2 mb-6">
          <div className="size-9 rounded-2xl gradient-primary grid place-items-center">
            <Gem className="size-5 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl">Astera</span>
        </div>
        <h1 className="font-display text-3xl leading-tight">
          Connect {clientName} to your account
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {clientName} will be able to read and add your transactions, budgets, goals and
          investments — acting as you inside Astera. You can revoke access at any time.
        </p>
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="mt-8 flex gap-3">
          <button
            disabled={busy}
            onClick={() => decide(false)}
            className="flex-1 py-3 rounded-2xl glass text-sm disabled:opacity-60"
          >
            Deny
          </button>
          <button
            disabled={busy}
            onClick={() => decide(true)}
            className="flex-1 py-3 rounded-2xl gradient-primary text-primary-foreground text-sm font-medium shadow-[var(--shadow-soft)] disabled:opacity-60"
          >
            {busy ? "..." : "Approve"}
          </button>
        </div>
      </main>
    </div>
  );
}
