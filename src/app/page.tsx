import { prisma } from "@/lib/prisma";
import { formatCurrency, MONTH_NAMES } from "@/lib/salary";
import StatCard from "@/components/StatCard";
import { Users, Wallet, CalendarDays, Send, Clock, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

async function getDashboardStats() {
  const now = new Date();

  const [totalEmployees, latestPayroll, sentEmailCount, pendingEmailCount] = await Promise.all([
    prisma.employee.count({ where: { isActive: true } }),
    prisma.payroll.findFirst({ orderBy: [{ year: "desc" }, { month: "desc" }] }),
    prisma.emailLog.count({ where: { status: "SENT" } }),
    prisma.emailLog.count({ where: { status: "PENDING" } }),
  ]);

  return { totalEmployees, latestPayroll, sentEmailCount, pendingEmailCount, now };
}

export default async function DashboardPage() {
  const { totalEmployees, latestPayroll, sentEmailCount, pendingEmailCount, now } =
    await getDashboardStats();

  const currentMonthLabel = latestPayroll
    ? `${MONTH_NAMES[latestPayroll.month - 1]} ${latestPayroll.year}`
    : `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()} (not generated)`;

  return (
  <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Overview of your payroll operations
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Employees"
          value={String(totalEmployees)}
          icon={<Users size={16} />}
          gradient="bg-gradient-to-br from-brand-500 to-brand-700"
          delay={0}
        />
        <StatCard
          label="Current Payroll Month"
          value={currentMonthLabel}
          icon={<CalendarDays size={16} />}
          gradient="bg-gradient-to-br from-violet-500 to-fuchsia-600"
          delay={0.05}
        />
        <StatCard
          label="Total Salary Amount"
          value={latestPayroll ? formatCurrency(Number(latestPayroll.totalNet)) : "—"}
          icon={<Wallet size={16} />}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          delay={0.1}
        />
        <StatCard
          label="Payslips Sent"
          value={String(sentEmailCount)}
          icon={<CheckCircle2 size={16} />}
          gradient="bg-gradient-to-br from-sky-500 to-blue-600"
          delay={0.15}
        />
        <StatCard
          label="Pending Emails"
          value={String(pendingEmailCount)}
          icon={<Clock size={16} />}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          delay={0.2}
        />
        <StatCard
          label="Last Payroll Date"
          value={latestPayroll ? new Date(latestPayroll.createdAt).toLocaleDateString("en-IN") : "—"}
          icon={<Send size={16} />}
          gradient="bg-gradient-to-br from-rose-500 to-pink-600"
          delay={0.25}
        />
      </div>

      <div className="glass-card rounded-2xl p-6 shadow-card">
        <h2 className="mb-3 text-base font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-3 text-sm">
          <a href="/employees" className="rounded-xl bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 transition-colors">
            + Add Employee
          </a>
          <a href="/payroll" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-medium hover:bg-white/10 transition-colors">
            Generate Payroll
          </a>
          <a href="/settings" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-medium hover:bg-white/10 transition-colors">
            Configure SMTP
          </a>
        </div>
      </div>
    </div>
  );
}
