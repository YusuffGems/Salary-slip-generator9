import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePayslipPdf } from "@/lib/pdf";
import { buildPayslipData } from "@/lib/payslip-data";
import { buildSmtpConfigFromSettings, sendPayslipEmail } from "@/lib/email";
import { formatCurrency, MONTH_NAMES } from "@/lib/salary";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { payrollId } = await req.json();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      try {
        const payroll = await prisma.payroll.findUnique({ where: { id: payrollId } });
        if (!payroll) {
          send({ type: "error", error: "Payroll not found" });
          controller.close();
          return;
        }

        const settings = await prisma.companySettings.findUnique({ where: { id: "singleton" } });
        if (!settings) {
          send({ type: "error", error: "Company settings not configured" });
          controller.close();
          return;
        }

        const smtp = buildSmtpConfigFromSettings(settings);

        const slips = await prisma.salarySlip.findMany({
          where: { payrollId },
          include: { employee: true },
        });

        send({ type: "start", total: slips.length });

        let success = 0;
        let failed = 0;

        for (const slip of slips) {
          const emailLog = await prisma.emailLog.create({
            data: {
              salarySlipId: slip.id,
              employeeId: slip.employeeId,
              email: slip.employee.email,
              payrollMonth: `${MONTH_NAMES[payroll.month - 1]} ${payroll.year}`,
              status: "PENDING",
            },
          });

          try {
            const data = await buildPayslipData(slip.id);
            if (!data) throw new Error("Could not build payslip data");

            const pdfBuffer = await generatePayslipPdf(data);

            await sendPayslipEmail({
              smtp,
              fromName: settings.companyName,
              to: slip.employee.email,
              employeeName: slip.employee.name,
              month: payroll.month,
              year: payroll.year,
              netSalary: formatCurrency(Number(slip.netSalary)),
              companyName: settings.companyName,
              pdfBuffer,
              pdfFilename: `SalarySlip_${data.employeeCode}_${MONTH_NAMES[payroll.month - 1]}_${payroll.year}.pdf`,
            });

            await prisma.emailLog.update({
              where: { id: emailLog.id },
              data: { status: "SENT", sentAt: new Date() },
            });

            success++;
            send({
              type: "progress",
              employeeName: slip.employee.name,
              status: "success",
              completed: success + failed,
              total: slips.length,
            });
          } catch (err: any) {
            await prisma.emailLog.update({
              where: { id: emailLog.id },
              data: { status: "FAILED", errorMessage: err?.message || "Unknown error" },
            });
            failed++;
            send({
              type: "progress",
              employeeName: slip.employee.name,
              status: "failed",
              error: err?.message,
              completed: success + failed,
              total: slips.length,
            });
          }
        }

        await prisma.payroll.update({
          where: { id: payrollId },
          data: { status: failed === 0 ? "SENT" : "PARTIALLY_SENT" },
        });

        send({ type: "done", success, failed });
      } catch (err: any) {
        send({ type: "error", error: err?.message || "Failed to send payslips" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
