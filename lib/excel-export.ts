import ExcelJS from "exceljs";
import type { MarineShipment } from "./types";
import { MARINE_CERTIFICATE_COLUMNS, FIELD_ORDER } from "./constants";

export async function exportMarineCertificate(
  shipments: MarineShipment[],
  filename?: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Sheet1");

  // Header row
  const headerRow = ws.addRow(MARINE_CERTIFICATE_COLUMNS);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 10 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE2E8F0" },
    };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FF94A3B8" } },
    };
    cell.alignment = { vertical: "middle", wrapText: true };
  });

  // Data rows
  shipments.forEach((shipment, idx) => {
    const rowData = FIELD_ORDER.map((field) => {
      if (field === "srNo") return String(idx + 1);
      return (shipment[field] as string) || "";
    });
    ws.addRow(rowData);
  });

  // Column widths based on header text and content
  ws.columns = MARINE_CERTIFICATE_COLUMNS.map((col, i) => {
    const fieldKey = FIELD_ORDER[i];
    let maxWidth = col.length + 2;

    // Check data for wider content
    shipments.forEach((s) => {
      const val = String(s[fieldKey] || "");
      if (val.length + 2 > maxWidth) maxWidth = val.length + 2;
    });

    return { width: Math.min(Math.max(maxWidth, 12), 50) };
  });

  // Generate and download
  const exportName =
    filename ||
    `Marine_Certificate_IFFCO_${new Date().toISOString().slice(0, 10)}.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = exportName;
  a.click();
  URL.revokeObjectURL(url);
}
