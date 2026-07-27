import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseOptionalDate(value: unknown): Date | null {
  if (!value || value === "") return null;
  const d = new Date(value as string);
  if (isNaN(d.getTime())) return null;
  return d;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body: any = await req.json();

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        employeeType: body.employeeType ?? "DIRECT",
        employeeCode: body.employeeCode,
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        department: body.department || null,
        designation: body.designation || null,
        dateOfJoining: parseOptionalDate(body.dateOfJoining),
        bankName: body.bankName || null,
        accountNumber: body.accountNumber || null,
        ifscCode: body.ifscCode || null,
        panNumber: body.panNumber || null,
        uanNumber: body.uanNumber || null,

        basicSalary: body.basicSalary ?? 0,
        hra: body.hra ?? 0,
        medicalAllowance: body.medicalAllowance ?? 0,
        travelAllowance: body.travelAllowance ?? 0,
        specialAllowance: body.specialAllowance ?? 0,
        bonus: body.bonus ?? 0,
        pf: body.pf ?? 0,
        esi: body.esi ?? 0,
        professionalTax: body.professionalTax ?? 0,
        otherDeduction: body.otherDeduction ?? 0,

        dateOfContract: parseOptionalDate(body.dateOfContract),
        grossPay: body.grossPay ?? 0,
        lastMonthPay: body.lastMonthPay ?? 0,
        tds: body.tds ?? 0,
      },
    });

    return NextResponse.json({ employee });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "An employee with this Employee ID already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: err?.message || "Failed to update employee" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.employee.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to remove employee" }, { status: 500 });
  }
}