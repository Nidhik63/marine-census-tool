"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  ArrowRight,
  Check,
  Search,
  ChevronLeft,
} from "lucide-react";
import {
  parseClientExcel,
  mapRowsToShipments,
  type ImportResult,
} from "@/lib/excel-import";
import type { MarineShipment } from "@/lib/types";
import { IMPORTABLE_FIELDS, PREVIEW_FIELDS } from "@/lib/constants";

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (shipments: MarineShipment[]) => void;
}

export default function ExcelImportModal({
  isOpen,
  onClose,
  onImport,
}: ExcelImportModalProps) {
  const [importData, setImportData] = useState<ImportResult | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [step, setStep] = useState<"upload" | "mapping" | "select">("upload");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [searchText, setSearchText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const filteredRowIndices = useMemo(() => {
    if (!importData) return [];
    const indices = importData.rows.map((_, i) => i);
    if (!searchText.trim()) return indices;

    const search = searchText.toLowerCase().trim();
    return indices.filter((i) => {
      const row = importData.rows[i];
      return PREVIEW_FIELDS.some((field) => {
        const sourceColumn = mapping[field.key];
        if (!sourceColumn) return false;
        const val = row[sourceColumn] || "";
        return val.toLowerCase().includes(search);
      });
    });
  }, [importData, searchText, mapping]);

  if (!isOpen) return null;

  async function handleFile(file: File) {
    try {
      setError("");
      const buffer = await file.arrayBuffer();
      const result = parseClientExcel(buffer);
      setImportData(result);
      setMapping(result.suggestedMapping);
      setStep("mapping");
    } catch (err) {
      setError("Failed to read Excel file. Please check the format.");
      console.error(err);
    }
  }

  function handleGoToSelect() {
    if (!importData) return;
    setSelectedRows(new Set());
    setSearchText("");
    setStep("select");
  }

  function handleImport() {
    if (!importData) return;
    const selectedRowData = importData.rows.filter((_, i) =>
      selectedRows.has(i)
    );
    const shipments = mapRowsToShipments(selectedRowData, mapping);
    onImport(shipments);
    handleReset();
    onClose();
  }

  function handleReset() {
    setImportData(null);
    setMapping({});
    setError("");
    setStep("upload");
    setSelectedRows(new Set());
    setSearchText("");
  }

  function toggleRow(index: number) {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function selectAll() {
    if (!importData) return;
    setSelectedRows(new Set(importData.rows.map((_, i) => i)));
  }

  function deselectAll() {
    setSelectedRows(new Set());
  }

  const selectedCount = selectedRows.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={`bg-white rounded-2xl shadow-xl overflow-hidden ${
          step === "select"
            ? "w-full max-w-5xl max-h-[90vh]"
            : "w-full max-w-2xl max-h-[80vh]"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={20} className="text-green-600" />
            <h2 className="text-lg font-semibold">Import Client Excel</h2>
            {step !== "upload" && (
              <span className="text-xs text-gray-400 ml-2">
                {step === "mapping"
                  ? "Step 1: Map columns"
                  : "Step 2: Select rows"}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div
          className="p-6 overflow-y-auto"
          style={{ maxHeight: step === "select" ? "70vh" : "60vh" }}
        >
          {/* Upload step */}
          {step === "upload" && (
            <div className="text-center">
              <div
                onClick={() => inputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors"
              >
                <Upload size={36} className="mx-auto mb-3 text-gray-400" />
                <p className="font-medium text-gray-700">
                  Upload client Excel file
                </p>
                <p className="text-sm text-gray-400 mt-1">.xlsx or .xls</p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFile(e.target.files[0]);
                }}
              />
              {error && (
                <p className="text-sm text-red-500 mt-3">{error}</p>
              )}
            </div>
          )}

          {/* Mapping step */}
          {step === "mapping" && importData && (
            <div>
              <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 rounded-lg">
                <Check size={16} className="text-green-600" />
                <span className="text-sm text-green-700">
                  Found {importData.rowCount} rows and{" "}
                  {importData.headers.length} columns
                </span>
              </div>

              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Map columns to Marine Certificate fields:
              </h3>

              <div className="space-y-2">
                {IMPORTABLE_FIELDS.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <span className="w-40 text-gray-600 flex-shrink-0">
                      {label}
                    </span>
                    <ArrowRight
                      size={14}
                      className="text-gray-300 flex-shrink-0"
                    />
                    <select
                      value={mapping[key] || ""}
                      onChange={(e) =>
                        setMapping((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                    >
                      <option value="">-- Skip --</option>
                      {importData.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Row selection step */}
          {step === "select" && importData && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">
                    {selectedCount} of {importData.rowCount} selected
                  </span>
                  <button
                    onClick={selectAll}
                    className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAll}
                    className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
                  >
                    Deselect All
                  </button>
                </div>

                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg w-56"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-400 mb-2">
                Select the shipments you want to import:
              </p>

              <div className="border rounded-lg overflow-auto max-h-[50vh]">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-2 py-2 text-left w-10">
                        <input
                          type="checkbox"
                          checked={
                            selectedCount === importData.rowCount &&
                            importData.rowCount > 0
                          }
                          onChange={(e) =>
                            e.target.checked ? selectAll() : deselectAll()
                          }
                          className="rounded"
                        />
                      </th>
                      <th className="px-2 py-2 text-left text-gray-500 w-8">
                        #
                      </th>
                      {PREVIEW_FIELDS.map((field) => (
                        <th
                          key={field.key}
                          className={`px-2 py-2 text-left text-gray-500 ${field.width}`}
                        >
                          {field.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRowIndices.map((rowIdx) => {
                      const row = importData.rows[rowIdx];
                      const isSelected = selectedRows.has(rowIdx);
                      return (
                        <tr
                          key={rowIdx}
                          onClick={() => toggleRow(rowIdx)}
                          className={`cursor-pointer border-t transition-colors ${
                            isSelected
                              ? "bg-blue-50 hover:bg-blue-100"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <td className="px-2 py-1.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRow(rowIdx)}
                              className="rounded"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-2 py-1.5 text-gray-400">
                            {rowIdx + 1}
                          </td>
                          {PREVIEW_FIELDS.map((field) => {
                            const sourceColumn = mapping[field.key];
                            const val = sourceColumn
                              ? row[sourceColumn] || "-"
                              : "-";
                            return (
                              <td
                                key={field.key}
                                className={`px-2 py-1.5 truncate max-w-[160px] ${field.width} text-gray-600`}
                                title={val}
                              >
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                    {filteredRowIndices.length === 0 && (
                      <tr>
                        <td
                          colSpan={PREVIEW_FIELDS.length + 2}
                          className="px-4 py-6 text-center text-gray-400"
                        >
                          No rows match your search
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "mapping" && importData && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Start Over
            </button>
            <button
              onClick={handleGoToSelect}
              className="px-5 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary-light font-medium"
            >
              Next: Select Rows
            </button>
          </div>
        )}

        {step === "select" && importData && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <button
              onClick={() => setStep("mapping")}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5"
            >
              <ChevronLeft size={14} />
              Back to Mapping
            </button>
            <button
              onClick={handleImport}
              disabled={selectedCount === 0}
              className="px-5 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary-light font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import {selectedCount} Shipment{selectedCount !== 1 ? "s" : ""}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
