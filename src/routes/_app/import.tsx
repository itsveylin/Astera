import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, MessageSquare, Trash2, Check, X, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Topbar } from "@/components/Topbar";
import { parseFile, parseSMSBatch } from "@/lib/import";
import type { ParsedRow } from "@/lib/import";
import {
  useCreateImport, useImportedTransactions, useUpdateImported, useDeleteImported, useApproveImported,
} from "@/hooks/useImportData";
import type { ImportedTransaction } from "@/hooks/useImportData";
import { CATEGORIES, formatMoney, getSubcategories, PAYMENT_METHODS, type Category } from "@/lib/finance";
import { useProfile } from "@/hooks/useFinanceData";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/import")({
  head: () => ({ meta: [
    { title: "Import Transactions — Astera" },
    { name: "description", content: "Review and import bank statement and SMS transactions into Astera." },
    { property: "og:title", content: "Import Transactions — Astera" },
    { property: "og:description", content: "Review and import bank statement and SMS transactions into Astera." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ImportPage,
});

type Tab = "upload" | "sms" | "review";

function ImportPage() {
  const [tab, setTab] = useState<Tab>("upload");
  const { data: pending = [] } = useImportedTransactions("pending");
  const { data: profile } = useProfile();
  const currency = profile?.currency ?? "INR";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Topbar title="Import Transactions" subtitle="Bring in transactions from bank statements or SMS — nothing is saved until you approve it." />

      <div role="tablist" aria-label="Import source" className="glass rounded-3xl p-2 flex flex-wrap gap-1">
        {([
          { k: "upload", label: "Upload Statement", icon: Upload },
          { k: "sms", label: "Paste SMS", icon: MessageSquare },
          { k: "review", label: `Review${pending.length ? ` · ${pending.length}` : ""}`, icon: FileText },
        ] as const).map(({ k, label, icon: Icon }) => (
          <Button variant="ghost" role="tab" aria-selected={tab === k} key={k} onClick={() => setTab(k)}
            className={`h-auto min-h-11 flex items-center gap-2 px-3 py-2 rounded-2xl text-sm ${tab === k ? "gradient-primary text-primary-foreground shadow-[var(--shadow-soft)]" : "text-muted-foreground hover:text-foreground"}`}>
            <Icon className="size-4" /> {label}
          </Button>
        ))}
      </div>

      {tab === "upload" && <UploadPanel />}
      {tab === "sms" && <SmsPanel />}
      {tab === "review" && <ReviewPanel rows={pending} currency={currency} />}
    </div>
  );
}

function UploadPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<ParsedRow[] | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [source, setSource] = useState<"pdf" | "csv" | "xlsx">("csv");
  const create = useCreateImport();

  const onFile = async (file: File) => {
    setBusy(true);
    try {
      const rows = await parseFile(file);
      if (!rows.length) { toast.error("No transactions found in this file"); return; }
      const ext = file.name.toLowerCase().split(".").pop();
      const src = ext === "pdf" ? "pdf" : ext === "csv" ? "csv" : "xlsx";
      setSource(src);
      setFilename(file.name);
      setPreview(rows);
      toast.success(`Extracted ${rows.length} rows — review below`);
    } catch (e: any) {
      toast.error(e?.message || "Could not parse this file");
    } finally { setBusy(false); }
  };

  const stage = async () => {
    if (!preview) return;
    try {
      const res = await create.mutateAsync({ source, filename, rows: preview });
      toast.success(`Staged ${res.inserted} transactions${res.duplicates ? ` · ${res.duplicates} duplicates skipped` : ""}`);
      setPreview(null); setFilename(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (e: any) { toast.error(e?.message || "Failed to stage"); }
  };

  return (
    <div className="space-y-4">
      <label
        className="glass rounded-3xl border border-dashed border-border/70 p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/50 transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
      >
        <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,.pdf" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
        <Upload className="size-8 text-muted-foreground" />
        <div className="text-center">
          <div className="font-medium">Drop a bank statement or click to select</div>
          <div className="text-xs text-muted-foreground mt-1">Supports CSV, XLSX, and PDF · files are parsed in your browser and never uploaded</div>
        </div>
      </label>

      {busy && <div className="glass rounded-3xl p-6 text-sm text-muted-foreground animate-pulse">Parsing…</div>}

      {preview && (
        <div className="glass rounded-3xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium break-all">{filename}</div>
              <div className="text-xs text-muted-foreground">{preview.length} transactions extracted</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setPreview(null); setFilename(null); }} className="px-3 py-2 rounded-2xl text-sm text-muted-foreground hover:text-foreground">Discard</button>
              <button onClick={stage} disabled={create.isPending} className="px-4 py-2 rounded-2xl gradient-primary text-primary-foreground text-sm disabled:opacity-50">Stage for review</button>
            </div>
          </div>
          <PreviewList rows={preview.slice(0, 25)} />
          {preview.length > 25 && <div className="text-xs text-muted-foreground text-center">…and {preview.length - 25} more</div>}
        </div>
      )}
    </div>
  );
}

