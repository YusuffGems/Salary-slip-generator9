import { prisma } from "@/lib/prisma";
import EmployeesClient from "./EmployeesClient";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  const departments = Array.from(
    new Set(employees.map((e) => e.department).filter(Boolean))
  ) as string[];

  const serialized = employees.map((e) => ({
    id: e.id,
    employeeType: e.employeeType ?? "DIRECT",
    employeeCode: e.employeeCode,
    name: e.name,
    email: e.email,
    phone: e.phone ?? undefined,
    department: e.department ?? undefined,
    designation: e.designation ?? undefined,
    dateOfJoining: e.dateOfJoining ? e.dateOfJoining.toISOString().slice(0, 10) : undefined,
    bankName: e.bankName ?? undefined,
    accountNumber: e.accountNumber ?? undefined,
    ifscCode: e.ifscCode ?? undefined,
    panNumber: e.panNumber ?? undefined,
    uanNumber: e.uanNumber ?? undefined,
    basicSalary: Number(e.basicSalary),
    hra: Number(e.hra),
    medicalAllowance: Number(e.medicalAllowance),
    travelAllowance: Number(e.travelAllowance),
    specialAllowance: Number(e.specialAllowance),
    bonus: Number(e.bonus),
    pf: Number(e.pf),
    esi: Number(e.esi),
    professionalTax: Number(e.professionalTax),
    otherDeduction: Number(e.otherDeduction),

    dateOfContract: e.dateOfContract ? e.dateOfContract.toISOString().slice(0, 10) : undefined,
    grossPay: e.grossPay != null ? Number(e.grossPay) : 0,
    lastMonthPay: e.lastMonthPay != null ? Number(e.lastMonthPay) : 0,
    tds: e.tds != null ? Number(e.tds) : 0,
  }));

  return <EmployeesClient initialEmployees={serialized} departments={departments} />;
}