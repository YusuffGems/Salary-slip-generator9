import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWorkingDaysInMonth } from "@/lib/salary";
import { z } from "zod";

const schema = z.object({
  daysWorked: z.number().nonnegative().nullable().optional(),
  daysLeave: z.number().nonnegative().nullable().optional(),
  lossOfPayDays: z.number().nonnegative().nullable().optional(),
  clBalance: z.number().nullable().optional(),
  elBalance: z.number().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slipId: string }> }) {
  try {
    const { slipId } = await params;
    const body = schema.parse(await req.json());

    const slip = await prisma.salarySlip.findUnique({
      where: { id: slipId },
      include: { payroll: true },
    });
    if (!slip) {
      return NextResponse.json({ error: "Salary slip not found" }, { status: 404 });
    }

    const updated = await prisma.salarySlip.update({
      where: { id: slipId },
      data: {
        workingDays: slip.workingDays ?? getWorkingDaysInMonth(slip.payroll.month, slip.payroll.year),
        daysWorked: body.daysWorked,
        daysLeave: body.daysLeave,
        lossOfPayDays: body.lossOfPayDays,
        clBalance: body.clBalance,
        elBalance: body.elBalance,
      },
    });

    return NextResponse.json({
      success: true,
      slip: {
        workingDays: updated.workingDays,
        daysWorked: updated.daysWorked !== null ? Number(updated.daysWorked) : null,
        daysLeave: updated.daysLeave !== null ? Number(updated.daysLeave) : null,
        lossOfPayDays: updated.lossOfPayDays !== null ? Number(updated.lossOfPayDays) : null,
        clBalance: updated.clBalance !== null ? Number(updated.clBalance) : null,
        elBalance: updated.elBalance !== null ? Number(updated.elBalance) : null,
      },
    });
  } catch (err: any) {
    if (err?.issues) {
      return NextResponse.json({ error: "Validation failed", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: err?.message || "Failed to update attendance" }, { status: 500 });
  }
}