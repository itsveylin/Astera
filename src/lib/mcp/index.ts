import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listTransactions from "./tools/list-transactions";
import createTransaction from "./tools/create-transaction";
import listBudgets from "./tools/list-budgets";
import listGoals from "./tools/list-goals";
import contributeToGoal from "./tools/contribute-to-goal";
import listInvestments from "./tools/list-investments";
import financialSummary from "./tools/financial-summary";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "aura-finance",
  title: "Aura Finance",
  version: "0.1.0",
  instructions:
    "Tools for the signed-in user's personal finances: read and add transactions, review budgets, savings goals and investments, contribute to goals, and get a monthly financial summary. Positive transaction amounts are income; negative amounts are expenses.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    financialSummary,
    listTransactions,
    createTransaction,
    listBudgets,
    listGoals,
    contributeToGoal,
    listInvestments,
  ],
});
