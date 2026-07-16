import * as XLSX from "xlsx";
import type { Category } from "./finance";
import { CATEGORIES } from "./finance";

export interface ParsedRow {
  occurred_at: string; // ISO
  description: string;
  debit: number | null;
  credit: number | null;
  balance: number | null;
  category: Category;
  subcategory: string | null;
  payment_method: string | null;
  confidence: number;
  dedupe_hash: string;
  raw_text: string | null;
}

// -------- Rule-based categorization ----------
const RULES: Array<{ match: RegExp; category: Category; subcategory?: string; payment?: string }> = [
  { match: /swiggy|zomato|dunzo|eatsure|ubereats|doordash/i, category: "Food", subcategory: "Delivery" },
  { match: /starbucks|cafe|coffee|barista/i, category: "Food", subcategory: "Cafe / Coffee" },
  { match: /uber|ola|rapido|lyft|meru/i, category: "Transport", subcategory: "Taxi / Ride-share" },
  { match: /petrol|diesel|indian oil|iocl|bharat petroleum|hpcl|shell|bpcl/i, category: "Transport", subcategory: "Fuel" },
  { match: /metro|irctc|railway|bus fare|bmtc|ksrtc|dmrc/i, category: "Transport", subcategory: "Public Transit" },
  { match: /amazon|flipkart|myntra|ajio|meesho|snapdeal|nykaa/i, category: "Shopping" },
  { match: /bigbasket|blinkit|zepto|dmart|reliance fresh|grofers|instamart/i, category: "Groceries", subcategory: "Supermarket" },
  { match: /netflix|prime video|hotstar|spotify|apple music|youtube premium|jio ?cinema|sonyliv|zee5/i, category: "Subscriptions", subcategory: "Streaming" },
  { match: /electricity|bescom|tneb|msedcl|adani electricity|torrent power/i, category: "Bills", subcategory: "Electricity" },
  { match: /water bill|bwssb|jal board/i, category: "Bills", subcategory: "Water" },
  { match: /gas bill|indraprastha gas|mahanagar gas|igl|mgl/i, category: "Bills", subcategory: "Gas" },
  { match: /airtel|jio|vodafone|vi |bsnl|mobile recharge|prepaid/i, category: "Bills", subcategory: "Mobile Recharge" },
  { match: /broadband|internet|act fibernet|hathway|excitel|tata play/i, category: "Bills", subcategory: "Internet" },
  { match: /rent|landlord|nobroker/i, category: "Bills", subcategory: "Rent" },
  { match: /insurance|policybazaar|lic |hdfc life|max life/i, category: "Bills", subcategory: "Insurance" },
  { match: /emi|loan|home loan|car loan/i, category: "Bills", subcategory: "EMI / Loan Payment" },
  { match: /salary|payroll|credit-salary|sal-cr/i, category: "Income", subcategory: "Salary" },
  { match: /refund|reversal/i, category: "Income", subcategory: "Refund" },
  { match: /interest credited|int\.pd|int credit/i, category: "Income", subcategory: "Interest" },
  { match: /pharmacy|apollo|medplus|1mg|pharmeasy|hospital|clinic/i, category: "Healthcare", subcategory: "Pharmacy" },
  { match: /makemytrip|goibibo|cleartrip|ixigo|indigo|airindia|vistara|spicejet/i, category: "Travel", subcategory: "Flights" },
  { match: /oyo|hotel|airbnb|booking\.com|agoda/i, category: "Travel", subcategory: "Hotels" },
  { match: /sip|mutual fund|zerodha|groww|kuvera|coin|upstox/i, category: "Investments" },
  { match: /income tax|itr|tds/i, category: "Taxes", subcategory: "Income Tax" },
  { match: /bookmyshow|pvr|inox|cinema/i, category: "Entertainment", subcategory: "Movies" },
];

export function categorize(description: string): { category: Category; subcategory: string | null; confidence: number } {
  const text = description || "";
  for (const r of RULES) {
    if (r.match.test(text)) return { category: r.category, subcategory: r.subcategory ?? null, confidence: 0.9 };
  }
  return { category: "Other", subcategory: null, confidence: 0.4 };
}

