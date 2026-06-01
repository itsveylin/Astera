import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const wipeFinancialData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const tables = ["transactions", "budgets", "goals", "investments"] as const;
    for (const t of tables) {
      const { error } = await supabaseAdmin.from(t).delete().eq("user_id", userId);
      if (error) throw new Error(`${t}: ${error.message}`);
    }
    return { ok: true };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const tables = ["transactions", "budgets", "goals", "investments"] as const;
    for (const t of tables) {
      const { error } = await supabaseAdmin.from(t).delete().eq("user_id", userId);
      if (error) throw new Error(`${t}: ${error.message}`);
    }
    await supabaseAdmin.from("profiles").delete().eq("id", userId);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
