import nodemailer from "nodemailer";
import { MONTH_NAMES } from "./salary";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean; // true for SSL (465), false for TLS/STARTTLS (587)
  auth: { user: string; pass: string };
}

export function getTransporter(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });
}

export function buildSmtpConfigFromSettings(settings: {
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpEmail?: string | null;
  smtpPassword?: string | null;
  smtpSecurity?: string | null;
}): SmtpConfig {
  if (!settings.smtpHost || !settings.smtpPort || !settings.smtpEmail || !settings.smtpPassword) {
    throw new Error("SMTP settings are incomplete. Please configure them in Settings.");
  }
  return {
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: (settings.smtpSecurity || "SSL").toUpperCase() === "SSL",
    auth: { user: settings.smtpEmail, pass: settings.smtpPassword },
  };
}

export function buildPayslipEmailHtml(params: {
  employeeName: string;
  month: number;
  year: number;
  companyName: string;
  netSalary: string;
}) {
  const monthLabel = `${MONTH_NAMES[params.month - 1]} ${params.year}`;
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color:#1a1a2e;">
    <div style="background: linear-gradient(135deg,#2643e8,#3d64f4); padding: 28px 32px; border-radius: 12px 12px 0 0;">
      <h2 style="color:#fff; margin:0; font-size:20px;">${params.companyName}</h2>
      <p style="color:#dbe6fe; margin:6px 0 0; font-size:13px;">Salary Slip – ${monthLabel}</p>
    </div>
    <div style="border:1px solid #e5e7eb; border-top:none; padding: 28px 32px; border-radius: 0 0 12px 12px;">
      <p>Dear ${params.employeeName},</p>
      <p>Please find attached your salary slip for <strong>${monthLabel}</strong>.</p>
      <div style="background:#f4f6fd; border-radius:8px; padding:14px 18px; margin: 18px 0;">
        <span style="font-size:12px; color:#666;">Net Salary Credited</span><br/>
        <span style="font-size:22px; font-weight:700; color:#1f33d1;">${params.netSalary}</span>
      </div>
      <p>If you have any questions about this payslip, please reach out to HR.</p>
      <p style="margin-top:28px;">Thank you.<br/>Regards,<br/><strong>${params.companyName}</strong></p>
    </div>
    <p style="text-align:center; color:#aaa; font-size:11px; margin-top:16px;">This is an automated email. Please do not reply directly.</p>
  </div>`;
}

export async function sendPayslipEmail(params: {
  smtp: SmtpConfig;
  fromName: string;
  to: string;
  employeeName: string;
  month: number;
  year: number;
  netSalary: string;
  companyName: string;
  pdfBuffer: Buffer;
  pdfFilename: string;
}) {
  const transporter = getTransporter(params.smtp);
  const monthLabel = `${MONTH_NAMES[params.month - 1]} ${params.year}`;

  await transporter.sendMail({
    from: `"${params.fromName}" <${params.smtp.auth.user}>`,
    to: params.to,
    subject: `Salary Slip – ${monthLabel}`,
    html: buildPayslipEmailHtml({
      employeeName: params.employeeName,
      month: params.month,
      year: params.year,
      companyName: params.companyName,
      netSalary: params.netSalary,
    }),
    attachments: [
      {
        filename: params.pdfFilename,
        content: params.pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}
