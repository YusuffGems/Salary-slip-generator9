"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, RotateCw, CheckCircle2, XCircle, Clock, Trash2 } from "lucide-react";
import { downloadFile } from "@/lib/download";
import { useSession } from "next-auth/react";

interface LogRow {
  id: string;
  salarySlipId: string;
  employeeCode: string;
  employeeName: string;
  email: string;
  payrollMonth: string;
  status: string;
  sentAt: string | null;
  errorMessage?: string | null;
  createdAt: string;
}

const statusStyles: Record<string, string> = {
  SENT: "bg-emerald-500/15 text-emerald-500",
  FAILED: "bg-rose-500/15 text-rose-500",
  PENDING: "bg-amber-500/15 text-amber-500",
};

const statusIcons: Record<string, any> = { SENT: CheckCircle2, FAILED: XCircle, PENDING: Clock };

export default function EmailHistoryClient({ logs: initialLogs }: { logs: LogRow[] }) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const isAdmin = role === "ADMIN";
  const canManage = role === "ADMIN" || role === "MANAGER";
  const [logs, setLogs] = useState<LogRow[]>(initialLogs);
  const [resending, setResending] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleResend(slipId: string) {
    setResending(slipId);
    try {
      const res = await fetch(`/api/payroll/slip/${slipId}/resend`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to resend");
        return;
      }
      toast.success("Email resent successfully");
    } finally {
      setResending(null);
    }
  }

  async function handleDelete(logId: string, employeeName: string) {
    if (!confirm(`Delete this email history entry for ${employeeName}? This only removes the log — the salary slip itself is not affected.`)) return;

    setDeletingId(logId);
    try {
      const res = await fetch(`/api/email-history/${logId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to delete entry");
        return;
      }
      setLogs((prev) => prev.filter((l) => l.id !== logId));
      toast.success("Email history entry deleted");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Email History</h1>
        <p className="text-sm text-[var(--text-secondary)]">{logs.length} records</p>
      </div>

      <div className="glass-card overflow-x-auto rounded-2xl shadow-card">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-[var(--text-secondary)]">
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Payroll Month</th>
              <th className="px-4 py-3">Sent Time</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => {
              const Icon = statusIcons[l.status] || Clock;
              return (
                <tr key={l.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="font-medium">{l.employeeName}</div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      <span className="font-mono text-brand-400">{l.employeeCode}</span> · {l.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">{l.payrollMonth}</td>
                  <td className="px-4 py-3">{l.sentAt ? new Date(l.sentAt).toLocaleString("en-IN") : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[l.status]}`}>
                      <Icon size={12} /> {l.status}
                    </span>
                    {l.errorMessage && <p className="mt-1 text-xs text-rose-400">{l.errorMessage}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() =>
                          downloadFile(
                            `/api/payroll/slip/${l.salarySlipId}/pdf`,
                            `SalarySlip_${l.employeeCode}_${l.payrollMonth.replace(" ", "_")}.pdf`
                          ).catch(() => toast.error("Download failed — please try again"))
                        }
                        className="rounded-lg p-2 hover:bg-white/10"
                        title="Download PDF"
                      >
                        <Download size={15} />
                      </button>
                      {canManage && (
                        <button
                          onClick={() => handleResend(l.salarySlipId)}
                          disabled={resending === l.salarySlipId}
                          className="rounded-lg p-2 hover:bg-white/10 disabled:opacity-50"
                          title="Resend Email"
                        >
                          <RotateCw size={15} className={resending === l.salarySlipId ? "animate-spin" : ""} />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(l.id, l.employeeName)}
                          disabled={deletingId === l.id}
                          className="rounded-lg p-2 text-rose-500 hover:bg-rose-500/10 disabled:opacity-50"
                          title="Delete this history entry"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {logs.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-[var(--text-secondary)]">No email history yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}