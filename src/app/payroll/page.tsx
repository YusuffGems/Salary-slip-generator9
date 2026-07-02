import { prisma } from "@/lib/prisma";
import PayrollClient from "./PayrollClient";

export const dynamic = "force-dynamic";

export default async function PayrollPage() {
  const payrolls = await prisma.payroll.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
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
    createdAt: p.createdAt.toISOString(),
  }));

  return <PayrollClient initialPayrolls={serialized} />;
}
