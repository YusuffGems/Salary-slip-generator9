"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Download, Mail, FileText, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/salary";
import { downloadFile } from "@/lib/download";

interface EmployeeData {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  phone: string | null;
  department: string | null;
  designation: string | null;
  dateOfJoining: string | null;
  bankName: string | null;
  accountNumber: string | null;
  basicSalary: number;
}

interface SlipRow {
  id: string;
  monthLabel: string;
  month: number;
  year: number;
  grossSalary: number;
  totalDeduction: number;
  netSalary: number;
  createdAt: string;
}

export default function EmployeeDetailClient({
  employee,
  slips,
  totalEarned,
}: {
  employee: EmployeeData;
  slips: SlipRow[];
  totalEarned: number;
}) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [emailingId, setEmailingId] = useState<string | null>(null);

  async function handleDownload(slip: SlipRow) {
    setDownloadingId(slip.id);
    try {
      await downloadFile(
        `/api/payroll/slip/${slip.id}/pdf`,
        `SalarySlip_${employee.employeeCode}_${slip.monthLabel.replace(" ", "_")}.pdf`
      );
    } catch {
      toast.error("Download failed — please try again");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleEmail(slip: SlipRow) {
    setEmailingId(slip.id);
    try {
      const res = await fetch(`/api/payroll/slip/${slip.id}/resend`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to send email");
        return;
      }
      toast.success(`Payslip emailed to ${employee.name}`);
    } finally {
      setEmailingId(null);
    }
  }

  return (
    <div className="animate-fadeUp space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/employees" className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <ArrowLeft size={16} /> Back to Employees
        </Link>
        <Link
          href={`/employees/${employee.id}/edit`}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10"
        >
          <Pencil size={14} /> Edit Employee
        </Link>
      </div>

      <div className="glass-card rounded-2xl p-6 shadow-card">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-2xl font-semibold text-white">
              {employee.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-semibold">{employee.name}</h1>
              <p className="text-sm text-[var(--text-secondary)]">
                <span className="font-mono text-brand-400">{employee.employeeCode}</span>
                {employee.designation ? ` · ${employee.designation}` : ""}
                {employee.department ? ` · ${employee.department}` : ""}
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{employee.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm sm:text-right">
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Basic Salary</p>
              <p className="font-semibold">{formatCurrency(employee.basicSalary)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Total Paid (All Time)</p>
              <p className="font-semibold text-emerald-500">{formatCurrency(totalEarned)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-x-auto rounded-2xl shadow-card">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-base font-semibold">Payslip History</h2>
          <span className="text-xs text-[var(--text-secondary)]">{slips.length} slip{slips.length === 1 ? "" : "s"}</span>
        </div>
        <table className="mt-3 w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-[var(--text-secondary)]">
              <th className="px-5 py-3">Month</th>
              <th className="px-5 py-3">Gross</th>
              <th className="px-5 py-3">Deduction</th>
              <th className="px-5 py-3">Net Salary</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {slips.map((slip) => (
              <tr key={slip.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-5 py-3 font-medium">{slip.monthLabel}</td>
                <td className="px-5 py-3">{formatCurrency(slip.grossSalary)}</td>
                <td className="px-5 py-3 text-rose-500">{formatCurrency(slip.totalDeduction)}</td>
                <td className="px-5 py-3 font-medium text-emerald-500">{formatCurrency(slip.netSalary)}</td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => handleDownload(slip)}
                      disabled={downloadingId === slip.id}
                      className="rounded-lg p-2 hover:bg-white/10 disabled:opacity-50"
                      title="Download PDF"
                    >
                      {downloadingId === slip.id ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                    </button>
                    <button
                      onClick={() => handleEmail(slip)}
                      disabled={emailingId === slip.id}
                      className="rounded-lg p-2 hover:bg-white/10 disabled:opacity-50"
                      title="Email Payslip"
                    >
                      {emailingId === slip.id ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {slips.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-[var(--text-secondary)]">
                  <FileText size={24} className="mx-auto mb-2 opacity-40" />
                  No payslips generated for this employee yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="h-5" />
      </div>
    </div>
  );
}