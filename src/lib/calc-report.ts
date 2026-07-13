// WeldSizer — Printable Report Generator
// Paid-tier feature — uses window.print() with CSS print styling

export interface ReportData {
  jointTypeLabel: string;
  materialTypeLabel: string;
  materialGradeLabel?: string;
  codeStandardLabel: string;
  thickness: string;
  unitLabel: string;
  otherUnitLabel: string;
  legSize: number;
  legSizeInches: number;
  throat: number;
  throatInches: number;
  legSizeOther: number;
  throatOther: number;
  codeNote: string;
  materialFactorNote: string;
}

export function buildReportHtml(data: ReportData): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const materialFactorRow = data.materialFactorNote
    ? `<tr>
        <td style="padding: 6px 12px; color: #64748b; border-bottom: 1px solid #1e293b; font-size: 13px;">Material Factor</td>
        <td style="padding: 6px 12px; color: #e2e8f0; border-bottom: 1px solid #1e293b; font-size: 13px; font-weight: 500;">${data.materialFactorNote}</td>
      </tr>`
    : "";

  // Build a clean printable HTML document
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>WeldSizer — Weld Calculation Report</title>
  <style>
    @page {
      margin: 0.75in;
      size: letter;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .report {
      max-width: 650px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-bottom: 20px;
      border-bottom: 3px solid #06b6d4;
      margin-bottom: 24px;
    }
    .header-icon {
      width: 40px;
      height: 40px;
      background: #06b6d4;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 22px;
      font-weight: 700;
    }
    .header-text h1 {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
    }
    .header-text p {
      font-size: 12px;
      color: #64748b;
    }
    .meta {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #64748b;
      margin-bottom: 24px;
    }
    h2 {
      font-size: 15px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    th {
      text-align: left;
      padding: 8px 12px;
      background: #f1f5f9;
      color: #475569;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #cbd5e1;
    }
    td {
      padding: 8px 12px;
      color: #334155;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }
    td:last-child {
      font-weight: 600;
      color: #0f172a;
    }
    .result-value {
      font-size: 20px;
      font-weight: 700;
      color: #0891b2;
    }
    .result-unit {
      font-size: 13px;
      font-weight: 400;
      color: #64748b;
    }
    .note {
      background: #f8fafc;
      border-left: 4px solid #06b6d4;
      padding: 14px 16px;
      margin-bottom: 24px;
      font-size: 13px;
      color: #475569;
      line-height: 1.6;
      border-radius: 0 8px 8px 0;
    }
    .note-label {
      font-weight: 600;
      color: #0f172a;
      display: block;
      margin-bottom: 4px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .footer {
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      margin-top: 32px;
    }
  </style>
</head>
<body>
  <div class="report">
    <div class="header">
      <div class="header-icon">WS</div>
      <div class="header-text">
        <h1>WeldSizer — Weld Calculation Report</h1>
        <p>Fast. Accurate. Code-Compliant.</p>
      </div>
    </div>

    <div class="meta">
      <span>Generated: ${dateStr} at ${timeStr}</span>
      <span>Report ID: ${Date.now().toString(36).toUpperCase()}</span>
    </div>

    <h2>Input Parameters</h2>
    <table>
      <tr>
        <td style="width: 45%;">Material Thickness</td>
        <td>${data.thickness} ${data.unitLabel}</td>
      </tr>
      <tr>
        <td>Joint Type</td>
        <td>${data.jointTypeLabel}</td>
      </tr>
      <tr>
        <td>Material Type</td>
        <td>${data.materialTypeLabel}</td>
      </tr>
      ${data.materialGradeLabel ? `<tr>
        <td>Alloy / Grade</td>
        <td>${data.materialGradeLabel}</td>
      </tr>` : ""}
      ${materialFactorRow}
      <tr>
        <td>Code Standard</td>
        <td>${data.codeStandardLabel}</td>
      </tr>
    </table>

    <h2>Calculation Results</h2>
    <table>
      <tr>
        <td style="width: 45%;">Recommended Weld Size (Leg)</td>
        <td><span class="result-value">${data.legSize.toFixed(data.unitLabel === "in" ? 3 : 1)}</span> <span class="result-unit">${data.unitLabel}</span></td>
      </tr>
      <tr>
        <td>Throat Thickness</td>
        <td><span class="result-value">${data.throat.toFixed(data.unitLabel === "in" ? 3 : 1)}</span> <span class="result-unit">${data.unitLabel}</span></td>
      </tr>
      <tr>
        <td>Weld Size (${data.otherUnitLabel})</td>
        <td>${data.legSizeOther.toFixed(data.otherUnitLabel === "in" ? 3 : 1)} ${data.otherUnitLabel}</td>
      </tr>
      <tr>
        <td>Throat (${data.otherUnitLabel})</td>
        <td>${data.throatOther.toFixed(data.otherUnitLabel === "in" ? 3 : 1)} ${data.otherUnitLabel}</td>
      </tr>
    </table>

    <div class="note">
      <span class="note-label">Code Reference</span>
      ${data.codeNote}
    </div>

    <div class="footer">
      Generated by WeldSizer — Weld Size Calculator
    </div>
  </div>
</body>
</html>`;
}

export function openPrintWindow(reportHtml: string): void {
  const printWindow = window.open("", "_blank", "width=800,height=600");
  if (!printWindow) {
    // Fallback: try printing in the current window
    const printContainer = document.getElementById("print-container");
    if (printContainer) {
      printContainer.innerHTML = reportHtml;
      window.print();
    }
    return;
  }
  printWindow.document.write(reportHtml);
  printWindow.document.close();
  printWindow.focus();

  // Wait for resources to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };
}