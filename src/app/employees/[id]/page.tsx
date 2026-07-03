import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatCurrency, MONTH_NAMES } from "@/lib/salary";
import EmployeeDetailClient from "./EmployeeDetailClient";

export const dynamic = "force-dynamic";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) notFound();

  const slips = await prisma.salarySlip.findMany({
    where: { employeeId: id },
    include: { payroll: true },
    orderBy: [{ payroll: { year: "desc" } }, { payroll: { month: "desc" } }],
  });

  const employeeData = {
    id: employee.id,
    employeeCode: employee.employeeCode,
    name: employee.name,
    email: employee.email,
    phone: employee.phone,
    department: employee.department,
    designation: employee.designation,
    dateOfJoining: employee.dateOfJoining ? employee.dateOfJoining.toISOString() : null,
    bankName: employee.bankName,
    accountNumber: employee.accountNumber,
    basicSalary: Number(employee.basicSalary),
  };

  const slipsData = slips.map((s) => ({
    id: s.id,
    monthLabel: `${MONTH_NAMES[s.payroll.month - 1]} ${s.payroll.year}`,
    month: s.payroll.month,
    year: s.payroll.year,
    grossSalary: Number(s.grossSalary),
    totalDeduction: Number(s.totalDeduction),
    netSalary: Number(s.netSalary),
    createdAt: s.createdAt.toISOString(),
  }));

  const totalEarned = slipsData.reduce((sum, s) => sum + s.netSalary, 0);

  return (
    <EmployeeDetailClient employee={employeeData} slips={slipsData} totalEarned={totalEarned} />
  );
}