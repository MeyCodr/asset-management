"use client";

import { useEffect, useState } from "react";
import { History, Eye, Search, Filter, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { BASE_PATH, formatDate } from "@/lib/utils";
import AuditLogDetailModal from "@/components/AuditLogDetailModal";

export interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  entityLabel: string | null;
  action: "CREATE" | "UPDATE" | "DELETE";
  userId: string | null;
  userName: string | null;
  changes: string | null;
  createdAt: string;
}

const ENTITY_LABELS: Record<string, string> = {
  Asset: "Asset",
  Employee: "Employee",
  AssetAssignment: "Assignment",
  MaintenanceRecord: "Maintenance",
  SoftwareLicense: "License",
  Expense: "Expense",
  FinAsset: "Fin Asset",
};

const ENTITY_TYPES = Object.keys(ENTITY_LABELS);
const ACTIONS = ["CREATE", "UPDATE", "DELETE"] as const;

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
};

type SortKey = "createdAt" | "userName" | "action" | "entityType" | "entityLabel";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 50;

function getSortValue(e: AuditLogEntry, key: SortKey): string {
  return e[key] ?? "";
}

function SortHeader({
  label,
  colKey,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  colKey: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = sortKey === colKey;
  return (
    <th style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }} onClick={() => onSort(colKey)}>
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

export default function AuditLogPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewEntry, setViewEntry] = useState<AuditLogEntry | null>(null);

  const [search, setSearch] = useState("");
  const [filterEntityType, setFilterEntityType] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch(`${BASE_PATH}/api/auth/me`)
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => {
        if (me?.role === "admin") {
          setIsAdmin(true);
          fetch(`${BASE_PATH}/api/audit-log`)
            .then((r) => (r.ok ? r.json() : []))
            .then(setLogs)
            .catch(() => setLogs([]))
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .finally(() => setCheckedAuth(true));
  }, []);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const userOptions = Array.from(new Set(logs.map((l) => l.userName).filter((u): u is string => !!u))).sort();

  const filtered = logs.filter((l) => {
    if (filterEntityType && l.entityType !== filterEntityType) return false;
    if (filterAction && l.action !== filterAction) return false;
    if (filterUser && l.userName !== filterUser) return false;
    if (search) {
      const q = search.toLowerCase();
      const matches =
        l.entityLabel?.toLowerCase().includes(q) ||
        l.entityId.toLowerCase().includes(q) ||
        l.userName?.toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const va = getSortValue(a, sortKey);
    const vb = getSortValue(b, sortKey);
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageLogs = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasFilters = search || filterEntityType || filterAction || filterUser;

  if (checkedAuth && !isAdmin) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Access restricted to administrators.
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Log</h1>
          <p className="page-subtitle">
            {sorted.length === 0
              ? "No activity recorded"
              : sorted.length <= PAGE_SIZE
              ? `${sorted.length} entr${sorted.length !== 1 ? "ies" : "y"}`
              : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, sorted.length)} of ${sorted.length} entries`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input" style={{ flex: 1, maxWidth: 320 }}>
          <Search size={15} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search by record, user..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="flex items-center gap-1 text-slate-500">
          <Filter size={15} />
        </div>

        <select className="form-input" style={{ width: "auto" }} value={filterEntityType} onChange={(e) => { setFilterEntityType(e.target.value); setPage(1); }}>
          <option value="">All Entity Types</option>
          {ENTITY_TYPES.map((t) => (
            <option key={t} value={t}>{ENTITY_LABELS[t]}</option>
          ))}
        </select>

        <select className="form-input" style={{ width: "auto" }} value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}>
          <option value="">All Actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <select className="form-input" style={{ width: "auto" }} value={filterUser} onChange={(e) => { setFilterUser(e.target.value); setPage(1); }}>
          <option value="">All Users</option>
          {userOptions.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            className="btn btn-secondary text-xs"
            onClick={() => {
              setSearch("");
              setFilterEntityType("");
              setFilterAction("");
              setFilterUser("");
              setPage(1);
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
              <SortHeader label="Date/Time" colKey="createdAt" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortHeader label="User" colKey="userName" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortHeader label="Action" colKey="action" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortHeader label="Entity Type" colKey="entityType" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortHeader label="Entity" colKey="entityLabel" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <th style={{ width: 90 }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center text-slate-400 py-8">
                  Loading audit log...
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <History size={48} className="mx-auto mb-3" style={{ color: "#d1d5db" }} />
                    <div className="text-lg font-medium text-slate-700 mb-1">No activity recorded</div>
                    <div className="text-sm text-slate-500">
                      {logs.length === 0
                        ? "Changes made across the system will appear here."
                        : "Try adjusting or clearing the filters."}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              pageLogs.map((entry) => (
                <tr key={entry.id}>
                  <td className="text-sm">{formatDate(entry.createdAt)}</td>
                  <td className="text-sm">{entry.userName ?? "System"}</td>
                  <td className="text-sm">
                    <span className={`badge ${ACTION_COLORS[entry.action] ?? "bg-gray-100 text-gray-700"}`}>
                      {entry.action}
                    </span>
                  </td>
                  <td className="text-sm">{ENTITY_LABELS[entry.entityType] ?? entry.entityType}</td>
                  <td className="text-sm">{entry.entityLabel ?? entry.entityId}</td>
                  <td>
                    <button
                      className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                      title="View details"
                      onClick={() => setViewEntry(entry)}
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
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

      {viewEntry && <AuditLogDetailModal entry={viewEntry} onClose={() => setViewEntry(null)} />}
    </div>
  );
}
