import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EmployeeFormScreen from "../../EmployeeFormScreen";

export const dynamic = "force-dynamic";

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) notFound();

  const initialValues = {
    employeeCode: employee.employeeCode,
    name: employee.name,
    email: employee.email,
    phone: employee.phone ?? "",
    department: employee.department ?? "",
    designation: employee.designation ?? "",
    dateOfJoining: employee.dateOfJoining ? employee.dateOfJoining.toISOString().slice(0, 10) : "",
    bankName: employee.bankName ?? "",
    accountNumber: employee.accountNumber ?? "",
    ifscCode: employee.ifscCode ?? "",
    panNumber: employee.panNumber ?? "",
    uanNumber: employee.uanNumber ?? "",
    basicSalary: Number(employee.basicSalary),
    hra: Number(employee.hra),
    medicalAllowance: Number(employee.medicalAllowance),
    travelAllowance: Number(employee.travelAllowance),
    specialAllowance: Number(employee.specialAllowance),
    bonus: Number(employee.bonus),
    pf: Number(employee.pf),
    esi: Number(employee.esi),
    professionalTax: Number(employee.professionalTax),
    otherDeduction: Number(employee.otherDeduction),
  };

  return <EmployeeFormScreen mode="edit" employeeId={employee.id} initialValues={initialValues} />;
}
