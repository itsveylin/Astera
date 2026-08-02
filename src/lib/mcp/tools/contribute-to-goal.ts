import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "contribute_to_goal",
  title: "Add or withdraw goal money",
  description:
    "Record a contribution to a savings goal. Use a negative amount to withdraw. The goal's saved total updates automatically.",
  inputSchema: {
    goal_id: z.string().describe("Goal id from list_goals."),
    amount: z.number().describe("Positive to contribute, negative to withdraw."),
    note: z.string().trim().optional().describe("Optional note."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ goal_id, amount, note }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("goal_contributions")
      .insert({ user_id: ctx.getUserId()!, goal_id, amount, note: note ?? null })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Recorded ${amount} toward goal ${goal_id}.` }],
      structuredContent: { contribution: data },
    };
  },
});
