import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { formatCurrency, MONTH_NAMES } from "./salary";
import type { SalaryBreakdown } from "@/types";

export interface PayslipData {
  employeeName: string;
  employeeCode: string;
  department?: string;
  designation?: string;
  month: number;
  year: number;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  panNumber?: string;
  breakdown: SalaryBreakdown;
  company: {
    companyName: string;
    logoUrl?: string;
    address?: string;
    phone?: string;
    email?: string;
    gst?: string;
    pan?: string;
    website?: string;
  };
}

const COLORS = {
  brand: "#2643e8",
  brandDark: "#1f33d1",
  text: "#1a1a2e",
  muted: "#666666",
  border: "#e5e7eb",
  panelBg: "#f4f6fd",
  deductionBg: "#d1315b",
  netBg: "#eafaf0",
  netBorder: "#2fb872",
  netText: "#1c9457",
};

function maskAccount(acc?: string) {
  if (!acc) return "-";
  if (acc.length <= 4) return acc;
  return `${"X".repeat(acc.length - 4)}${acc.slice(-4)}`;
}

/**
 * Renders a payslip PDF to a Buffer using pdfkit directly (no React involved).
 * This intentionally avoids @react-pdf/renderer, which has a well-documented
 * incompatibility with React instances inside Next.js App Router route
 * handlers (causes "Minified React error #31" under certain dev-server
 * module resolution conditions). pdfkit is a plain, imperative PDF library
 * with no dependency on React at all, so this class of bug cannot occur.
 */