export function inferPaymentMethod(description: string): string | null {
  const t = description.toLowerCase();
  if (/upi|@ok|@ybl|@paytm|gpay|phonepe/.test(t)) return "UPI";
  if (/neft|imps|rtgs|transfer|xfer/.test(t)) return "Bank Transfer";
  if (/card|pos |visa|mastercard|rupay/.test(t)) return "Card";
  if (/atm|cash wdl|withdrawal/.test(t)) return "Cash";
  return null;
}

// -------- Hash for dedupe ----------
export async function dedupeHash(occurred_at: string, description: string, amt: number): Promise<string> {
  const key = `${occurred_at.slice(0, 10)}|${description.trim().toLowerCase().replace(/\s+/g, " ")}|${amt.toFixed(2)}`;
  const buf = new TextEncoder().encode(key);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// -------- Date parsing ----------
const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
};
export function parseDate(s: string): Date | null {
  if (!s) return null;
  const str = String(s).trim();
  // Excel serial
  const asNum = Number(str);
  if (!isNaN(asNum) && asNum > 20000 && asNum < 80000) {
    const d = XLSX.SSF.parse_date_code(asNum);
    if (d) return new Date(d.y, d.m - 1, d.d, d.H || 0, d.M || 0, d.S || 0);
  }
  // dd-Mon-yyyy or dd Mon yyyy
  let m = str.match(/(\d{1,2})[-\s\/]([A-Za-z]{3,})[-\s\/](\d{2,4})/);
  if (m) {
    const day = +m[1], mo = MONTHS[m[2].toLowerCase().slice(0, 3)], yr = +m[3] < 100 ? 2000 + +m[3] : +m[3];
    if (mo !== undefined) return new Date(yr, mo, day);
  }
  // dd/mm/yyyy or dd-mm-yyyy
  m = str.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (m) {
    const day = +m[1], mo = +m[2] - 1, yr = +m[3] < 100 ? 2000 + +m[3] : +m[3];
    return new Date(yr, mo, day);
  }
  // yyyy-mm-dd
  m = str.match(/(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function parseAmount(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/[^\d.\-]/g, ""));
  return isNaN(n) ? null : n;
}

// -------- Column detection ----------
const COL_ALIASES = {
  date: ["date", "txn date", "transaction date", "value date", "posting date"],
  desc: ["description", "narration", "particulars", "details", "remarks", "merchant", "transaction", "info"],
  debit: ["debit", "withdrawal", "withdrawal amt", "dr", "withdrawal amount", "amount debited"],
  credit: ["credit", "deposit", "deposit amt", "cr", "credit amount", "amount credited"],
  amount: ["amount", "txn amount", "transaction amount"],
  balance: ["balance", "running balance", "closing balance", "available balance"],
};
function findCol(headers: string[], aliases: string[]): number {
  const lower = headers.map((h) => (h ?? "").toString().trim().toLowerCase());
  for (const a of aliases) {
    const i = lower.findIndex((h) => h === a);
    if (i >= 0) return i;
  }
  for (const a of aliases) {
    const i = lower.findIndex((h) => h.includes(a));
    if (i >= 0) return i;
  }
  return -1;
}

async function rowsToParsed(rows: any[][]): Promise<ParsedRow[]> {
  if (!rows.length) return [];
  // Find header row: first row where at least 2 aliases match
  let headerIdx = 0;
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const strs = rows[i].map((c) => String(c ?? "").toLowerCase());
    const matches = ["date", "description", "narration", "debit", "credit", "amount", "balance"].filter((k) =>
      strs.some((s) => s.includes(k)),
    ).length;
    if (matches >= 2) { headerIdx = i; break; }
  }
  const headers = rows[headerIdx].map((h) => String(h ?? ""));
  const dateCol = findCol(headers, COL_ALIASES.date);
  const descCol = findCol(headers, COL_ALIASES.desc);
  const debitCol = findCol(headers, COL_ALIASES.debit);
  const creditCol = findCol(headers, COL_ALIASES.credit);
  const amtCol = findCol(headers, COL_ALIASES.amount);
  const balCol = findCol(headers, COL_ALIASES.balance);
  if (dateCol < 0 || descCol < 0) throw new Error("Could not detect Date and Description columns");

  const out: ParsedRow[] = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.every((c) => c === null || c === undefined || c === "")) continue;
    const d = parseDate(r[dateCol]);
    if (!d) continue;
    const desc = String(r[descCol] ?? "").trim();
    if (!desc) continue;
    let debit = debitCol >= 0 ? parseAmount(r[debitCol]) : null;
    let credit = creditCol >= 0 ? parseAmount(r[creditCol]) : null;
    if ((debit === null || debit === 0) && (credit === null || credit === 0) && amtCol >= 0) {
      const a = parseAmount(r[amtCol]);
      if (a !== null) { if (a < 0) debit = Math.abs(a); else credit = a; }
    }
    if ((!debit || debit === 0) && (!credit || credit === 0)) continue;
    const balance = balCol >= 0 ? parseAmount(r[balCol]) : null;
    const cat = categorize(desc);
    // Force income if credit only
    let category = cat.category;
    if (credit && !debit && category === "Other") category = "Income";
    const pm = inferPaymentMethod(desc);
    const amt = debit ? -debit : credit || 0;
    const hash = await dedupeHash(d.toISOString(), desc, amt);
    out.push({
      occurred_at: d.toISOString(), description: desc,
      debit: debit || null, credit: credit || null, balance,
      category, subcategory: cat.subcategory,
      payment_method: pm, confidence: cat.confidence,
      dedupe_hash: hash, raw_text: null,
    });
  }
  return out;
}

