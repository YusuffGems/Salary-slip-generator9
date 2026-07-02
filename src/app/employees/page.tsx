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

  // Decimal fields must be serialized before passing to a client component,
  // and Prisma's `null` for empty optional text fields must become `undefined`
  // to match the form's TypeScript types (which use `string | undefined`).
  const serialized = employees.map((e) => ({
    id: e.id,
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
  }));

  return <EmployeesClient initialEmployees={serialized} departments={departments} />;
}
