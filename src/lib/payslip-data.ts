import { prisma } from "./prisma";
import type { PayslipData } from "./pdf";

export async function buildPayslipData(slipId: string): Promise<PayslipData | null> {
  const slip = await prisma.salarySlip.findUnique({
    where: { id: slipId },
    include: { employee: true, payroll: true },
  });
  if (!slip) return null;

  const settings = await prisma.companySettings.findUnique({ where: { id: "singleton" } });

  return {
    employeeName: slip.employee.name,
    employeeCode: slip.employee.employeeCode,
    employeeEmail: slip.employee.email,
    department: slip.employee.department ?? undefined,
    designation: slip.employee.designation ?? undefined,
    dateOfJoining: slip.employee.dateOfJoining
      ? slip.employee.dateOfJoining.toLocaleDateString("en-GB").replace(/\//g, "-")
      : undefined,
    month: slip.payroll.month,
    year: slip.payroll.year,
    bankName: slip.employee.bankName ?? undefined,
    accountNumber: slip.employee.accountNumber ?? undefined,
    ifscCode: slip.employee.ifscCode ?? undefined,
    panNumber: slip.employee.panNumber ?? undefined,
    breakdown: {
      basicSalary: Number(slip.basicSalary),
      hra: Number(slip.hra),
      medicalAllowance: Number(slip.medicalAllowance),
      travelAllowance: Number(slip.travelAllowance),
      specialAllowance: Number(slip.specialAllowance),
      bonus: Number(slip.bonus),
      grossSalary: Number(slip.grossSalary),
      pf: Number(slip.pf),
      esi: Number(slip.esi),
      professionalTax: Number(slip.professionalTax),
      otherDeduction: Number(slip.otherDeduction),
      totalDeduction: Number(slip.totalDeduction),
      netSalary: Number(slip.netSalary),
    },
    company: {
      companyName: settings?.companyName || "Your Company",
      logoUrl: settings?.logoUrl ?? undefined,
      address: settings?.address ?? undefined,
      phone: settings?.phone ?? undefined,
      email: settings?.email ?? undefined,
      gst: settings?.gst ?? undefined,
      pan: settings?.pan ?? undefined,
      website: settings?.website ?? undefined,
      preparedByName: settings?.preparedByName ?? undefined,
      preparedByTitle: settings?.preparedByTitle ?? undefined,
      preparedBySignatureUrl: settings?.preparedBySignatureUrl ?? undefined,
      verifiedByName: settings?.verifiedByName ?? undefined,
      verifiedByTitle: settings?.verifiedByTitle ?? undefined,
      verifiedBySignatureUrl: settings?.verifiedBySignatureUrl ?? undefined,
    },
  };
}