import {
  LayoutDashboard, Receipt, BarChart3, Wallet, Target, TrendingUp,
  RefreshCw, FileText, Settings, Repeat, CreditCard, Download,
} from "lucide-react";

// Both navigation surfaces use this registry to keep route coverage identical.
export const financeNavigation = [
  { to: "/dashboard", label: "Dashboard", mobileLabel: "Home", icon: LayoutDashboard, group: "Everyday money" },
  { to: "/transactions", label: "Transactions", mobileLabel: "Txns", icon: Receipt, group: "Everyday money" },
  { to: "/recurring", label: "Recurring", icon: Repeat, group: "Everyday money" },
  { to: "/import", label: "Import Transactions", icon: Download, group: "Everyday money" },
  { to: "/analytics", label: "Analytics", mobileLabel: "Stats", icon: BarChart3, group: "Planning & growth" },
  { to: "/budgets", label: "Budgets", icon: Wallet, group: "Planning & growth" },
  { to: "/goals", label: "Goals", mobileLabel: "Goals", icon: Target, group: "Planning & growth" },
  { to: "/investments", label: "Investments", icon: TrendingUp, group: "Planning & growth" },
  { to: "/credit-cards", label: "Credit Cards", icon: CreditCard, group: "Cards & subscriptions" },
  { to: "/subscriptions", label: "Subscriptions", icon: RefreshCw, group: "Cards & subscriptions" },
  { to: "/report", label: "Year Report", icon: FileText, group: "Planning & growth" },
  { to: "/settings", label: "Settings", icon: Settings, group: "Account & privacy" },
] as const;

export const mobilePrimaryNavigation = financeNavigation.filter((item) => "mobileLabel" in item);
export const navigationGroups = ["Everyday money", "Planning & growth", "Cards & subscriptions", "Account & privacy"] as const;