import { defineTool } from "@lovable.dev/mcp-js";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_budgets",
  title: "List budgets",
  description: "List the signed-in user's monthly category budgets with spending so far this month.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

    const [budgets, txns] = await Promise.all([
      supabase.from("budgets").select("id, category, monthly_limit"),
      supabase.from("transactions").select("category, amount").gte("occurred_at", monthStart),
    ]);
    if (budgets.error) return { content: [{ type: "text", text: budgets.error.message }], isError: true };
    if (txns.error) return { content: [{ type: "text", text: txns.error.message }], isError: true };

    const spent: Record<string, number> = {};
    for (const t of txns.data ?? []) {
      if (t.amount < 0) spent[t.category] = (spent[t.category] ?? 0) + Math.abs(t.amount);
    }
    const rows = (budgets.data ?? []).map((b) => ({
      ...b,
      spent_this_month: spent[b.category] ?? 0,
      remaining: b.monthly_limit - (spent[b.category] ?? 0),
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { budgets: rows },
    };
  },
});
