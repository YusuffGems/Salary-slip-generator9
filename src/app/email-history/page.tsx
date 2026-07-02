import { prisma } from "@/lib/prisma";
import EmailHistoryClient from "./EmailHistoryClient";

export const dynamic = "force-dynamic";

export default async function EmailHistoryPage() {
  const logs = await prisma.emailLog.findMany({
    include: { employee: true, salarySlip: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const serialized = logs.map((l) => ({
    id: l.id,
    salarySlipId: l.salarySlipId,
    employeeCode: l.employee.employeeCode,
    employeeName: l.employee.name,
    email: l.email,
    payrollMonth: l.payrollMonth,
    status: l.status,
    sentAt: l.sentAt?.toISOString() ?? null,
    errorMessage: l.errorMessage,
    createdAt: l.createdAt.toISOString(),
  }));

  return <EmailHistoryClient logs={serialized} />;
}
