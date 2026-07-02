import { NextRequest, NextResponse } from "next/server";
import { supabase, LOGO_BUCKET } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const path = `logo-${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from(LOGO_BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);

    await prisma.companySettings.upsert({
      where: { id: "singleton" },
      update: { logoUrl: data.publicUrl },
      create: { id: "singleton", companyName: "", logoUrl: data.publicUrl },
    });

    return NextResponse.json({ url: data.publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Upload failed" }, { status: 500 });
  }
}
