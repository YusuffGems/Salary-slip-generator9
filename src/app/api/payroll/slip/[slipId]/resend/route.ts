import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePayslipPdf } from "@/lib/pdf";
import { buildPayslipData } from "@/lib/payslip-data";
import { buildSmtpConfigFromSettings, sendPayslipEmail } from "@/lib/email";
import { formatCurrency, MONTH_NAMES } from "@/lib/salary";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ slipId: string }> }) {
  try {
    const { slipId } = await params;
    const slip = await prisma.salarySlip.findUnique({
      where: { id: slipId },
      include: { employee: true, payroll: true },
    });
    if (!slip) return NextResponse.json({ error: "Slip not found" }, { status: 404 });

    const settings = await prisma.companySettings.findUnique({ where: { id: "singleton" } });
    if (!settings) return NextResponse.json({ error: "Company settings not configured" }, { status: 400 });

    const smtp = buildSmtpConfigFromSettings(settings);
    const data = await buildPayslipData(slip.id);
    if (!data) return NextResponse.json({ error: "Could not build payslip" }, { status: 500 });

    const pdfBuffer = await generatePayslipPdf(data);

    await sendPayslipEmail({
      smtp,
      fromName: settings.companyName,
      to: slip.employee.email,
      employeeName: slip.employee.name,
      month: slip.payroll.month,
      year: slip.payroll.year,
      netSalary: formatCurrency(Number(slip.netSalary)),
      companyName: settings.companyName,
      pdfBuffer,
      pdfFilename: `SalarySlip_${data.employeeCode}_${MONTH_NAMES[slip.payroll.month - 1]}_${slip.payroll.year}.pdf`,
    });

    await prisma.emailLog.create({
      data: {
        salarySlipId: slip.id,
        employeeId: slip.employeeId,
        email: slip.employee.email,
        payrollMonth: `${MONTH_NAMES[slip.payroll.month - 1]} ${slip.payroll.year}`,
        status: "SENT",
        sentAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to resend email" }, { status: 500 });
  }
}
