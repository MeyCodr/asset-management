"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Landmark, Wallet, Cpu, AppWindow, Filter } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { BASE_PATH, FIN_ASSET_CATEGORIES, FIN_ASSET_TYPES, ASSET_STATUSES, FIN_ASSET_PLANTS } from "@/lib/utils";
import type { FinAsset } from "@/components/FinAssetModal";

// Validated against scripts/validate_palette.js (CVD-safe up to 6 categorical slots)
const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

function formatRM(n: number): string {
  return `RM ${n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface PieLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}

// Renders the percent label inside each slice (rather than outside with a leader
// line) so it can't get clipped by the chart container.
function renderInsidePercentLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: PieLabelProps) {
  if (cx == null || cy == null || midAngle == null || innerRadius == null || outerRadius == null || !percent) {
    return null;
  }
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtext,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtext?: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color + "20" }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {subtext && (
          <div className="text-xs mt-1" style={{ color }}>
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FinAssetsDashboardPage() {
  const [finAssets, setFinAssets] = useState<FinAsset[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterCategory, setFilterCategory] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterPlant, setFilterPlant] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");

  useEffect(() => {
    fetch(`${BASE_PATH}/api/fin-assets`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setFinAssets)
      .catch(() => setFinAssets([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  const isEmpty = finAssets.length === 0;

  const brandOptions = Array.from(new Set(finAssets.map((f) => f.brand).filter((b): b is string => !!b))).sort();
  const departmentOptions = Array.from(new Set(finAssets.map((f) => f.department).filter((d): d is string => !!d))).sort();
  const supplierOptions = Array.from(new Set(finAssets.map((f) => f.supplier).filter((s): s is string => !!s))).sort();

  const hasFilters = !!(filterCategory || filterType || filterStatus || filterBrand || filterPlant || filterDepartment || filterSupplier);

  const filtered = finAssets.filter((f) => {
    if (filterCategory && f.assetCategory !== filterCategory) return false;
    if (filterType && f.assetType !== filterType) return false;
    if (filterStatus && f.assetStatus !== filterStatus) return false;
    if (filterBrand && f.brand !== filterBrand) return false;
    if (filterPlant && f.plant !== filterPlant) return false;
    if (filterDepartment && f.department !== filterDepartment) return false;
    if (filterSupplier && f.supplier !== filterSupplier) return false;
    return true;
  });

  const totalValue = filtered.reduce((sum, f) => sum + (f.totalAmountRm ?? 0), 0);
  const hardwareValue = filtered
    .filter((f) => f.assetType === "Hardware")
    .reduce((sum, f) => sum + (f.totalAmountRm ?? 0), 0);
  const softwareValue = filtered
    .filter((f) => f.assetType === "Software")
    .reduce((sum, f) => sum + (f.totalAmountRm ?? 0), 0);

  const byCategory = Object.values(
    filtered.reduce<Record<string, { name: string; total: number }>>((acc, f) => {
      const key = f.assetCategory || "Uncategorized";
      acc[key] ??= { name: key, total: 0 };
      acc[key].total += f.totalAmountRm ?? 0;
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total);

  const byPlant = Object.values(
    filtered.reduce<Record<string, { name: string; total: number }>>((acc, f) => {
      const key = f.plant || "Not Set";
      acc[key] ??= { name: key, total: 0 };
      acc[key].total += f.totalAmountRm ?? 0;
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total);

  const byDepartment = Object.values(
    filtered.reduce<Record<string, { name: string; total: number }>>((acc, f) => {
      const key = f.department || "Not Set";
      acc[key] ??= { name: key, total: 0 };
      acc[key].total += f.totalAmountRm ?? 0;
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total);

  const topSuppliers = Object.values(
    filtered.reduce<Record<string, { name: string; total: number }>>((acc, f) => {
      const key = f.supplier || "Unknown";
      acc[key] ??= { name: key, total: 0 };
      acc[key].total += f.totalAmountRm ?? 0;
      return acc;
    }, {})
  )
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const monthlyTrend = Object.values(
    filtered.reduce<Record<string, { month: string; total: number }>>((acc, f) => {
      if (!f.dateOfPurchase) return acc;
      const key = f.dateOfPurchase.slice(0, 7); // YYYY-MM
      acc[key] ??= { month: key, total: 0 };
      acc[key].total += f.totalAmountRm ?? 0;
      return acc;
    }, {})
  ).sort((a, b) => a.month.localeCompare(b.month));

  const byStatus = Object.values(
    filtered.reduce<Record<string, { name: string; value: number }>>((acc, f) => {
      const key = f.assetStatus || "Not Set";
      acc[key] ??= { name: key, value: 0 };
      acc[key].value += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.value - a.value);

  const byType = Object.values(
    filtered.reduce<Record<string, { name: string; value: number }>>((acc, f) => {
      const key = f.assetType || "Not Set";
      acc[key] ??= { name: key, value: 0 };
      acc[key].value += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.value - a.value);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">IT Fin Asset Dashboard</h1>
          <p className="page-subtitle">Overview of IT financial assets and valuations</p>
        </div>
        <Link href="/fin-assets" className="btn btn-primary">
          <Landmark size={16} /> View Financial Assets
        </Link>
      </div>

      {isEmpty ? (
        <div className="card empty-state">
          <Landmark size={48} className="mx-auto mb-3" style={{ color: "#d1d5db" }} />
          <div className="text-lg font-medium text-slate-700 mb-1">No financial assets yet</div>
          <div className="text-sm text-slate-500 mb-4">
            Add financial asset records to see valuation trends here.
          </div>
          <Link href="/fin-assets" className="btn btn-primary mx-auto">
            Go to Financial Assets
          </Link>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="filter-bar">
            <div className="flex items-center gap-1 text-slate-500">
              <Filter size={15} />
            </div>

            <select className="form-input" style={{ width: "auto" }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">All Categories</option>
              {FIN_ASSET_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select className="form-input" style={{ width: "auto" }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              {FIN_ASSET_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <select className="form-input" style={{ width: "auto" }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {ASSET_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select className="form-input" style={{ width: "auto" }} value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)}>
              <option value="">All Brands</option>
              {brandOptions.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <select className="form-input" style={{ width: "auto" }} value={filterPlant} onChange={(e) => setFilterPlant(e.target.value)}>
              <option value="">All Plants</option>
              {FIN_ASSET_PLANTS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <select className="form-input" style={{ width: "auto" }} value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}>
              <option value="">All Departments</option>
              {departmentOptions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select className="form-input" style={{ width: "auto" }} value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)}>
              <option value="">All Suppliers</option>
              {supplierOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {hasFilters && (
              <button
                className="btn btn-secondary text-xs"
                onClick={() => {
                  setFilterCategory("");
                  setFilterType("");
                  setFilterStatus("");
                  setFilterBrand("");
                  setFilterPlant("");
                  setFilterDepartment("");
                  setFilterSupplier("");
                }}
              >
                Clear filters
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="card empty-state">
              <Landmark size={48} className="mx-auto mb-3" style={{ color: "#d1d5db" }} />
              <div className="text-lg font-medium text-slate-700 mb-1">No financial assets match these filters</div>
              <div className="text-sm text-slate-500">Try adjusting or clearing the filters above.</div>
            </div>
          ) : (
          <>
          {/* Stats */}
          <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            <StatCard label="Total Assets" value={filtered.length} icon={Landmark} color="#3b82f6" />
            <StatCard label="Total Value" value={formatRM(totalValue)} icon={Wallet} color="#10b981" />
            <StatCard
              label="Hardware Value"
              value={formatRM(hardwareValue)}
              icon={Cpu}
              color="#f59e0b"
              subtext={totalValue > 0 ? `${Math.round((hardwareValue / totalValue) * 100)}% of total` : undefined}
            />
            <StatCard
              label="Software Value"
              value={formatRM(softwareValue)}
              icon={AppWindow}
              color="#8b5cf6"
              subtext={totalValue > 0 ? `${Math.round((softwareValue / totalValue) * 100)}% of total` : undefined}
            />
          </div>

          {/* Charts */}
          <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="card">
              <h3 className="font-semibold text-sm text-slate-700 mb-4">Value by Category</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byCategory} margin={{ top: 0, right: 0, bottom: 0, left: 10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatRM(v as number)} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="font-semibold text-sm text-slate-700 mb-4">Assets by Status</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={renderInsidePercentLabel} labelLine={false}>
                    {byStatus.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(v) => `${v} asset${v !== 1 ? "s" : ""}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="font-semibold text-sm text-slate-700 mb-4">Value by Department</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byDepartment} margin={{ top: 0, right: 0, bottom: 0, left: 10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-30} textAnchor="end" height={70} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatRM(v as number)} />
                  <Bar dataKey="total" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card" style={{ gridColumn: "span 2" }}>
              <h3 className="font-semibold text-sm text-slate-700 mb-4">Top Suppliers by Value</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={topSuppliers}
                  layout="vertical"
                  margin={{ top: 0, right: 20, bottom: 0, left: 10 }}
                >
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatRM(v as number)} />
                  <Bar dataKey="total" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="font-semibold text-sm text-slate-700 mb-4">Purchase Value Trend Over Time</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyTrend} margin={{ top: 0, right: 10, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatRM(v as number)} />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="font-semibold text-sm text-slate-700 mb-4">Value by Plant</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byPlant} margin={{ top: 0, right: 0, bottom: 0, left: 10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatRM(v as number)} />
                  <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="font-semibold text-sm text-slate-700 mb-4">Assets by Type</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={byType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={renderInsidePercentLabel} labelLine={false}>
                    {byType.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(v) => `${v} asset${v !== 1 ? "s" : ""}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          </>
          )}
        </>
      )}
    </div>
  );
}
