"use client";

import { useEffect, useState } from "react";
import { Plus, Receipt, Eye, Edit2, Trash2, Filter, Upload, Download, Search, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import ExcelJS from "exceljs";
import { BASE_PATH, formatDate, EXPENSE_CATEGORIES, EXPENSE_NATURES } from "@/lib/utils";
import ExpenseModal, { type Expense } from "@/components/ExpenseModal";
import ExpenseDetailModal from "@/components/ExpenseDetailModal";
import ExpenseImportModal from "@/components/ExpenseImportModal";
import ConfirmModal from "@/components/ConfirmModal";

function formatNumber(n: number | null): string {
  return n === null ? "—" : n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPercent(n: number | null): string {
  return n === null ? "—" : `${Math.round(n * 100)}%`;
}

type SortKey =
  | "nature" | "category" | "subCategory" | "amp" | "costCtr" | "supplier"
  | "dateEntry" | "phnRefLetter" | "agreementPo" | "typeOfRenewal"
  | "quotationNo" | "invoiceNo" | "doNo" | "services" | "description"
  | "licenseProductId" | "qty" | "unit" | "unitPrice" | "subTotalRm" | "sstRm"
  | "sstTotalRm" | "grandTotalRm" | "effectiveDate";

type SortDir = "asc" | "desc";

const PAGE_SIZE = 50;

const SEARCH_FIELDS: (keyof Expense)[] = [
  "supplier", "services", "description", "category", "subCategory",
  "invoiceNo", "quotationNo", "doNo", "phnRefLetter", "agreementPo", "licenseProductId",
];

function getSortValue(e: Expense, key: SortKey): string | number {
  switch (key) {
    case "qty":
    case "unitPrice":
    case "subTotalRm":
    case "sstRm":
    case "sstTotalRm":
    case "grandTotalRm":
      return e[key] ?? -Infinity;
    default:
      return e[key] ?? "";
  }
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [viewExpense, setViewExpense] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterNature, setFilterNature] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubCategory, setFilterSubCategory] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  async function fetchExpenses() {
    try {
      const res = await fetch(`${BASE_PATH}/api/expenses`);
      if (res.ok) setExpenses(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, filterNature, filterCategory, filterSubCategory]);

  function handleSaved(expense: Expense) {
    setExpenses((prev) => {
      const exists = prev.some((e) => e.id === expense.id);
      return exists ? prev.map((e) => (e.id === expense.id ? expense : e)) : [expense, ...prev];
    });
    setShowModal(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    const res = await fetch(`${BASE_PATH}/api/expenses/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    if (res.ok) setExpenses((prev) => prev.filter((e) => e.id !== deleteId));
  }

  const subCategoryOptions = EXPENSE_CATEGORIES.find((c) => c.name === filterCategory)?.subCategories ?? [];

  const filteredExpenses = expenses.filter((e) => {
    if (filterNature && e.nature !== filterNature) return false;
    if (filterCategory && e.category !== filterCategory) return false;
    if (filterSubCategory && e.subCategory !== filterSubCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      const matches = SEARCH_FIELDS.some((field) => (e[field] as string | null)?.toLowerCase().includes(q));
      if (!matches) return false;
    }
    return true;
  });

  const sortedExpenses = sortKey
    ? [...filteredExpenses].sort((a, b) => {
        const va = getSortValue(a, sortKey);
        const vb = getSortValue(b, sortKey);
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      })
    : filteredExpenses;

  const totalPages = Math.max(1, Math.ceil(sortedExpenses.length / PAGE_SIZE));
  const pageExpenses = sortedExpenses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totals = sortedExpenses.reduce(
    (acc, e) => ({
      qty: acc.qty + (e.qty ?? 0),
      subTotalRm: acc.subTotalRm + (e.subTotalRm ?? 0),
      sstTotalRm: acc.sstTotalRm + (e.sstTotalRm ?? 0),
      grandTotalRm: acc.grandTotalRm + (e.grandTotalRm ?? 0),
    }),
    { qty: 0, subTotalRm: 0, sstTotalRm: 0, grandTotalRm: 0 }
  );

  async function handleExport() {
    const headers = [
      "Nature", "Category", "Sub Category", "AMP (Year)", "Cost Ctr", "Supplier",
      "Date Entry", "PHN Ref Letter", "Agreement/PO", "Type of Renewal",
      "Quotation No", "Invoice No", "DO No", "Services", "Description",
      "License/Product ID", "Qty", "Unit (Pcs)", "Price/Unit (RM)", "Sub Total (RM)",
      "SST (RM)", "SST Total (RM)", "Grand Total (RM)", "Effective Date",
    ];
    const rows = sortedExpenses.map((e) => [
      e.nature, e.category, e.subCategory ?? "", e.amp ?? "", e.costCtr ?? "", e.supplier,
      e.dateEntry ? e.dateEntry.split("T")[0] : "", e.phnRefLetter ?? "", e.agreementPo ?? "", e.typeOfRenewal ?? "",
      e.quotationNo ?? "", e.invoiceNo ?? "", e.doNo ?? "", e.services ?? "", e.description ?? "",
      e.licenseProductId ?? "", e.qty ?? "", e.unit ?? "", e.unitPrice ?? "", e.subTotalRm ?? "",
      e.sstRm ?? "", e.sstTotalRm ?? "", e.grandTotalRm ?? "", e.effectiveDate ? e.effectiveDate.split("T")[0] : "",
    ]);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Expenses");
    worksheet.addTable({
      name: "ExpensesTable",
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
    a.download = `expenses_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

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
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">IT Expenses</h1>
          <p className="page-subtitle">
            {sortedExpenses.length === 0
              ? "No expenses found"
              : sortedExpenses.length <= PAGE_SIZE
              ? `${sortedExpenses.length} expense${sortedExpenses.length !== 1 ? "s" : ""}`
              : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, sortedExpenses.length)} of ${sortedExpenses.length} expenses`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-secondary"
            onClick={handleExport}
            disabled={sortedExpenses.length === 0}
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
              setEditExpense(null);
              setShowModal(true);
            }}
          >
            <Plus size={16} /> Add Expense
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input" style={{ flex: 1, maxWidth: 320 }}>
          <Search size={15} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search by supplier, service, invoice no..."
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
          value={filterNature}
          onChange={(e) => setFilterNature(e.target.value)}
        >
          <option value="">All Natures</option>
          {EXPENSE_NATURES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <select
          className="form-input"
          style={{ width: "auto" }}
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setFilterSubCategory("");
          }}
        >
          <option value="">All Categories</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          className="form-input"
          style={{ width: "auto" }}
          value={filterSubCategory}
          onChange={(e) => setFilterSubCategory(e.target.value)}
          disabled={!filterCategory}
        >
          <option value="">All Sub Categories</option>
          {subCategoryOptions.map((sc) => (
            <option key={sc} value={sc}>
              {sc}
            </option>
          ))}
        </select>

        {(search || filterNature || filterCategory || filterSubCategory) && (
          <button
            className="btn btn-secondary text-xs"
            onClick={() => {
              setSearch("");
              setFilterNature("");
              setFilterCategory("");
              setFilterSubCategory("");
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
              <SortHeader label="Nature" colKey="nature" />
              <SortHeader label="Category" colKey="category" />
              <SortHeader label="Sub Category" colKey="subCategory" />
              <SortHeader label="AMP" colKey="amp" />
              <SortHeader label="Cost Ctr" colKey="costCtr" />
              <SortHeader label="Supplier" colKey="supplier" />
              <SortHeader label="Date Entry" colKey="dateEntry" />
              <SortHeader label="PHN Ref Letter" colKey="phnRefLetter" />
              <SortHeader label="Agreement/PO" colKey="agreementPo" />
              <SortHeader label="Type of Renewal" colKey="typeOfRenewal" />
              <SortHeader label="Quotation No" colKey="quotationNo" />
              <SortHeader label="Invoice No" colKey="invoiceNo" />
              <SortHeader label="DO No" colKey="doNo" />
              <SortHeader label="Services" colKey="services" />
              <SortHeader label="Description" colKey="description" />
              <SortHeader label="License/Product ID" colKey="licenseProductId" />
              <SortHeader label="Qty" colKey="qty" />
              <SortHeader label="Unit (Pcs)" colKey="unit" />
              <SortHeader label="Price/Unit (RM)" colKey="unitPrice" />
              <SortHeader label="Sub Total (RM)" colKey="subTotalRm" />
              <SortHeader label="SST (RM)" colKey="sstRm" />
              <SortHeader label="SST Total (RM)" colKey="sstTotalRm" />
              <SortHeader label="Grand Total (RM)" colKey="grandTotalRm" />
              <SortHeader label="Effective Date" colKey="effectiveDate" />
              <th className="sticky-col" style={{ width: 120 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={24} className="text-center text-slate-400 py-8">
                  Loading expenses...
                </td>
                <td className="sticky-col" />
              </tr>
            ) : sortedExpenses.length === 0 ? (
              <tr>
                <td colSpan={24}>
                  <div className="empty-state">
                    <Receipt size={48} className="mx-auto mb-3" style={{ color: "#d1d5db" }} />
                    <div className="text-lg font-medium text-slate-700 mb-1">
                      No expenses found
                    </div>
                    <div className="text-sm text-slate-500">
                      {expenses.length === 0
                        ? "IT expense records will appear here once added."
                        : "Try adjusting or clearing the filters."}
                    </div>
                  </div>
                </td>
                <td className="sticky-col" />
              </tr>
            ) : (
              pageExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td className="text-sm">{expense.nature}</td>
                  <td className="text-sm">{expense.category}</td>
                  <td className="text-sm">{expense.subCategory ?? "—"}</td>
                  <td className="text-sm">{expense.amp ?? "—"}</td>
                  <td className="text-sm">{expense.costCtr ?? "—"}</td>
                  <td className="text-sm">{expense.supplier}</td>
                  <td className="text-sm">{formatDate(expense.dateEntry)}</td>
                  <td className="text-sm">{expense.phnRefLetter ?? "—"}</td>
                  <td className="text-sm">{expense.agreementPo ?? "—"}</td>
                  <td className="text-sm">{expense.typeOfRenewal ?? "—"}</td>
                  <td className="text-sm">{expense.quotationNo ?? "—"}</td>
                  <td className="text-sm">{expense.invoiceNo ?? "—"}</td>
                  <td className="text-sm">{expense.doNo ?? "—"}</td>
                  <td className="text-sm">{expense.services ?? "—"}</td>
                  <td className="text-sm">{expense.description ?? "—"}</td>
                  <td className="text-sm">{expense.licenseProductId ?? "—"}</td>
                  <td className="text-sm">{expense.qty ?? "—"}</td>
                  <td className="text-sm">{expense.unit ?? "—"}</td>
                  <td className="text-sm">{formatNumber(expense.unitPrice)}</td>
                  <td className="text-sm">{formatNumber(expense.subTotalRm)}</td>
                  <td className="text-sm">{formatPercent(expense.sstRm)}</td>
                  <td className="text-sm">{formatNumber(expense.sstTotalRm)}</td>
                  <td className="text-sm">{formatNumber(expense.grandTotalRm)}</td>
                  <td className="text-sm">{formatDate(expense.effectiveDate)}</td>
                  <td className="sticky-col">
                    <div className="flex items-center gap-1">
                      <button
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                        title="View details"
                        onClick={() => setViewExpense(expense)}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600"
                        title="Edit"
                        onClick={() => {
                          setEditExpense(expense);
                          setShowModal(true);
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="p-1.5 rounded hover:bg-red-50 text-slate-500 hover:text-red-600"
                        title="Delete"
                        onClick={() => setDeleteId(expense.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {!loading && sortedExpenses.length > 0 && (
            <tfoot>
              <tr style={{ fontWeight: 600, background: "#f9fafb", borderTop: "2px solid #e5e7eb" }}>
                <td colSpan={16} className="text-sm text-right" style={{ background: "#f9fafb" }}>
                  Totals {totalPages > 1 ? "(all filtered)" : ""}
                </td>
                <td className="text-sm" style={{ background: "#f9fafb" }}>{totals.qty || "—"}</td>
                <td style={{ background: "#f9fafb" }} />
                <td style={{ background: "#f9fafb" }} />
                <td className="text-sm" style={{ background: "#f9fafb" }}>{formatNumber(totals.subTotalRm)}</td>
                <td style={{ background: "#f9fafb" }} />
                <td className="text-sm" style={{ background: "#f9fafb" }}>{formatNumber(totals.sstTotalRm)}</td>
                <td className="text-sm" style={{ background: "#f9fafb" }}>{formatNumber(totals.grandTotalRm)}</td>
                <td style={{ background: "#f9fafb" }} />
                <td className="sticky-col" style={{ background: "#f9fafb" }} />
              </tr>
            </tfoot>
          )}
        </table>
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
        <ExpenseImportModal
          onClose={() => setShowImportModal(false)}
          onImported={() => { setShowImportModal(false); fetchExpenses(); }}
        />
      )}

      {showModal && (
        <ExpenseModal
          expense={editExpense}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}

      {viewExpense && (
        <ExpenseDetailModal
          expense={viewExpense}
          onClose={() => setViewExpense(null)}
          onEdit={() => {
            setEditExpense(viewExpense);
            setViewExpense(null);
            setShowModal(true);
          }}
        />
      )}

      {deleteId && (
        <ConfirmModal
          title="Delete Expense"
          message="Are you sure you want to delete this expense? This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
