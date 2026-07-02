"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import EmployeeForm, { type EmployeeFormValues } from "./EmployeeForm";

export default function EmployeeFormScreen({
  mode,
  employeeId,
  initialValues,
}: {
  mode: "create" | "edit";
  employeeId?: string;
  initialValues?: Partial<EmployeeFormValues>;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(values: EmployeeFormValues) {
    setSaving(true);
    try {
      const res = await fetch(mode === "edit" ? `/api/employees/${employeeId}` : "/api/employees", {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Something went wrong");
        setSaving(false);
        return;
      }
      toast.success(mode === "edit" ? "Employee updated" : "Employee added");
      router.push("/employees");
      router.refresh();
    } catch {
      toast.error("Network error — please try again");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col overflow-hidden bg-[#0b0e1a]">
      {/* Fixed header */}
      <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-white/10 px-4 sm:px-7">
        <button
          onClick={() => router.push("/employees")}
          className="flex items-center gap-2 bg-transparent text-sm font-medium text-white"
        >
          <ArrowLeft size={18} /> <span className="hidden sm:inline">Back</span>
        </button>

        <h1 className="text-sm font-semibold text-white sm:text-base">
          {mode === "edit" ? "Edit Employee" : "Add Employee"}
        </h1>

        <button
          type="submit"
          form="employee-form"
          disabled={saving}
          className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-60 sm:px-5 sm:text-sm"
        >
          {saving ? "Saving..." : "Save Employee"}
        </button>
      </div>

      {/* Body - scrolls on small screens, fits on one page on desktop */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
        <EmployeeForm formId="employee-form" initialValues={initialValues} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
