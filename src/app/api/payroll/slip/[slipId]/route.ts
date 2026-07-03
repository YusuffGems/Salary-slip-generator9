import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slipId: string }> }) {
  try {
    const { slipId } = await params;

    const slip = await prisma.salarySlip.findUnique({ where: { id: slipId } });
    if (!slip) {
      return NextResponse.json({ error: "Salary slip not found" }, { status: 404 });
    }

    const payrollId = slip.payrollId;

    await prisma.$transaction(async (tx) => {
      await tx.salarySlip.delete({ where: { id: slipId } });

      const remaining = await tx.salarySlip.findMany({ where: { payrollId } });

      if (remaining.length === 0) {
        await tx.payroll.delete({ where: { id: payrollId } });
      } else {
        const totalGross = remaining.reduce((sum, s) => sum + Number(s.grossSalary), 0);
        const totalDeduction = remaining.reduce((sum, s) => sum + Number(s.totalDeduction), 0);
        const totalNet = remaining.reduce((sum, s) => sum + Number(s.netSalary), 0);

        await tx.payroll.update({
          where: { id: payrollId },
          data: {
            employeeCount: remaining.length,
            totalGross,
            totalDeduction,
            totalNet,
          },
        });
      }
    });

    return NextResponse.json({ success: true, payrollDeleted: (await prisma.payroll.findUnique({ where: { id: payrollId } })) === null });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to delete salary slip" }, { status: 500 });
  }
}