function PreviewList({ rows }: { rows: ParsedRow[] }) {
  return (
    <div className="rounded-2xl border border-border/50 divide-y divide-border/50 max-h-[420px] overflow-y-auto">
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-2 sm:flex items-center gap-3 px-3 py-2 text-sm">
          <div className="text-xs text-muted-foreground sm:w-24 shrink-0">{new Date(r.occurred_at).toLocaleDateString()}</div>
          <div className="sm:flex-1 min-w-0 truncate">{r.description}</div>
          <div className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground break-words">{r.category}</div>
          <div className={`sm:w-28 min-w-0 break-words text-right tabular-nums shrink-0 ${r.credit ? "text-success" : "text-destructive"}`}>
            {r.credit ? `+${r.credit.toFixed(2)}` : `-${(r.debit ?? 0).toFixed(2)}`}
          </div>
        </div>
      ))}
    </div>
  );
}

function SmsPanel() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const create = useCreateImport();

  const handleParse = async () => {
    if (!text.trim()) { toast.error("Paste one or more SMS messages"); return; }
    setBusy(true);
    try {
      const rows = await parseSMSBatch(text);
      if (!rows.length) { toast.error("No transaction details could be extracted"); return; }
      const res = await create.mutateAsync({ source: "sms", filename: null, rows });
      toast.success(`Staged ${res.inserted} messages${res.duplicates ? ` · ${res.duplicates} duplicates skipped` : ""}`);
      setText("");
    } catch (e: any) { toast.error(e?.message || "Parsing failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="glass rounded-3xl p-6 space-y-4">
      <div>
        <div className="font-medium mb-1">Paste bank SMS messages</div>
        <div className="text-xs text-muted-foreground">Separate multiple messages with a blank line. Amount, type, merchant, date and account will be extracted.</div>
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={10}
        placeholder="INR 450 debited from A/C XX1234 on 15-Jul-2026 to AMAZON PAY."
        className="w-full rounded-2xl border border-border/60 bg-background/60 p-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/40" />
      <div className="flex justify-end">
        <button onClick={handleParse} disabled={busy} className="px-4 py-2 rounded-2xl gradient-primary text-primary-foreground text-sm disabled:opacity-50">
          {busy ? "Parsing…" : "Extract & stage"}
        </button>
      </div>
    </div>
  );
}

function ReviewPanel({ rows, currency }: { rows: ImportedTransaction[]; currency: string }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const update = useUpdateImported();
  const del = useDeleteImported();
  const approve = useApproveImported();
  const allIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  const toggle = (id: string) => {
    const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n);
  };
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(allIds));

  const approveSelected = async () => {
    const chosen = rows.filter((r) => selected.has(r.id));
    if (!chosen.length) { toast.error("Select at least one row"); return; }
    try {
      const res = await approve.mutateAsync(chosen);
      toast.success(`Imported ${res.count} transactions`);
      setSelected(new Set());
    } catch (e: any) { toast.error(e?.message || "Import failed"); }
  };

  if (!rows.length) {
    return (
      <div className="glass rounded-3xl p-10 text-center text-muted-foreground">
        <FileText className="size-8 mx-auto mb-3 opacity-60" />
        Nothing to review. Upload a statement or paste SMS messages to get started.
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded" />
          Select all ({rows.length})
        </label>
        <div className="flex gap-2">
          <button onClick={approveSelected} disabled={approve.isPending || !selected.size}
            className="px-4 py-2 rounded-2xl gradient-primary text-primary-foreground text-sm flex items-center gap-2 disabled:opacity-50">
            <Check className="size-4" /> Approve selected ({selected.size})
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/50 divide-y divide-border/50 overflow-hidden">
        {rows.map((r) => (
          <ReviewRow key={r.id} row={r} selected={selected.has(r.id)} onToggle={() => toggle(r.id)}
            onEdit={(patch) => update.mutate({ id: r.id, patch })}
            onDelete={() => del.mutate(r.id)} currency={currency} />
        ))}
      </div>
    </div>
  );
}

