import { NextRequest, NextResponse } from "next/server";
import { generatePayslipPdf } from "@/lib/pdf";
import { buildPayslipData } from "@/lib/payslip-data";
import { MONTH_NAMES } from "@/lib/salary";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slipId: string }> }) {
  const { slipId } = await params;
  const data = await buildPayslipData(slipId);
  if (!data) return NextResponse.json({ error: "Slip not found" }, { status: 404 });

  const pdfBuffer = await generatePayslipPdf(data);
  const filename = `SalarySlip_${data.employeeCode}_${MONTH_NAMES[data.month - 1]}_${data.year}.pdf`;

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
