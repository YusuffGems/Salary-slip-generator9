import type { SalaryBreakdown } from "@/types";

/**
 * Pure calculation function — used both live in the Employee form (client)
 * and server-side when generating payroll, so the numbers are always
 * guaranteed to match.
 */
export function calculateSalary(input: {
  basicSalary: number;
  hra: number;
  medicalAllowance: number;
  travelAllowance: number;
  specialAllowance: number;
  bonus: number;
  pf: number;
  esi: number;
  professionalTax: number;
  otherDeduction: number;
}): SalaryBreakdown {
  const basicSalary = round2(input.basicSalary || 0);
  const hra = round2(input.hra || 0);
  const medicalAllowance = round2(input.medicalAllowance || 0);
  const travelAllowance = round2(input.travelAllowance || 0);
  const specialAllowance = round2(input.specialAllowance || 0);
  const bonus = round2(input.bonus || 0);

  const grossSalary = round2(
    basicSalary + hra + medicalAllowance + travelAllowance + specialAllowance + bonus
  );

  const pf = round2(input.pf || 0);
  const esi = round2(input.esi || 0);
  const professionalTax = round2(input.professionalTax || 0);
  const otherDeduction = round2(input.otherDeduction || 0);

  const totalDeduction = round2(pf + esi + professionalTax + otherDeduction);
  const netSalary = round2(grossSalary - totalDeduction);

  return {
    basicSalary,
    hra,
    medicalAllowance,
    travelAllowance,
    specialAllowance,
    bonus,
    grossSalary,
    pf,
    esi,
    professionalTax,
    otherDeduction,
    totalDeduction,
    netSalary,
  };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Auto-calculates the standard "No. of Working Days" for a payroll month:
 * total calendar days in the month, minus Sundays (the common convention
 * for Indian payroll where Saturdays are working but Sundays are not).
 * Adjust here if a different working-week convention is needed.
 */
export function getWorkingDaysInMonth(month: number, year: number): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  let workingDays = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    if (date.getDay() !== 0) {
      // 0 = Sunday
      workingDays++;
    }
  }
  return workingDays;
}