function ReviewRow({ row, selected, onToggle, onEdit, onDelete, currency }: {
  row: ImportedTransaction; selected: boolean; onToggle: () => void;
  onEdit: (patch: Partial<ImportedTransaction>) => void; onDelete: () => void; currency: string;
}) {
  const [open, setOpen] = useState(false);
  const amt = row.credit && row.credit > 0 ? row.credit : -(row.debit || 0);
  const category = (row.category as Category) || "Other";
  const subs = getSubcategories(category);
  const low = row.confidence < 0.5;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-background/40">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <input type="checkbox" checked={selected} onChange={onToggle} className="rounded shrink-0" />
        <div className="text-xs text-muted-foreground w-24 shrink-0 tabular-nums">
          {new Date(row.occurred_at).toLocaleDateString(undefined, { day: "2-digit", month: "short" })}
        </div>
        <button className="flex-1 min-w-0 text-left" onClick={() => setOpen((o) => !o)}>
          <div className="truncate text-sm font-medium">{row.description}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{category}</span>
            {row.subcategory && <span className="text-xs text-muted-foreground">· {row.subcategory}</span>}
            {row.payment_method && <span className="text-xs text-muted-foreground">· {row.payment_method}</span>}
            {low && <span className="inline-flex items-center gap-1 text-xs text-[oklch(0.65_0.16_60)]"><AlertCircle className="size-3" /> Low confidence</span>}
          </div>
        </button>
        <div className={`w-32 text-right tabular-nums shrink-0 text-sm font-medium ${amt >= 0 ? "text-[var(--color-success)]" : "text-destructive"}`}>
          {amt >= 0 ? "+" : "-"}{formatMoney(Math.abs(amt), currency)}
        </div>
        <button onClick={onDelete} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0">
          <Trash2 className="size-4" />
        </button>
      </div>
      {open && (
        <div className="px-3 pb-3 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-border/40 bg-background/30">
          <Field label="Description">
            <input defaultValue={row.description} onBlur={(e) => e.target.value !== row.description && onEdit({ description: e.target.value })}
              className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm" />
          </Field>
          <Field label="Amount">
            <input type="number" step="0.01" defaultValue={Math.abs(amt).toString()}
              onBlur={(e) => {
                const v = Math.abs(Number(e.target.value) || 0);
                if (v === Math.abs(amt)) return;
                if (amt >= 0) onEdit({ credit: v, debit: null }); else onEdit({ debit: v, credit: null });
              }}
              className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm tabular-nums" />
          </Field>
          <Field label="Type">
            <select value={amt >= 0 ? "credit" : "debit"}
              onChange={(e) => e.target.value === "credit" ? onEdit({ credit: Math.abs(amt) || 0, debit: null }) : onEdit({ debit: Math.abs(amt) || 0, credit: null })}
              className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm">
              <option value="debit">Expense</option>
              <option value="credit">Income</option>
            </select>
          </Field>
          <Field label="Category">
            <select value={category} onChange={(e) => onEdit({ category: e.target.value, subcategory: null })}
              className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          {subs.length > 0 && (
            <Field label="Subcategory">
              <select value={row.subcategory ?? ""} onChange={(e) => onEdit({ subcategory: e.target.value || null })}
                className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm">
                <option value="">—</option>
                {subs.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          )}
          <Field label="Payment method">
            <select value={row.payment_method ?? ""} onChange={(e) => onEdit({ payment_method: e.target.value || null })}
              className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm">
              <option value="">—</option>
              {PAYMENT_METHODS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          {row.raw_text && (
            <Field label="Source">
              <div className="text-xs text-muted-foreground bg-muted/40 rounded-xl p-2 font-mono break-words sm:col-span-2">{row.raw_text}</div>
            </Field>
          )}
        </div>
      )}
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
