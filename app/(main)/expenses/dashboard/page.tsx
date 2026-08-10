"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Receipt, DollarSign, TrendingUp, TrendingDown, Filter } from "lucide-react";
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
import { BASE_PATH, formatDate, EXPENSE_NATURES, EXPENSE_CATEGORIES, EXPENSE_COST_CENTERS } from "@/lib/utils";
import type { Expense } from "@/components/ExpenseModal";

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16"];

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

export default function ExpensesDashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState("");
  const [filterNature, setFilterNature] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubCategory, setFilterSubCategory] = useState("");
  const [filterCostCtr, setFilterCostCtr] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterService, setFilterService] = useState("");

  useEffect(() => {
    fetch(`${BASE_PATH}/api/expenses`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setExpenses)
      .catch(() => setExpenses([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  const isEmpty = expenses.length === 0;

  const yearOptions = Array.from(new Set(expenses.map((e) => e.amp).filter(Boolean))).sort().reverse() as string[];
  const subCategoryOptions = EXPENSE_CATEGORIES.find((c) => c.name === filterCategory)?.subCategories ?? [];
  const supplierOptions = Array.from(new Set(expenses.map((e) => e.supplier).filter(Boolean))).sort();
  const serviceOptions = Array.from(new Set(expenses.map((e) => e.services).filter(Boolean))).sort() as string[];

  const hasFilters = !!(filterYear || filterNature || filterCategory || filterSubCategory || filterCostCtr || filterSupplier || filterService);

  const filtered = expenses.filter((e) => {
    if (filterYear && e.amp !== filterYear) return false;
    if (filterNature && e.nature !== filterNature) return false;
    if (filterCategory && e.category !== filterCategory) return false;
    if (filterSubCategory && e.subCategory !== filterSubCategory) return false;
    if (filterCostCtr && e.costCtr !== filterCostCtr) return false;
    if (filterSupplier && e.supplier !== filterSupplier) return false;
    if (filterService && e.services !== filterService) return false;
    return true;
  });

  const total = filtered.reduce((sum, e) => sum + (e.grandTotalRm ?? 0), 0);
  const opexTotal = filtered
    .filter((e) => e.nature === "OPEX")
    .reduce((sum, e) => sum + (e.grandTotalRm ?? 0), 0);
  const capexTotal = filtered
    .filter((e) => e.nature === "CAPEX")
    .reduce((sum, e) => sum + (e.grandTotalRm ?? 0), 0);

  const byCategory = Object.values(
    filtered.reduce<Record<string, { name: string; total: number }>>((acc, e) => {
      const key = e.category || "Uncategorized";
      acc[key] ??= { name: key, total: 0 };
      acc[key].total += e.grandTotalRm ?? 0;
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total);

  const natureSplit = [
    { name: "OPEX", value: opexTotal },
    { name: "CAPEX", value: capexTotal },
  ].filter((n) => n.value > 0);

  const byCostCtr = Object.values(
    filtered.reduce<Record<string, { name: string; total: number }>>((acc, e) => {
      const key = e.costCtr || "Unassigned";
      acc[key] ??= { name: key, total: 0 };
      acc[key].total += e.grandTotalRm ?? 0;
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total);

  const topSuppliers = Object.values(
    filtered.reduce<Record<string, { name: string; total: number }>>((acc, e) => {
      const key = e.supplier || "Unknown";
      acc[key] ??= { name: key, total: 0 };
      acc[key].total += e.grandTotalRm ?? 0;
      return acc;
    }, {})
  )
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const bySubCategory = Object.values(
    filtered.reduce<Record<string, { name: string; total: number }>>((acc, e) => {
      const key = e.subCategory || "Not Set";
      acc[key] ??= { name: key, total: 0 };
      acc[key].total += e.grandTotalRm ?? 0;
      return acc;
    }, {})
  )
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const subTotalSum = filtered.reduce((sum, e) => sum + (e.subTotalRm ?? 0), 0);
  const sstTotalSum = filtered.reduce((sum, e) => sum + (e.sstTotalRm ?? 0), 0);
  const costBreakdown = [
    { name: "Sub Total (RM)", value: subTotalSum },
    { name: "SST (RM)", value: sstTotalSum },
  ].filter((n) => n.value > 0);

  const byRenewalType = Object.values(
    filtered.reduce<Record<string, { name: string; total: number }>>((acc, e) => {
      const key = e.typeOfRenewal || "Not Set";
      acc[key] ??= { name: key, total: 0 };
      acc[key].total += e.grandTotalRm ?? 0;
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total);

  const monthlyTrend = Object.values(
    filtered.reduce<Record<string, { month: string; total: number }>>((acc, e) => {
      if (!e.dateEntry) return acc;
      const key = e.dateEntry.slice(0, 7); // YYYY-MM
      acc[key] ??= { month: key, total: 0 };
      acc[key].total += e.grandTotalRm ?? 0;
      return acc;
    }, {})
  ).sort((a, b) => a.month.localeCompare(b.month));

  const recent = [...filtered]
    .sort((a, b) => (b.dateEntry ?? "").localeCompare(a.dateEntry ?? ""))
    .slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">IT Expenses Dashboard</h1>
          <p className="page-subtitle">Overview of IT department spending</p>
        </div>
        <Link href="/expenses" className="btn btn-primary">
          <Receipt size={16} /> View Expense Records
        </Link>
      </div>

      {isEmpty ? (
        <div className="card empty-state">
          <Receipt size={48} className="mx-auto mb-3" style={{ color: "#d1d5db" }} />
          <div className="text-lg font-medium text-slate-700 mb-1">No expenses yet</div>
          <div className="text-sm text-slate-500 mb-4">
            Add expense records to see spending trends here.
          </div>
          <Link href="/expenses" className="btn btn-primary mx-auto">
            Go to Expense Records
          </Link>
        </div>
      ) : (
        <>
          {/* Filters (Fiscal Year, OPEX/CAPEX, Category/Sub Category, Cost Centre, Supplier, Service) */}
          <div className="filter-bar">
            <div className="flex items-center gap-1 text-slate-500">
              <Filter size={15} />
            </div>

            <select className="form-input" style={{ width: "auto" }} value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
              <option value="">All Years</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <select className="form-input" style={{ width: "auto" }} value={filterNature} onChange={(e) => setFilterNature(e.target.value)}>
              <option value="">All Natures</option>
              {EXPENSE_NATURES.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>

            <select
              className="form-input"
              style={{ width: "auto" }}
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setFilterSubCategory(""); }}
            >
              <option value="">All Categories</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
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
                <option key={sc} value={sc}>{sc}</option>
              ))}
            </select>

            <select className="form-input" style={{ width: "auto" }} value={filterCostCtr} onChange={(e) => setFilterCostCtr(e.target.value)}>
              <option value="">All Cost Centres</option>
              {EXPENSE_COST_CENTERS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select className="form-input" style={{ width: "auto" }} value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)}>
              <option value="">All Suppliers</option>
              {supplierOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select className="form-input" style={{ width: "auto" }} value={filterService} onChange={(e) => setFilterService(e.target.value)}>
              <option value="">All Services</option>
              {serviceOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {hasFilters && (
              <button
                className="btn btn-secondary text-xs"
                onClick={() => {
                  setFilterYear("");
                  setFilterNature("");
                  setFilterCategory("");
                  setFilterSubCategory("");
                  setFilterCostCtr("");
                  setFilterSupplier("");
                  setFilterService("");
                }}
              >
                Clear filters
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="card empty-state">
              <Receipt size={48} className="mx-auto mb-3" style={{ color: "#d1d5db" }} />
              <div className="text-lg font-medium text-slate-700 mb-1">No expenses match these filters</div>
              <div className="text-sm text-slate-500">Try adjusting or clearing the filters above.</div>
            </div>
          ) : (
          <>
          {/* Stats */}
          <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            <StatCard
              label="Total Expenses"
              value={expenses.length}
              icon={Receipt}
              color="#3b82f6"
            />
            <StatCard
              label="Total Spend"
              value={formatRM(total)}
              icon={DollarSign}
              color="#10b981"
            />
            <StatCard
              label="OPEX"
              value={formatRM(opexTotal)}
              icon={TrendingUp}
              color="#f59e0b"
              subtext={total > 0 ? `${Math.round((opexTotal / total) * 100)}% of total` : undefined}
            />
            <StatCard
              label="CAPEX"
              value={formatRM(capexTotal)}
              icon={TrendingDown}
              color="#8b5cf6"
              subtext={total > 0 ? `${Math.round((capexTotal / total) * 100)}% of total` : undefined}
            />
          </div>

          {/* Charts */}
          <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="card">
              <h3 className="font-semibold text-sm text-slate-700 mb-4">Spend by Category</h3>
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
              <h3 className="font-semibold text-sm text-slate-700 mb-4">OPEX vs CAPEX</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={natureSplit} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={renderInsidePercentLabel} labelLine={false}>
                    {natureSplit.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(v) => formatRM(v as number)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="font-semibold text-sm text-slate-700 mb-4">Spend Trend Over Time</h3>
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
              <h3 className="font-semibold text-sm text-slate-700 mb-4">Spend by Cost Centre</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byCostCtr} margin={{ top: 0, right: 0, bottom: 0, left: 10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatRM(v as number)} />
                  <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card" style={{ gridColumn: "span 2" }}>
              <h3 className="font-semibold text-sm text-slate-700 mb-4">Top Suppliers by Spend</h3>
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
              <h3 className="font-semibold text-sm text-slate-700 mb-4">Spend by Type of Renewal</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byRenewalType} margin={{ top: 0, right: 0, bottom: 0, left: 10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatRM(v as number)} />
                  <Bar dataKey="total" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="font-semibold text-sm text-slate-700 mb-4">Spend by Sub Category</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={bySubCategory}
                  layout="vertical"
                  margin={{ top: 0, right: 20, bottom: 0, left: 10 }}
                >
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => formatRM(v as number)} />
                  <Bar dataKey="total" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="font-semibold text-sm text-slate-700 mb-4">Cost Breakdown (Sub Total vs SST)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={costBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={renderInsidePercentLabel} labelLine={false}>
                    {costBreakdown.map((_, i) => (
                      <Cell key={i} fill={[ "#3b82f6", "#ef4444" ][i % 2]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(v) => formatRM(v as number)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent expenses */}
          <div className="card" style={{ padding: 0, overflowX: "auto" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-sm text-slate-700">Recent Expenses</h3>
              <Link href="/expenses" className="text-xs text-blue-600 hover:underline">
                View all →
              </Link>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Date Entry</th>
                  <th>Nature</th>
                  <th>Category</th>
                  <th>Supplier</th>
                  <th>Grand Total (RM)</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((e) => (
                  <tr key={e.id}>
                    <td className="text-xs text-slate-500">{formatDate(e.dateEntry)}</td>
                    <td>
                      <span className={`badge ${e.nature === "OPEX" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                        {e.nature}
                      </span>
                    </td>
                    <td className="text-sm">{e.category}</td>
                    <td className="text-sm">{e.supplier}</td>
                    <td className="text-sm font-medium">
                      {e.grandTotalRm != null ? formatRM(e.grandTotalRm) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
          )}
        </>
      )}
    </div>
  );
}
