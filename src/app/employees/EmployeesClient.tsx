"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/salary";
import { calculateSalary } from "@/lib/salary";
import type { EmployeeFormValues } from "./EmployeeForm";

interface EmployeeRow extends EmployeeFormValues {
  id: string;
}

export default function EmployeesClient({
  initialEmployees,
  departments,
}: {
  initialEmployees: EmployeeRow[];
  departments: string[];
}) {
  const [employees, setEmployees] = useState<EmployeeRow[]>(initialEmployees);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

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

  async function handleDelete(id: string) {
    if (!confirm("Remove this employee? Historical payslips will be preserved.")) return;
    const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      toast.success("Employee removed");
    } else {
      toast.error("Failed to remove employee");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="text-sm text-[var(--text-secondary)]">{employees.length} total</p>
        </div>
        <Link
          href="/employees/new"
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-card hover:bg-brand-700 transition-colors"
        >
          <Plus size={16} /> Add Employee
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, or email..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div className="glass-card overflow-x-auto rounded-2xl shadow-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-[var(--text-secondary)]">
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Basic</th>
              <th className="px-4 py-3">Net Salary</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => {
              const breakdown = calculateSalary(e);
              return (
                <tr key={e.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{e.name}</div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      <span className="font-mono text-brand-400">{e.employeeCode}</span> · {e.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">{e.department || "-"}</td>
                  <td className="px-4 py-3">{formatCurrency(e.basicSalary)}</td>
                  <td className="px-4 py-3 font-medium text-emerald-500">{formatCurrency(breakdown.netSalary)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link href={`/employees/${e.id}/edit`} className="rounded-lg p-2 hover:bg-white/10" aria-label="Edit">
                        <Pencil size={15} />
                      </Link>
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="rounded-lg p-2 text-rose-500 hover:bg-rose-500/10"
                        aria-label="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[var(--text-secondary)]">
                  No employees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
