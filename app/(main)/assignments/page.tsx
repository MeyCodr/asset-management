"use client";

import { useEffect, useState, FormEvent } from "react";
import { Plus, X, RotateCcw, Trash2, Trash, Search } from "lucide-react";
import { formatDate, STATUS_COLORS, BASE_PATH } from "@/lib/utils";
import ConfirmModal from "@/components/ConfirmModal";

interface Asset {
  id: string;
  assetTag: string;
  name: string;
  status: string;
  category: { name: string };
  department: { name: string };
}

interface Employee {
  id: string;
  name: string;
  jobTitle: string;
  department: { name: string };
}

interface Assignment {
  id: string;
  assignedDate: string;
  returnedDate: string | null;
  notes: string | null;
  asset: Asset;
  employee: Employee;
}

interface NewAssignmentModalProps {
  assets: Asset[];
  employees: Employee[];
  onClose: () => void;
  onSaved: () => void;
}

function NewAssignmentModal({ assets, employees, onClose, onSaved }: NewAssignmentModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    assetId: assets[0]?.id ?? "",
    employeeId: employees[0]?.id ?? "",
    assignedDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const availableAssets = assets.filter(a => a.status === "Check In");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.assetId || !form.employeeId) {
      setError("Please select an asset and an employee.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${BASE_PATH}/api/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create assignment");
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
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h2 className="modal-title">Assign Asset</h2>
          <button className="p-1 rounded hover:bg-slate-100" onClick={onClose}><X size={18} /></button>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="form-label">Asset *</label>
              <select name="assetId" value={form.assetId} onChange={handleChange} className="form-input">
                <option value="">Select asset...</option>
                {availableAssets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.assetTag} — {a.name} ({a.status})
                  </option>
                ))}
              </select>
              {availableAssets.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No assets available. All assets are currently assigned or not in stock.</p>
              )}
            </div>
            <div>
              <label className="form-label">Employee *</label>
              <select name="employeeId" value={form.employeeId} onChange={handleChange} className="form-input">
                <option value="">Select employee...</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} — {e.jobTitle}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Assignment Date</label>
              <input type="date" name="assignedDate" value={form.assignedDate} onChange={handleChange} className="form-input" />
            </div>
            <div>
              <label className="form-label">Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} className="form-input" placeholder="Optional notes..." />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Assign Asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOnly, setActiveOnly] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [confirmState, setConfirmState] = useState<{ type: "return" | "delete"; id: string } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  async function fetchAll() {
    const params = activeOnly ? "?active=true" : "";
    const [assignRes, assetRes, empRes] = await Promise.all([
      fetch(`${BASE_PATH}/api/assignments${params}`),
      fetch(`${BASE_PATH}/api/assets`),
      fetch(`${BASE_PATH}/api/employees`),
    ]);
    if (assignRes.ok) setAssignments(await assignRes.json());
    if (assetRes.ok) setAllAssets(await assetRes.json());
    if (empRes.ok) setEmployees(await empRes.json());
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, [activeOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleConfirm() {
    if (!confirmState) return;
    if (confirmState.type === "return") {
      const res = await fetch(`${BASE_PATH}/api/assignments/${confirmState.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnedDate: new Date().toISOString() }),
      });
      if (res.ok) fetchAll();
    } else {
      const res = await fetch(`${BASE_PATH}/api/assignments/${confirmState.id}`, { method: "DELETE" });
      if (res.ok) fetchAll();
    }
    setConfirmState(null);
  }

  async function handleBulkDelete() {
    await Promise.all([...selected].map((id) => fetch(`${BASE_PATH}/api/assignments/${id}`, { method: "DELETE" })));
    setSelected(new Set());
    setShowBulkConfirm(false);
    fetchAll();
  }

  function toggleSelect(id: string) {
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  function toggleSelectAll(checked: boolean) {
    setSelected(checked ? new Set(assignments.map((a) => a.id)) : new Set());
  }

  const filtered = assignments.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.asset.assetTag.toLowerCase().includes(q) ||
      a.asset.name.toLowerCase().includes(q) ||
      a.employee.name.toLowerCase().includes(q) ||
      a.employee.department.name.toLowerCase().includes(q)
    );
  });

  const active = assignments.filter((a) => !a.returnedDate);
  const returned = assignments.filter((a) => a.returnedDate);

  return (
    <div className="flex flex-col h-full">
      <div className="page-header">
        <div>
          <h1 className="page-title">Assignments</h1>
          <p className="page-subtitle">
            {active.length} active · {returned.length} returned
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="rounded"
            />
            Active only
          </label>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Assign Asset
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input" style={{ flex: 1, maxWidth: 340 }}>
          <Search size={15} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search by asset, employee, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

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
          <div className="empty-state text-slate-400">Loading assignments...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No assignments found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox" checked={filtered.length > 0 && filtered.every((a) => selected.has(a.id))} onChange={(e) => setSelected(e.target.checked ? new Set(filtered.map((a) => a.id)) : new Set())} />
                </th>
                <th>Asset</th>
                <th>Category</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Assigned Date</th>
                <th>Returned Date</th>
                <th>Status</th>
                <th className="sticky-col" style={{ width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td>
                    <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggleSelect(a.id)} />
                  </td>
                  <td>
                    <div className="font-mono text-xs text-blue-600 font-medium">{a.asset.assetTag}</div>
                    <div className="text-xs text-slate-500">{a.asset.name}</div>
                  </td>
                  <td className="text-sm">{a.asset.category.name}</td>
                  <td>
                    <div className="font-medium text-sm">{a.employee.name}</div>
                    <div className="text-xs text-slate-400">{a.employee.jobTitle}</div>
                  </td>
                  <td className="text-sm">{a.employee.department.name}</td>
                  <td className="text-sm">{formatDate(a.assignedDate)}</td>
                  <td className="text-sm text-slate-500">{a.returnedDate ? formatDate(a.returnedDate) : "—"}</td>
                  <td>
                    <span className={`badge ${a.returnedDate ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-700"}`}>
                      {a.returnedDate ? "Returned" : "Active"}
                    </span>
                  </td>
                  <td className="sticky-col">
                    <div className="flex items-center gap-1">
                      {!a.returnedDate && (
                        <button
                          className="p-1.5 rounded hover:bg-amber-50 text-slate-500 hover:text-amber-600"
                          title="Mark as returned"
                          onClick={() => setConfirmState({ type: "return", id: a.id })}
                        >
                          <RotateCcw size={14} />
                        </button>
                      )}
                      <button
                        className="p-1.5 rounded hover:bg-red-50 text-slate-500 hover:text-red-600"
                        title="Delete"
                        onClick={() => setConfirmState({ type: "delete", id: a.id })}
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
          title="Delete Selected Assignments"
          message={`Are you sure you want to delete ${selected.size} assignment${selected.size !== 1 ? "s" : ""}? This action cannot be undone.`}
          confirmLabel={`Delete ${selected.size}`}
          variant="danger"
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkConfirm(false)}
        />
      )}

      {confirmState && (
        <ConfirmModal
          title={confirmState.type === "return" ? "Mark as Returned" : "Delete Assignment"}
          message={
            confirmState.type === "return"
              ? "Mark this asset as returned? This will set today as the return date."
              : "Delete this assignment record? This action cannot be undone."
          }
          confirmLabel={confirmState.type === "return" ? "Mark Returned" : "Delete"}
          variant={confirmState.type === "return" ? "warning" : "danger"}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}

      {showModal && (
        <NewAssignmentModal
          assets={allAssets}
          employees={employees}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchAll(); }}
        />
      )}
    </div>
  );
}
