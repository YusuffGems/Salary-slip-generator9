import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const payrolls = await prisma.payroll.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: { _count: { select: { salarySlips: true } } },
  });

  const serialized = payrolls.map((p) => ({
    id: p.id,
    month: p.month,
    year: p.year,
    employeeCount: p.employeeCount,
    totalGross: Number(p.totalGross),
    totalDeduction: Number(p.totalDeduction),
    totalNet: Number(p.totalNet),
    status: p.status,
    createdAt: p.createdAt,
  }));

  return NextResponse.json({ payrolls: serialized });
}
