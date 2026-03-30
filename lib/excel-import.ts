import * as XLSX from "xlsx";
import type { MarineShipment } from "./types";
import { createEmptyShipment } from "./types";
import { CLIENT_EXCEL_SYNONYMS } from "./constants";

export interface ImportResult {
  headers: string[];
  rows: Record<string, string>[];
  suggestedMapping: Record<string, string>;
  rowCount: number;
}

export function parseClientExcel(buffer: ArrayBuffer): ImportResult {
  const data = new Uint8Array(buffer);
  const workbook = XLSX.read(data, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

  // Client Excel may have title rows before the header. Find the header row
  // by looking for a row that contains known keywords.
  const allRows = XLSX.utils.sheet_to_json<Record<string, string>>(
    firstSheet,
    { raw: false, defval: "", header: 1 }
  ) as unknown as string[][];

  let headerRowIndex = 0;
  const headerKeywords = [
    "shipper",
    "invoice",
    "consignee",
    "cargo",
    "port",
    "conveyance",
    "sum insured",
    "sr no",
    "sr. no",
  ];

  for (let i = 0; i < Math.min(allRows.length, 10); i++) {
    const rowText = (allRows[i] || [])
      .map((c) => String(c || "").toLowerCase())
      .join(" ");
    const matchCount = headerKeywords.filter((kw) =>
      rowText.includes(kw)
    ).length;
    if (matchCount >= 3) {
      headerRowIndex = i;
      break;
    }
  }

  // Re-parse from the detected header row
  const range = XLSX.utils.decode_range(firstSheet["!ref"] || "A1");
  range.s.r = headerRowIndex;
  firstSheet["!ref"] = XLSX.utils.encode_range(range);

  const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(
    firstSheet,
    { raw: false, defval: "" }
  );

  const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];

  const suggestedMapping: Record<string, string> = {};
  const usedHeaders = new Set<string>();
  const normalizeHeader = (h: string) =>
    h
      .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, " ")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");

  // First pass: exact matches only (normalized equality)
  for (const [field, synonyms] of Object.entries(CLIENT_EXCEL_SYNONYMS)) {
    for (const header of headers) {
      if (usedHeaders.has(header)) continue;
      const headerLower = normalizeHeader(header);
      if (synonyms.some((s) => headerLower === s)) {
        suggestedMapping[field] = header;
        usedHeaders.add(header);
        break;
      }
    }
  }

  // Second pass: partial/includes matches for fields not yet mapped
  for (const [field, synonyms] of Object.entries(CLIENT_EXCEL_SYNONYMS)) {
    if (suggestedMapping[field]) continue;
    for (const header of headers) {
      if (usedHeaders.has(header)) continue;
      const headerLower = normalizeHeader(header);
      if (
        synonyms.some((s) => headerLower.includes(s) || s.includes(headerLower))
      ) {
        suggestedMapping[field] = header;
        usedHeaders.add(header);
        break;
      }
    }
  }

  return { headers, rows: jsonData, suggestedMapping, rowCount: jsonData.length };
}

export function mapRowsToShipments(
  rows: Record<string, string>[],
  columnMapping: Record<string, string>
): MarineShipment[] {
  return rows.map((row) => {
    const shipment = createEmptyShipment();
    for (const [field, sourceColumn] of Object.entries(columnMapping)) {
      if (sourceColumn && row[sourceColumn] !== undefined) {
        const val = row[sourceColumn] || "";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (shipment as any)[field] = val;
      }
    }
    return shipment;
  });
}
