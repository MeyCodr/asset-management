"use client";

import { useEffect, useState } from "react";
import { Plus, Landmark, Edit2, Trash2, Filter, Search, Upload, Download, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import ExcelJS from "exceljs";
import { BASE_PATH, formatDate, formatCurrency, FIN_ASSET_CATEGORIES, FIN_ASSET_TYPES, ASSET_STATUSES, FIN_ASSET_PLANTS } from "@/lib/utils";
import FinAssetModal, { type FinAsset } from "@/components/FinAssetModal";
import FinAssetImportModal from "@/components/FinAssetImportModal";
import ConfirmModal from "@/components/ConfirmModal";

interface Department {
  id: string;
  name: string;
}

type SortKey =
  | "finAssetTag" | "assetCategory" | "itAssetId" | "assetType" | "assetStatus"
  | "serialNumberLic" | "brand" | "model" | "os" | "qty" | "department" | "plant"
  | "approvedFinCapexNo" | "dateOfPurchase" | "purchaseOrder" | "totalAmountRm" | "supplier";

type SortDir = "asc" | "desc";

const SEARCH_FIELDS: (keyof FinAsset)[] = [
  "finAssetTag", "assetCategory", "itAssetId", "assetType", "assetStatus",
  "serialNumberLic", "brand", "model", "os", "department", "plant",
  "approvedFinCapexNo", "purchaseOrder", "supplier",
];

function getSortValue(f: FinAsset, key: SortKey): string | number {
  switch (key) {
    case "qty":
    case "totalAmountRm":
      return f[key] ?? -Infinity;
    default:
      return f[key] ?? "";
  }
}

export default function FinAssetsPage() {
  const [finAssets, setFinAssets] = useState<FinAsset[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editFinAsset, setEditFinAsset] = useState<FinAsset | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterPlant, setFilterPlant] = useState("");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  async function fetchFinAssets() {
    try {
      const res = await fetch(`${BASE_PATH}/api/fin-assets`);
      if (res.ok) setFinAssets(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFinAssets();
    fetch(`${BASE_PATH}/api/departments`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setDepartments)
      .catch(() => null);
  }, []);

  function handleSaved(finAsset: FinAsset) {
    setFinAssets((prev) => {
      const exists = prev.some((f) => f.id === finAsset.id);
      return exists ? prev.map((f) => (f.id === finAsset.id ? finAsset : f)) : [finAsset, ...prev];
    });
    setShowModal(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    const res = await fetch(`${BASE_PATH}/api/fin-assets/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    if (res.ok) setFinAssets((prev) => prev.filter((f) => f.id !== deleteId));
  }

  async function handleExport() {
    const headers = [
      "FIN Asset TAG", "Asset Category", "IT Asset ID", "Asset Type", "Asset Status",
      "Serial Number/Lic", "Brand", "Model", "OS", "Qty", "Department", "Plant",
      "Approved FIN CAPEX No", "Date of Purchase", "Purchase Order", "Total Amount (RM)", "Supplier",
    ];
    const rows = sortedFinAssets.map((f) => [
      f.finAssetTag, f.assetCategory, f.itAssetId ?? "", f.assetType ?? "", f.assetStatus ?? "",
      f.serialNumberLic ?? "", f.brand ?? "", f.model ?? "", f.os ?? "", f.qty ?? "", f.department ?? "", f.plant ?? "",
      f.approvedFinCapexNo ?? "", f.dateOfPurchase ? f.dateOfPurchase.split("T")[0] : "", f.purchaseOrder ?? "",
      f.totalAmountRm ?? "", f.supplier ?? "",
    ]);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Financial Assets");
    worksheet.addTable({
      name: "FinAssetsTable",
      ref: "A1",
      headerRow: true,
      style: { theme: "TableStyleMedium9", showRowStripes: true },
      columns: headers.map((h) => ({ name: h, filterButton: true })),
      rows,
    });
    worksheet.columns.forEach((col) => { col.width = 18; });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finassets_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const brandOptions = Array.from(new Set(finAssets.map((f) => f.brand).filter((b): b is string => !!b))).sort();

  const filteredFinAssets = finAssets.filter((f) => {
    if (filterCategory && f.assetCategory !== filterCategory) return false;
    if (filterType && f.assetType !== filterType) return false;
    if (filterStatus && f.assetStatus !== filterStatus) return false;
    if (filterBrand && f.brand !== filterBrand) return false;
    if (filterPlant && f.plant !== filterPlant) return false;
    if (search) {
      const q = search.toLowerCase();
      const matches = SEARCH_FIELDS.some((field) => (f[field] as string | null)?.toLowerCase().includes(q));
      if (!matches) return false;
    }
    return true;
  });

  const sortedFinAssets = sortKey
    ? [...filteredFinAssets].sort((a, b) => {
        const va = getSortValue(a, sortKey);
        const vb = getSortValue(b, sortKey);
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      })
    : filteredFinAssets;

  function SortHeader({ label, colKey }: { label: string; colKey: SortKey }) {
    const active = sortKey === colKey;
    return (
      <th style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }} onClick={() => handleSort(colKey)}>
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

  const hasFilters = search || filterCategory || filterType || filterStatus || filterBrand || filterPlant;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Finance Asset</h1>
          <p className="page-subtitle">
            {sortedFinAssets.length === 0
              ? "No financial assets found"
              : `${sortedFinAssets.length} financial asset${sortedFinAssets.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-secondary"
            onClick={handleExport}
            disabled={sortedFinAssets.length === 0}
          >
            <Download size={15} /> Export
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowImportModal(true)}
          >
            <Upload size={15} /> Import
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditFinAsset(null);
              setShowModal(true);
            }}
          >
            <Plus size={16} /> Add Financial Asset
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input" style={{ flex: 1, maxWidth: 320 }}>
          <Search size={15} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search by tag, category, brand, supplier..."
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
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {FIN_ASSET_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          className="form-input"
          style={{ width: "auto" }}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All Types</option>
          {FIN_ASSET_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

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
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value)}
        >
          <option value="">All Brands</option>
          {brandOptions.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        <select
          className="form-input"
          style={{ width: "auto" }}
          value={filterPlant}
          onChange={(e) => setFilterPlant(e.target.value)}
        >
          <option value="">All Plants</option>
          {FIN_ASSET_PLANTS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            className="btn btn-secondary text-xs"
            onClick={() => {
              setSearch("");
              setFilterCategory("");
              setFilterType("");
              setFilterStatus("");
              setFilterBrand("");
              setFilterPlant("");
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="card scroll-light" style={{ padding: 0, overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <SortHeader label="FIN Asset TAG" colKey="finAssetTag" />
              <SortHeader label="Asset Category" colKey="assetCategory" />
              <SortHeader label="IT Asset ID" colKey="itAssetId" />
              <SortHeader label="Asset Type" colKey="assetType" />
              <SortHeader label="Asset Status" colKey="assetStatus" />
              <SortHeader label="Serial Number/Lic" colKey="serialNumberLic" />
              <SortHeader label="Brand" colKey="brand" />
              <SortHeader label="Model" colKey="model" />
              <SortHeader label="OS" colKey="os" />
              <SortHeader label="Qty" colKey="qty" />
              <SortHeader label="Department" colKey="department" />
              <SortHeader label="Plant" colKey="plant" />
              <SortHeader label="Approved FIN CAPEX No" colKey="approvedFinCapexNo" />
              <SortHeader label="Date of Purchase" colKey="dateOfPurchase" />
              <SortHeader label="Purchase Order" colKey="purchaseOrder" />
              <SortHeader label="Total Amount (RM)" colKey="totalAmountRm" />
              <SortHeader label="Supplier" colKey="supplier" />
              <th className="sticky-col" style={{ width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={17} className="text-center text-slate-400 py-8">
                  Loading financial assets...
                </td>
                <td className="sticky-col" />
              </tr>
            ) : sortedFinAssets.length === 0 ? (
              <tr>
                <td colSpan={17}>
                  <div className="empty-state">
                    <Landmark size={48} className="mx-auto mb-3" style={{ color: "#d1d5db" }} />
                    <div className="text-lg font-medium text-slate-700 mb-1">
                      No financial assets found
                    </div>
                    <div className="text-sm text-slate-500">
                      {finAssets.length === 0
                        ? "IT financial asset records will appear here once added."
                        : "Try adjusting or clearing the filters."}
                    </div>
                  </div>
                </td>
                <td className="sticky-col" />
              </tr>
            ) : (
              sortedFinAssets.map((f) => (
                <tr key={f.id}>
                  <td className="text-sm">{f.finAssetTag}</td>
                  <td className="text-sm">{f.assetCategory}</td>
                  <td className="text-sm">{f.itAssetId ?? "—"}</td>
                  <td className="text-sm">{f.assetType ?? "—"}</td>
                  <td className="text-sm">{f.assetStatus ?? "—"}</td>
                  <td className="text-sm">{f.serialNumberLic ?? "—"}</td>
                  <td className="text-sm">{f.brand ?? "—"}</td>
                  <td className="text-sm">{f.model ?? "—"}</td>
                  <td className="text-sm">{f.os ?? "—"}</td>
                  <td className="text-sm">{f.qty ?? "—"}</td>
                  <td className="text-sm">{f.department ?? "—"}</td>
                  <td className="text-sm">{f.plant ?? "—"}</td>
                  <td className="text-sm">{f.approvedFinCapexNo ?? "—"}</td>
                  <td className="text-sm">{formatDate(f.dateOfPurchase)}</td>
                  <td className="text-sm">{f.purchaseOrder ?? "—"}</td>
                  <td className="text-sm">{formatCurrency(f.totalAmountRm)}</td>
                  <td className="text-sm">{f.supplier ?? "—"}</td>
                  <td className="sticky-col">
                    <div className="flex items-center gap-1">
                      <button
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600"
                        title="Edit"
                        onClick={() => {
                          setEditFinAsset(f);
                          setShowModal(true);
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="p-1.5 rounded hover:bg-red-50 text-slate-500 hover:text-red-600"
                        title="Delete"
                        onClick={() => setDeleteId(f.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showImportModal && (
        <FinAssetImportModal
          onClose={() => setShowImportModal(false)}
          onImported={() => { setShowImportModal(false); fetchFinAssets(); }}
        />
      )}

      {showModal && (
        <FinAssetModal
          finAsset={editFinAsset}
          departments={departments}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}

      {deleteId && (
        <ConfirmModal
          title="Delete Financial Asset"
          message="Are you sure you want to delete this financial asset? This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
