import PDFDocument from "pdfkit";
import { formatCurrency, MONTH_NAMES } from "./salary";
import type { SalaryBreakdown } from "@/types";

export interface PayslipData {
  employeeName: string;
  employeeCode: string;
  employeeEmail?: string;
  department?: string;
  designation?: string;
  dateOfJoining?: string;
  month: number;
  year: number;
  bankName?: string;
  accountNumber?: string;
  workingDays?: number;
  daysWorked?: number;
  daysLeave?: number;
  lossOfPayDays?: number;
  clBalance?: number;
  elBalance?: number;
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
    preparedByName?: string;
    preparedByTitle?: string;
    preparedBySignatureUrl?: string;
    verifiedByName?: string;
    verifiedByTitle?: string;
    verifiedBySignatureUrl?: string;
  };
}

const BORDER = "#000000";
const TEXT = "#000000";

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

export async function generatePayslipPdf(data: PayslipData): Promise<Buffer> {
  const { breakdown: b, company } = data;
  const monthLabel = `${MONTH_NAMES[data.month - 1]} ${data.year}`;

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const left = doc.page.margins.left;
  let y = doc.page.margins.top;

  if (company.logoUrl) {
    const logoBuffer = await fetchImageBuffer(company.logoUrl);
    if (logoBuffer) {
      doc.image(logoBuffer, left, y, { fit: [110, 50] });
    }
  }

  doc.fontSize(15).fillColor(TEXT).font("Helvetica-Bold").text(company.companyName || "Company Name", left, y + 4, {
    width: pageWidth,
    align: "center",
  });
  if (company.address) {
    doc.fontSize(9).font("Helvetica-Bold").text(company.address, left, y + 24, {
      width: pageWidth,
      align: "center",
    });
  }
  doc.fontSize(10.5).font("Helvetica-Bold").text(`Pay Slip for the month of ${monthLabel}`, left, y + 40, {
    width: pageWidth,
    align: "center",
  });

  y += 65;

  const rowHeight = 20;
  const col1W = pageWidth * 0.22;
  const col2W = pageWidth * 0.28;
  const col3W = pageWidth * 0.22;
  const col4W = pageWidth - col1W - col2W - col3W;

  const fmtNum = (v: number | undefined) => (v === undefined || v === null ? "-" : String(v));

  const infoRows: [string, string, string, string][] = [
    ["Employee Name", data.employeeName, "No. of Working Days", fmtNum(data.workingDays)],
    ["Employee Code", data.employeeCode, "No. of Days Worked", fmtNum(data.daysWorked)],
    ["Designation", data.designation || "-", "No. of Days Leave", fmtNum(data.daysLeave)],
    ["Department", data.department || "-", "Loss of Pay Days", fmtNum(data.lossOfPayDays)],
    ["PAN No.", data.panNumber || "-", "CL Balance", fmtNum(data.clBalance)],
    ["Joining Date", data.dateOfJoining || "-", "EL Balance", fmtNum(data.elBalance)],
    ["Email", data.employeeEmail || "-", "Actual Gross Salary", formatCurrency(b.grossSalary)],
  ];

  function drawGridRow(cells: string[], widths: number[], rowY: number) {
    let x = left;
    doc.lineWidth(0.75).strokeColor(BORDER);
    doc.rect(left, rowY, pageWidth, rowHeight).stroke();
    for (let i = 0; i < cells.length; i++) {
      if (i > 0) {
        doc.moveTo(x, rowY).lineTo(x, rowY + rowHeight).stroke();
      }
      doc
        .fontSize(8.5)
        .font("Helvetica")
        .fillColor(TEXT)
        .text(cells[i], x + 6, rowY + 6, { width: widths[i] - 10, height: rowHeight - 6 });
      x += widths[i];
    }
  }

  infoRows.forEach((row) => {
    drawGridRow([row[0], row[1], row[2], row[3]], [col1W, col2W, col3W, col4W], y);
    y += rowHeight;
  });

  y += 14;

  const sCol1 = pageWidth * 0.22;
  const sCol2 = pageWidth * 0.22;
  const sCol3 = pageWidth * 0.28;
  const sCol4 = pageWidth - sCol1 - sCol2 - sCol3;

  const headerRowHeight = 26;
  doc.lineWidth(0.75).strokeColor(BORDER);
  doc.rect(left, y, sCol1 + sCol2, headerRowHeight).stroke();
  doc.rect(left + sCol1 + sCol2, y, sCol3 + sCol4, headerRowHeight).stroke();
  doc
    .fontSize(8.5)
    .font("Helvetica-Bold")
    .fillColor(TEXT)
    .text("Salary Calculation\nIn Rupees", left + 6, y + 5, { width: sCol1 + sCol2 - 12, align: "center" });
  doc
    .fontSize(8.5)
    .font("Helvetica-Bold")
    .text("Deductions in Rupees", left + sCol1 + sCol2 + 6, y + 9, { width: sCol3 + sCol4 - 12, align: "center" });
  y += headerRowHeight;

  const earnings: [string, number][] = [
    ["Basic", b.basicSalary],
    ["HRA", b.hra],
    ["Transport Allowance", b.travelAllowance],
    ["Medical Allowance", b.medicalAllowance],
    ["Other Allowance", b.specialAllowance],
    ["Bonus", b.bonus],
  ];
  const deductions: [string, number][] = [
    ["Professional Tax", b.professionalTax],
    ["Provident Fund", b.pf],
    ["ESI", b.esi],
    ["Other Deduction", b.otherDeduction],
  ];

  const dataRowHeight = 19;
  for (let i = 0; i < earnings.length; i++) {
    const isSecondLast = i === earnings.length - 2;
    const rowY = y + i * dataRowHeight;

    doc.lineWidth(0.75).strokeColor(BORDER);
    doc.rect(left, rowY, sCol1, dataRowHeight).stroke();
    doc.rect(left + sCol1, rowY, sCol2, dataRowHeight).stroke();

    doc.fontSize(8.5).font("Helvetica").fillColor(TEXT).text(earnings[i][0], left + 6, rowY + 5, { width: sCol1 - 10 });
    doc.fontSize(8.5).font("Helvetica").text(formatCurrency(earnings[i][1]), left + sCol1 + 6, rowY + 5, {
      width: sCol2 - 12,
      align: "right",
    });

    if (i < deductions.length) {
      doc.rect(left + sCol1 + sCol2, rowY, sCol3, dataRowHeight).stroke();
      doc.rect(left + sCol1 + sCol2 + sCol3, rowY, sCol4, dataRowHeight).stroke();
      doc.fontSize(8.5).font("Helvetica").text(deductions[i][0], left + sCol1 + sCol2 + 6, rowY + 5, { width: sCol3 - 10 });
      doc.fontSize(8.5).font("Helvetica").text(formatCurrency(deductions[i][1]), left + sCol1 + sCol2 + sCol3 + 6, rowY + 5, {
        width: sCol4 - 12,
        align: "right",
      });
    } else if (isSecondLast) {
      doc.rect(left + sCol1 + sCol2, rowY, sCol3, dataRowHeight).stroke();
      doc.rect(left + sCol1 + sCol2 + sCol3, rowY, sCol4, dataRowHeight).stroke();
      doc.fontSize(8.5).font("Helvetica-Bold").text("Total Deductions", left + sCol1 + sCol2 + 6, rowY + 5, { width: sCol3 - 10 });
      doc.fontSize(8.5).font("Helvetica-Bold").text(formatCurrency(b.totalDeduction), left + sCol1 + sCol2 + sCol3 + 6, rowY + 5, {
        width: sCol4 - 12,
        align: "right",
      });
    } else {
      doc.rect(left + sCol1 + sCol2, rowY, sCol3, dataRowHeight).stroke();
      doc.rect(left + sCol1 + sCol2 + sCol3, rowY, sCol4, dataRowHeight).stroke();
    }
  }
  y += earnings.length * dataRowHeight;

  const totalRowHeight = 22;
  doc.lineWidth(0.75).strokeColor(BORDER);
  doc.rect(left, y, sCol1, totalRowHeight).stroke();
  doc.rect(left + sCol1, y, sCol2, totalRowHeight).stroke();
  doc.rect(left + sCol1 + sCol2, y, sCol3, totalRowHeight).stroke();
  doc.rect(left + sCol1 + sCol2 + sCol3, y, sCol4, totalRowHeight).stroke();

  doc.fontSize(9).font("Helvetica-Bold").fillColor(TEXT).text("TOTAL", left + 6, y + 6, { width: sCol1 - 10 });
  doc.fontSize(9).font("Helvetica-Bold").text(formatCurrency(b.grossSalary), left + sCol1 + 6, y + 6, {
    width: sCol2 - 12,
    align: "right",
  });
  doc.fontSize(9).font("Helvetica-Bold").text("NET PAYABLE", left + sCol1 + sCol2 + 6, y + 6, { width: sCol3 - 10 });
  doc.fontSize(9).font("Helvetica-Bold").text(formatCurrency(b.netSalary), left + sCol1 + sCol2 + sCol3 + 6, y + 6, {
    width: sCol4 - 12,
    align: "right",
  });

  y += totalRowHeight + 30;

  const sigBoxHeight = 100;
  const sigColWidth = pageWidth / 2;

  doc.lineWidth(0.75).strokeColor(BORDER);
  doc.rect(left, y, sigColWidth, sigBoxHeight).stroke();
  doc.rect(left + sigColWidth, y, sigColWidth, sigBoxHeight).stroke();

  doc.fontSize(9).font("Helvetica").fillColor(TEXT).text("Prepared by:", left, y + 12, { width: sigColWidth, align: "center" });
  doc.fontSize(9).font("Helvetica").text("Verified By:", left + sigColWidth, y + 12, { width: sigColWidth, align: "center" });

  const preparedSigBuffer = company.preparedBySignatureUrl
    ? await fetchImageBuffer(company.preparedBySignatureUrl)
    : null;
  const verifiedSigBuffer = company.verifiedBySignatureUrl
    ? await fetchImageBuffer(company.verifiedBySignatureUrl)
    : null;

  if (preparedSigBuffer) {
    doc.image(preparedSigBuffer, left + 10, y + 22, { fit: [sigColWidth - 20, sigBoxHeight - 30], align: "center", valign: "center" });
  } else {
    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .text(company.preparedByName || "", left, y + 55, { width: sigColWidth, align: "center" });
    doc
      .fontSize(8)
      .font("Helvetica")
      .text(company.preparedByTitle || "", left, y + 69, { width: sigColWidth, align: "center" });
  }

  if (verifiedSigBuffer) {
    doc.image(verifiedSigBuffer, left + sigColWidth + 10, y + 22, { fit: [sigColWidth - 20, sigBoxHeight - 30], align: "center", valign: "center" });
  } else {
    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .text(company.verifiedByName || "", left + sigColWidth, y + 55, { width: sigColWidth, align: "center" });
    doc
      .fontSize(8)
      .font("Helvetica")
      .text(company.verifiedByTitle || "", left + sigColWidth, y + 69, { width: sigColWidth, align: "center" });
  }

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}