"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, FileText, Download, Mail, MessageCircle, CheckCircle2, Loader2 } from "lucide-react";
import { calculateSalary, formatCurrency, MONTH_NAMES } from "@/lib/salary";
import { downloadFile } from "@/lib/download";
import { buildWhatsAppShareLink } from "@/lib/whatsapp";
import { useSession } from "next-auth/react";

interface EmployeeRow {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  dateOfJoining: string | null;
  basicSalary: number;
  hra: number;
  medicalAllowance: number;
  travelAllowance: number;
  specialAllowance: number;
  bonus: number;
  pf: number;
  esi: number;
  professionalTax: number;
  otherDeduction: number;
}

export default function GenerateSalaryClient({
  employees,
  departments,
}: {
  employees: EmployeeRow[];
  departments: string[];
}) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const canManage = role === "ADMIN" || role === "MANAGER";
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [selected, setSelected] = useState<EmployeeRow | null>(null);
  const [generatedSlipId, setGeneratedSlipId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

  const [generatedIds, setGeneratedIds] = useState<Set<string>>(new Set());
  const [slipsByEmployee, setSlipsByEmployee] = useState<Record<string, string>>({});
  const [statusLoading, setStatusLoading] = useState(true);

  async function refreshStatus() {
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/payroll/status?month=${month}&year=${year}`);
      const json = await res.json();
      setGeneratedIds(new Set<string>(json.generatedEmployeeIds || []));
      setSlipsByEmployee(json.slipsByEmployee || {});
    } finally {
      setStatusLoading(false);
    }
  }

  useEffect(() => {
    refreshStatus();
    setGeneratedSlipId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const matchesSearch =
        !search ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
        e.email.toLowerCase().includes(search.toLowerCase());
      const matchesDept = !deptFilter || e.department === deptFilter;
      return matchesSearch && matchesDept;
    });
  }, [employees, search, deptFilter]);

  function selectEmployee(emp: EmployeeRow) {
    setSelected(emp);
    setGeneratedSlipId(slipsByEmployee[emp.id] ?? null);
  }

  const breakdown = selected ? calculateSalary(selected) : null;
  const alreadyGenerated = selected ? generatedIds.has(selected.id) : false;

  async function handleGenerate() {
    if (!selected) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/payroll/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year, employeeIds: [selected.id] }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to generate salary slip");
        return;
      }
      const slipId = json.createdSlipIds?.[0];
      setGeneratedSlipId(slipId ?? null);
      toast.success(`Salary slip generated for ${selected.name}`);
      refreshStatus();
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownload() {
    if (!generatedSlipId || !selected) return;
    setDownloading(true);
    try {
      const filename = `SalarySlip_${selected.employeeCode}_${MONTH_NAMES[month - 1]}_${year}.pdf`;
      await downloadFile(`/api/payroll/slip/${generatedSlipId}/pdf`, filename);
    } catch {
      toast.error("Download failed — please try again");
    } finally {
      setDownloading(false);
    }
  }

  async function handleSendEmail() {
    if (!generatedSlipId) return;
    setSendingEmail(true);
    try {
      const res = await fetch(`/api/payroll/slip/${generatedSlipId}/resend`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to send email");
        return;
      }
      toast.success("Salary slip emailed successfully");
    } finally {
      setSendingEmail(false);
    }
  }

  async function handleSendWhatsApp() {
    if (!generatedSlipId || !selected) return;
    if (!selected.phone) {
      toast.error("This employee has no phone number on file — add one in Employees first.");
      return;
    }
    setSendingWhatsApp(true);
    try {
      const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;
      const filename = `SalarySlip_${selected.employeeCode}_${monthLabel.replace(" ", "_")}.pdf`;
      await downloadFile(`/api/payroll/slip/${generatedSlipId}/pdf`, filename);
      const message = `Hi ${selected.name}, please find attached your salary slip for ${monthLabel}. (The PDF was just downloaded to your device — please attach it here before sending)`;
      window.open(buildWhatsAppShareLink(selected.phone, message), "_blank");
      toast.success("PDF downloaded — attach it in the WhatsApp chat that just opened");
    } catch {
      toast.error("Failed to prepare WhatsApp message");
    } finally {
      setSendingWhatsApp(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Generate Salary</h1>
        <p className="text-sm text-[var(--text-secondary)]">Select an employee to generate their salary slip</p>
      </div>

      {/* Month/Year + Search + Filter */}
      <div className="glass-card flex flex-wrap items-end gap-3 rounded-2xl p-5 shadow-card">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
          >
            {MONTH_NAMES.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
          />
        </div>
        <div className="relative flex-1" style={{ minWidth: "220px" }}>
          <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Search Employee</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, code, or email..."
              className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Department</label>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Employee Table */}
      <div className="glass-card overflow-x-auto rounded-2xl shadow-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-[var(--text-secondary)]">
              <th className="px-4 py-3">Employee Code</th>
              <th className="px-4 py-3">Employee Name</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Designation</th>
              <th className="px-4 py-3">Basic Salary</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => {
              const isSelected = selected?.id === e.id;
              const isGenerated = generatedIds.has(e.id);
              return (
                <tr
                  key={e.id}
                  onClick={() => selectEmployee(e)}
                  className={`cursor-pointer border-b border-white/5 transition-colors ${
                    isSelected ? "bg-brand-600/15" : "hover:bg-white/5"
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-brand-400">{e.employeeCode}</td>
                  <td className="px-4 py-3 font-medium">{e.name}</td>
                  <td className="px-4 py-3">{e.department || "-"}</td>
                  <td className="px-4 py-3">{e.designation || "-"}</td>
                  <td className="px-4 py-3">{formatCurrency(e.basicSalary)}</td>
                  <td className="px-4 py-3">
                    {statusLoading ? (
                      <span className="text-xs text-[var(--text-secondary)]">…</span>
                    ) : isGenerated ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-500">
                        <CheckCircle2 size={12} /> Generated
                      </span>
                    ) : (
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(ev) => { ev.stopPropagation(); selectEmployee(e); }}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/10"
                    >
                      {isSelected ? "Selected" : "Select"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[var(--text-secondary)]">
                  No employees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Selected employee panel */}
      {selected && breakdown && (
        <div className="space-y-4">
          {/* Employee Information */}
          <div className="glass-card rounded-2xl p-6 shadow-card">
            <h2 className="mb-4 text-sm font-semibold text-brand-500">Employee Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Employee Code" value={selected.employeeCode} mono />
              <Info label="Employee Name" value={selected.name} />
              <Info label="Department" value={selected.department || "-"} />
              <Info label="Designation" value={selected.designation || "-"} />
              <Info label="Email" value={selected.email} />
              <Info label="Basic Salary" value={formatCurrency(selected.basicSalary)} />
              <Info
                label="Joining Date"
                value={selected.dateOfJoining ? new Date(selected.dateOfJoining).toLocaleDateString("en-IN") : "-"}
              />
              <Info label="Salary Period" value={`${MONTH_NAMES[month - 1]} ${year}`} />
            </div>
          </div>

          {/* Salary Components */}
          <div className="glass-card rounded-2xl p-6 shadow-card">
            <h2 className="mb-4 text-sm font-semibold text-brand-500">Salary Components</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-500">Earnings</p>
                <Line label="Basic Salary" value={breakdown.basicSalary} />
                <Line label="HRA" value={breakdown.hra} />
                <Line label="Medical Allowance" value={breakdown.medicalAllowance} />
                <Line label="Travel Allowance" value={breakdown.travelAllowance} />
                <Line label="Special Allowance" value={breakdown.specialAllowance} />
                <Line label="Bonus" value={breakdown.bonus} />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-500">Deductions</p>
                <Line label="PF" value={breakdown.pf} />
                <Line label="ESI" value={breakdown.esi} />
                <Line label="Professional Tax" value={breakdown.professionalTax} />
                <Line label="Other Deduction" value={breakdown.otherDeduction} />
              </div>
            </div>
          </div>

          {/* Preview / Summary */}
          <div className="glass-card rounded-2xl p-6 shadow-card">
            <h2 className="mb-4 text-sm font-semibold text-brand-500">Preview</h2>
            <div className="grid grid-cols-1 gap-4 rounded-xl bg-white/5 p-5 text-center sm:grid-cols-3">
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Gross Salary</p>
                <p className="mt-1 text-xl font-semibold">{formatCurrency(breakdown.grossSalary)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Total Deduction</p>
                <p className="mt-1 text-xl font-semibold text-rose-500">{formatCurrency(breakdown.totalDeduction)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Net Salary</p>
                <p className="mt-1 text-xl font-semibold text-emerald-500">{formatCurrency(breakdown.netSalary)}</p>
              </div>
            </div>
          </div>

          {/* Generate / Result actions */}
          {!generatedSlipId && !canManage ? (
            <div className="glass-card rounded-2xl p-6 text-center text-sm text-[var(--text-secondary)] shadow-card">
              Your account has view-only access — generating salary slips is restricted to Admin and Manager roles.
            </div>
          ) : (
          <div className="glass-card flex flex-wrap items-center justify-between gap-4 rounded-2xl p-6 shadow-card">
            {!generatedSlipId ? (
              <>
                <p className="text-sm text-[var(--text-secondary)]">
                  {alreadyGenerated
                    ? "A salary slip already exists for this employee and period."
                    : `Ready to generate the salary slip for ${MONTH_NAMES[month - 1]} ${year}.`}
                </p>
                <button
                  onClick={handleGenerate}
                  disabled={generating || alreadyGenerated}
                  className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-card hover:bg-brand-700 disabled:opacity-50"
                >
                  {generating ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                  {generating ? "Generating..." : "Generate Salary Slip"}
                </button>
              </>
            ) : (
              <>
                <p className="flex items-center gap-2 text-sm text-emerald-500">
                  <CheckCircle2 size={16} /> Salary slip generated successfully
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 disabled:opacity-50"
                  >
                    {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    Download PDF
                  </button>
                  {canManage && (
                    <button
                      onClick={handleSendEmail}
                      disabled={sendingEmail}
                      className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                    >
                      {sendingEmail ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                      Email to Employee
                    </button>
                  )}
                  {canManage && (
                    <button
                      onClick={handleSendWhatsApp}
                      disabled={sendingWhatsApp}
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 disabled:opacity-50"
                    >
                      {sendingWhatsApp ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
                      Send via WhatsApp
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
          )}
        </div>
      )}
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-secondary)]">{label}</p>
      <p className={`mt-0.5 text-sm font-medium ${mono ? "font-mono text-brand-400" : ""}`}>{value}</p>
    </div>
  );
}

function Line({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-1.5 text-sm">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className="font-medium">{formatCurrency(value)}</span>
    </div>
  );
}