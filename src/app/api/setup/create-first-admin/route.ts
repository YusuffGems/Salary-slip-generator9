import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const existingCount = await prisma.user.count();
    if (existingCount > 0) {
      return NextResponse.json(
        { error: "Setup already completed. An admin account already exists — please sign in instead." },
        { status: 403 }
      );
    }

    const { name, email, password } = schema.parse(await req.json());

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: "ADMIN" },
    });

    return NextResponse.json({ success: true, email: user.email }, { status: 201 });
  } catch (err: any) {
    if (err?.issues) {
      return NextResponse.json({ error: err.issues[0]?.message || "Validation failed" }, { status: 400 });
    }
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: err?.message || "Failed to create admin account" }, { status: 500 });
  }
}

export async function GET() {
  const existingCount = await prisma.user.count();
  return NextResponse.json({ setupComplete: existingCount > 0 });
}