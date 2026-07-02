import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const employeeSchema = z.object({
  employeeCode: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  dateOfJoining: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  panNumber: z.string().optional(),
  uanNumber: z.string().optional(),
  basicSalary: z.number().nonnegative(),
  hra: z.number().nonnegative().default(0),
  medicalAllowance: z.number().nonnegative().default(0),
  travelAllowance: z.number().nonnegative().default(0),
  specialAllowance: z.number().nonnegative().default(0),
  bonus: z.number().nonnegative().default(0),
  pf: z.number().nonnegative().default(0),
  esi: z.number().nonnegative().default(0),
  professionalTax: z.number().nonnegative().default(0),
  otherDeduction: z.number().nonnegative().default(0),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const department = searchParams.get("department") || "";
  const page = Number(searchParams.get("page") || "1");
  const pageSize = Number(searchParams.get("pageSize") || "10");

  const where = {
    isActive: true,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { employeeCode: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(department ? { department } : {}),
  };

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.employee.count({ where }),
  ]);

  return NextResponse.json({ employees, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = employeeSchema.parse(body);

    const existing = await prisma.employee.findUnique({ where: { employeeCode: data.employeeCode } });
    if (existing) {
      return NextResponse.json({ error: "Employee ID already exists" }, { status: 409 });
    }

    const employee = await prisma.employee.create({
      data: {
        ...data,
        dateOfJoining: data.dateOfJoining ? new Date(data.dateOfJoining) : undefined,
      },
    });
    return NextResponse.json({ employee }, { status: 201 });
  } catch (err: any) {
    if (err?.issues) {
      return NextResponse.json({ error: "Validation failed", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: err?.message || "Failed to create employee" }, { status: 500 });
  }
}
