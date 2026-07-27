"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { calculateSalary, calculateContractSalary, formatCurrency } from "@/lib/salary";

const schema = z.object({
  employeeType: z.enum(["DIRECT", "CONTRACT"]).default("DIRECT"),
  employeeCode: z.string().min(1, "Required"),
  name: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  dateOfJoining: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  panNumber: z.string().optional(),
  uanNumber: z.string().optional(),

  basicSalary: z.coerce.number().nonnegative().optional().default(0),
  hra: z.coerce.number().nonnegative().optional().default(0),
  medicalAllowance: z.coerce.number().nonnegative().optional().default(0),
  travelAllowance: z.coerce.number().nonnegative().optional().default(0),
  specialAllowance: z.coerce.number().nonnegative().optional().default(0),
  bonus: z.coerce.number().nonnegative().optional().default(0),
  pf: z.coerce.number().nonnegative().optional().default(0),
  esi: z.coerce.number().nonnegative().optional().default(0),
  professionalTax: z.coerce.number().nonnegative().optional().default(0),
  otherDeduction: z.coerce.number().nonnegative().optional().default(0),

  dateOfContract: z.string().optional(),
  grossPay: z.coerce.number().nonnegative().optional().default(0),
  lastMonthPay: z.coerce.number().nonnegative().optional().default(0),
  tds: z.coerce.number().nonnegative().optional().default(0),
});

export type EmployeeFormValues = z.infer<typeof schema>;

const inputClass =
  "h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-brand-500";
const labelClass = "mb-1 block text-xs font-medium text-[var(--text-secondary)]";

export default function EmployeeForm({
  formId,
  initialValues,
  onSubmit,
}: {
  formId: string;
  initialValues?: Partial<EmployeeFormValues>;
  onSubmit: (values: EmployeeFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeType: "DIRECT",
      basicSalary: 0, hra: 0, medicalAllowance: 0, travelAllowance: 0,
      specialAllowance: 0, bonus: 0, pf: 0, esi: 0, professionalTax: 0, otherDeduction: 0,
      grossPay: 0, lastMonthPay: 0, tds: 0,
      ...initialValues,
    },
  });

  const values = watch();
  const employeeType = values.employeeType;
  const directBreakdown = calculateSalary(values);
  const contractBreakdown = calculateContractSalary(values);

  const Field = (name: keyof EmployeeFormValues, label: string, opts: { type?: string; step?: string } = {}) => (
    <div>
      <label className={labelClass}>{label}</label>
      <input {...register(name)} type={opts.type || "text"} step={opts.step} className={inputClass} />
      {errors[name] && <p className="mt-1 text-[10px] text-rose-500">{errors[name]?.message as string}</p>}
    </div>
  );

  const sectionTitle = (text: string, colorClass: string) => (
    <h3 className={`mb-3 text-xs font-bold uppercase tracking-wide ${colorClass}`}>{text}</h3>
  );

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Employee Type - determines which pay fields show below */}
        <div className="lg:col-span-2">
          {sectionTitle("Employee Type", "text-brand-400")}
          <div className="max-w-xs">
            <label className={labelClass}>Type</label>
            <select {...register("employeeType")} className={inputClass}>
              <option value="DIRECT" style={{ color: "#000" }}>Direct Employee</option>
              <option value="CONTRACT" style={{ color: "#000" }}>Contract Employee</option>
            </select>
          </div>
        </div>

        <div>
          {sectionTitle("Employee Information", "text-brand-400")}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Field("employeeCode", "Employee ID")}
            {Field("name", "Employee Name")}
            {Field("email", "Email Address", { type: "email" })}
            {Field("phone", "Phone Number")}
            {Field("department", "Department")}
            {Field("designation", "Designation")}
          </div>
        </div>

        <div>
          {sectionTitle("Bank Information", "text-brand-400")}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Field("bankName", "Bank Name")}
            {Field("accountNumber", "Account Number")}
            {Field("ifscCode", "IFSC Code")}
            {Field("panNumber", "PAN Number")}
            {employeeType === "DIRECT" && Field("uanNumber", "UAN Number")}
            {employeeType === "DIRECT" && Field("dateOfJoining", "Date of Joining", { type: "date" })}
            {employeeType === "CONTRACT" && Field("dateOfContract", "Date of Contract", { type: "date" })}
          </div>
        </div>

        {employeeType === "DIRECT" ? (
          <>
            <div>
              {sectionTitle("Salary Earnings", "text-emerald-400")}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Field("basicSalary", "Basic Salary", { type: "number", step: "0.01" })}
                {Field("hra", "HRA", { type: "number", step: "0.01" })}
                {Field("medicalAllowance", "Medical Allowance", { type: "number", step: "0.01" })}
                {Field("travelAllowance", "Travel Allowance", { type: "number", step: "0.01" })}
                {Field("specialAllowance", "Special Allowance", { type: "number", step: "0.01" })}
                {Field("bonus", "Mobile Allowance", { type: "number", step: "0.01" })}
              </div>
            </div>

            <div>
              {sectionTitle("Salary Deductions", "text-rose-400")}
              <div className="grid grid-cols-2 gap-3">
                {Field("pf", "PF", { type: "number", step: "0.01" })}
                {Field("esi", "ESI", { type: "number", step: "0.01" })}
                {Field("professionalTax", "Professional Tax", { type: "number", step: "0.01" })}
                {Field("otherDeduction", "Other Deduction", { type: "number", step: "0.01" })}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 gap-3 rounded-xl bg-white/5 p-4 text-center sm:grid-cols-3">
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Gross Salary</p>
                  <p className="text-lg font-bold">{formatCurrency(directBreakdown.grossSalary)}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Total Deduction</p>
                  <p className="text-lg font-bold text-rose-500">{formatCurrency(directBreakdown.totalDeduction)}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Net Salary</p>
                  <p className="text-lg font-bold text-emerald-500">{formatCurrency(directBreakdown.netSalary)}</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              {sectionTitle("Contract Pay Details", "text-emerald-400")}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Field("grossPay", "Gross Pay", { type: "number", step: "0.01" })}
                {Field("lastMonthPay", "Last Month Pay", { type: "number", step: "0.01" })}
                {Field("tds", "TDS", { type: "number", step: "0.01" })}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 gap-3 rounded-xl bg-white/5 p-4 text-center sm:grid-cols-3">
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Gross Pay</p>
                  <p className="text-lg font-bold">{formatCurrency(contractBreakdown.grossPay)}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">TDS</p>
                  <p className="text-lg font-bold text-rose-500">{formatCurrency(contractBreakdown.tds)}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Net Pay</p>
                  <p className="text-lg font-bold text-emerald-500">{formatCurrency(contractBreakdown.netPay)}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </form>
  );
}