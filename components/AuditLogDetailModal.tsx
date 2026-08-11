"use client";

import { X, History } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { AuditLogEntry } from "@/app/(main)/audit-log/page";

interface Props {
  entry: AuditLogEntry;
  onClose: () => void;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
};

function formatValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) return formatDate(v);
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

export default function AuditLogDetailModal({ entry, onClose }: Props) {
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = entry.changes ? JSON.parse(entry.changes) : null;
  } catch {
    parsed = null;
  }

  const isDiff = entry.action === "UPDATE";

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-shell" style={{ maxWidth: 640 }}>
        <div className="modal-pinned-header">
          <h2 className="modal-title flex items-center gap-2">
            <History size={18} /> Audit Log Detail
          </h2>
          <button className="p-1 rounded hover:bg-slate-100" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-scroll-body">
          <div className="detail-grid mb-4">
            <div className="detail-item">
              <label>Date/Time</label>
              <span>{formatDate(entry.createdAt)}</span>
            </div>
            <div className="detail-item">
              <label>Action</label>
              <span>
                <span className={`badge ${ACTION_COLORS[entry.action] ?? "bg-gray-100 text-gray-700"}`}>
                  {entry.action}
                </span>
              </span>
            </div>
            <div className="detail-item">
              <label>User</label>
              <span>{entry.userName ?? "System"}</span>
            </div>
            <div className="detail-item">
              <label>Entity Type</label>
              <span>{entry.entityType}</span>
            </div>
            <div className="detail-item" style={{ gridColumn: "span 2" }}>
              <label>Entity</label>
              <span>{entry.entityLabel ?? entry.entityId}</span>
            </div>
          </div>

          <div className="detail-section-title mb-2">
            {isDiff ? "Changed Fields" : entry.action === "CREATE" ? "Created With" : "Record Snapshot"}
          </div>

          {!parsed || Object.keys(parsed).length === 0 ? (
            <div className="text-sm text-slate-400">No field-level details recorded.</div>
          ) : (
            <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
              <table>
                <thead>
                  <tr>
                    <th className="text-xs">Field</th>
                    {isDiff ? (
                      <>
                        <th className="text-xs">From</th>
                        <th className="text-xs">To</th>
                      </>
                    ) : (
                      <th className="text-xs">Value</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(parsed).map(([field, value]) => (
                    <tr key={field}>
                      <td className="text-xs font-medium">{field}</td>
                      {isDiff ? (
                        <>
                          <td className="text-xs text-slate-500">
                            {formatValue((value as { from: unknown; to: unknown }).from)}
                          </td>
                          <td className="text-xs">
                            {formatValue((value as { from: unknown; to: unknown }).to)}
                          </td>
                        </>
                      ) : (
                        <td className="text-xs">{formatValue(value)}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-pinned-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
