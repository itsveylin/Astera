export const CATEGORIES = [
  "Food", "Groceries", "Transport", "Shopping", "Entertainment",
  "Bills", "Taxes", "Healthcare", "Travel", "Subscriptions", "Investments",
  "Income", "Other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const categoryMeta: Record<Category, { color: string; icon: string }> = {
  Food: { color: "oklch(0.78 0.16 30)", icon: "🍜" },
  Transport: { color: "oklch(0.75 0.15 200)", icon: "🚗" },
  Shopping: { color: "oklch(0.72 0.18 340)", icon: "🛍️" },
  Entertainment: { color: "oklch(0.7 0.2 295)", icon: "🎬" },
  Bills: { color: "oklch(0.7 0.16 60)", icon: "🧾" },
  Taxes: { color: "oklch(0.7 0.16 35)", icon: "🧮" },
  Healthcare: { color: "oklch(0.72 0.16 10)", icon: "💊" },
  Travel: { color: "oklch(0.75 0.16 220)", icon: "✈️" },
  Groceries: { color: "oklch(0.74 0.16 145)", icon: "🥬" },
  Subscriptions: { color: "oklch(0.7 0.18 280)", icon: "🔁" },
  Investments: { color: "oklch(0.72 0.16 170)", icon: "📈" },
  Income: { color: "oklch(0.72 0.18 155)", icon: "💰" },
  Other: { color: "oklch(0.7 0.04 280)", icon: "✨" },
};

export const SUBCATEGORIES: Partial<Record<Category, readonly string[]>> = {
  Bills: [
    "Rent", "Electricity", "Water", "Gas", "Internet", "Mobile Recharge",
    "Insurance", "Maintenance", "EMI / Loan Payment", "Other Bills",
  ],
  Taxes: [
    "Income Tax", "Property Tax", "Professional Tax", "Capital Gains Tax", "Other Taxes",
  ],
  Food: ["Dining Out", "Cafe / Coffee", "Snacks", "Delivery", "Other Food"],
  Transport: ["Fuel", "Public Transit", "Taxi / Ride-share", "Parking", "Vehicle Service", "Other Transport"],
  Shopping: ["Clothing", "Electronics", "Home", "Gifts", "Other Shopping"],
  Entertainment: ["Movies", "Events", "Games", "Music", "Other Entertainment"],
  Healthcare: ["Doctor", "Pharmacy", "Diagnostics", "Insurance Premium", "Other Healthcare"],
  Travel: ["Flights", "Hotels", "Transport", "Activities", "Other Travel"],
  Groceries: ["Supermarket", "Produce", "Household", "Other Groceries"],
  Subscriptions: ["Streaming", "Software", "News & Media", "Membership", "Other Subscription"],
  Income: ["Salary", "Freelance", "Refund", "Interest", "Gift", "Other Income"],
};

export function getSubcategories(category: Category | string | null | undefined): readonly string[] {
  if (!category) return [];
  return SUBCATEGORIES[category as Category] ?? [];
}


export const INVESTMENT_TYPES = [
  "Mutual Fund", "SIP", "Stock", "ETF", "Crypto", "Gold", "Fixed Deposit",
] as const;
export type InvestmentType = (typeof INVESTMENT_TYPES)[number];

export const PAYMENT_METHODS = ["Cash", "UPI", "Card", "Bank Transfer", "Other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const paymentMethodMeta: Record<PaymentMethod, { color: string; icon: string }> = {
  Cash: { color: "oklch(0.78 0.16 145)", icon: "💵" },
  UPI: { color: "oklch(0.75 0.16 260)", icon: "📲" },
  Card: { color: "oklch(0.72 0.18 320)", icon: "💳" },
  "Bank Transfer": { color: "oklch(0.72 0.16 220)", icon: "🏦" },
  Other: { color: "oklch(0.7 0.04 280)", icon: "•" },
};

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
  subcategory?: string | null;
  payment_method: string | null;
  notes: string | null;
  occurred_at: string;
  investment_id?: string | null;
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
