import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));

  if (!month || !year) {
    return NextResponse.json({ error: "month and year are required" }, { status: 400 });
  }

  const payroll = await prisma.payroll.findUnique({ where: { month_year: { month, year } } });
  if (!payroll) {
    return NextResponse.json({ generatedEmployeeIds: [], slipsByEmployee: {} });
  }

  const slips = await prisma.salarySlip.findMany({
    where: { payrollId: payroll.id },
    select: { id: true, employeeId: true },
  });

  const slipsByEmployee: Record<string, string> = {};
  slips.forEach((s) => {
    slipsByEmployee[s.employeeId] = s.id;
  });

  return NextResponse.json({
    generatedEmployeeIds: slips.map((s) => s.employeeId),
    slipsByEmployee,
  });
}
