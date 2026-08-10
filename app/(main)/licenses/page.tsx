"use client";

import { useEffect, useState, FormEvent } from "react";
import { Plus, X, Edit2, Trash2, Key, Trash, Search, Upload, AlertTriangle, Bell, Send, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import LicenseImportModal from "@/components/LicenseImportModal";
import { formatDate, formatCurrency, LICENSE_TYPES, BASE_PATH } from "@/lib/utils";

interface License {
  id: string;
  name: string;
  vendor: string;
  refLetter: string | null;
  refLetterDate: string | null;
  renewalStart: string | null;
  renewalEnd: string | null;
  itSection: string | null;
  status: string;
  licenseKey: string | null;
  licenseType: string;
  cost: number | null;
  totalSeats: number;
  usedSeats: number;
  notes: string | null;
}

const LICENSE_STATUSES = ["New", "On Going", "Closed"];

interface ModalProps {
  license: License | null;
  onClose: () => void;
  onSaved: () => void;
}

function formatPeriod(start: string | null, end: string | null): string {
  if (!start && !end) return "—";
  const fmt = (d: string) => {
    const dt = new Date(d);
    return `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
  };
  if (start && end) return `${fmt(start)}~${fmt(end)}`;
  if (start) return `${fmt(start)}~`;
  return `~${fmt(end!)}`;
}

function daysLeft(renewalEnd: string | null): number | null {
  if (!renewalEnd) return null;
  const diff = new Date(renewalEnd).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ days }: { days: number | null }) {
  if (days === null) return null;
  if (days < 0)
    return <span className="badge bg-red-100 text-red-700 mt-0.5">Expired</span>;
  if (days <= 14)
    return <span className="badge bg-red-100 text-red-700 mt-0.5">{days}d left</span>;
  if (days <= 60)
    return <span className="badge bg-amber-100 text-amber-700 mt-0.5">{days}d left</span>;
  return null;
}

function LicenseModal({ license, onClose, onSaved }: ModalProps) {
  const isEdit = !!license;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name:          license?.name          ?? "",
    vendor:        license?.vendor        ?? "",
    refLetter:     license?.refLetter     ?? "",
    refLetterDate: license?.refLetterDate?.split("T")[0] ?? "",
    renewalStart:  license?.renewalStart?.split("T")[0]  ?? "",
    renewalEnd:    license?.renewalEnd?.split("T")[0]    ?? "",
    itSection:     license?.itSection     ?? "",
    status:        license?.status        ?? "On Going",
    licenseType:   license?.licenseType   ?? "Subscription",
    cost:          license?.cost?.toString() ?? "",
    totalSeats:    license?.totalSeats?.toString() ?? "1",
    usedSeats:     license?.usedSeats?.toString()  ?? "0",
    notes:         license?.notes         ?? "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name || !form.vendor) {
      setError("Description and Supplier are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const url = isEdit ? `${BASE_PATH}/api/licenses/${license.id}` : `${BASE_PATH}/api/licenses`;
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
      <div className="modal modal-shell" style={{ maxWidth: 620 }}>
        <div className="modal-pinned-header">
          <h2 className="modal-title">{isEdit ? "Edit License" : "Add License"}</h2>
          <button className="p-1 rounded hover:bg-slate-100" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col" style={{ flex: 1, minHeight: 0 }}>
          <div className="modal-scroll-body">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>
          )}
          <div className="form-grid mb-4">
            <div className="form-grid-full">
              <label className="form-label">Description *</label>
              <input name="name" value={form.name} onChange={handleChange} className="form-input" placeholder="e.g. AUTODESK PDMC RENEWAL" required />
            </div>
            <div>
              <label className="form-label">Supplier *</label>
              <input name="vendor" value={form.vendor} onChange={handleChange} className="form-input" placeholder="e.g. ACAD SYSTEM SDN BHD" required />
            </div>
            <div>
              <label className="form-label">IT Section</label>
              <input name="itSection" value={form.itSection} onChange={handleChange} className="form-input" placeholder="e.g. IT ADMIN" />
            </div>
            <div>
              <label className="form-label">Official Ref Letter</label>
              <input name="refLetter" value={form.refLetter} onChange={handleChange} className="form-input" placeholder="e.g. PHN/IT_ADMIN/ACAD/2025/01" />
            </div>
            <div>
              <label className="form-label">Letter Ref Date</label>
              <input type="date" name="refLetterDate" value={form.refLetterDate} onChange={handleChange} className="form-input" />
            </div>
            <div>
              <label className="form-label">Period Renewal Start</label>
              <input type="date" name="renewalStart" value={form.renewalStart} onChange={handleChange} className="form-input" />
            </div>
            <div>
              <label className="form-label">Period Renewal End</label>
              <input type="date" name="renewalEnd" value={form.renewalEnd} onChange={handleChange} className="form-input" />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="form-input">
                {LICENSE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">License Type</label>
              <select name="licenseType" value={form.licenseType} onChange={handleChange} className="form-input">
                {LICENSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Cost (RM)</label>
              <input type="number" name="cost" value={form.cost} onChange={handleChange} className="form-input" step="0.01" />
            </div>
            <div>
              <label className="form-label">Total Seats</label>
              <input type="number" name="totalSeats" value={form.totalSeats} onChange={handleChange} className="form-input" min="1" />
            </div>
            <div>
              <label className="form-label">Used Seats</label>
              <input type="number" name="usedSeats" value={form.usedSeats} onChange={handleChange} className="form-input" min="0" />
            </div>
            <div className="form-grid-full">
              <label className="form-label">Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} className="form-input" />
            </div>
          </div>
          </div>
          <div className="modal-pinned-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Add License"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editLicense, setEditLicense] = useState<License | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterItSection, setFilterItSection] = useState("");
  const [supplierSort, setSupplierSort] = useState<"asc" | "desc" | null>(null);
  const [notifying, setNotifying] = useState(false);
  const [notifyResult, setNotifyResult] = useState<string | null>(null);

  async function fetchLicenses() {
    const res = await fetch(`${BASE_PATH}/api/licenses`);
    if (res.ok) setLicenses(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchLicenses(); }, []);

  async function handleSendNotifications() {
    setNotifying(true);
    setNotifyResult(null);
    try {
      const res = await fetch(`${BASE_PATH}/api/notifications/license-expiry`, { method: "POST" });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = { error: text.slice(0, 200) }; }
      if (!res.ok) {
        setNotifyResult(`Error: ${data.error ?? res.statusText}`);
      } else if (data.sent === 0) {
        setNotifyResult("No new notifications to send.");
      } else {
        setNotifyResult(`Sent to ${data.recipients} user${data.recipients !== 1 ? "s" : ""}. ${(data.summary ?? []).join(" · ")}`);
      }
    } catch (err) {
      setNotifyResult(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setNotifying(false);
      setTimeout(() => setNotifyResult(null), 6000);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    const res = await fetch(`${BASE_PATH}/api/licenses/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    if (res.ok) fetchLicenses();
  }

  async function handleBulkDelete() {
    await Promise.all([...selected].map((id) => fetch(`${BASE_PATH}/api/licenses/${id}`, { method: "DELETE" })));
    setSelected(new Set());
    setShowBulkConfirm(false);
    fetchLicenses();
  }

  function toggleSelect(id: string) {
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  const itSections = Array.from(new Set(licenses.map((l) => l.itSection).filter(Boolean))) as string[];

  const filtered = licenses
    .filter((l) => {
      if (filterItSection && (l.itSection ?? "") !== filterItSection) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        l.vendor.toLowerCase().includes(q) ||
        (l.refLetter ?? "").toLowerCase().includes(q) ||
        (l.itSection ?? "").toLowerCase().includes(q) ||
        l.status.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (!supplierSort) return 0;
      const cmp = a.vendor.localeCompare(b.vendor);
      return supplierSort === "asc" ? cmp : -cmp;
    });

  const onGoing = licenses.filter((l) => l.status === "On Going").length;
  const totalCost = licenses.reduce((sum, l) => sum + (l.cost ?? 0), 0);

  const critical  = licenses.filter((l) => { const d = daysLeft(l.renewalEnd); return d !== null && d >= 0 && d <= 14; });
  const warning   = licenses.filter((l) => { const d = daysLeft(l.renewalEnd); return d !== null && d > 14  && d <= 60; });

  return (
    <div className="flex flex-col h-full">
      <div className="page-header">
        <div>
          <h1 className="page-title">Software Licenses</h1>
          <p className="page-subtitle">
            {licenses.length} license{licenses.length !== 1 ? "s" : ""} · {onGoing} on going · Total cost: {formatCurrency(totalCost)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-secondary"
            onClick={handleSendNotifications}
            disabled={notifying}
            title="Send expiry reminder emails to all active users"
          >
            {notifying
              ? <><span className="animate-spin inline-block w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full" /> Sending...</>
              : <><Send size={14} /> Send Reminders</>
            }
          </button>
          <button className="btn btn-secondary" onClick={() => setShowImportModal(true)}>
            <Upload size={15} /> Import
          </button>
          <button className="btn btn-primary" onClick={() => { setEditLicense(null); setShowModal(true); }}>
            <Plus size={16} /> Add License
          </button>
        </div>
      </div>

      {notifyResult && (
        <div className="flex items-center gap-2 p-3 rounded-lg mb-3 text-sm" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d" }}>
          <Send size={14} />
          {notifyResult}
        </div>
      )}

      <div className="filter-bar">
        <div className="search-input" style={{ flex: 1, maxWidth: 340 }}>
          <Search size={15} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search by description, supplier, ref letter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-input"
          style={{ width: "auto" }}
          value={filterItSection}
          onChange={(e) => setFilterItSection(e.target.value)}
        >
          <option value="">All IT Sections</option>
          {itSections.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {(search || filterItSection) && (
          <button
            className="btn btn-secondary text-xs"
            onClick={() => { setSearch(""); setFilterItSection(""); }}
          >
            Clear filters
          </button>
        )}
      </div>

      {critical.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-lg mb-3 text-sm" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
          <AlertTriangle size={18} className="shrink-0 mt-0.5" color="#dc2626" />
          <div>
            <div className="font-semibold text-red-700 mb-1">
              {critical.length} license{critical.length > 1 ? "s" : ""} expiring within 14 days
            </div>
            <ul className="text-red-600 space-y-0.5">
              {critical.map((l) => (
                <li key={l.id}>
                  <span className="font-medium">{l.name}</span>
                  {" — "}{l.vendor}
                  {" · "}<span className="font-medium">{daysLeft(l.renewalEnd)}d left</span>
                  {" (expires "}{formatDate(l.renewalEnd)}{")"}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {warning.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-lg mb-3 text-sm" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
          <Bell size={18} className="shrink-0 mt-0.5" color="#d97706" />
          <div>
            <div className="font-semibold text-amber-700 mb-1">
              {warning.length} license{warning.length > 1 ? "s" : ""} expiring within 60 days
            </div>
            <ul className="text-amber-700 space-y-0.5">
              {warning.map((l) => (
                <li key={l.id}>
                  <span className="font-medium">{l.name}</span>
                  {" — "}{l.vendor}
                  {" · "}<span className="font-medium">{daysLeft(l.renewalEnd)}d left</span>
                  {" (expires "}{formatDate(l.renewalEnd)}{")"}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {selected.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2 mb-2 rounded-lg bg-red-50 text-red-700 text-sm" style={{ border: "1px solid #fecaca" }}>
          <span>{selected.size} item{selected.size !== 1 ? "s" : ""} selected</span>
          <button className="btn btn-danger flex items-center gap-1" onClick={() => setShowBulkConfirm(true)}>
            <Trash size={14} /> Delete Selected
          </button>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflowX: "scroll", overflowY: "auto", flex: 1, minHeight: 0 }}>
        {loading ? (
          <div className="empty-state text-slate-400">Loading licenses...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Key size={40} className="mx-auto mb-3" style={{ color: "#d1d5db" }} />
            No licenses found.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && filtered.every((l) => selected.has(l.id))}
                    onChange={(e) => setSelected(e.target.checked ? new Set(filtered.map((l) => l.id)) : new Set())}
                  />
                </th>
                <th style={{ width: 48 }}>No</th>
                <th
                  style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
                  onClick={() => setSupplierSort((s) => s === "asc" ? "desc" : s === "desc" ? null : "asc")}
                >
                  <span className="flex items-center gap-1">
                    Supplier
                    {supplierSort === "asc"  ? <ChevronUp   size={13} className="text-blue-500" /> :
                     supplierSort === "desc" ? <ChevronDown size={13} className="text-blue-500" /> :
                                              <ChevronsUpDown size={13} className="text-slate-300" />}
                  </span>
                </th>
                <th>Official Ref Letter</th>
                <th>Letter Ref Date</th>
                <th>Description</th>
                <th>Period Renewal</th>
                <th>
                  <span className="flex items-center gap-1">
                    IT Section
                    {filterItSection && <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />}
                  </span>
                </th>
                <th>License Type</th>
                <th>Cost (RM)</th>
                <th>Status</th>
                <th className="sticky-col" style={{ width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, idx) => (
                <tr key={l.id}>
                  <td>
                    <input type="checkbox" checked={selected.has(l.id)} onChange={() => toggleSelect(l.id)} />
                  </td>
                  <td className="text-xs text-slate-400 text-center">{idx + 1}</td>
                  <td className="text-sm font-medium">{l.vendor}</td>
                  <td className="text-sm font-mono text-slate-600">{l.refLetter ?? "—"}</td>
                  <td className="text-sm text-slate-500">{formatDate(l.refLetterDate)}</td>
                  <td className="text-sm font-medium">{l.name}</td>
                  <td className="text-sm text-slate-600 whitespace-nowrap">
                    <div>{formatPeriod(l.renewalStart, l.renewalEnd)}</div>
                    <ExpiryBadge days={daysLeft(l.renewalEnd)} />
                  </td>
                  <td className="text-sm">{l.itSection ?? "—"}</td>
                  <td>
                    <span className="badge bg-blue-50 text-blue-700">{l.licenseType}</span>
                  </td>
                  <td className="text-sm">{formatCurrency(l.cost)}</td>
                  <td>
                    <span
                      className={`badge font-semibold ${
                        l.status === "On Going"
                          ? "bg-green-100 text-green-700"
                          : l.status === "New"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {l.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="sticky-col">
                    <div className="flex items-center gap-1">
                      <button
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600"
                        title="Edit"
                        onClick={() => { setEditLicense(l); setShowModal(true); }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="p-1.5 rounded hover:bg-red-50 text-slate-500 hover:text-red-600"
                        title="Delete"
                        onClick={() => setDeleteId(l.id)}
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
          title="Delete Selected Licenses"
          message={`Are you sure you want to delete ${selected.size} license${selected.size !== 1 ? "s" : ""}? This action cannot be undone.`}
          confirmLabel={`Delete ${selected.size}`}
          variant="danger"
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkConfirm(false)}
        />
      )}

      {deleteId && (
        <ConfirmModal
          title="Delete License"
          message="Are you sure you want to delete this license? This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {showModal && (
        <LicenseModal
          license={editLicense}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchLicenses(); }}
        />
      )}

      {showImportModal && (
        <LicenseImportModal
          onClose={() => setShowImportModal(false)}
          onImported={() => { setShowImportModal(false); fetchLicenses(); }}
        />
      )}
    </div>
  );
}
