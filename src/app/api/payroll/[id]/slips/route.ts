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
  }));

  return NextResponse.json({ slips: serialized });
}
