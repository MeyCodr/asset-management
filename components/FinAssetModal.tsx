"use client";

import { useState, FormEvent } from "react";
import { X } from "lucide-react";
import { ASSET_STATUSES, FIN_ASSET_TYPES, FIN_ASSET_CATEGORIES, FIN_ASSET_PLANTS, BASE_PATH } from "@/lib/utils";

export interface FinAsset {
  id: string;
  finAssetTag: string;
  assetCategory: string;
  itAssetId: string | null;
  assetType: string | null;
  assetStatus: string | null;
  serialNumberLic: string | null;
  brand: string | null;
  model: string | null;
  os: string | null;
  qty: number | null;
  department: string | null;
  plant: string | null;
  approvedFinCapexNo: string | null;
  dateOfPurchase: string | null;
  purchaseOrder: string | null;
  totalAmountRm: number | null;
  supplier: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Department {
  id: string;
  name: string;
}

interface Props {
  finAsset: FinAsset | null;
  departments: Department[];
  onClose: () => void;
  onSaved: (finAsset: FinAsset) => void;
}

function toDateInput(d: string | null | undefined): string {
  if (!d) return "";
  return d.split("T")[0];
}

export default function FinAssetModal({ finAsset, departments, onClose, onSaved }: Props) {
  const isEdit = !!finAsset;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    finAssetTag: finAsset?.finAssetTag ?? "",
    assetCategory: finAsset?.assetCategory ?? FIN_ASSET_CATEGORIES[0],
    itAssetId: finAsset?.itAssetId ?? "",
    assetType: finAsset?.assetType ?? "",
    assetStatus: finAsset?.assetStatus ?? "",
    serialNumberLic: finAsset?.serialNumberLic ?? "",
    brand: finAsset?.brand ?? "",
    model: finAsset?.model ?? "",
    os: finAsset?.os ?? "",
    qty: finAsset?.qty?.toString() ?? "",
    department: finAsset?.department ?? "",
    plant: finAsset?.plant ?? "",
    approvedFinCapexNo: finAsset?.approvedFinCapexNo ?? "",
    dateOfPurchase: toDateInput(finAsset?.dateOfPurchase),
    purchaseOrder: finAsset?.purchaseOrder ?? "",
    totalAmountRm: finAsset?.totalAmountRm?.toString() ?? "",
    supplier: finAsset?.supplier ?? "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.finAssetTag || !form.assetCategory) {
      setError("FIN Asset TAG and Asset Category are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const url = isEdit ? `${BASE_PATH}/api/fin-assets/${finAsset.id}` : `${BASE_PATH}/api/fin-assets`;
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save financial asset");
        return;
      }
      onSaved(data);
    } catch (e) {
      setError("Network error");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-shell" style={{ maxWidth: 720 }}>
        <div className="modal-pinned-header">
          <h2 className="modal-title">{isEdit ? "Edit Financial Asset" : "Add Financial Asset"}</h2>
          <button className="p-1 rounded hover:bg-slate-100" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col" style={{ flex: 1, minHeight: 0 }}>
          <div className="modal-scroll-body">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="form-grid">
              <div>
                <label className="form-label">FIN Asset TAG *</label>
                <input
                  name="finAssetTag"
                  value={form.finAssetTag}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="FIN-0001"
                  required
                />
              </div>
              <div>
                <label className="form-label">Asset Category *</label>
                <select
                  name="assetCategory"
                  value={form.assetCategory}
                  onChange={handleChange}
                  className="form-input"
                  required
                >
                  {FIN_ASSET_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">IT Asset ID</label>
                <input
                  name="itAssetId"
                  value={form.itAssetId}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="IT-LAP-DELLATITUDE5540"
                />
              </div>
              <div>
                <label className="form-label">Asset Type</label>
                <select
                  name="assetType"
                  value={form.assetType}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">— Select —</option>
                  {FIN_ASSET_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Asset Status</label>
                <select
                  name="assetStatus"
                  value={form.assetStatus}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">— Select —</option>
                  {ASSET_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Serial Number/Lic</label>
                <input
                  name="serialNumberLic"
                  value={form.serialNumberLic}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="SN-XXXXX"
                />
              </div>
              <div>
                <label className="form-label">Brand</label>
                <input
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Dell"
                />
              </div>
              <div>
                <label className="form-label">Model</label>
                <input
                  name="model"
                  value={form.model}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Latitude 5540"
                />
              </div>
              <div>
                <label className="form-label">OS</label>
                <input
                  name="os"
                  value={form.os}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Windows 11 Pro"
                />
              </div>
              <div>
                <label className="form-label">Qty</label>
                <input
                  name="qty"
                  type="number"
                  min="0"
                  value={form.qty}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="1"
                />
              </div>
              <div>
                <label className="form-label">Department</label>
                <select
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">— Select —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Plant</label>
                <select
                  name="plant"
                  value={form.plant}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">— Select —</option>
                  {FIN_ASSET_PLANTS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Approved FIN CAPEX No</label>
                <input
                  name="approvedFinCapexNo"
                  value={form.approvedFinCapexNo}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="FC-2026-001"
                />
              </div>
              <div>
                <label className="form-label">Date of Purchase</label>
                <input
                  name="dateOfPurchase"
                  type="date"
                  value={form.dateOfPurchase}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Purchase Order</label>
                <input
                  name="purchaseOrder"
                  value={form.purchaseOrder}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="PO-88231"
                />
              </div>
              <div>
                <label className="form-label">Total Amount (RM)</label>
                <input
                  name="totalAmountRm"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.totalAmountRm}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="form-label">Supplier</label>
                <input
                  name="supplier"
                  value={form.supplier}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Dell Malaysia"
                />
              </div>
            </div>
          </div>

          <div className="modal-pinned-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Financial Asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
