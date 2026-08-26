"use client";

import { useState, useRef } from "react";
import { X, Upload, Download, AlertTriangle, CheckCircle, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { BASE_PATH } from "@/lib/utils";

const TEMPLATE_HEADERS = [
  "Supplier",
  "Official Ref Letter",
  "Letter Ref Date",
  "Description",
  "Version",
  "Period Renewal Start",
  "Period Renewal End",
  "Quantity",
  "Deployment",
  "IT Section",
  "Status",
  "License Type",
  "Cost (RM)",
  "Notes",
];

const TEMPLATE_EXAMPLE = [
  "ACAD SYSTEM SDN BHD",
  "PHN/IT_ADMIN/ACAD/2025/01",
  "2025-06-24",
  "AUTODESK PDMC RENEWAL",
  "",
  "2025-07-07",
  "2026-07-06",
  "7",
  "7",
  "IT ADMIN",
  "On Going",
  "Subscription",
  "5000",
  "",
];

interface Props {
  onClose: () => void;
  onImported: () => void;
}

type ParsedRow = Record<string, string>;

export default function LicenseImportModal({ onClose, onImported }: Props) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; updated: number; skipped: number; errors: string[] } | null>(null);
  const [parseError, setParseError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, TEMPLATE_EXAMPLE]);
    ws["!cols"] = TEMPLATE_HEADERS.map(() => ({ wch: 24 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Licenses");
    XLSX.writeFile(wb, "license_import_template.xlsx");
  }

  function handleFile(file: File) {
    setParseError("");
    setRows([]);
    setResult(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array", cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const parsed = XLSX.utils.sheet_to_json<ParsedRow>(ws, { defval: "" });

        if (parsed.length === 0) {
          setParseError("The file is empty or has no data rows.");
          return;
        }

        const headers = Object.keys(parsed[0]).map((h) => h.trim().toLowerCase());
        const hasSupplier = headers.includes("supplier");
        const hasDesc = headers.includes("description");
        if (!hasSupplier && !hasDesc) {
          setParseError('Missing required columns. File must have at least "Supplier" and "Description".');
          return;
        }

        // Normalize all keys to lowercase+trimmed so lookups are case-insensitive
        const cleaned = parsed.map((row) =>
          Object.fromEntries(
            Object.entries(row).map(([k, v]) => [k.trim().toLowerCase(), v == null ? "" : String(v)])
          )
        );
        setRows(cleaned);
      } catch {
        setParseError("Failed to parse file. Please use the provided template.");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleImport() {
    if (rows.length === 0) return;
    setImporting(true);
    try {
      const res = await fetch(`${BASE_PATH}/api/licenses/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) {
        setParseError(data.error ?? "Import failed.");
        return;
      }
      setResult(data);
      if (data.imported > 0) setTimeout(() => onImported(), 1500);
    } catch {
      setParseError("Network error. Please try again.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-shell" style={{ maxWidth: 700 }}>
        <div className="modal-pinned-header">
          <h2 className="modal-title flex items-center gap-2">
            <FileSpreadsheet size={18} /> Import Licenses from Excel / CSV
          </h2>
          <button className="p-1 rounded hover:bg-slate-100" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-scroll-body">
        {/* Template download */}
        <div
          className="flex items-center justify-between p-3 rounded-lg mb-4 text-sm"
          style={{ background: "#f0f9ff", border: "1px solid #bae6fd" }}
        >
          <div className="text-slate-600">
            Download the template and fill in your license data. <strong>Supplier</strong> and <strong>Description</strong> are required.
            Period Renewal uses separate Start and End date columns.
          </div>
          <button className="btn btn-secondary flex items-center gap-1.5 shrink-0 ml-4" onClick={downloadTemplate}>
            <Download size={14} /> Template
          </button>
        </div>

        {/* Drop zone */}
        {!rows.length && !result && (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-lg cursor-pointer text-slate-400 mb-4"
            style={{ border: "2px dashed #cbd5e1", padding: "40px 24px" }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={32} />
            <div className="text-center">
              <div className="font-medium text-slate-600">Drop file here or click to browse</div>
              <div className="text-xs mt-1">Supports .xlsx, .xls, .csv</div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        )}

        {parseError && (
          <div className="flex items-start gap-2 p-3 mb-4 rounded-lg text-sm text-red-700" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            {parseError}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mb-4">
            <div
              className="flex items-center gap-2 p-3 rounded-lg text-sm font-medium mb-3"
              style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
            >
              <CheckCircle size={16} color="#16a34a" />
              <span className="text-green-800">
                {result.imported} license{result.imported !== 1 ? "s" : ""} imported
                {result.updated > 0 && ` · ${result.updated} updated`}
                {result.skipped > 0 && ` · ${result.skipped} skipped`}
              </span>
            </div>
            {result.errors.length > 0 && (
              <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #fecaca" }}>
                <div className="px-3 py-2 text-xs font-medium text-red-700" style={{ background: "#fef2f2" }}>
                  {result.errors.length} row{result.errors.length !== 1 ? "s" : ""} had errors:
                </div>
                <div className="max-h-32 overflow-y-auto scroll-light">
                  {result.errors.map((e, i) => (
                    <div key={i} className="px-3 py-1.5 text-xs text-red-600 border-t border-red-100">{e}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Preview */}
        {rows.length > 0 && !result && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-slate-700">
                {fileName} — <span className="text-slate-500">{rows.length} row{rows.length !== 1 ? "s" : ""} ready to import</span>
              </div>
              <button
                className="text-xs text-slate-400 hover:text-red-500"
                onClick={() => { setRows([]); setFileName(""); setParseError(""); }}
              >
                Remove
              </button>
            </div>
            <div className="rounded-lg overflow-auto scroll-light" style={{ border: "1px solid #e2e8f0", maxHeight: 220 }}>
              <table>
                <thead>
                  <tr>
                    <th className="text-xs">#</th>
                    <th className="text-xs">Supplier</th>
                    <th className="text-xs">Ref Letter</th>
                    <th className="text-xs">Description</th>
                    <th className="text-xs">Period Renewal</th>
                    <th className="text-xs">IT Section</th>
                    <th className="text-xs">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 10).map((row, i) => {
                    const start = row["period renewal start"] || row["period renewal"] || "";
                    const end   = row["period renewal end"]   || "";
                    const period = start && end ? `${start}~${end}` : start || end || "—";
                    return (
                      <tr key={i}>
                        <td className="text-xs text-slate-400">{i + 1}</td>
                        <td className="text-xs font-medium">{row["supplier"] || "—"}</td>
                        <td className="text-xs font-mono text-slate-500">{row["official ref letter"] || "—"}</td>
                        <td className="text-xs">{row["description"] || "—"}</td>
                        <td className="text-xs text-slate-500">{period}</td>
                        <td className="text-xs">{row["it section"] || "—"}</td>
                        <td className="text-xs">{row["status"] || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {rows.length > 10 && (
                <div className="text-center text-xs text-slate-400 py-2 border-t border-slate-100">
                  + {rows.length - 10} more rows not shown
                </div>
              )}
            </div>
          </div>
        )}

        </div>

        <div className="modal-pinned-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          {rows.length > 0 && !result && (
            <button className="btn btn-primary" onClick={handleImport} disabled={importing}>
              {importing ? (
                <><span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" /> Importing...</>
              ) : (
                <><Upload size={14} /> Import {rows.length} License{rows.length !== 1 ? "s" : ""}</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
