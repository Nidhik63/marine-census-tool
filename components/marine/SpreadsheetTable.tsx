"use client";

import { memo, useRef } from "react";
import type { MarineShipment, MarineShipmentKey } from "@/lib/types";
import { OPEN_POLICY_NO, COVERS_TEXT } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";

interface SpreadsheetTableProps {
  shipments: MarineShipment[];
  onCellChange: (
    rowIndex: number,
    field: MarineShipmentKey,
    value: string
  ) => void;
  onAddRow: () => void;
  onDeleteRow: (rowIndex: number) => void;
}

interface ColumnDef {
  key: MarineShipmentKey;
  label: string;
  width: number;
  readOnly?: boolean;
}

const COLUMNS: ColumnDef[] = [
  { key: "srNo", label: "SR NO", width: 60, readOnly: true },
  { key: "openPolicyNo", label: "Open Policy No", width: 140, readOnly: true },
  { key: "nameOfInsured", label: "Name of the insured", width: 200 },
  { key: "certificateNo", label: "Certificate No", width: 130 },
  { key: "shipper", label: "Shipper", width: 200 },
  { key: "descriptionOfCargo", label: "Description of Cargo", width: 180 },
  { key: "consigneeBuyer", label: "Consignee/Buyer", width: 220 },
  { key: "invoiceNo", label: "Invoice No.", width: 140 },
  { key: "conveyance", label: "Conveyance", width: 130 },
  { key: "lcBankDetails", label: "LC /Bank Details", width: 140 },
  { key: "portOfLoading", label: "PORT OF LOADING", width: 140 },
  { key: "portOfDischarge", label: "PORT OF DISCHARGE", width: 140 },
  { key: "basisOfValuation", label: "Basic of Valuation", width: 130 },
  { key: "sumInsuredCurrency", label: "Sum Insured Currency", width: 130 },
  { key: "sumInsured", label: "Sum Insured", width: 130 },
  { key: "covers", label: "Covers", width: 300, readOnly: true },
  { key: "additionalRemarks", label: "Additional Remarks", width: 180 },
  { key: "claimsPayable", label: "Claims Payable", width: 140 },
];

export default function SpreadsheetTable({
  shipments,
  onCellChange,
  onAddRow,
  onDeleteRow,
}: SpreadsheetTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">
          Marine Certificate Data{" "}
          <span className="text-gray-500 font-normal">
            ({shipments.length} shipment{shipments.length !== 1 ? "s" : ""})
          </span>
        </h3>
        <button
          onClick={onAddRow}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center gap-1.5 text-gray-700"
        >
          <Plus size={14} />
          Add Row
        </button>
      </div>

      {/* Table */}
      <div ref={tableRef} className="overflow-x-auto overflow-y-auto max-h-[65vh]">
        <table className="text-xs border-collapse" style={{ minWidth: "100%" }}>
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-100">
              <th className="sticky left-0 z-20 bg-gray-100 px-2 py-2 text-left font-semibold text-gray-600 border-b border-r border-gray-200 w-10">
                #
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="px-1 py-2 text-left font-semibold text-gray-600 border-b border-r border-gray-200 whitespace-nowrap"
                  style={{ minWidth: col.width, maxWidth: col.width }}
                >
                  {col.label}
                </th>
              ))}
              <th className="px-2 py-2 text-center font-semibold text-gray-600 border-b border-gray-200 w-10">
                &nbsp;
              </th>
            </tr>
          </thead>
          <tbody>
            {shipments.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNS.length + 2}
                  className="px-4 py-12 text-center text-gray-400 text-sm"
                >
                  No data yet. Upload documents or click &quot;Add Row&quot; to
                  start.
                </td>
              </tr>
            ) : (
              shipments.map((shipment, rowIndex) => (
                <tr
                  key={shipment.id}
                  className="border-b border-gray-100 hover:bg-gray-50/50"
                >
                  <td className="sticky left-0 z-10 bg-white px-2 py-0.5 font-medium border-r border-gray-200 text-center text-gray-400">
                    {rowIndex + 1}
                  </td>

                  {COLUMNS.map((col) => (
                    <td
                      key={col.key}
                      className="px-0.5 py-0.5 border-r border-gray-100"
                      style={{ minWidth: col.width, maxWidth: col.width }}
                    >
                      <CellInput
                        column={col}
                        value={
                          col.key === "srNo"
                            ? String(rowIndex + 1)
                            : col.key === "openPolicyNo"
                              ? OPEN_POLICY_NO
                              : col.key === "covers"
                                ? COVERS_TEXT
                                : (shipment[col.key] as string)
                        }
                        readOnly={col.readOnly}
                        onChange={(val) => onCellChange(rowIndex, col.key, val)}
                      />
                    </td>
                  ))}

                  <td className="px-1 py-0.5 text-center">
                    <button
                      onClick={() => onDeleteRow(rowIndex)}
                      className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded"
                      title="Delete row"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {shipments.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-400 flex items-center justify-between">
          <span>Scroll right to see all {COLUMNS.length} columns</span>
          <span>
            {shipments.length} row{shipments.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}

const CellInput = memo(function CellInput({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  column,
  value,
  readOnly,
  onChange,
}: {
  column: ColumnDef;
  value: string;
  readOnly?: boolean;
  onChange: (value: string) => void;
}) {
  if (readOnly) {
    return (
      <div
        className="w-full px-1.5 py-1 text-xs bg-gray-50 text-gray-500 rounded truncate"
        title={value}
      >
        {value || "-"}
      </div>
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="-"
      className="w-full px-1.5 py-1 text-xs border border-gray-200 bg-white hover:border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
    />
  );
});
