"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Filter, Edit2, Trash2, Eye, Trash, Upload, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { formatCurrency, formatDate, STATUS_COLORS, ASSET_STATUSES, ASSET_OWNERSHIP_COLORS, BASE_PATH } from "@/lib/utils";
import AssetModal from "@/components/AssetModal";
import AssetDetailModal from "@/components/AssetDetailModal";
import AssetImportModal from "@/components/AssetImportModal";
import ConfirmModal from "@/components/ConfirmModal";

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

interface Employee {
  id: string;
  name: string;
  jobTitle: string;
  email: string;
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
  categoryId: string;
  departmentId: string;
  category: Category;
  department: Department;
  assignments: Array<{
    id: string;
    employee: Employee;
    assignedDate: string;
    returnedDate: string | null;
  }>;
}

type SortKey =
  | "assetTag"
  | "name"
  | "brand"
  | "category"
  | "status"
  | "assetStatus"
  | "officeLicense"
  | "assignedTo"
  | "location"
  | "purchaseDate"
  | "warrantyExpiry";

type SortDir = "asc" | "desc";

const PAGE_SIZE = 50;

function getAssignee(asset: Asset): string {
  return asset.assignments.find((a) => !a.returnedDate)?.employee.name ?? "";
}

function getSortValue(asset: Asset, key: SortKey): string | number {
  switch (key) {
    case "assetTag":      return asset.assetTag ?? "";
    case "name":          return asset.name ?? "";
    case "brand":         return asset.brand ?? "";
    case "category":      return asset.category.name ?? "";
    case "status":        return asset.status ?? "";
    case "assetStatus":   return asset.assetStatus ?? "";
    case "officeLicense": return asset.officeLicense ?? "";
    case "assignedTo":    return getAssignee(asset);
    case "location":      return asset.location ?? "";
    case "purchaseDate":  return asset.purchaseDate ?? "";
    case "warrantyExpiry":return asset.warrantyExpiry ?? "";
  }
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showModal, setShowModal] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);
  const [viewAsset, setViewAsset] = useState<Asset | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  async function fetchAssets() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterStatus) params.set("status", filterStatus);
    if (filterCategory) params.set("categoryId", filterCategory);

    const res = await fetch(`${BASE_PATH}/api/assets?${params}`);
    if (res.ok) {
      setAssets(await res.json());
    }
    setLoading(false);
  }

  async function fetchMeta() {
    const [catRes, deptRes] = await Promise.all([
      fetch(`${BASE_PATH}/api/categories`),
      fetch(`${BASE_PATH}/api/departments`),
    ]);
    if (catRes.ok) setCategories(await catRes.json());
    if (deptRes.ok) setDepartments(await deptRes.json());
  }

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    setPage(1);
    fetchAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterStatus, filterCategory]);

  async function handleDelete() {
    if (!deleteId) return;
    const res = await fetch(`${BASE_PATH}/api/assets/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    if (res.ok) fetchAssets();
  }

  async function handleBulkDelete() {
    await Promise.all([...selected].map((id) => fetch(`${BASE_PATH}/api/assets/${id}`, { method: "DELETE" })));
    setSelected(new Set());
    setShowBulkConfirm(false);
    fetchAssets();
  }

  function toggleSelect(id: string) {
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  function toggleSelectAll(checked: boolean) {
    setSelected(checked ? new Set(pageAssets.map((a) => a.id)) : new Set());
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  // Sort
  const sortedAssets = sortKey
    ? [...assets].sort((a, b) => {
        const va = getSortValue(a, sortKey);
        const vb = getSortValue(b, sortKey);
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      })
    : assets;

  const totalPages = Math.max(1, Math.ceil(sortedAssets.length / PAGE_SIZE));
  const pageAssets = sortedAssets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function SortHeader({ label, colKey, style }: { label: string; colKey: SortKey; style?: React.CSSProperties }) {
    const active = sortKey === colKey;
    return (
      <th
        style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap", ...style }}
        onClick={() => handleSort(colKey)}
      >
        <span className="flex items-center gap-1">
          {label}
          {active ? (
            sortDir === "asc" ? <ChevronUp size={13} className="text-blue-500" /> : <ChevronDown size={13} className="text-blue-500" />
          ) : (
            <ChevronsUpDown size={13} className="text-slate-300" />
          )}
        </span>
      </th>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="page-header">
        <div>
          <h1 className="page-title">Assets</h1>
          <p className="page-subtitle">
            {assets.length === 0
              ? "No assets found"
              : assets.length <= PAGE_SIZE
              ? `${assets.length} asset${assets.length !== 1 ? "s" : ""}`
              : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, assets.length)} of ${assets.length} assets`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-secondary"
            onClick={() => setShowImportModal(true)}
          >
            <Upload size={15} /> Import
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditAsset(null);
              setShowModal(true);
            }}
          >
            <Plus size={16} /> Add Asset
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input" style={{ flex: 1, maxWidth: 340 }}>
          <Search size={15} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search by name, tag, serial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1 text-slate-500">
          <Filter size={15} />
        </div>

        <select
          className="form-input"
          style={{ width: "auto" }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          {ASSET_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          className="form-input"
          style={{ width: "auto" }}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {(filterStatus || filterCategory || search) && (
          <button
            className="btn btn-secondary text-xs"
            onClick={() => {
              setSearch("");
              setFilterStatus("");
              setFilterCategory("");
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2 mb-2 rounded-lg bg-red-50 text-red-700 text-sm" style={{ border: "1px solid #fecaca" }}>
          <span>{selected.size} item{selected.size !== 1 ? "s" : ""} selected</span>
          <button className="btn btn-danger flex items-center gap-1" onClick={() => setShowBulkConfirm(true)}>
            <Trash size={14} /> Delete Selected
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflowX: "scroll", overflowY: "auto", flex: 1, minHeight: 0 }}>
        {loading ? (
          <div className="empty-state text-slate-400">Loading assets...</div>
        ) : assets.length === 0 ? (
          <div className="empty-state">
            <div className="text-slate-500 mb-2">No assets found</div>
            <button
              className="btn btn-primary mx-auto"
              onClick={() => {
                setEditAsset(null);
                setShowModal(true);
              }}
            >
              <Plus size={15} /> Add your first asset
            </button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox" checked={pageAssets.length > 0 && pageAssets.every((a) => selected.has(a.id))} onChange={(e) => toggleSelectAll(e.target.checked)} />
                </th>
                <th style={{ width: 48 }}>No</th>
                <SortHeader label="Asset Tag"        colKey="assetTag" />
                <SortHeader label="Name"             colKey="name" />
                <SortHeader label="Brand"            colKey="brand" />
                <SortHeader label="Category"         colKey="category" />
                <SortHeader label="Condition"        colKey="status" />
                <SortHeader label="Asset Status"     colKey="assetStatus" />
                <SortHeader label="Office License"   colKey="officeLicense" />
                <SortHeader label="Assigned To"      colKey="assignedTo" />
                <SortHeader label="Purchase Date"      colKey="purchaseDate" />
                <SortHeader label="Warranty"         colKey="warrantyExpiry" />
                <th className="sticky-col" style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageAssets.map((asset, idx) => (
                <tr key={asset.id}>
                  <td>
                    <input type="checkbox" checked={selected.has(asset.id)} onChange={() => toggleSelect(asset.id)} />
                  </td>
                  <td className="text-xs text-slate-400 text-center">
                    {(page - 1) * PAGE_SIZE + idx + 1}
                  </td>
                  <td>
                    <span className="font-mono text-xs text-blue-600 font-medium">
                      {asset.assetTag}
                    </span>
                  </td>
                  <td>
                    <div className="font-medium text-sm">{asset.name}</div>
                    {asset.model && (
                      <div className="text-xs text-slate-400">{asset.model}</div>
                    )}
                  </td>
                  <td className="text-sm">{asset.brand ?? "—"}</td>
                  <td>
                    <span className="text-sm">{asset.category.name}</span>
                    <div className="text-xs text-slate-400 capitalize">
                      {asset.category.type}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge ${STATUS_COLORS[asset.status] ?? "bg-gray-100 text-gray-700"}`}
                    >
                      {asset.status}
                    </span>
                  </td>
                  <td>
                    {asset.assetStatus ? (
                      <span className={`badge ${ASSET_OWNERSHIP_COLORS[asset.assetStatus] ?? "bg-gray-100 text-gray-700"}`}>
                        {asset.assetStatus}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="text-sm">{asset.officeLicense ?? "—"}</td>
                  <td className="text-sm">
                    {getAssignee(asset) || (
                      <span className="text-slate-400">Unassigned</span>
                    )}
                  </td>
                  <td className="text-sm text-slate-600">
                    {formatDate(asset.purchaseDate)}
                  </td>
                  <td className="text-sm text-slate-600">
                    {formatDate(asset.warrantyExpiry)}
                  </td>
                  <td className="sticky-col">
                    <div className="flex items-center gap-1">
                      <button
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                        title="View details"
                        onClick={() => setViewAsset(asset)}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600"
                        title="Edit"
                        onClick={() => {
                          setEditAsset(asset);
                          setShowModal(true);
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="p-1.5 rounded hover:bg-red-50 text-slate-500 hover:text-red-600"
                        title="Delete"
                        onClick={() => setDeleteId(asset.id)}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              className="btn btn-secondary"
              style={{ padding: "4px 10px" }}
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-slate-400">…</span>
                ) : (
                  <button
                    key={p}
                    className={`btn ${p === page ? "btn-primary" : "btn-secondary"}`}
                    style={{ padding: "4px 10px", minWidth: 36 }}
                    onClick={() => setPage(p as number)}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              className="btn btn-secondary"
              style={{ padding: "4px 10px" }}
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showImportModal && (
        <AssetImportModal
          onClose={() => setShowImportModal(false)}
          onImported={() => { setShowImportModal(false); fetchAssets(); }}
        />
      )}

      {showModal && (
        <AssetModal
          asset={editAsset}
          categories={categories}
          departments={departments}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            fetchAssets();
          }}
        />
      )}

      {deleteId && (
        <ConfirmModal
          title="Delete Asset"
          message="Are you sure you want to delete this asset? This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {showBulkConfirm && (
        <ConfirmModal
          title="Delete Selected Assets"
          message={`Are you sure you want to delete ${selected.size} asset${selected.size !== 1 ? "s" : ""}? This action cannot be undone.`}
          confirmLabel={`Delete ${selected.size}`}
          variant="danger"
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkConfirm(false)}
        />
      )}

      {viewAsset && (
        <AssetDetailModal
          asset={viewAsset}
          onClose={() => setViewAsset(null)}
          onEdit={() => {
            setEditAsset(viewAsset);
            setViewAsset(null);
            setShowModal(true);
          }}
        />
      )}
    </div>
  );
}
