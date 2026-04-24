"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import { Plus, X, Edit2, Trash2, Wrench, Trash, Search, ChevronDown } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import { formatDate, formatCurrency, STATUS_COLORS, MAINTENANCE_TYPES, BASE_PATH } from "@/lib/utils";

interface Asset {
  id: string;
  assetTag: string;
  name: string;
  category: { name: string };
  department: { name: string };
}

interface MaintenanceRecord {
  id: string;
  type: string;
  description: string;
  cost: number | null;
  performedBy: string | null;
  vendor: string | null;
  maintenanceDate: string;
  nextMaintenanceDate: string | null;
  status: string;
  notes: string | null;
  asset: Asset;
}

interface ModalProps {
  record: MaintenanceRecord | null;
  assets: Asset[];
  onClose: () => void;
  onSaved: () => void;
}

function AssetSearchDropdown({
  assets,
  value,
  onChange,
  disabled,
}: {
  assets: Asset[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = assets.find((a) => a.id === value);

  const filtered = assets.filter((a) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      a.assetTag.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.category.name.toLowerCase().includes(q)
    );
  });

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Trigger button */}
      <button
        type="button"
        className="form-input flex items-center justify-between gap-2 text-left"
        style={{ width: "100%", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1 }}
        onClick={() => { if (!disabled) setOpen((o) => !o); }}
        disabled={disabled}
      >
        {selected ? (
          <span>
            <span className="font-mono text-xs text-blue-600 font-medium">{selected.assetTag}</span>
            <span className="text-slate-600 ml-2 text-sm">{selected.name}</span>
          </span>
        ) : (
          <span className="text-slate-400 text-sm">Select an asset…</span>
        )}
        <ChevronDown size={14} className="shrink-0 text-slate-400" />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
            background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)", zIndex: 50, maxHeight: 280, display: "flex", flexDirection: "column",
          }}
        >
          {/* Search input */}
          <div className="p-2 border-b border-slate-100">
            <div className="search-input">
              <Search size={13} color="#9ca3af" />
              <input
                autoFocus
                type="text"
                placeholder="Search by tag, name, category…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Results list */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-slate-400 text-center">No assets found.</div>
            ) : (
              filtered.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50"
                  style={{ borderBottom: "1px solid #f1f5f9", background: a.id === value ? "#eff6ff" : undefined }}
                  onMouseDown={() => { onChange(a.id); setOpen(false); setQuery(""); }}
                >
                  <span className="font-mono text-xs text-blue-600 font-medium shrink-0">{a.assetTag}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{a.name}</div>
                    <div className="text-xs text-slate-400">{a.category.name}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MaintenanceModal({ record, assets, onClose, onSaved }: ModalProps) {
  const isEdit = !!record;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    assetId: record?.asset.id ?? (assets[0]?.id ?? ""),
    type: record?.type ?? "Preventive",
    description: record?.description ?? "",
    cost: record?.cost?.toString() ?? "",
    performedBy: record?.performedBy ?? "",
    vendor: record?.vendor ?? "",
    maintenanceDate: record?.maintenanceDate?.split("T")[0] ?? new Date().toISOString().split("T")[0],
    nextMaintenanceDate: record?.nextMaintenanceDate?.split("T")[0] ?? "",
    status: record?.status ?? "Completed",
    notes: record?.notes ?? "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.assetId || !form.description || !form.maintenanceDate) {
      setError("Asset, description, and date are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const url = isEdit ? `${BASE_PATH}/api/maintenance/${record.id}` : `${BASE_PATH}/api/maintenance`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save");
        return;
      }
      onSaved();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? "Edit Maintenance Record" : "Log Maintenance"}</h2>
          <button className="p-1 rounded hover:bg-slate-100" onClick={onClose}><X size={18} /></button>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-grid mb-4">
            <div className="form-grid-full">
              <label className="form-label">Asset *</label>
              <AssetSearchDropdown
                assets={assets}
                value={form.assetId}
                onChange={(id) => setForm((f) => ({ ...f, assetId: id }))}
                disabled={isEdit}
              />
            </div>
            <div>
              <label className="form-label">Type *</label>
              <select name="type" value={form.type} onChange={handleChange} className="form-input">
                {MAINTENANCE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Status *</label>
              <select name="status" value={form.status} onChange={handleChange} className="form-input">
                <option>Scheduled</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </div>
            <div className="form-grid-full">
              <label className="form-label">Description *</label>
              <textarea name="description" value={form.description} onChange={handleChange} className="form-input" required />
            </div>
            <div>
              <label className="form-label">Cost (RM)</label>
              <input type="number" name="cost" value={form.cost} onChange={handleChange} className="form-input" step="0.01" />
            </div>
            <div>
              <label className="form-label">Performed By</label>
              <input name="performedBy" value={form.performedBy} onChange={handleChange} className="form-input" />
            </div>
            <div>
              <label className="form-label">Vendor</label>
              <input name="vendor" value={form.vendor} onChange={handleChange} className="form-input" />
            </div>
            <div>
              <label className="form-label">Maintenance Date *</label>
              <input type="date" name="maintenanceDate" value={form.maintenanceDate} onChange={handleChange} className="form-input" required />
            </div>
            <div>
              <label className="form-label">Next Maintenance Date</label>
              <input type="date" name="nextMaintenanceDate" value={form.nextMaintenanceDate} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-grid-full">
              <label className="form-label">Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} className="form-input" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Log Maintenance"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MaintenancePage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState<MaintenanceRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  async function fetchAll() {
    const params = filterStatus ? `?status=${filterStatus}` : "";
    const [recRes, assetRes] = await Promise.all([
      fetch(`${BASE_PATH}/api/maintenance${params}`),
      fetch(`${BASE_PATH}/api/assets`),
    ]);
    if (recRes.ok) setRecords(await recRes.json());
    if (assetRes.ok) setAssets(await assetRes.json());
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, [filterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete() {
    if (!deleteId) return;
    const res = await fetch(`${BASE_PATH}/api/maintenance/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    if (res.ok) fetchAll();
  }

  async function handleBulkDelete() {
    await Promise.all([...selected].map((id) => fetch(`${BASE_PATH}/api/maintenance/${id}`, { method: "DELETE" })));
    setSelected(new Set());
    setShowBulkConfirm(false);
    fetchAll();
  }

  function toggleSelect(id: string) {
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  function toggleSelectAll(checked: boolean) {
    setSelected(checked ? new Set(records.map((r) => r.id)) : new Set());
  }

  const filtered = records.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.asset.assetTag.toLowerCase().includes(q) ||
      r.asset.name.toLowerCase().includes(q) ||
      r.type.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      (r.performedBy ?? "").toLowerCase().includes(q)
    );
  });

  const totalCost = records.reduce((sum, r) => sum + (r.cost ?? 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Maintenance</h1>
          <p className="page-subtitle">
            {records.length} record{records.length !== 1 ? "s" : ""} · Total cost: {formatCurrency(totalCost)}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditRecord(null); setShowModal(true); }}>
          <Plus size={16} /> Log Maintenance
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-input" style={{ flex: 1, maxWidth: 340 }}>
          <Search size={15} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search by asset, type, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-input"
          style={{ width: "auto" }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option>Scheduled</option>
          <option>In Progress</option>
          <option>Completed</option>
        </select>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2 mb-2 rounded-lg bg-red-50 text-red-700 text-sm" style={{ border: "1px solid #fecaca" }}>
          <span>{selected.size} item{selected.size !== 1 ? "s" : ""} selected</span>
          <button className="btn btn-danger flex items-center gap-1" onClick={() => setShowBulkConfirm(true)}>
            <Trash size={14} /> Delete Selected
          </button>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflowX: "auto" }}>
        {loading ? (
          <div className="empty-state text-slate-400">Loading records...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Wrench size={40} className="mx-auto mb-3" style={{ color: "#d1d5db" }} />
            No maintenance records found.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox" checked={filtered.length > 0 && filtered.every((r) => selected.has(r.id))} onChange={(e) => setSelected(e.target.checked ? new Set(filtered.map((r) => r.id)) : new Set())} />
                </th>
                <th>Asset</th>
                <th>Type</th>
                <th>Description</th>
                <th>Status</th>
                <th>Date</th>
                <th>Next Due</th>
                <th>Cost (RM)</th>
                <th>Performed By</th>
                <th style={{ width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>
                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} />
                  </td>
                  <td>
                    <div className="font-mono text-xs text-blue-600 font-medium">{r.asset.assetTag}</div>
                    <div className="text-xs text-slate-500">{r.asset.name}</div>
                  </td>
                  <td>
                    <span className="badge bg-slate-100 text-slate-700">{r.type}</span>
                  </td>
                  <td className="text-sm max-w-xs">
                    <div className="truncate" style={{ maxWidth: 200 }}>{r.description}</div>
                  </td>
                  <td>
                    <span className={`badge ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="text-sm">{formatDate(r.maintenanceDate)}</td>
                  <td className="text-sm text-slate-500">
                    {r.nextMaintenanceDate ? formatDate(r.nextMaintenanceDate) : "—"}
                  </td>
                  <td className="text-sm">{formatCurrency(r.cost)}</td>
                  <td className="text-sm text-slate-600">{r.performedBy ?? "—"}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600"
                        onClick={() => { setEditRecord(r); setShowModal(true); }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="p-1.5 rounded hover:bg-red-50 text-slate-500 hover:text-red-600"
                        onClick={() => setDeleteId(r.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showBulkConfirm && (
        <ConfirmModal
          title="Delete Selected Records"
          message={`Are you sure you want to delete ${selected.size} maintenance record${selected.size !== 1 ? "s" : ""}? This action cannot be undone.`}
          confirmLabel={`Delete ${selected.size}`}
          variant="danger"
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkConfirm(false)}
        />
      )}

      {deleteId && (
        <ConfirmModal
          title="Delete Maintenance Record"
          message="Are you sure you want to delete this maintenance record? This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {showModal && (
        <MaintenanceModal
          record={editRecord}
          assets={assets}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchAll(); }}
        />
      )}
    </div>
  );
}
