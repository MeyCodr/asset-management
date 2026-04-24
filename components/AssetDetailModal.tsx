"use client";

import { X, Edit2 } from "lucide-react";
import { formatCurrency, formatDate, STATUS_COLORS, ASSET_OWNERSHIP_COLORS } from "@/lib/utils";

interface Asset {
  id: string;
  assetTag: string;
  name: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  status: string;
  assetStatus: string | null;
  officeLicense: string | null;
  location: string | null;
  purchaseDate: string | null;
  purchaseCost: number | null;
  vendor: string | null;
  warrantyExpiry: string | null;
  ipAddress: string | null;
  macAddress: string | null;
  operatingSystem: string | null;
  processor: string | null;
  ram: string | null;
  storage: string | null;
  notes: string | null;
  category: { name: string; type: string };
  department: { name: string };
  assignments: Array<{
    id: string;
    assignedDate: string;
    returnedDate: string | null;
    employee: { name: string; jobTitle: string; email: string };
  }>;
}

interface Props {
  asset: Asset;
  onClose: () => void;
  onEdit: () => void;
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="detail-item">
      <label>{label}</label>
      <span>{value || "—"}</span>
    </div>
  );
}

export default function AssetDetailModal({ asset, onClose, onEdit }: Props) {
  const activeAssignment = asset.assignments.find((a) => !a.returnedDate);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-blue-600 font-semibold">
                {asset.assetTag}
              </span>
              <span
                className={`badge ${STATUS_COLORS[asset.status] ?? "bg-gray-100 text-gray-700"}`}
              >
                {asset.status}
              </span>
              {asset.assetStatus && (
                <span className={`badge ${ASSET_OWNERSHIP_COLORS[asset.assetStatus] ?? "bg-gray-100 text-gray-700"}`}>
                  {asset.assetStatus}
                </span>
              )}
            </div>
            <h2 className="modal-title mt-1">{asset.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary" onClick={onEdit}>
              <Edit2 size={14} /> Edit
            </button>
            <button className="p-1 rounded hover:bg-slate-100" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Basic */}
        <div className="detail-section">
          <div className="detail-section-title">Basic Information</div>
          <div className="detail-grid">
            <Field label="Brand" value={asset.brand} />
            <Field label="Model" value={asset.model} />
            <Field label="Serial Number" value={asset.serialNumber} />
            <Field label="Category" value={asset.category.name} />
            <Field label="Department" value={asset.department.name} />
            <Field label="Location" value={asset.location} />
            <Field label="Office License" value={asset.officeLicense} />
          </div>
        </div>

        {/* Purchase */}
        <div className="detail-section">
          <div className="detail-section-title">Purchase & Warranty</div>
          <div className="detail-grid">
            <Field label="Purchase Date" value={formatDate(asset.purchaseDate)} />
            <Field label="Purchase Cost (RM)" value={formatCurrency(asset.purchaseCost)} />
            <Field label="Vendor" value={asset.vendor} />
            <Field label="Warranty Expiry" value={formatDate(asset.warrantyExpiry)} />
          </div>
        </div>

        {/* Technical */}
        {(asset.operatingSystem ||
          asset.processor ||
          asset.ram ||
          asset.storage ||
          asset.ipAddress ||
          asset.macAddress) && (
          <div className="detail-section">
            <div className="detail-section-title">Technical Specifications</div>
            <div className="detail-grid">
              {asset.operatingSystem && (
                <Field label="Operating System" value={asset.operatingSystem} />
              )}
              {asset.processor && (
                <Field label="Processor" value={asset.processor} />
              )}
              {asset.ram && <Field label="RAM" value={asset.ram} />}
              {asset.storage && <Field label="Storage" value={asset.storage} />}
              {asset.ipAddress && (
                <Field label="IP Address" value={asset.ipAddress} />
              )}
              {asset.macAddress && (
                <Field label="MAC Address" value={asset.macAddress} />
              )}
            </div>
          </div>
        )}

        {/* Current Assignment */}
        {activeAssignment && (
          <div className="detail-section">
            <div className="detail-section-title">Current Assignment</div>
            <div
              className="p-3 rounded-lg"
              style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
            >
              <div className="font-medium text-sm text-green-800">
                {activeAssignment.employee.name}
              </div>
              <div className="text-xs text-green-600">
                {activeAssignment.employee.jobTitle}
              </div>
              <div className="text-xs text-green-600 mt-1">
                Assigned: {formatDate(activeAssignment.assignedDate)}
              </div>
            </div>
          </div>
        )}

        {/* Assignment History */}
        {asset.assignments.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">
              Assignment History ({asset.assignments.length})
            </div>
            <div className="space-y-2">
              {asset.assignments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-2 rounded text-sm"
                  style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                >
                  <div>
                    <span className="font-medium">{a.employee.name}</span>
                    <span className="text-slate-400 ml-2 text-xs">
                      {a.employee.jobTitle}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatDate(a.assignedDate)} →{" "}
                    {a.returnedDate ? formatDate(a.returnedDate) : "Present"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {asset.notes && (
          <div className="detail-section">
            <div className="detail-section-title">Notes</div>
            <p className="text-sm text-slate-600">{asset.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
