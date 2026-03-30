"use client";

import { useState, useCallback } from "react";
import type {
  MarineShipment,
  MarineShipmentKey,
  UploadedFile,
} from "@/lib/types";
import { createEmptyShipment, OPEN_POLICY_NO, COVERS_TEXT } from "@/lib/types";
import { extractTextFromDocx } from "@/lib/word-extract";
import { exportMarineCertificate } from "@/lib/excel-export";
import SpreadsheetTable from "./SpreadsheetTable";
import ExcelImportModal from "./ExcelImportModal";
import DocumentUploader from "./DocumentUploader";
import ApiKeySettings, { getStoredApiKey } from "./ApiKeySettings";
import {
  Download,
  FileUp,
  Trash2,
  Settings,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

function getFileType(file: File): "excel" | "word" {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "xlsx" || ext === "xls") return "excel";
  return "word";
}

export default function MarineWorkspace() {
  const [shipments, setShipments] = useState<MarineShipment[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // ── File management ──
  const handleFilesAdded = useCallback((files: File[]) => {
    const newFiles: UploadedFile[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      fileType: getFileType(file),
      status: "pending" as const,
      progress: 0,
    }));

    // Excel files trigger the import modal; Word files go to pending list
    const excelFiles = newFiles.filter((f) => f.fileType === "excel");
    const wordFiles = newFiles.filter((f) => f.fileType === "word");

    if (wordFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...wordFiles]);
    }

    if (excelFiles.length > 0) {
      // Add to file list and open import modal for the first one
      setUploadedFiles((prev) => [...prev, ...excelFiles]);
      setShowExcelImport(true);
    }
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // ── Process Word documents ──
  const processWordFiles = useCallback(async () => {
    const pendingWordFiles = uploadedFiles.filter(
      (f) => f.fileType === "word" && f.status === "pending"
    );

    if (pendingWordFiles.length === 0) return;

    const apiKey = getStoredApiKey();
    if (!apiKey) {
      setShowSettings(true);
      return;
    }

    setIsProcessing(true);

    for (const uploadedFile of pendingWordFiles) {
      // Update status to processing
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id ? { ...f, status: "processing" as const } : f
        )
      );

      try {
        // Step 1: Extract text from .docx
        const text = await extractTextFromDocx(uploadedFile.file);

        if (!text.trim()) {
          throw new Error("No text found in document");
        }

        // Step 2: Send to Claude for field extraction
        const response = await fetch("/api/extract-word", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, apiKey }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Extraction failed");
        }

        const { fields } = await response.json();

        // Step 3: Create shipment from extracted fields
        const shipment = createEmptyShipment();
        if (fields.nameOfInsured)
          shipment.nameOfInsured = fields.nameOfInsured;
        if (fields.shipper) shipment.shipper = fields.shipper;
        if (fields.descriptionOfCargo)
          shipment.descriptionOfCargo = fields.descriptionOfCargo;
        if (fields.consigneeBuyer)
          shipment.consigneeBuyer = fields.consigneeBuyer;
        if (fields.invoiceNo) shipment.invoiceNo = fields.invoiceNo;
        if (fields.conveyance) shipment.conveyance = fields.conveyance;
        if (fields.lcBankDetails)
          shipment.lcBankDetails = fields.lcBankDetails;
        if (fields.portOfLoading)
          shipment.portOfLoading = fields.portOfLoading;
        if (fields.portOfDischarge)
          shipment.portOfDischarge = fields.portOfDischarge;
        if (fields.basisOfValuation)
          shipment.basisOfValuation = fields.basisOfValuation;
        if (fields.sumInsuredCurrency)
          shipment.sumInsuredCurrency = fields.sumInsuredCurrency;
        if (fields.sumInsured) shipment.sumInsured = fields.sumInsured;
        if (fields.additionalRemarks)
          shipment.additionalRemarks = fields.additionalRemarks;

        setShipments((prev) => [...prev, shipment]);
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id ? { ...f, status: "done" as const } : f
          )
        );
      } catch (error) {
        console.error("Error processing Word file:", error);
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id
              ? {
                  ...f,
                  status: "error" as const,
                  errorMessage:
                    error instanceof Error
                      ? error.message
                      : "Processing failed",
                }
              : f
          )
        );
      }
    }

    setIsProcessing(false);
  }, [uploadedFiles]);

  // ── Shipment management ──
  const handleCellChange = useCallback(
    (rowIndex: number, field: MarineShipmentKey, value: string) => {
      setShipments((prev) =>
        prev.map((s, i) => (i === rowIndex ? { ...s, [field]: value } : s))
      );
    },
    []
  );

  const handleAddRow = useCallback(() => {
    setShipments((prev) => [...prev, createEmptyShipment()]);
  }, []);

  const handleDeleteRow = useCallback((rowIndex: number) => {
    setShipments((prev) => prev.filter((_, i) => i !== rowIndex));
  }, []);

  const handleExcelImport = useCallback(
    (imported: MarineShipment[]) => {
      // Ensure constant fields are set
      const withConstants = imported.map((s) => ({
        ...s,
        openPolicyNo: OPEN_POLICY_NO,
        covers: COVERS_TEXT,
      }));
      setShipments((prev) => [...prev, ...withConstants]);

      // Mark all Excel files as done
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.fileType === "excel" && f.status === "pending"
            ? { ...f, status: "done" as const }
            : f
        )
      );
    },
    []
  );

  const handleExport = useCallback(async () => {
    if (shipments.length === 0) return;
    await exportMarineCertificate(shipments);
  }, [shipments]);

  const handleClearAll = useCallback(() => {
    setShipments([]);
    setUploadedFiles([]);
    setShowClearConfirm(false);
  }, []);

  const pendingWordCount = uploadedFiles.filter(
    (f) => f.fileType === "word" && f.status === "pending"
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-lg font-bold text-primary">
              Marine Census Tool
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5"
            >
              <Settings size={14} />
              Settings
            </button>

            <button
              onClick={() => setShowExcelImport(true)}
              className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5"
            >
              <FileUp size={14} />
              Import Excel
            </button>

            {shipments.length > 0 && (
              <>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 flex items-center gap-1.5"
                >
                  <Trash2 size={14} />
                  Clear All
                </button>
                <button
                  onClick={handleExport}
                  className="px-4 py-1.5 text-sm text-white bg-primary rounded-lg hover:bg-primary-light font-medium flex items-center gap-1.5"
                >
                  <Download size={14} />
                  Export
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Document uploader */}
        <DocumentUploader
          files={uploadedFiles}
          onFilesAdded={handleFilesAdded}
          onRemoveFile={handleRemoveFile}
        />

        {/* Process button for Word files */}
        {pendingWordCount > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={processWordFiles}
              disabled={isProcessing}
              className="px-5 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary-light font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Extract Data from {pendingWordCount} Word File
                  {pendingWordCount !== 1 ? "s" : ""}
                </>
              )}
            </button>
            {!getStoredApiKey() && (
              <p className="text-xs text-amber-600">
                Set your Claude API key in Settings first
              </p>
            )}
          </div>
        )}

        {/* Spreadsheet table */}
        <SpreadsheetTable
          shipments={shipments}
          onCellChange={handleCellChange}
          onAddRow={handleAddRow}
          onDeleteRow={handleDeleteRow}
        />
      </div>

      {/* Modals */}
      <ApiKeySettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <ExcelImportModal
        isOpen={showExcelImport}
        onClose={() => setShowExcelImport(false)}
        onImport={handleExcelImport}
      />

      {/* Clear confirmation dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-semibold text-gray-800 mb-2">Clear all data?</h3>
            <p className="text-sm text-gray-500 mb-4">
              This will remove all {shipments.length} shipment
              {shipments.length !== 1 ? "s" : ""} and uploaded files. This
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 font-medium"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
