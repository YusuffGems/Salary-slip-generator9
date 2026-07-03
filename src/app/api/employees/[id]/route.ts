import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ employee });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { dateOfJoining, ...rest } = body;

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...rest,
        ...(dateOfJoining ? { dateOfJoining: new Date(dateOfJoining) } : {}),
      },
    });
    return NextResponse.json({ employee });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to update employee" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Soft delete keeps historical payroll/email records intact
    await prisma.employee.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to delete employee" }, { status: 500 });
  }
}
