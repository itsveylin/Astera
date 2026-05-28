export const CATEGORIES = [
  "Food", "Groceries", "Transport", "Shopping", "Entertainment",
  "Bills", "Healthcare", "Travel", "Subscriptions", "Investments",
  "Income", "Other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const categoryMeta: Record<Category, { color: string; icon: string }> = {
  Food: { color: "oklch(0.78 0.16 30)", icon: "🍜" },
  Transport: { color: "oklch(0.75 0.15 200)", icon: "🚗" },
  Shopping: { color: "oklch(0.72 0.18 340)", icon: "🛍️" },
  Entertainment: { color: "oklch(0.7 0.2 295)", icon: "🎬" },
  Bills: { color: "oklch(0.7 0.16 60)", icon: "🧾" },
  Healthcare: { color: "oklch(0.72 0.16 10)", icon: "💊" },
  Travel: { color: "oklch(0.75 0.16 220)", icon: "✈️" },
  Groceries: { color: "oklch(0.74 0.16 145)", icon: "🥬" },
  Subscriptions: { color: "oklch(0.7 0.18 280)", icon: "🔁" },
  Investments: { color: "oklch(0.72 0.16 170)", icon: "📈" },
  Income: { color: "oklch(0.72 0.18 155)", icon: "💰" },
  Other: { color: "oklch(0.7 0.04 280)", icon: "✨" },
};

export const INVESTMENT_TYPES = [
  "Mutual Fund", "SIP", "Stock", "ETF", "Crypto", "Gold", "Fixed Deposit",
] as const;
export type InvestmentType = (typeof INVESTMENT_TYPES)[number];

const currencyLocale: Record<string, [string, string]> = {
  INR: ["en-IN", "INR"],
  USD: ["en-US", "USD"],
  EUR: ["de-DE", "EUR"],
  GBP: ["en-GB", "GBP"],
  AED: ["en-AE", "AED"],
};

export function formatMoney(n: number, currency = "INR") {
  const [locale, code] = currencyLocale[currency] ?? currencyLocale.INR;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  }).format(n);
}

export interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  category: Category;
  payment_method: string | null;
  notes: string | null;
  occurred_at: string;
}
export interface Budget { id: string; category: Category; monthly_limit: number; }
export interface Goal {
  id: string; name: string; emoji: string;
  target: number; saved: number; deadline: string | null;
}
export interface Investment {
  id: string; name: string; type: string;
  invested: number; current_value: number; notes: string | null;
}
export interface Profile {
  id: string; display_name: string | null; currency: string;
  monthly_income: number; savings_goal: number; onboarded: boolean; theme: string;
}