export async function generatePayslipPdf(data: PayslipData): Promise<Buffer> {
  const { breakdown: b, company } = data;
  const monthLabel = `${MONTH_NAMES[data.month - 1]} ${data.year}`;

  const qrPayload = JSON.stringify({
    employee: data.employeeCode,
    month: `${data.month}-${data.year}`,
    net: b.netSalary,
  });
  const qrDataUrl = await QRCode.toDataURL(qrPayload, { margin: 1, width: 200 });
  const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");

  const doc = new PDFDocument({ size: "A4", margin: 36 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const left = doc.page.margins.left;

  // ---------- Header ----------
  let y = doc.page.margins.top;
  doc
    .fontSize(16)
    .fillColor(COLORS.brandDark)
    .font("Helvetica-Bold")
    .text(company.companyName || "Company Name", left, y);

  let addressLineY = y + 20;
  if (company.address) {
    doc.fontSize(8).fillColor(COLORS.muted).font("Helvetica").text(company.address, left, addressLineY, { width: pageWidth * 0.6 });
    addressLineY += 10;
  }
  const contactLine = [company.email, company.phone].filter(Boolean).join("   |   ");
  if (contactLine) {
    doc.fontSize(8).fillColor(COLORS.muted).text(contactLine, left, addressLineY);
  }

  doc.fontSize(13).fillColor(COLORS.text).font("Helvetica-Bold").text("SALARY SLIP", left, y, { width: pageWidth, align: "right" });
  doc.fontSize(9).fillColor(COLORS.muted).font("Helvetica").text(monthLabel, left, y + 16, { width: pageWidth, align: "right" });

  y += 40;
  doc.moveTo(left, y).lineTo(left + pageWidth, y).lineWidth(2).strokeColor(COLORS.brand).stroke();
  y += 18;

  // ---------- Employee info grid ----------
  const gridTop = y;
  const gridHeight = 78;
  doc.roundedRect(left, gridTop, pageWidth, gridHeight, 6).fill(COLORS.panelBg);

  const infoItems: [string, string][] = [
    ["Employee Name", data.employeeName],
    ["Employee ID", data.employeeCode],
    ["Department", data.department || "-"],
    ["Designation", data.designation || "-"],
    ["PAN Number", data.panNumber || "-"],
    ["Payroll Month", monthLabel],
  ];
  const colWidth = pageWidth / 2;
  infoItems.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const ix = left + 14 + col * colWidth;
    const iy = gridTop + 12 + row * 22;
    doc.fontSize(7.5).fillColor(COLORS.muted).font("Helvetica").text(label, ix, iy);
    doc.fontSize(9.5).fillColor(COLORS.text).font("Helvetica-Bold").text(value, ix, iy + 9);
  });

  y = gridTop + gridHeight + 18;

  // ---------- Earnings / Deductions tables ----------
  const tableGap = 12;
  const tableWidth = (pageWidth - tableGap) / 2;
  const earningsX = left;
  const deductionsX = left + tableWidth + tableGap;

  const earnings: [string, number][] = [
    ["Basic Salary", b.basicSalary],
    ["HRA", b.hra],
    ["Medical Allowance", b.medicalAllowance],
    ["Travel Allowance", b.travelAllowance],
    ["Special Allowance", b.specialAllowance],
    ["Bonus", b.bonus],
  ];
  const deductions: [string, number][] = [
    ["Provident Fund (PF)", b.pf],
    ["ESI", b.esi],
    ["Professional Tax", b.professionalTax],
    ["Other Deduction", b.otherDeduction],
  ];

  function drawTable(
    x: number,
    startY: number,
    title: string,
    headerColor: string,
    rows: [string, number][],
    totalLabel: string,
    totalValue: number
  ): number {
    let ty = startY;
    doc.rect(x, ty, tableWidth, 20).fill(headerColor);
    doc.fontSize(9.5).fillColor("#ffffff").font("Helvetica-Bold").text(title, x + 8, ty + 5.5);
    ty += 20;

    rows.forEach(([label, value]) => {
      doc.moveTo(x, ty + 18).lineTo(x + tableWidth, ty + 18).lineWidth(0.5).strokeColor(COLORS.border).stroke();
      doc.fontSize(8.5).fillColor(COLORS.text).font("Helvetica").text(label, x + 8, ty + 5, { width: tableWidth * 0.6 });
      doc
        .fontSize(8.5)
        .fillColor(COLORS.text)
        .font("Helvetica-Bold")
        .text(formatCurrency(value), x + 8, ty + 5, { width: tableWidth - 16, align: "right" });
      ty += 18;
    });

    doc.rect(x, ty, tableWidth, 20).fill(COLORS.panelBg);
    doc.fontSize(9).fillColor(COLORS.text).font("Helvetica-Bold").text(totalLabel, x + 8, ty + 5.5);
    doc
      .fontSize(9)
      .fillColor(COLORS.text)
      .font("Helvetica-Bold")
      .text(formatCurrency(totalValue), x + 8, ty + 5.5, { width: tableWidth - 16, align: "right" });
    ty += 20;

    return ty;
  }

  const earningsBottom = drawTable(earningsX, y, "EARNINGS", COLORS.brand, earnings, "Gross Salary", b.grossSalary);
  const deductionsBottom = drawTable(deductionsX, y, "DEDUCTIONS", COLORS.deductionBg, deductions, "Total Deduction", b.totalDeduction);

  y = Math.max(earningsBottom, deductionsBottom) + 14;

  // ---------- Net salary box ----------
  const netBoxHeight = 40;
  doc
    .roundedRect(left, y, pageWidth, netBoxHeight, 6)
    .fillAndStroke(COLORS.netBg, COLORS.netBorder);
  doc
    .fontSize(10.5)
    .fillColor(COLORS.text)
    .font("Helvetica-Bold")
    .text("NET SALARY (Gross − Deductions)", left + 14, y + 13);
  doc
    .fontSize(15)
    .fillColor(COLORS.netText)
    .font("Helvetica-Bold")
    .text(formatCurrency(b.netSalary), left, y + 10, { width: pageWidth - 14, align: "right" });

  y += netBoxHeight + 16;

  // ---------- Bank details ----------
  const bankBoxHeight = 58;
  doc.roundedRect(left, y, pageWidth, bankBoxHeight, 6).lineWidth(0.75).strokeColor(COLORS.border).stroke();
  doc.fontSize(8.5).fillColor("#444444").font("Helvetica-Bold").text("BANK DETAILS", left + 12, y + 10);

  const bankItems: [string, string][] = [
    ["Bank Name", data.bankName || "-"],
    ["Account Number", maskAccount(data.accountNumber)],
    ["IFSC Code", data.ifscCode || "-"],
  ];
  const bankColWidth = pageWidth / 3;
  bankItems.forEach(([label, value], i) => {
    const ix = left + 12 + i * bankColWidth;
    doc.fontSize(7.5).fillColor(COLORS.muted).font("Helvetica").text(label, ix, y + 28);
    doc.fontSize(9).fillColor(COLORS.text).font("Helvetica-Bold").text(value, ix, y + 38);
  });

  y += bankBoxHeight + 20;

  // ---------- Footer ----------
  const footerY = doc.page.height - doc.page.margins.bottom - 60;
  doc.moveTo(left, footerY).lineTo(left + pageWidth, footerY).lineWidth(0.5).strokeColor(COLORS.border).stroke();

  const footerNote = [
    "This is a system-generated salary slip and does not require a physical signature.",
    company.gst ? `GST: ${company.gst}` : "",
    company.pan ? `PAN: ${company.pan}` : "",
  ]
    .filter(Boolean)
    .join("   ");
  doc.fontSize(7).fillColor("#888888").font("Helvetica").text(footerNote, left, footerY + 10, { width: pageWidth * 0.55 });

  doc.moveTo(left + pageWidth * 0.62, footerY + 32).lineTo(left + pageWidth * 0.62 + 120, footerY + 32).lineWidth(1).strokeColor("#333333").stroke();
  doc
    .fontSize(8)
    .fillColor(COLORS.text)
    .text("Authorized Signatory", left + pageWidth * 0.62, footerY + 36, { width: 120, align: "center" });

  doc.image(qrBuffer, left + pageWidth - 50, footerY + 5, { width: 50, height: 50 });

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}
