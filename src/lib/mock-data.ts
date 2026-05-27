export type Category =
  | "Food" | "Transport" | "Shopping" | "Entertainment" | "Bills"
  | "Healthcare" | "Travel" | "Groceries" | "Subscriptions" | "Investments" | "Income" | "Other";

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

export interface Transaction {
  id: string;
  merchant: string;
  amount: number; // negative = expense
  category: Category;
  paymentMethod: "UPI" | "Card" | "Cash" | "NetBanking";
  app: "PhonePe" | "GPay" | "Paytm" | "HDFC" | "ICICI" | "Cash" | "Amazon Pay";
  date: string;
  notes?: string;
}

const merchants: Array<[string, Category, number, Transaction["app"]]> = [
  ["Zomato", "Food", -480, "PhonePe"],
  ["Swiggy Instamart", "Groceries", -1240, "GPay"],
  ["Uber", "Transport", -245, "GPay"],
  ["Netflix", "Subscriptions", -649, "HDFC"],
  ["Spotify", "Subscriptions", -119, "Paytm"],
  ["Amazon", "Shopping", -2399, "Amazon Pay"],
  ["BigBasket", "Groceries", -1850, "PhonePe"],
  ["Indigo Airlines", "Travel", -8420, "HDFC"],
  ["Apollo Pharmacy", "Healthcare", -560, "GPay"],
  ["BookMyShow", "Entertainment", -780, "Paytm"],
  ["Electricity Bill", "Bills", -2100, "ICICI"],
  ["SIP – Parag Parikh", "Investments", -10000, "ICICI"],
  ["Salary – Acme Corp", "Income", 185000, "HDFC"],
  ["Freelance Project", "Income", 42000, "HDFC"],
  ["Starbucks", "Food", -380, "GPay"],
  ["Ola", "Transport", -180, "Paytm"],
  ["Myntra", "Shopping", -3499, "PhonePe"],
  ["Prime Video", "Subscriptions", -179, "HDFC"],
  ["IRCTC", "Travel", -1240, "GPay"],
  ["Cult.fit", "Healthcare", -1499, "HDFC"],
];

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateTransactions(count = 80): Transaction[] {
  const r = rand(42);
  const out: Transaction[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const m = merchants[Math.floor(r() * merchants.length)];
    const d = new Date(now);
    d.setDate(now.getDate() - Math.floor(r() * 90));
    d.setHours(Math.floor(r() * 24), Math.floor(r() * 60));
    const variance = 0.7 + r() * 0.6;
    out.push({
      id: `tx_${i}`,
      merchant: m[0],
      category: m[1],
      amount: Math.round(m[2] * variance),
      app: m[3],
      paymentMethod: m[3] === "Cash" ? "Cash" : m[3] === "HDFC" || m[3] === "ICICI" ? "Card" : "UPI",
      date: d.toISOString(),
    });
  }
  return out.sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export const transactions = generateTransactions(120);

export const budgets = [
  { category: "Food" as Category, limit: 8000, spent: 5840 },
  { category: "Groceries" as Category, limit: 12000, spent: 9420 },
  { category: "Transport" as Category, limit: 4000, spent: 4280 },
  { category: "Entertainment" as Category, limit: 3000, spent: 1240 },
  { category: "Shopping" as Category, limit: 10000, spent: 11200 },
  { category: "Subscriptions" as Category, limit: 2000, spent: 1547 },
  { category: "Bills" as Category, limit: 8000, spent: 6300 },
  { category: "Healthcare" as Category, limit: 3000, spent: 2059 },
];

export const goals = [
  { id: "g1", name: "Emergency Fund", target: 300000, saved: 218000, deadline: "2026-12-31", emoji: "🛟" },
  { id: "g2", name: "Bali Vacation", target: 150000, saved: 84000, deadline: "2026-09-01", emoji: "🌴" },
  { id: "g3", name: "MacBook Pro", target: 250000, saved: 165000, deadline: "2026-08-15", emoji: "💻" },
  { id: "g4", name: "Down Payment – Home", target: 2000000, saved: 540000, deadline: "2028-04-01", emoji: "🏡" },
  { id: "g5", name: "MBA Tuition", target: 1200000, saved: 320000, deadline: "2027-06-01", emoji: "🎓" },
];

export const investments = [
  { name: "Parag Parikh Flexi Cap", type: "Mutual Fund", invested: 240000, current: 318000, allocation: 28 },
  { name: "Nippon Small Cap", type: "Mutual Fund", invested: 120000, current: 162400, allocation: 14 },
  { name: "Nifty 50 ETF", type: "ETF", invested: 180000, current: 214000, allocation: 19 },
  { name: "TCS", type: "Stock", invested: 90000, current: 104500, allocation: 9 },
  { name: "HDFC Bank", type: "Stock", invested: 70000, current: 78400, allocation: 7 },
  { name: "Bitcoin", type: "Crypto", invested: 50000, current: 89000, allocation: 8 },
  { name: "Sovereign Gold Bond", type: "Gold", invested: 60000, current: 71200, allocation: 6 },
  { name: "SBI Fixed Deposit", type: "FD", invested: 100000, current: 108400, allocation: 9 },
];

export const subscriptions = [
  { name: "Netflix", amount: 649, cycle: "Monthly", next: "2026-06-12", category: "Streaming", color: "#E50914", used: true },
  { name: "Spotify", amount: 119, cycle: "Monthly", next: "2026-06-04", category: "Music", color: "#1DB954", used: true },
  { name: "Amazon Prime", amount: 1499, cycle: "Yearly", next: "2026-11-22", category: "Shopping", color: "#FF9900", used: true },
  { name: "Notion Plus", amount: 800, cycle: "Monthly", next: "2026-06-18", category: "Productivity", color: "#000", used: true },
  { name: "iCloud 200GB", amount: 219, cycle: "Monthly", next: "2026-06-09", category: "Storage", color: "#0071e3", used: true },
  { name: "Adobe Creative Cloud", amount: 1675, cycle: "Monthly", next: "2026-06-25", category: "Design", color: "#FA0F00", used: false },
  { name: "ChatGPT Plus", amount: 1750, cycle: "Monthly", next: "2026-06-15", category: "AI", color: "#10A37F", used: true },
];

export const insights = [
  { tone: "warn", title: "Food spending up 18%", body: "You spent ₹5,840 on food this week vs ₹4,950 last week. Cooking 2 more meals at home could save ₹1,200." },
  { tone: "good", title: "Transport spending decreasing", body: "Your transport expenses dropped by 12% this month. Keep using the metro pass!" },
  { tone: "info", title: "Hidden subscriptions detected", body: "You may save ₹4,200 monthly by cancelling 2 unused subscriptions." },
  { tone: "good", title: "Savings goal on track", body: "You're 73% to your Emergency Fund — 2 months ahead of schedule." },
];

export const monthlySpend = [
  { month: "Jan", income: 198000, expense: 92000, savings: 106000 },
  { month: "Feb", income: 185000, expense: 88000, savings: 97000 },
  { month: "Mar", income: 210000, expense: 104000, savings: 106000 },
  { month: "Apr", income: 195000, expense: 96000, savings: 99000 },
  { month: "May", income: 227000, expense: 112000, savings: 115000 },
  { month: "Jun", income: 215000, expense: 98000, savings: 117000 },
  { month: "Jul", income: 220000, expense: 105000, savings: 115000 },
  { month: "Aug", income: 232000, expense: 119000, savings: 113000 },
  { month: "Sep", income: 218000, expense: 102000, savings: 116000 },
  { month: "Oct", income: 245000, expense: 124000, savings: 121000 },
  { month: "Nov", income: 238000, expense: 117000, savings: 121000 },
  { month: "Dec", income: 280000, expense: 142000, savings: 138000 },
];

export const heatmapData = (() => {
  const r = rand(7);
  return Array.from({ length: 12 * 7 }, (_, i) => ({
    week: Math.floor(i / 7),
    day: i % 7,
    value: Math.round(r() * 4500 + 200),
  }));
})();

export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export const totals = {
  balance: 487320,
  income: 245000,
  expense: 124000,
  savings: 121000,
  investments: 1145900,
  netWorth: 1633220,
  cash: 14200,
  upcomingBills: 12480,
};
