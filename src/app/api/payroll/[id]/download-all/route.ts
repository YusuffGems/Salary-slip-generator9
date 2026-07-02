import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { prisma } from "@/lib/prisma";
import { generatePayslipPdf } from "@/lib/pdf";
import { buildPayslipData } from "@/lib/payslip-data";
import { MONTH_NAMES } from "@/lib/salary";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payroll = await prisma.payroll.findUnique({ where: { id } });
  if (!payroll) return NextResponse.json({ error: "Payroll not found" }, { status: 404 });

  const slips = await prisma.salarySlip.findMany({
    where: { payrollId: id },
    include: { employee: true },
  });

  const zip = new JSZip();

  for (const slip of slips) {
    const data = await buildPayslipData(slip.id);
    if (!data) continue;
    const pdfBuffer = await generatePayslipPdf(data);
    zip.file(`SalarySlip_${data.employeeCode}_${MONTH_NAMES[payroll.month - 1]}_${payroll.year}.pdf`, pdfBuffer);
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  const filename = `Payslips_${MONTH_NAMES[payroll.month - 1]}_${payroll.year}.zip`;

  return new NextResponse(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
