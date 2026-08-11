"use client";

import { Building2, Tag, X, Trash2, Edit2, Plus, Upload, FileSpreadsheet, AlertCircle, Loader, Server, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { BASE_PATH } from "@/lib/utils";
import ConfirmModal from "@/components/ConfirmModal";
import * as XLSX from "xlsx";

interface Department { id: string; name: string; code: string; }
interface Category { id: string; name: string; type: string; }
interface ADConfig {
  host: string; port: number; baseDN: string; bindDN: string;
  bindPassword: string; userSearchBase: string; userFilter: string; useTLS: boolean;
}

const DEFAULT_AD: ADConfig = {
  host: "", port: 389, baseDN: "", bindDN: "",
  bindPassword: "", userSearchBase: "", userFilter: "", useTLS: false,
};

type Tab = "ad" | "departments" | "categories";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("ad");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Departments
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deleteDeptId, setDeleteDeptId] = useState<string | null>(null);
  const [deptForm, setDeptForm] = useState({ name: "", code: "" });
  const [deptError, setDeptError] = useState("");
  const [deptSaving, setDeptSaving] = useState(false);
  const [importRows, setImportRows] = useState<{ name: string; code: string; valid: boolean; reason?: string }[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({ name: "", type: "hardware" });
  const [catError, setCatError] = useState("");
  const [catSaving, setCatSaving] = useState(false);

  // AD Config
  const [adConfig, setAdConfig] = useState<ADConfig>(DEFAULT_AD);
  const [adSaving, setAdSaving] = useState(false);
  const [adSaved, setAdSaved] = useState(false);
  const [adTesting, setAdTesting] = useState(false);
  const [adTestResult, setAdTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${BASE_PATH}/api/auth/me`),
      fetch(`${BASE_PATH}/api/departments`),
      fetch(`${BASE_PATH}/api/categories`),
      fetch(`${BASE_PATH}/api/config`),
    ]).then(async ([meRes, dRes, cRes, adRes]) => {
      if (meRes.ok) { const me = await meRes.json(); setIsAdmin(me?.role === "admin"); }
      else setIsAdmin(false);
      if (dRes.ok) setDepartments(await dRes.json());
      if (cRes.ok) setCategories(await cRes.json());
      if (adRes.ok) { const d = await adRes.json(); if (d) setAdConfig({ ...DEFAULT_AD, ...d }); }
    });
  }, []);

  async function fetchDepartments() {
    const res = await fetch(`${BASE_PATH}/api/departments`);
    if (res.ok) setDepartments(await res.json());
  }

  async function fetchCategories() {
    const res = await fetch(`${BASE_PATH}/api/categories`);
    if (res.ok) setCategories(await res.json());
  }

  // --- AD ---
  async function saveADConfig() {
    setAdSaving(true); setAdSaved(false);
    const res = await fetch(`${BASE_PATH}/api/config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adConfig),
    });
    setAdSaving(false);
    if (res.ok) { setAdSaved(true); setTimeout(() => setAdSaved(false), 3000); }
  }

  async function testADConnection() {
    setAdTesting(true); setAdTestResult(null);
    const res = await fetch(`${BASE_PATH}/api/ad/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adConfig),
    });
    const data = await res.json();
    setAdTestResult(res.ok ? data : { ok: false, message: data.message ?? data.error });
    setAdTesting(false);
  }

  // --- Categories ---
  async function saveCategory() {
    if (!catForm.name) { setCatError("Name is required."); return; }
    setCatSaving(true); setCatError("");
    const url = editCat ? `${BASE_PATH}/api/categories/${editCat.id}` : `${BASE_PATH}/api/categories`;
    const res = await fetch(url, {
      method: editCat ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(catForm),
    });
    setCatSaving(false);
    if (res.ok) { setCatForm({ name: "", type: "hardware" }); setEditCat(null); fetchCategories(); }
    else { const d = await res.json(); setCatError(d.error ?? "Failed to save category."); }
  }

  async function deleteCategory() {
    if (!deleteCatId) return;
    const res = await fetch(`${BASE_PATH}/api/categories/${deleteCatId}`, { method: "DELETE" });
    setDeleteCatId(null);
    if (res.ok) fetchCategories();
    else { const d = await res.json(); alert(d.error ?? "Failed to delete category."); }
  }

  // --- Departments ---
  async function addDepartment() {
    if (!deptForm.name || !deptForm.code) { setDeptError("Name and code are required."); return; }
    setDeptSaving(true); setDeptError("");
    const res = await fetch(`${BASE_PATH}/api/departments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(deptForm),
    });
    setDeptSaving(false);
    if (res.ok) { setDeptForm({ name: "", code: "" }); fetchDepartments(); }
    else { const d = await res.json(); setDeptError(d.error ?? "Failed to add department."); }
  }

  async function deleteDepartment() {
    if (!deleteDeptId) return;
    const res = await fetch(`${BASE_PATH}/api/departments/${deleteDeptId}`, { method: "DELETE" });
    setDeleteDeptId(null);
    if (res.ok) fetchDepartments();
    else { const d = await res.json(); alert(d.error ?? "Failed to delete department."); }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const raw: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
      const parsed = raw.map((row) => {
        const get = (...candidates: string[]) => {
          for (const c of candidates) {
            const key = Object.keys(row).find((k) => k.toLowerCase().trim() === c);
            if (key && row[key]) return String(row[key]).trim();
          }
          return "";
        };
        const name = get("name", "department name", "department", "dept name", "dept");
        const code = get("code", "dept code", "department code", "short code").toUpperCase();
        let valid = true; let reason = "";
        if (!name) { valid = false; reason = "Missing name"; }
        else if (!code) { valid = false; reason = "Missing code"; }
        else if (code.length > 20) { valid = false; reason = "Code too long (max 20)"; }
        return { name, code, valid, reason };
      });
      setImportRows(parsed); setImportResult(null); setShowImportModal(true);
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  }

  async function handleBulkImport() {
    const valid = importRows.filter((r) => r.valid);
    if (!valid.length) return;
    setImporting(true);
    const res = await fetch(`${BASE_PATH}/api/departments/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(valid.map(({ name, code }) => ({ name, code }))),
    });
    const data = await res.json();
    setImportResult(data); setImporting(false); fetchDepartments();
  }

  if (isAdmin === null) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-slate-500 font-medium mb-1">Access Restricted</div>
          <div className="text-sm text-slate-400">You do not have permission to view this page.</div>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "ad", label: "AD Configuration", icon: <Server size={15} /> },
    { key: "departments", label: "Departments", icon: <Building2 size={15} /> },
    { key: "categories", label: "Asset Categories", icon: <Tag size={15} /> },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">System configuration and reference data</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors"
            style={{
              borderBottom: activeTab === t.key ? "2px solid #3b82f6" : "2px solid transparent",
              color: activeTab === t.key ? "#3b82f6" : "#64748b",
              background: "none",
              marginBottom: -1,
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* AD Configuration tab */}
      {activeTab === "ad" && (
        <div className="card">
          <h3 className="font-semibold text-sm text-slate-700 mb-1 flex items-center gap-2">
            <Server size={16} color="#6366f1" /> Active Directory Configuration
          </h3>
          <p className="text-xs text-slate-400 mb-5">
            Configure your on-premise AD to sync the employee directory.
          </p>

          <div className="form-grid mb-4">
            <div>
              <label className="form-label">Server Host *</label>
              <input className="form-input" placeholder="192.168.0.10 or dc.phn.local"
                value={adConfig.host} onChange={(e) => setAdConfig((c) => ({ ...c, host: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Port</label>
              <input type="number" className="form-input" value={adConfig.port}
                onChange={(e) => setAdConfig((c) => ({ ...c, port: Number(e.target.value) }))} />
            </div>
            <div className="form-grid-full">
              <label className="form-label">Base DN *</label>
              <input className="form-input" placeholder="DC=phn,DC=local"
                value={adConfig.baseDN} onChange={(e) => setAdConfig((c) => ({ ...c, baseDN: e.target.value }))} />
            </div>
            <div className="form-grid-full">
              <label className="form-label">Bind DN (Service Account) *</label>
              <input className="form-input" placeholder="CN=svc-assets,OU=Service Accounts,DC=phn,DC=local"
                value={adConfig.bindDN} onChange={(e) => setAdConfig((c) => ({ ...c, bindDN: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Bind Password *</label>
              <input type="password" className="form-input" placeholder="Service account password"
                value={adConfig.bindPassword} onChange={(e) => setAdConfig((c) => ({ ...c, bindPassword: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">User Search Base <span className="text-slate-400">(optional)</span></label>
              <input className="form-input" placeholder="OU=Staff,DC=phn,DC=local"
                value={adConfig.userSearchBase} onChange={(e) => setAdConfig((c) => ({ ...c, userSearchBase: e.target.value }))} />
            </div>
            <div className="form-grid-full">
              <label className="form-label">User Filter <span className="text-slate-400">(optional — leave blank for default)</span></label>
              <input className="form-input" placeholder="(&(objectClass=user)(department=IT))"
                value={adConfig.userFilter} onChange={(e) => setAdConfig((c) => ({ ...c, userFilter: e.target.value }))} />
            </div>
            <div className="form-grid-full">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={adConfig.useTLS}
                  onChange={(e) => setAdConfig((c) => ({ ...c, useTLS: e.target.checked, port: e.target.checked ? 636 : 389 }))} />
                <span className="text-sm text-slate-600">Use LDAPS (TLS) — port 636</span>
              </label>
            </div>
          </div>

          {adTestResult && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg mb-4 text-sm ${adTestResult.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
              style={{ border: `1px solid ${adTestResult.ok ? "#bbf7d0" : "#fecaca"}` }}
            >
              {adTestResult.ok ? <CheckCircle size={16} /> : <XCircle size={16} />}
              {adTestResult.message}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button className="btn btn-secondary" onClick={testADConnection} disabled={adTesting}>
              {adTesting ? <Loader size={14} className="animate-spin" /> : <Server size={14} />}
              {adTesting ? "Testing..." : "Test Connection"}
            </button>
            <button className="btn btn-primary" onClick={saveADConfig} disabled={adSaving}>
              {adSaving ? "Saving..." : adSaved ? "Saved ✓" : "Save Configuration"}
            </button>
          </div>
        </div>
      )}

      {/* Departments tab */}
      {activeTab === "departments" && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
              <Building2 size={16} color="#3b82f6" /> Departments ({departments.length})
            </h3>
            <button className="btn btn-secondary" style={{ fontSize: 12, padding: "4px 10px" }}
              onClick={() => fileInputRef.current?.click()}>
              <Upload size={13} /> Import Excel / CSV
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            <input className="form-input" placeholder="Department name"
              value={deptForm.name}
              onChange={(e) => setDeptForm((f) => ({ ...f, name: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && addDepartment()} />
            <input className="form-input" placeholder="Code" style={{ width: 80 }} maxLength={20}
              value={deptForm.code}
              onChange={(e) => setDeptForm((f) => ({ ...f, code: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && addDepartment()} />
            <button className="btn btn-primary" onClick={addDepartment} disabled={deptSaving} style={{ whiteSpace: "nowrap" }}>
              <Plus size={14} /> Add
            </button>
          </div>
          {deptError && <p className="text-xs text-red-600 mb-3">{deptError}</p>}

          <div className="space-y-2">
            {departments.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-2 rounded"
                style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div>
                  <div className="font-medium text-sm">{d.name}</div>
                  <div className="text-xs text-slate-400">Code: {d.code}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge bg-blue-50 text-blue-700">{d.code}</span>
                  <button className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                    title="Delete department" onClick={() => setDeleteDeptId(d.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories tab */}
      {activeTab === "categories" && (
        <div className="card">
          <h3 className="font-semibold text-sm text-slate-700 mb-4 flex items-center gap-2">
            <Tag size={16} color="#10b981" /> Asset Categories ({categories.length})
          </h3>

          <div className="flex gap-2 mb-2">
            <input className="form-input" placeholder="Category name"
              value={catForm.name}
              onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && saveCategory()} />
            <select className="form-input" style={{ width: 130 }}
              value={catForm.type} onChange={(e) => setCatForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="hardware">Hardware</option>
              <option value="software">Software</option>
              <option value="peripheral">Peripheral</option>
              <option value="network">Network</option>
              <option value="mobile">Mobile</option>
            </select>
            <button className="btn btn-primary" onClick={saveCategory} disabled={catSaving} style={{ whiteSpace: "nowrap" }}>
              <Plus size={14} /> {editCat ? "Update" : "Add"}
            </button>
            {editCat && (
              <button className="btn btn-secondary"
                onClick={() => { setEditCat(null); setCatForm({ name: "", type: "hardware" }); setCatError(""); }}>
                <X size={14} />
              </button>
            )}
          </div>
          {catError && <p className="text-xs text-red-600 mb-3">{catError}</p>}

          <div className="space-y-2">
            {categories.map((c) => (
              <div key={c.id}
                className={`flex items-center justify-between p-2 rounded ${editCat?.id === c.id ? "ring-2 ring-blue-300" : ""}`}
                style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div>
                  <div className="font-medium text-sm">{c.name}</div>
                  <span className="badge bg-green-50 text-green-700 capitalize mt-0.5">{c.type}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600"
                    title="Edit"
                    onClick={() => { setEditCat(c); setCatForm({ name: c.name, type: c.type }); setCatError(""); }}>
                    <Edit2 size={13} />
                  </button>
                  <button className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                    title="Delete" onClick={() => setDeleteCatId(c.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm modals */}
      {deleteDeptId && (
        <ConfirmModal title="Delete Department"
          message="Are you sure you want to delete this department? This will fail if employees or assets are still assigned to it."
          confirmLabel="Delete" variant="danger"
          onConfirm={deleteDepartment} onCancel={() => setDeleteDeptId(null)} />
      )}
      {deleteCatId && (
        <ConfirmModal title="Delete Category"
          message="Are you sure you want to delete this category? This will fail if assets are still using it."
          confirmLabel="Delete" variant="danger"
          onConfirm={deleteCategory} onCancel={() => setDeleteCatId(null)} />
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileSelect} />

      {/* Import Preview Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowImportModal(false)}>
          <div className="modal modal-shell" style={{ maxWidth: 620, maxHeight: "80vh" }}>
            <div className="modal-pinned-header">
              <h2 className="modal-title flex items-center gap-2">
                <FileSpreadsheet size={18} /> Import Departments
              </h2>
              <button className="p-1 rounded hover:bg-slate-100" onClick={() => setShowImportModal(false)}>
                <X size={18} />
              </button>
            </div>

            {importResult ? (
              <div className="modal-scroll-body">
                <div className="p-4 rounded-lg bg-green-50 text-green-800 text-sm mb-3" style={{ border: "1px solid #bbf7d0" }}>
                  <div className="font-semibold mb-1">Import complete</div>
                  <div>{importResult.imported} department{importResult.imported !== 1 ? "s" : ""} imported · {importResult.skipped} skipped</div>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="space-y-1">
                    {importResult.errors.map((e, i) => (
                      <div key={i} className="text-xs text-amber-700 flex items-center gap-1">
                        <AlertCircle size={12} /> {e}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-end mt-4">
                  <button className="btn btn-primary" onClick={() => setShowImportModal(false)}>Done</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col" style={{ flex: 1, minHeight: 0, padding: "1.25rem 1.5rem", overflow: "hidden" }}>
                  <div className="text-sm text-slate-500 mb-3">
                    {importRows.length} row{importRows.length !== 1 ? "s" : ""} detected ·{" "}
                    <span className="text-green-600">{importRows.filter((r) => r.valid).length} valid</span>
                    {importRows.some((r) => !r.valid) && (
                      <span className="text-red-500"> · {importRows.filter((r) => !r.valid).length} invalid</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mb-3">
                    Expected columns: <code className="bg-slate-100 px-1 rounded">name</code> and <code className="bg-slate-100 px-1 rounded">code</code> (row 1 should be headers)
                  </div>
                  <div className="overflow-auto flex-1 rounded-lg scroll-light" style={{ border: "1px solid #e2e8f0" }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Department Name</th>
                          <th>Code</th>
                          <th style={{ width: 120 }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importRows.map((row, i) => (
                          <tr key={i} style={{ opacity: row.valid ? 1 : 0.6 }}>
                            <td className="text-sm">{row.name || <span className="text-slate-400 italic">empty</span>}</td>
                            <td className="font-mono text-sm">{row.code || <span className="text-slate-400 italic">empty</span>}</td>
                            <td>
                              {row.valid
                                ? <span className="badge bg-green-100 text-green-700">Ready</span>
                                : <span className="badge bg-red-100 text-red-600" title={row.reason}>{row.reason}</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="modal-pinned-footer">
                  <button className="btn btn-secondary" onClick={() => setShowImportModal(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleBulkImport}
                    disabled={importing || importRows.filter((r) => r.valid).length === 0}>
                    {importing
                      ? <><Loader size={14} className="animate-spin" /> Importing...</>
                      : <><Upload size={14} /> Import {importRows.filter((r) => r.valid).length} Department{importRows.filter((r) => r.valid).length !== 1 ? "s" : ""}</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
