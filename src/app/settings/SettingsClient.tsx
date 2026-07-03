"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save, Upload } from "lucide-react";
import type { CompanySettingsInput } from "@/types";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-500";
const labelClass = "mb-1 block text-xs font-medium text-[var(--text-secondary)]";

export default function SettingsClient({ initialSettings }: { initialSettings: CompanySettingsInput }) {
  const [settings, setSettings] = useState<CompanySettingsInput>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  function update<K extends keyof CompanySettingsInput>(key: K, value: CompanySettingsInput[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to save settings");
        return;
      }
      toast.success("Settings saved");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/settings/upload-logo", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Upload failed");
        return;
      }
      update("logoUrl", json.url);
      toast.success("Logo uploaded");
    } finally {
      setUploading(false);
    }
  }

  const Field = (
    key: keyof CompanySettingsInput,
    label: string,
    opts: { type?: string } = {}
  ) => (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type={opts.type || "text"}
        value={(settings[key] as string | number) ?? ""}
        onChange={(e) => update(key, (opts.type === "number" ? Number(e.target.value) : e.target.value) as any)}
        className={inputClass}
      />
    </div>
  );

  return (
    <div className="animate-fadeUp mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-[var(--text-secondary)]">Company profile & email configuration</p>
      </div>

      <section className="glass-card rounded-2xl p-6 shadow-card">
        <h2 className="mb-4 text-sm font-semibold text-brand-500">Company Details</h2>
        <div className="mb-4 flex items-center gap-4">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="h-16 w-16 rounded-xl object-contain bg-white/5 p-1" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/5 text-xs text-[var(--text-secondary)]">
              No Logo
            </div>
          )}
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
            <Upload size={14} /> {uploading ? "Uploading..." : "Upload Logo"}
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
          </label>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Field("companyName", "Company Name")}
          {Field("phone", "Phone")}
          {Field("email", "Email")}
          {Field("website", "Website")}
          {Field("gst", "GST Number")}
          {Field("pan", "PAN Number")}
          <div className="sm:col-span-2">{Field("address", "Address")}</div>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 shadow-card">
        <h2 className="mb-4 text-sm font-semibold text-brand-500">Payslip Signatories</h2>
        <p className="mb-4 text-xs text-[var(--text-secondary)]">
          These names appear at the bottom of every generated payslip, under "Prepared by" and "Verified By".
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Field("preparedByName", "Prepared By - Name")}
          {Field("preparedByTitle", "Prepared By - Title")}
          {Field("verifiedByName", "Verified By - Name")}
          {Field("verifiedByTitle", "Verified By - Title")}
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 shadow-card">
        <h2 className="mb-4 text-sm font-semibold text-brand-500">SMTP / Email Automation</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Field("smtpHost", "SMTP Host")}
          {Field("smtpPort", "SMTP Port", { type: "number" })}
          {Field("smtpEmail", "SMTP Email")}
          {Field("smtpPassword", "SMTP Password", { type: "password" })}
          <div>
            <label className={labelClass}>SMTP Security</label>
            <select
              value={settings.smtpSecurity}
              onChange={(e) => update("smtpSecurity", e.target.value as "SSL" | "TLS" | "NONE")}
              className={inputClass}
            >
              <option value="SSL">SSL (port 465)</option>
              <option value="TLS">TLS / STARTTLS (port 587)</option>
              <option value="NONE">None</option>
            </select>
          </div>
        </div>
        <p className="mt-3 text-xs text-[var(--text-secondary)]">
          For Gmail, use an App Password (not your regular password) with 2-Step Verification enabled.
        </p>
      </section>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-card hover:bg-brand-700 disabled:opacity-60"
        >
          <Save size={16} /> {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
