import { defineTool } from "@lovable.dev/mcp-js";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_goals",
  title: "List savings goals",
  description: "List the signed-in user's savings goals with target, saved amount, and progress.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("goals")
      .select("id, name, emoji, target, saved, deadline")
      .order("created_at", { ascending: true });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = (data ?? []).map((g) => ({
      ...g,
      remaining: Math.max(0, g.target - g.saved),
      progress_percent: g.target > 0 ? Math.round((g.saved / g.target) * 100) : 0,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { goals: rows },
    };
  },
});
