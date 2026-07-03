import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateSalary, getWorkingDaysInMonth } from "@/lib/salary";
import { z } from "zod";

const attendanceSchema = z.object({
  daysWorked: z.number().nonnegative().optional(),
  daysLeave: z.number().nonnegative().optional(),
  lossOfPayDays: z.number().nonnegative().optional(),
  clBalance: z.number().optional(),
  elBalance: z.number().optional(),
});

const schema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  employeeIds: z.array(z.string()).optional(),
  attendance: attendanceSchema.optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { month, year, employeeIds, attendance } = schema.parse(await req.json());

    let payroll = await prisma.payroll.findUnique({ where: { month_year: { month, year } } });

    const targetEmployees = await prisma.employee.findMany({
      where: {
        isActive: true,
        ...(employeeIds && employeeIds.length > 0 ? { id: { in: employeeIds } } : {}),
      },
    });

    if (targetEmployees.length === 0) {
      return NextResponse.json({ error: "No matching active employees found." }, { status: 400 });
    }

    let employeesToProcess = targetEmployees;
    if (payroll) {
      const existingSlips = await prisma.salarySlip.findMany({
        where: { payrollId: payroll.id },
        select: { employeeId: true },
      });
      const alreadyDone = new Set(existingSlips.map((s) => s.employeeId));
      employeesToProcess = targetEmployees.filter((e) => !alreadyDone.has(e.id));

      if (employeesToProcess.length === 0) {
        return NextResponse.json(
          {
            error:
              employeeIds && employeeIds.length === 1
                ? `A salary slip for this employee already exists for ${month}/${year}.`
                : `Payroll for ${month}/${year} has already been generated.`,
          },
          { status: 409 }
        );
      }
    }

    const createdSlipIds: string[] = [];
    const workingDays = getWorkingDaysInMonth(month, year);

    await prisma.$transaction(async (tx) => {
      if (!payroll) {
        payroll = await tx.payroll.create({
          data: { month, year, employeeCount: 0, status: "GENERATED" },
        });
      }

      for (const emp of employeesToProcess) {
        const b = calculateSalary({
          basicSalary: Number(emp.basicSalary),
          hra: Number(emp.hra),
          medicalAllowance: Number(emp.medicalAllowance),
          travelAllowance: Number(emp.travelAllowance),
          specialAllowance: Number(emp.specialAllowance),
          bonus: Number(emp.bonus),
          pf: Number(emp.pf),
          esi: Number(emp.esi),
          professionalTax: Number(emp.professionalTax),
          otherDeduction: Number(emp.otherDeduction),
        });

        const slip = await tx.salarySlip.create({
          data: {
            payrollId: payroll!.id,
            employeeId: emp.id,
            basicSalary: b.basicSalary,
            hra: b.hra,
            medicalAllowance: b.medicalAllowance,
            travelAllowance: b.travelAllowance,
            specialAllowance: b.specialAllowance,
            bonus: b.bonus,
            grossSalary: b.grossSalary,
            pf: b.pf,
            esi: b.esi,
            professionalTax: b.professionalTax,
            otherDeduction: b.otherDeduction,
            totalDeduction: b.totalDeduction,
            netSalary: b.netSalary,
            workingDays,
            daysWorked: attendance?.daysWorked,
            daysLeave: attendance?.daysLeave,
            lossOfPayDays: attendance?.lossOfPayDays,
            clBalance: attendance?.clBalance,
            elBalance: attendance?.elBalance,
          },
        });
        createdSlipIds.push(slip.id);
      }

      const allSlips = await tx.salarySlip.findMany({ where: { payrollId: payroll!.id } });
      const totalGross = allSlips.reduce((sum, s) => sum + Number(s.grossSalary), 0);
      const totalDeduction = allSlips.reduce((sum, s) => sum + Number(s.totalDeduction), 0);
      const totalNet = allSlips.reduce((sum, s) => sum + Number(s.netSalary), 0);

      payroll = await tx.payroll.update({
        where: { id: payroll!.id },
        data: {
          employeeCount: allSlips.length,
          totalGross,
          totalDeduction,
          totalNet,
        },
      });
    });

    return NextResponse.json({ payroll, createdSlipIds }, { status: 201 });
  } catch (err: any) {
    if (err?.issues) {
      return NextResponse.json({ error: "Validation failed", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: err?.message || "Failed to generate payroll" }, { status: 500 });
  }
}