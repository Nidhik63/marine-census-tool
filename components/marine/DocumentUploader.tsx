"use client";

import { useRef, useState } from "react";
import type { UploadedFile } from "@/lib/types";
import {
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".docx", ".doc"];
const ACCEPTED_MIME_TYPES = [
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function isAcceptedFile(file: File): boolean {
  if (ACCEPTED_MIME_TYPES.includes(file.type)) return true;
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  return ACCEPTED_EXTENSIONS.includes(ext);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getFileType(file: File): "excel" | "word" {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "xlsx" || ext === "xls") return "excel";
  return "word";
}

interface DocumentUploaderProps {
  files: UploadedFile[];
  onFilesAdded: (files: File[]) => void;
  onRemoveFile: (id: string) => void;
}

export default function DocumentUploader({
  files,
  onFilesAdded,
  onRemoveFile,
}: DocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(fileList: FileList | File[]) {
    const validFiles: File[] = [];
    const fileArray = Array.from(fileList);

    for (const file of fileArray) {
      if (file.name.startsWith(".")) continue;
      if (!isAcceptedFile(file)) continue;
      if (file.size > MAX_FILE_SIZE) continue;
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onFilesAdded(validFiles);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">Upload Client Documents</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Upload client Excel (.xlsx) or Word (.docx) files
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`mx-4 my-4 border-2 border-dashed rounded-xl p-6 cursor-pointer text-center transition-colors ${
          isDragging
            ? "border-primary bg-blue-50"
            : "border-gray-300 hover:border-primary/50 hover:bg-gray-50"
        }`}
      >
        <Upload size={28} className="mx-auto mb-2 text-gray-400" />
        <p className="text-sm font-medium text-gray-700">
          Drag & drop files here, or click to browse
        </p>
        <p className="text-xs text-gray-400 mt-1">
          .xlsx, .xls, .docx, .doc (max 10MB each)
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.docx,.doc"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* File list */}
      {files.length > 0 && (
        <div className="px-4 pb-4">
          <div className="space-y-2">
            {files.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3 p-2.5 border border-gray-100 rounded-lg bg-gray-50/50"
              >
                {f.fileType === "excel" ? (
                  <FileSpreadsheet size={18} className="text-green-600 flex-shrink-0" />
                ) : (
                  <FileText size={18} className="text-blue-600 flex-shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {f.file.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {f.fileType === "excel" ? "Excel" : "Word"} &middot;{" "}
                    {(f.file.size / 1024).toFixed(0)} KB
                  </p>
                </div>

                {/* Status */}
                {f.status === "pending" && (
                  <span className="text-xs text-gray-400">Pending</span>
                )}
                {f.status === "processing" && (
                  <Loader2 size={16} className="text-primary animate-spin" />
                )}
                {f.status === "done" && (
                  <CheckCircle size={16} className="text-green-500" />
                )}
                {f.status === "error" && (
                  <span title={f.errorMessage} className="flex items-center gap-1">
                    <AlertCircle size={16} className="text-red-500" />
                  </span>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFile(f.id);
                  }}
                  className="p-1 text-gray-300 hover:text-red-500 rounded"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
