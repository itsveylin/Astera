import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_transactions",
  title: "List transactions",
  description:
    "List the signed-in user's transactions, newest first. Positive amounts are income, negative amounts are expenses.",
  inputSchema: {
    limit: z.number().int().min(1).max(200).default(25).describe("How many transactions to return."),
    category: z.string().optional().describe("Filter by exact category name, e.g. 'Food'."),
    since: z.string().optional().describe("Only transactions on or after this ISO date (YYYY-MM-DD)."),
    until: z.string().optional().describe("Only transactions on or before this ISO date (YYYY-MM-DD)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, category, since, until }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("transactions")
      .select("id, occurred_at, merchant, category, subcategory, amount, payment_method, notes")
      .order("occurred_at", { ascending: false })
      .limit(limit ?? 25);
    if (category) query = query.eq("category", category);
    if (since) query = query.gte("occurred_at", since);
    if (until) query = query.lte("occurred_at", until);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { transactions: data ?? [] },
    };
  },
});
