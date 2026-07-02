export interface EmployeeInput {
  employeeCode: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  designation?: string;
  dateOfJoining?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  panNumber?: string;
  uanNumber?: string;

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
}

export interface SalaryBreakdown {
  basicSalary: number;
  hra: number;
  medicalAllowance: number;
  travelAllowance: number;
  specialAllowance: number;
  bonus: number;
  grossSalary: number;

  pf: number;
  esi: number;
  professionalTax: number;
  otherDeduction: number;
  totalDeduction: number;

  netSalary: number;
}

export interface CompanySettingsInput {
  companyName: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  gst?: string;
  pan?: string;
  website?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpEmail?: string;
  smtpPassword?: string;
  smtpSecurity?: "SSL" | "TLS" | "NONE";
}

export type SendProgressEvent =
  | { type: "start"; total: number }
  | { type: "progress"; employeeName: string; status: "success" | "failed"; error?: string; completed: number; total: number }
  | { type: "done"; success: number; failed: number };