// -------- CSV ----------
function parseCSV(text: string): any[][] {
  const rows: any[][] = []; let cur: string[] = []; let field = ""; let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else field += c;
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  return rows;
}

export async function parseFile(file: File): Promise<ParsedRow[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) {
    const text = await file.text();
    return rowsToParsed(parseCSV(text));
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array", cellDates: false });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: true, defval: null });
    return rowsToParsed(rows);
  }
  if (name.endsWith(".pdf")) return parsePDF(file);
  throw new Error("Unsupported file format. Use CSV, XLSX, or PDF.");
}

async function parsePDF(file: File): Promise<ParsedRow[]> {
  const pdfjs: any = await import("pdfjs-dist");
  const worker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url" as any)).default;
  pdfjs.GlobalWorkerOptions.workerSrc = worker;
  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  const lines: string[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();
    // Group items by y
    const byY: Map<number, { x: number; s: string }[]> = new Map();
    for (const it of tc.items as any[]) {
      const y = Math.round(it.transform[5]);
      const x = it.transform[4];
      if (!byY.has(y)) byY.set(y, []);
      byY.get(y)!.push({ x, s: it.str });
    }
    const ys = Array.from(byY.keys()).sort((a, b) => b - a);
    for (const y of ys) {
      const line = byY.get(y)!.sort((a, b) => a.x - b.x).map((p) => p.s).join(" ").replace(/\s+/g, " ").trim();
      if (line) lines.push(line);
    }
  }
  return parseStatementLines(lines);
}

function parseStatementLines(lines: string[]): Promise<ParsedRow[]> {
  const dateRe = /(\d{1,2}[-\/\s][A-Za-z]{3,}[-\/\s]\d{2,4}|\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4}|\d{4}[-\/.]\d{1,2}[-\/.]\d{1,2})/;
  const numRe = /-?[\d,]+\.\d{2}/g;
  const out: Promise<ParsedRow>[] = [];
  for (const line of lines) {
    const dm = line.match(dateRe);
    if (!dm) continue;
    const d = parseDate(dm[0]); if (!d) continue;
    const nums = line.match(numRe);
    if (!nums || nums.length < 1) continue;
    const parsed = nums.map((n) => parseFloat(n.replace(/,/g, "")));
    // Heuristic: last number is balance, previous is amount
    let amount: number; let balance: number | null = null;
    if (parsed.length >= 2) { balance = parsed[parsed.length - 1]; amount = parsed[parsed.length - 2]; }
    else amount = parsed[0];
    // Description = text between the date and the first number
    const firstNumIdx = line.search(numRe);
    const dateEnd = dm.index! + dm[0].length;
    const desc = line.substring(dateEnd, firstNumIdx).replace(/^\s+|\s+$/g, "").replace(/\s+/g, " ");
    if (!desc || Math.abs(amount) < 0.01) continue;
    // Guess debit/credit by "Cr"/"Dr" markers
    const isCredit = /\bcr\b|credit/i.test(line);
    const isDebit = /\bdr\b|debit/i.test(line);
    let debit: number | null = null, credit: number | null = null;
    if (isCredit && !isDebit) credit = Math.abs(amount);
    else if (isDebit && !isCredit) debit = Math.abs(amount);
    else debit = Math.abs(amount); // default assume debit
    const cat = categorize(desc);
    let category = cat.category;
    if (credit && !debit && category === "Other") category = "Income";
    const pm = inferPaymentMethod(desc);
    const signed = debit ? -debit : (credit || 0);
    out.push(dedupeHash(d.toISOString(), desc, signed).then((h) => ({
      occurred_at: d.toISOString(), description: desc,
      debit, credit, balance,
      category, subcategory: cat.subcategory,
      payment_method: pm, confidence: 0.65,
      dedupe_hash: h, raw_text: line,
    })));
  }
  return Promise.all(out);
}

