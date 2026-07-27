"use client";

import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Eye, Send, Download, X, CheckCircle2, XCircle, Loader2, Sparkles, Trash2, MessageCircle } from "lucide-react";
import Link from "next/link";
import { downloadFile } from "@/lib/download";
import { buildWhatsAppShareLink } from "@/lib/whatsapp";
import { useSession } from "next-auth/react";
import { formatCurrency, MONTH_NAMES } from "@/lib/salary";

interface PayrollRow {
  id: string;
  month: number;
  year: number;
  employeeCount: number;
  totalGross: number;
  totalDeduction: number;
  totalNet: number;
  status: string;
  createdAt: string;
}

interface SlipPreview {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  email: string;
  phone?: string | null;
  department?: string;
  grossSalary: number;
  totalDeduction: number;
  netSalary: number;
}

type ProgressEvent =
  | { type: "start"; total: number }
  | { type: "progress"; employeeName: string; status: "success" | "failed"; error?: string; completed: number; total: number }
  | { type: "done"; success: number; failed: number }
  | { type: "error"; error: string };

export default function PayrollClient({ initialPayrolls }: { initialPayrolls: PayrollRow[] }) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const isAdmin = role === "ADMIN";
  const canManage = role === "ADMIN" || role === "MANAGER";
  const [payrolls, setPayrolls] = useState<PayrollRow[]>(initialPayrolls);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [generating, setGenerating] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSlips, setPreviewSlips] = useState<SlipPreview[]>([]);
  const [activePayroll, setActivePayroll] = useState<PayrollRow | null>(null);

  const [sending, setSending] = useState(false);
  const [sendingWhatsAppId, setSendingWhatsAppId] = useState<string | null>(null);
  const [progressEvents, setProgressEvents] = useState<ProgressEvent[]>([]);
  const [progressOpen, setProgressOpen] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/payroll/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to generate payroll");
        return;
      }
      toast.success(`Payroll generated for ${MONTH_NAMES[month - 1]} ${year}`);
      setPayrolls((prev) => [
        {
          id: json.payroll.id,
          month,
          year,
          employeeCount: json.payroll.employeeCount,
          totalGross: Number(json.payroll.totalGross),
          totalDeduction: Number(json.payroll.totalDeduction),
          totalNet: Number(json.payroll.totalNet),
          status: json.payroll.status,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    } finally {
      setGenerating(false);
    }
  }

  async function handlePreview(p: PayrollRow) {
    setActivePayroll(p);
    const res = await fetch(`/api/payroll/${p.id}/slips`);
    const json = await res.json();
    setPreviewSlips(json.slips || []);
    setPreviewOpen(true);
  }

  async function handleDeleteSlip(slipId: string, employeeName: string) {
    if (!confirm(`Delete the salary slip for ${employeeName}? This cannot be undone.`)) return;

    const res = await fetch(`/api/payroll/slip/${slipId}`, { method: "DELETE" });
    const json = await res.json();

    if (!res.ok) {
      toast.error(json.error || "Failed to delete salary slip");
      return;
    }

    toast.success("Salary slip deleted");
    setPreviewSlips((prev) => prev.filter((s) => s.id !== slipId));

    if (json.payrollDeleted) {
      setPayrolls((prev) => prev.filter((p) => p.id !== activePayroll?.id));
      setPreviewOpen(false);
    } else if (activePayroll) {
      const res2 = await fetch("/api/payroll");
      const json2 = await res2.json();
      if (res2.ok) {
        setPayrolls(json2.payrolls || []);
      }
    }
  }

  async function handleSendWhatsApp(slip: SlipPreview) {
    if (!slip.phone) {
      toast.error("This employee has no phone number on file — add one in Employees first.");
      return;
    }
    setSendingWhatsAppId(slip.id);
    try {
      const monthLabel = activePayroll ? `${MONTH_NAMES[activePayroll.month - 1]} ${activePayroll.year}` : "";
      const filename = `SalarySlip_${slip.employeeCode}_${monthLabel.replace(" ", "_")}.pdf`;
      await downloadFile(`/api/payroll/slip/${slip.id}/pdf`, filename);
      const message = `Hi ${slip.employeeName}, please find attached your salary slip for ${monthLabel}. (The PDF was just downloaded to your device — please attach it here before sending)`;
      window.open(buildWhatsAppShareLink(slip.phone, message), "_blank");
      toast.success("PDF downloaded — attach it in the WhatsApp chat that just opened");
    } catch {
      toast.error("Failed to prepare WhatsApp message");
    } finally {
      setSendingWhatsAppId(null);
    }
  }

  async function handleSend(p: PayrollRow) {
    setActivePayroll(p);
    setProgressEvents([]);
    setProgressOpen(true);
    setSending(true);

    const res = await fetch("/api/payroll/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payrollId: p.id }),
    });

    if (!res.body) {
      setSending(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";
      for (const part of parts) {
        const line = part.replace(/^data: /, "").trim();
        if (!line) continue;
        const evt: ProgressEvent = JSON.parse(line);
        setProgressEvents((prev) => [...prev, evt]);
        if (evt.type === "done") {
          setSending(false);
          setPayrolls((prev) =>
            prev.map((pr) =>
              pr.id === p.id ? { ...pr, status: evt.failed === 0 ? "SENT" : "PARTIALLY_SENT" } : pr
            )
          );
        }
      }
    }
    setSending(false);
  }

  async function handleDownloadAll(p: PayrollRow) {
    try {
      await downloadFile(`/api/payroll/${p.id}/download-all`, `Payslips_${MONTH_NAMES[p.month - 1]}_${p.year}.zip`);
    } catch {
      toast.error("Download failed — please try again");
    }
  }

  const totalCompleted = progressEvents.filter((e) => e.type === "progress").length;
  const totalExpected = progressEvents.find((e) => e.type === "start") as { total: number } | undefined;
  const successCount = progressEvents.filter((e) => e.type === "progress" && e.status === "success").length;
  const failedCount = progressEvents.filter((e) => e.type === "progress" && e.status === "failed").length;
  const doneEvent = progressEvents.find((e) => e.type === "done") as { success: number; failed: number } | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payroll</h1>
        <p className="text-sm text-[var(--text-secondary)]">Generate and dispatch monthly payslips</p>
      </div>

      <div className="glass-card flex flex-wrap items-end gap-3 rounded-2xl p-5 shadow-card">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Month</label>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
            {MONTH_NAMES.map((m, i) => (
              <option key={m} value={i + 1} style={{ color: "#000" }}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Year</label>
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm" />
        </div>
        {canManage && (
          <>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-card hover:bg-brand-700 disabled:opacity-60"
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              Generate Payroll (All Employees)
            </button>
            <Link
              href="/payroll/generate"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors"
            >
              <Sparkles size={16} /> Generate Salary (Single Employee)
            </Link>
          </>
        )}
      </div>

      <div className="glass-card overflow-x-auto rounded-2xl shadow-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-[var(--text-secondary)]">
              <th className="px-4 py-3">Sl No</th>
              <th className="px-4 py-3">Month</th>
              <th className="px-4 py-3">Employees</th>
              <th className="px-4 py-3">Total Salary</th>
              <th className="px-4 py-3">Net Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payrolls.map((p, index) => (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 text-[var(--text-secondary)]">{index + 1}</td>
                <td className="px-4 py-3 font-medium">{MONTH_NAMES[p.month - 1]} {p.year}</td>
                <td className="px-4 py-3">{p.employeeCount}</td>
                <td className="px-4 py-3">{formatCurrency(p.totalGross)}</td>
                <td className="px-4 py-3 text-emerald-500 font-medium">{formatCurrency(p.totalNet)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    p.status === "SENT" ? "bg-emerald-500/15 text-emerald-500" :
                    p.status === "PARTIALLY_SENT" ? "bg-amber-500/15 text-amber-500" :
                    "bg-white/10 text-[var(--text-secondary)]"
                  }`}>
                    {p.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => handlePreview(p)} title="Preview" className="rounded-lg p-2 hover:bg-white/10"><Eye size={15} /></button>
                    {canManage && (
                      <button onClick={() => handleSend(p)} title="Send Payslips" className="rounded-lg p-2 hover:bg-white/10"><Send size={15} /></button>
                    )}
                    <button onClick={() => handleDownloadAll(p)} title="Download All" className="rounded-lg p-2 hover:bg-white/10"><Download size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {payrolls.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-[var(--text-secondary)]">No payroll runs yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="glass-card max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6 shadow-glass">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Preview — {activePayroll && `${MONTH_NAMES[activePayroll.month - 1]} ${activePayroll.year}`}
                </h2>
                <button onClick={() => setPreviewOpen(false)}><X size={20} /></button>
              </div>
              <div className="space-y-2">
                {previewSlips.map((s, idx) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-xs text-[var(--text-secondary)]">{idx + 1}.</span>
                      <div>
                        <Link href={`/employees/${s.employeeId}`} className="text-sm font-medium hover:text-brand-400 hover:underline">
                          {s.employeeName}
                        </Link>
                        <p className="text-xs text-[var(--text-secondary)]">{s.employeeCode} · {s.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-emerald-500">{formatCurrency(s.netSalary)}</span>
                      <button
                        onClick={() =>
                          downloadFile(
                            `/api/payroll/slip/${s.id}/pdf`,
                            `SalarySlip_${s.employeeCode}_${activePayroll ? MONTH_NAMES[activePayroll.month - 1] : ""}_${activePayroll?.year ?? ""}.pdf`
                          ).catch(() => toast.error("Download failed — please try again"))
                        }
                        className="rounded-lg p-2 hover:bg-white/10"
                      >
                        <Download size={14} />
                      </button>
                      {canManage && (
                        <button
                          onClick={() => handleSendWhatsApp(s)}
                          disabled={sendingWhatsAppId === s.id}
                          className="rounded-lg p-2 hover:bg-white/10 disabled:opacity-50"
                          title="Send via WhatsApp"
                        >
                          {sendingWhatsAppId === s.id ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />}
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteSlip(s.id, s.employeeName)}
                          className="rounded-lg p-2 text-rose-500 hover:bg-rose-500/10"
                          title="Delete this salary slip"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Modal */}
      <AnimatePresence>
        {progressOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="glass-card w-full max-w-lg rounded-2xl p-6 shadow-glass">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{sending ? "Sending Payslips..." : "Send Complete"}</h2>
                {!sending && <button onClick={() => setProgressOpen(false)}><X size={20} /></button>}
              </div>

              <p className="mb-2 text-xs text-[var(--text-secondary)]">
                {sending ? "Generating PDFs and sending emails..." : "All done!"}
              </p>

              <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-brand-500 to-brand-700"
                  animate={{
                    width: totalExpected ? `${(totalCompleted / totalExpected.total) * 100}%` : "0%",
                  }}
                />
              </div>

              <div className="mb-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-white/5 py-2">
                  <p className="font-semibold text-emerald-500">{doneEvent?.success ?? successCount}</p>
                  <p className="text-[var(--text-secondary)]">Success</p>
                </div>
                <div className="rounded-lg bg-white/5 py-2">
                  <p className="font-semibold text-rose-500">{doneEvent?.failed ?? failedCount}</p>
                  <p className="text-[var(--text-secondary)]">Failed</p>
                </div>
                <div className="rounded-lg bg-white/5 py-2">
                  <p className="font-semibold">
                    {totalExpected ? Math.round((totalCompleted / totalExpected.total) * 100) : 0}%
                  </p>
                  <p className="text-[var(--text-secondary)]">Complete</p>
                </div>
              </div>

              <div className="max-h-56 space-y-1.5 overflow-y-auto">
                {progressEvents.filter((e): e is Extract<ProgressEvent, { type: "progress" }> => e.type === "progress").map((e, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs">
                    {e.status === "success" ? (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    ) : (
                      <XCircle size={14} className="text-rose-500" />
                    )}
                    <span className="flex-1">{e.employeeName}</span>
                    {e.error && <span className="text-rose-400">{e.error}</span>}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}