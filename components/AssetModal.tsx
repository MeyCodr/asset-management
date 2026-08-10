"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { X, RefreshCw } from "lucide-react";
import { ASSET_STATUSES, ASSET_OWNERSHIP_TYPES, BASE_PATH } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  type: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

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
  categoryId: string;
  departmentId: string;
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
}

interface Props {
  asset: Asset | null;
  categories: Category[];
  departments: Department[];
  onClose: () => void;
  onSaved: () => void;
}

function toDateInput(d: string | null | undefined): string {
  if (!d) return "";
  return d.split("T")[0];
}

export default function AssetModal({
  asset,
  categories,
  departments,
  onClose,
  onSaved,
}: Props) {
  const isEdit = !!asset;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const tagManuallyEdited = useRef(false);

  const itDepartment = departments.find((d) => d.name.toLowerCase().includes("it") || d.code.toLowerCase() === "it");

  const [form, setForm] = useState({
    assetTag: asset?.assetTag ?? "",
    name: asset?.name ?? "",
    brand: asset?.brand ?? "",
    model: asset?.model ?? "",
    serialNumber: asset?.serialNumber ?? "",
    status: asset?.status ?? "Check In",
    assetStatus: asset?.assetStatus ?? "",
    officeLicense: asset?.officeLicense ?? "",
    categoryId: asset?.categoryId ?? (categories[0]?.id ?? ""),
    departmentId: asset?.departmentId ?? (itDepartment?.id ?? departments[0]?.id ?? ""),
    location: asset?.location ?? "",
    purchaseDate: toDateInput(asset?.purchaseDate),
    purchaseCost: asset?.purchaseCost?.toString() ?? "",
    vendor: asset?.vendor ?? "",
    warrantyExpiry: toDateInput(asset?.warrantyExpiry),
    ipAddress: asset?.ipAddress ?? "",
    macAddress: asset?.macAddress ?? "",
    operatingSystem: asset?.operatingSystem ?? "",
    processor: asset?.processor ?? "",
    ram: asset?.ram ?? "",
    storage: asset?.storage ?? "",
    notes: asset?.notes ?? "",
  });

  function buildTag(categoryId: string, name: string): string {
    const category = categories.find((c) => c.id === categoryId);
    if (!category || !name.trim()) return "";
    const catPart = getCatAbbrev(category.name);
    const namePart = name.toUpperCase().replace(/[^A-Z0-9]/g, "");
    return `IT-${catPart}-${namePart}`;
  }

  function getCatAbbrev(categoryName: string): string {
    const words = categoryName.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, "").split(/\s+/).filter(Boolean);
    if (words.length === 1) return words[0].slice(0, 3).padEnd(3, "X");
    return words.map((w) => w.slice(0, Math.min(4, Math.ceil(w.length / 2)))).join("");
  }

  // Auto-generate tag in add mode when category or name changes
  useEffect(() => {
    if (isEdit || tagManuallyEdited.current) return;
    const tag = buildTag(form.categoryId, form.name);
    if (tag) setForm((f) => ({ ...f, assetTag: tag }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.categoryId, form.name]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    // Mark as manually edited if user types in the asset tag field
    if (name === "assetTag") tagManuallyEdited.current = true;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.assetTag || !form.name || !form.categoryId || !form.departmentId) {
      setError("Asset tag, name, category, and department are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const url = isEdit ? `${BASE_PATH}/api/assets/${asset.id}` : `${BASE_PATH}/api/assets`;
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save asset");
        return;
      }
      onSaved();
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
          <h2 className="modal-title">{isEdit ? "Edit Asset" : "Add New Asset"}</h2>
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

          {/* Basic Info */}
          <div className="detail-section-title mb-3">Basic Information</div>
          <div className="form-grid mb-4">
            <div>
              <label className="form-label flex items-center justify-between">
                Asset Tag *
                {!isEdit && (
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-normal"
                    onClick={() => {
                      tagManuallyEdited.current = false;
                      const tag = buildTag(form.categoryId, form.name);
                      if (tag) setForm((f) => ({ ...f, assetTag: tag }));
                    }}
                  >
                    <RefreshCw size={11} />
                    Regenerate
                  </button>
                )}
              </label>
              <input
                name="assetTag"
                value={form.assetTag}
                onChange={handleChange}
                className="form-input"
                placeholder="IT-LAP-DELLATITUDE5540"
                required
              />
            </div>
            <div>
              <label className="form-label">Asset Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="form-input"
                placeholder="Dell Latitude 5540"
                required
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
              <label className="form-label">Serial Number</label>
              <input
                name="serialNumber"
                value={form.serialNumber}
                onChange={handleChange}
                className="form-input"
                placeholder="SN-XXXXX"
              />
            </div>
            <div>
              <label className="form-label">Condition *</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="form-input"
              >
                {ASSET_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
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
                {ASSET_OWNERSHIP_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Office License</label>
              <input
                name="officeLicense"
                value={form.officeLicense}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. Microsoft 365, None"
              />
            </div>
            <div>
              <label className="form-label">Category *</label>
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                className="form-input"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {isEdit && (
              <div>
                <label className="form-label">Department *</label>
                <select
                  name="departmentId"
                  value={form.departmentId}
                  onChange={handleChange}
                  className="form-input"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="form-label">Location</label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                className="form-input"
                placeholder="Office Floor 3"
              />
            </div>
          </div>

          {/* Purchase Info */}
          <div className="detail-section-title mb-3">Purchase & Warranty</div>
          <div className="form-grid mb-4">
            <div>
              <label className="form-label">Purchase Date</label>
              <input
                type="date"
                name="purchaseDate"
                value={form.purchaseDate}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Purchase Cost (RM)</label>
              <input
                type="number"
                name="purchaseCost"
                value={form.purchaseCost}
                onChange={handleChange}
                className="form-input"
                placeholder="0.00"
                step="0.01"
              />
            </div>
            <div>
              <label className="form-label">Vendor</label>
              <input
                name="vendor"
                value={form.vendor}
                onChange={handleChange}
                className="form-input"
                placeholder="Dell Technologies"
              />
            </div>
            <div>
              <label className="form-label">Warranty Expiry</label>
              <input
                type="date"
                name="warrantyExpiry"
                value={form.warrantyExpiry}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          {/* Technical Specs */}
          <div className="detail-section-title mb-3">Technical Specifications</div>
          <div className="form-grid mb-4">
            <div>
              <label className="form-label">IP Address</label>
              <input
                name="ipAddress"
                value={form.ipAddress}
                onChange={handleChange}
                className="form-input"
                placeholder="192.168.1.x"
              />
            </div>
            <div>
              <label className="form-label">MAC Address</label>
              <input
                name="macAddress"
                value={form.macAddress}
                onChange={handleChange}
                className="form-input"
                placeholder="00:1A:2B:3C:4D:5E"
              />
            </div>
            <div>
              <label className="form-label">Operating System</label>
              <input
                name="operatingSystem"
                value={form.operatingSystem}
                onChange={handleChange}
                className="form-input"
                placeholder="Windows 11 Pro"
              />
            </div>
            <div>
              <label className="form-label">Processor</label>
              <input
                name="processor"
                value={form.processor}
                onChange={handleChange}
                className="form-input"
                placeholder="Intel Core i7-1365U"
              />
            </div>
            <div>
              <label className="form-label">RAM</label>
              <input
                name="ram"
                value={form.ram}
                onChange={handleChange}
                className="form-input"
                placeholder="16GB DDR4"
              />
            </div>
            <div>
              <label className="form-label">Storage</label>
              <input
                name="storage"
                value={form.storage}
                onChange={handleChange}
                className="form-input"
                placeholder="512GB NVMe SSD"
              />
            </div>
            <div className="form-grid-full">
              <label className="form-label">Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                className="form-input"
                placeholder="Additional notes..."
              />
            </div>
          </div>
          </div>

          <div className="modal-pinned-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
