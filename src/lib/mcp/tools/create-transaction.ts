import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_transaction",
  title: "Create transaction",
  description:
    "Record a new transaction for the signed-in user. Use a positive amount for income and a negative amount for an expense.",
  inputSchema: {
    merchant: z.string().trim().min(1).describe("Merchant or description, e.g. 'Blue Tokai'."),
    amount: z.number().describe("Positive for income, negative for an expense."),
    category: z.string().trim().min(1).describe("Category name, e.g. 'Food', 'Bills', 'Income'."),
    subcategory: z.string().trim().optional().describe("Optional subcategory, e.g. 'Electricity'."),
    payment_method: z
      .enum(["Cash", "UPI", "Card", "Bank Transfer", "Other"])
      .default("UPI")
      .describe("How the money moved."),
    occurred_at: z.string().optional().describe("ISO timestamp; defaults to now."),
    notes: z.string().trim().optional().describe("Optional note."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: ctx.getUserId()!,
        merchant: input.merchant,
        amount: input.amount,
        category: input.category,
        subcategory: input.subcategory ?? null,
        payment_method: input.payment_method ?? "UPI",
        occurred_at: input.occurred_at ?? new Date().toISOString(),
        notes: input.notes ?? null,
      })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Added ${input.merchant} (${input.amount}).` }],
      structuredContent: { transaction: data },
    };
  },
});
