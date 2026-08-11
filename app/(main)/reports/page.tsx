"use client";

import { useEffect, useState } from "react";
import { Download, BarChart3, TrendingUp, AlertTriangle } from "lucide-react";
import { formatCurrency, formatDate, STATUS_COLORS, BASE_PATH } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { differenceInDays, parseISO } from "date-fns";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16"];

interface Asset {
  id: string;
  assetTag: string;
  name: string;
  brand: string | null;
  status: string;
  purchaseCost: number | null;
  purchaseDate: string | null;
  warrantyExpiry: string | null;
  category: { name: string; type: string };
  department: { name: string };
  assignments: Array<{ returnedDate: string | null; employee: { name: string } }>;
}

interface License {
  id: string;
  name: string;
  vendor: string;
  expiryDate: string | null;
  totalSeats: number;
  usedSeats: number;
  cost: number | null;
  licenseType: string;
}

const REPORT_PAGE_SIZE = 50;

export default function ReportsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportPage, setReportPage] = useState(1);

  useEffect(() => {
    Promise.all([fetch(`${BASE_PATH}/api/assets`), fetch(`${BASE_PATH}/api/licenses`)]).then(
      async ([aRes, lRes]) => {
        if (aRes.ok) setAssets(await aRes.json());
        if (lRes.ok) setLicenses(await lRes.json());
        setLoading(false);
      }
    );
  }, []);

  // Computed
  const totalValue = assets.reduce((sum, a) => sum + (a.purchaseCost ?? 0), 0);
  const activeValue = assets
    .filter((a) => a.status === "Check Out" || a.status === "Check In")
    .reduce((sum, a) => sum + (a.purchaseCost ?? 0), 0);

  const byCategory = Object.values(
    assets.reduce<Record<string, { name: string; count: number; value: number }>>((acc, a) => {
      const k = a.category.name;
      if (!acc[k]) acc[k] = { name: k, count: 0, value: 0 };
      acc[k].count++;
      acc[k].value += a.purchaseCost ?? 0;
      return acc;
    }, {})
  ).sort((a, b) => b.count - a.count);

  const byStatus = Object.values(
    assets.reduce<Record<string, { name: string; count: number }>>((acc, a) => {
      if (!acc[a.status]) acc[a.status] = { name: a.status, count: 0 };
      acc[a.status].count++;
      return acc;
    }, {})
  );

  const warrantyExpiring = assets.filter((a) => {
    if (!a.warrantyExpiry) return false;
    const days = differenceInDays(parseISO(a.warrantyExpiry), new Date());
    return days >= 0 && days <= 90;
  });

  const licenseExpiring = licenses.filter((l) => {
    if (!l.expiryDate) return false;
    const days = differenceInDays(parseISO(l.expiryDate), new Date());
    return days >= 0 && days <= 90;
  });

  const unassigned = assets.filter(
    (a) => !a.assignments.find((x) => !x.returnedDate) && a.status !== "Disposed"
  );

  function exportCSV() {
    const headers = [
      "Asset Tag", "Name", "Brand", "Category", "Status", "Department",
      "Purchase Cost", "Purchase Date", "Warranty Expiry", "Assigned To",
    ];
    const csvDate = (v: string | null | undefined) => {
      const d = formatDate(v);
      return d === "—" ? "" : d;
    };
    const rows = assets.map((a) => {
      const assignee = a.assignments.find((x) => !x.returnedDate)?.employee.name ?? "";
      return [
        a.assetTag, a.name, a.brand ?? "", a.category.name, a.status,
        a.department.name, a.purchaseCost?.toString() ?? "",
        csvDate(a.purchaseDate), csvDate(a.warrantyExpiry), assignee,
      ];
    });
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    // UTF-8 BOM so Excel opens it with correct encoding
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `it-assets-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">Loading reports...</div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">IT asset analytics and summaries</p>
        </div>
        <button className="btn btn-secondary" onClick={exportCSV}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Portfolio Value (RM)</div>
          <div className="text-2xl font-bold text-slate-800">{formatCurrency(totalValue)}</div>
          <div className="text-xs text-slate-400 mt-1">All {assets.length} assets</div>
        </div>
        <div className="card">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Active Asset Value (RM)</div>
          <div className="text-2xl font-bold text-green-700">{formatCurrency(activeValue)}</div>
          <div className="text-xs text-slate-400 mt-1">Check In + Check Out</div>
        </div>
        <div className="card">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Unassigned Assets</div>
          <div className="text-2xl font-bold text-amber-600">{unassigned.length}</div>
          <div className="text-xs text-slate-400 mt-1">Available for assignment</div>
        </div>
        <div className="card">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">License Spend (RM)</div>
          <div className="text-2xl font-bold text-purple-700">
            {formatCurrency(licenses.reduce((s, l) => s + (l.cost ?? 0) * l.totalSeats, 0))}
          </div>
          <div className="text-xs text-slate-400 mt-1">Across {licenses.length} licenses</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="font-semibold text-sm text-slate-700 mb-4 flex items-center gap-2">
            <BarChart3 size={16} color="#3b82f6" /> Assets by Category
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byCategory} margin={{ left: -10 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" name="Count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-semibold text-sm text-slate-700 mb-4 flex items-center gap-2">
            <TrendingUp size={16} color="#10b981" /> Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={byStatus} dataKey="count" nameKey="name" cx="50%" cy="45%" outerRadius={80}>
                {byStatus.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Value by Category */}
      <div className="card mb-6">
        <h3 className="font-semibold text-sm text-slate-700 mb-4">Asset Value by Category</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={byCategory} margin={{ left: 20 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `RM${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => formatCurrency(v as number)} />
            <Bar dataKey="value" name="Value" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Alert Tables */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Warranty expiring */}
        <div className="card scroll-light" style={{ padding: 0, overflowX: "auto" }}>
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <AlertTriangle size={16} color="#f59e0b" />
            <h3 className="font-semibold text-sm text-slate-700">
              Warranties Expiring (90 days) — {warrantyExpiring.length}
            </h3>
          </div>
          {warrantyExpiring.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">No warranties expiring soon.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Category</th>
                  <th>Expiry</th>
                  <th>Days Left</th>
                </tr>
              </thead>
              <tbody>
                {warrantyExpiring.map((a) => {
                  const days = differenceInDays(parseISO(a.warrantyExpiry!), new Date());
                  return (
                    <tr key={a.id}>
                      <td>
                        <div className="font-mono text-xs text-blue-600">{a.assetTag}</div>
                        <div className="text-xs text-slate-500">{a.name}</div>
                      </td>
                      <td className="text-xs">{a.category.name}</td>
                      <td className="text-xs">{formatDate(a.warrantyExpiry)}</td>
                      <td>
                        <span className={`badge ${days <= 30 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                          {days}d
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* License expiring */}
        <div className="card scroll-light" style={{ padding: 0, overflowX: "auto" }}>
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <AlertTriangle size={16} color="#ef4444" />
            <h3 className="font-semibold text-sm text-slate-700">
              Licenses Expiring (90 days) — {licenseExpiring.length}
            </h3>
          </div>
          {licenseExpiring.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">No licenses expiring soon.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>License</th>
                  <th>Type</th>
                  <th>Expiry</th>
                  <th>Days Left</th>
                </tr>
              </thead>
              <tbody>
                {licenseExpiring.map((l) => {
                  const days = differenceInDays(parseISO(l.expiryDate!), new Date());
                  return (
                    <tr key={l.id}>
                      <td>
                        <div className="font-medium text-xs">{l.name}</div>
                        <div className="text-xs text-slate-400">{l.vendor}</div>
                      </td>
                      <td><span className="badge bg-blue-50 text-blue-700 text-xs">{l.licenseType}</span></td>
                      <td className="text-xs">{formatDate(l.expiryDate)}</td>
                      <td>
                        <span className={`badge ${days <= 30 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                          {days}d
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Full Asset List for reporting */}
      {(() => {
        const totalPages = Math.max(1, Math.ceil(assets.length / REPORT_PAGE_SIZE));
        const pageAssets = assets.slice((reportPage - 1) * REPORT_PAGE_SIZE, reportPage * REPORT_PAGE_SIZE);
        const start = (reportPage - 1) * REPORT_PAGE_SIZE + 1;
        const end = Math.min(reportPage * REPORT_PAGE_SIZE, assets.length);

        const pageButtons: number[] = [];
        if (totalPages <= 7) {
          for (let i = 1; i <= totalPages; i++) pageButtons.push(i);
        } else {
          pageButtons.push(1);
          if (reportPage > 3) pageButtons.push(-1);
          for (let i = Math.max(2, reportPage - 1); i <= Math.min(totalPages - 1, reportPage + 1); i++) pageButtons.push(i);
          if (reportPage < totalPages - 2) pageButtons.push(-2);
          pageButtons.push(totalPages);
        }

        return (
          <div className="card scroll-light" style={{ padding: 0, overflowX: "auto" }}>
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-700">
                Complete Asset Registry ({assets.length})
                {assets.length > 0 && (
                  <span className="ml-2 text-slate-400 font-normal">— showing {start}–{end}</span>
                )}
              </h3>
              <button className="btn btn-secondary text-xs" onClick={exportCSV}>
                <Download size={13} /> Export CSV
              </button>
            </div>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}>No</th>
                  <th>Tag</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Value (RM)</th>
                  <th>Warranty</th>
                  <th>Assigned To</th>
                </tr>
              </thead>
              <tbody>
                {pageAssets.map((a, idx) => {
                  const assignee = a.assignments.find((x) => !x.returnedDate)?.employee.name;
                  return (
                    <tr key={a.id}>
                      <td className="text-xs text-slate-400 text-center">{start + idx}</td>
                      <td className="font-mono text-xs text-blue-600">{a.assetTag}</td>
                      <td>
                        <div className="text-sm font-medium">{a.name}</div>
                        {a.brand && <div className="text-xs text-slate-400">{a.brand}</div>}
                      </td>
                      <td className="text-sm">{a.category.name}</td>
                      <td>
                        <span className={`badge ${STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="text-sm">{formatCurrency(a.purchaseCost)}</td>
                      <td className="text-sm text-slate-500">{formatDate(a.warrantyExpiry)}</td>
                      <td className="text-sm">{assignee ?? <span className="text-slate-400">Unassigned</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Page {reportPage} of {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    className="btn btn-secondary text-xs px-2 py-1"
                    disabled={reportPage === 1}
                    onClick={() => setReportPage((p) => p - 1)}
                  >
                    Previous
                  </button>
                  {pageButtons.map((p, i) =>
                    p < 0 ? (
                      <span key={p} className="text-slate-400 text-xs px-1">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setReportPage(p)}
                        className="btn text-xs px-2 py-1"
                        style={{
                          background: p === reportPage ? "#3b82f6" : undefined,
                          color: p === reportPage ? "#fff" : undefined,
                          borderColor: p === reportPage ? "#3b82f6" : undefined,
                        }}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    className="btn btn-secondary text-xs px-2 py-1"
                    disabled={reportPage === totalPages}
                    onClick={() => setReportPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
