import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ logId: string }> }) {
  try {
    const { logId } = await params;

    const log = await prisma.emailLog.findUnique({ where: { id: logId } });
    if (!log) {
      return NextResponse.json({ error: "Email log entry not found" }, { status: 404 });
    }

    await prisma.emailLog.delete({ where: { id: logId } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to delete email log entry" }, { status: 500 });
  }
}