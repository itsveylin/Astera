import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "financial_summary",
  title: "Financial summary",
  description:
    "Summarize the signed-in user's income, expenses, net flow, top spending categories, and portfolio value for a given month.",
  inputSchema: {
    month: z.string().optional().describe("Month as YYYY-MM. Defaults to the current month."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ month }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);

    const now = new Date();
    const [y, m] = month
      ? month.split("-").map(Number)
      : [now.getUTCFullYear(), now.getUTCMonth() + 1];
    if (!y || !m || m < 1 || m > 12) {
      return { content: [{ type: "text", text: "Invalid month. Use YYYY-MM." }], isError: true };
    }
    const start = new Date(Date.UTC(y, m - 1, 1)).toISOString();
    const end = new Date(Date.UTC(y, m, 1)).toISOString();

    const [txns, investments] = await Promise.all([
      supabase
        .from("transactions")
        .select("category, amount")
        .gte("occurred_at", start)
        .lt("occurred_at", end),
      supabase.from("investments").select("invested, current_value"),
    ]);
    if (txns.error) return { content: [{ type: "text", text: txns.error.message }], isError: true };
    if (investments.error) {
      return { content: [{ type: "text", text: investments.error.message }], isError: true };
    }

    let income = 0;
    let expense = 0;
    const byCategory: Record<string, number> = {};
    for (const t of txns.data ?? []) {
      if (t.amount > 0) income += t.amount;
      else {
        expense += Math.abs(t.amount);
        byCategory[t.category] = (byCategory[t.category] ?? 0) + Math.abs(t.amount);
      }
    }
    const top_categories = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, spent]) => ({ category, spent }));

    const invested = (investments.data ?? []).reduce((s, i) => s + i.invested, 0);
    const portfolio_value = (investments.data ?? []).reduce((s, i) => s + i.current_value, 0);

    const summary = {
      month: `${y}-${String(m).padStart(2, "0")}`,
      income,
      expense,
      net: income - expense,
      top_categories,
      invested,
      portfolio_value,
      portfolio_profit_loss: portfolio_value - invested,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});
