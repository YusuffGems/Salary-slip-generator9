import { prisma } from "@/lib/prisma";
import GenerateSalaryClient from "./GenerateSalaryClient";

export const dynamic = "force-dynamic";

export default async function GenerateSalaryPage() {
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const serialized = employees.map((e) => ({
    id: e.id,
    employeeCode: e.employeeCode,
    name: e.name,
    email: e.email,
    department: e.department ?? "",
    designation: e.designation ?? "",
    dateOfJoining: e.dateOfJoining ? e.dateOfJoining.toISOString() : null,
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

  const departments = Array.from(new Set(serialized.map((e) => e.department).filter(Boolean))) as string[];

  return <GenerateSalaryClient employees={serialized} departments={departments} />;
}
