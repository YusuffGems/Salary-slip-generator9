import { prisma } from "@/lib/prisma";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await prisma.companySettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", companyName: "" },
  });

  return (
    <SettingsClient
      initialSettings={{
        companyName: settings.companyName,
        logoUrl: settings.logoUrl ?? "",
        address: settings.address ?? "",
        phone: settings.phone ?? "",
        email: settings.email ?? "",
        gst: settings.gst ?? "",
        pan: settings.pan ?? "",
        website: settings.website ?? "",
        preparedByName: settings.preparedByName ?? "",
        preparedByTitle: settings.preparedByTitle ?? "",
        verifiedByName: settings.verifiedByName ?? "",
        verifiedByTitle: settings.verifiedByTitle ?? "",
        smtpHost: settings.smtpHost ?? "",
        smtpPort: settings.smtpPort ?? 465,
        smtpEmail: settings.smtpEmail ?? "",
        smtpPassword: settings.smtpPassword ?? "",
        smtpSecurity: (settings.smtpSecurity as "SSL" | "TLS" | "NONE") ?? "SSL",
      }}
    />
  );
}