// -------- SMS parsing ----------
export async function parseSMSBatch(text: string): Promise<ParsedRow[]> {
  const msgs = text.split(/\n\s*\n+|(?=^[A-Z\-]{2,}: )/m).map((s) => s.trim()).filter(Boolean);
  const out: ParsedRow[] = [];
  for (const m of msgs) {
    const p = await parseSMS(m);
    if (p) out.push(p);
  }
  return out;
}

export async function parseSMS(sms: string): Promise<ParsedRow | null> {
  if (!sms) return null;
  const amtMatch = sms.match(/(?:INR|Rs\.?|₹|USD|\$)\s*([\d,]+(?:\.\d{1,2})?)/i) || sms.match(/([\d,]+\.\d{2})/);
  if (!amtMatch) return null;
  const amount = parseFloat(amtMatch[1].replace(/,/g, ""));
  if (!amount || isNaN(amount)) return null;

  const isDebit = /debited|debit|withdrawn|spent|paid|purchase|charged/i.test(sms);
  const isCredit = /credited|credit|received|deposited|refund|salary/i.test(sms);
  const type: "debit" | "credit" = isCredit && !isDebit ? "credit" : "debit";

  const dateMatch = sms.match(/on\s+(\d{1,2}[-\/\s][A-Za-z]{3,}[-\/\s]\d{2,4}|\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4})/i);
  const d = dateMatch ? parseDate(dateMatch[1]) : new Date();
  const timeMatch = sms.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
  if (d && timeMatch) {
    const parts = timeMatch[1].split(":").map(Number);
    d.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0);
  }
  const occ = d || new Date();

  // Merchant: after "to", "at", "for", "info:"
  let merchant = "";
  const mm =
    sms.match(/(?:to|paid to|at|towards|for|info[:\-]|received from|credited by)\s+([A-Z0-9][A-Za-z0-9 &.\-*]{2,60})/i);
  if (mm) merchant = mm[1].trim().replace(/\.?$/, "").replace(/\s+on\s+.*$/i, "");
  if (!merchant) {
    const upi = sms.match(/UPI[\/\-\:]?\s*([A-Za-z0-9._\-@]+)/i);
    if (upi) merchant = upi[1];
  }
  if (!merchant) merchant = "Bank transaction";
  merchant = merchant.split(/\s+/).slice(0, 6).join(" ");

  const acct = sms.match(/A\/C[\s.]*(?:[Xx*]+)?(\d{2,6})/i);
  const notes = acct ? `A/C ...${acct[1]}` : null;

  const cat = categorize(merchant + " " + sms);
  let category = cat.category;
  if (type === "credit" && category === "Other") category = "Income";
  const pm = inferPaymentMethod(sms) ?? (/UPI/i.test(sms) ? "UPI" : "Bank Transfer");

  const debit = type === "debit" ? amount : null;
  const credit = type === "credit" ? amount : null;
  const signed = type === "debit" ? -amount : amount;
  const hash = await dedupeHash(occ.toISOString(), merchant, signed);

  return {
    occurred_at: occ.toISOString(),
    description: merchant,
    debit, credit, balance: null,
    category, subcategory: cat.subcategory ?? (notes ? null : null),
    payment_method: pm,
    confidence: 0.75,
    dedupe_hash: hash,
    raw_text: sms + (notes ? " · " + notes : ""),
  };
}

export const _ALL_CATEGORIES = CATEGORIES;
