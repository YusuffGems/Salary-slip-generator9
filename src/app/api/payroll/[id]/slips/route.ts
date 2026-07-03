import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const slips = await prisma.salarySlip.findMany({
    where: { payrollId: id },
    include: { employee: true },
    orderBy: { employee: { name: "asc" } },
  });

  const serialized = slips.map((s) => ({
    id: s.id,
    employeeId: s.employeeId,
    employeeName: s.employee.name,
    employeeCode: s.employee.employeeCode,
    email: s.employee.email,
    department: s.employee.department,
    designation: s.employee.designation,
    grossSalary: Number(s.grossSalary),
    totalDeduction: Number(s.totalDeduction),
    netSalary: Number(s.netSalary),
    workingDays: s.workingDays,
    daysWorked: s.daysWorked !== null ? Number(s.daysWorked) : null,
    daysLeave: s.daysLeave !== null ? Number(s.daysLeave) : null,
    lossOfPayDays: s.lossOfPayDays !== null ? Number(s.lossOfPayDays) : null,
    clBalance: s.clBalance !== null ? Number(s.clBalance) : null,
    elBalance: s.elBalance !== null ? Number(s.elBalance) : null,
  }));

  return NextResponse.json({ slips: serialized });
}