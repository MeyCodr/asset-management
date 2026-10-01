"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Receipt,
  Wallet,
  TrendingUp,
  Building2,
  PieChart as PieIcon,
  BarChart3,
  CalendarRange,
  Landmark,
  Truck,
  RefreshCw,
  Layers,
  Percent,
  Clock,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  LabelList,
} from "recharts";
import {
  PALETTE,
  NEUTRAL,
  AXIS_TICK,
  colorFor,
  formatRM,
  formatCompact,
  ChartTooltip,
  ChartCard,
  KpiCard,
  Donut,
  DashboardHero,
  FilterPanel,
  filterSelectClass,
} from "@/components/DashboardUI";
import {
  BASE_PATH,
  formatDate,
  EXPENSE_NATURES,
  EXPENSE_CATEGORIES,
  EXPENSE_COST_CENTERS,
  EXPENSE_RENEWAL_TYPES,
} from "@/lib/utils";
import type { Expense } from "@/components/ExpenseModal";

const NATURE_COLORS: Record<string, string> = { OPEX: PALETTE[0], CAPEX: PALETTE[1] };
const COST_COLORS: Record<string, string> = { "Sub Total (RM)": PALETTE[2], "SST (RM)": PALETTE[4] };

const CATEGORY_NAMES = EXPENSE_CATEGORIES.map((c) => c.name);

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
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  const isEmpty = expenses.length === 0;

  const yearOptions = Array.from(new Set(expenses.map((e) => e.amp).filter(Boolean))).sort().reverse() as string[];
  const subCategoryOptions = EXPENSE_CATEGORIES.find((c) => c.name === filterCategory)?.subCategories ?? [];
  const supplierOptions = Array.from(new Set(expenses.map((e) => e.supplier).filter(Boolean))).sort();
  const serviceOptions = Array.from(new Set(expenses.map((e) => e.services).filter(Boolean))).sort() as string[];

  const activeFilterCount = [filterYear, filterNature, filterCategory, filterSubCategory, filterCostCtr, filterSupplier, filterService].filter(Boolean).length;
  const hasFilters = activeFilterCount > 0;

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

  const yearlyTrend = Object.values(
    filtered.reduce<Record<string, { year: string; total: number }>>((acc, e) => {
      if (!e.dateEntry) return acc;
      const key = e.dateEntry.slice(0, 4); // YYYY
      acc[key] ??= { year: key, total: 0 };
      acc[key].total += e.grandTotalRm ?? 0;
      return acc;
    }, {})
  ).sort((a, b) => a.year.localeCompare(b.year));

  const recent = [...filtered]
    .sort((a, b) => (b.dateEntry ?? "").localeCompare(a.dateEntry ?? ""))
    .slice(0, 5);

  const opexShare = total > 0 ? (opexTotal / total) * 100 : 0;
  const capexShare = total > 0 ? (capexTotal / total) * 100 : 0;

  function clearFilters() {
    setFilterYear("");
    setFilterNature("");
    setFilterCategory("");
    setFilterSubCategory("");
    setFilterCostCtr("");
    setFilterSupplier("");
    setFilterService("");
  }

  return (
    <div>
      <DashboardHero
        badgeIcon={Receipt}
        badge="IT Department"
        title="IT Expenses Dashboard"
        subtitle="Overview of IT department spending"
        metricLabel={hasFilters ? "Filtered spend" : "Total spend"}
        metricValue={isEmpty ? undefined : formatRM(total)}
        linkHref="/expenses"
        linkLabel="View Expense Records"
        linkIcon={Receipt}
        gradient="linear-gradient(120deg, #1e3a8a 0%, #4338ca 45%, #7c3aed 75%, #db2777 100%)"
      />

      {isEmpty ? (
        <div className="card empty-state">
          <Receipt size={48} className="mx-auto mb-3" style={{ color: "#d1d5db" }} />
          <div className="mb-1 text-lg font-medium text-slate-700">No expenses yet</div>
          <div className="mb-4 text-sm text-slate-500">
            Add expense records to see spending trends here.
          </div>
          <Link href="/expenses" className="btn btn-primary mx-auto">
            Go to Expense Records
          </Link>
        </div>
      ) : (
        <>
          {/* Filters (Fiscal Year, OPEX/CAPEX, Category/Sub Category, Cost Centre, Supplier, Service) */}
          <FilterPanel activeCount={activeFilterCount} onClear={clearFilters}>
            <select className={filterSelectClass(!!filterYear)} style={{ width: "auto" }} value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
              <option value="">All Years</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <select className={filterSelectClass(!!filterNature)} style={{ width: "auto" }} value={filterNature} onChange={(e) => setFilterNature(e.target.value)}>
              <option value="">All Natures</option>
              {EXPENSE_NATURES.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>

            <select
              className={filterSelectClass(!!filterCategory)}
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
              className={filterSelectClass(!!filterSubCategory)}
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

            <select className={filterSelectClass(!!filterCostCtr)} style={{ width: "auto" }} value={filterCostCtr} onChange={(e) => setFilterCostCtr(e.target.value)}>
              <option value="">All Cost Centres</option>
              {EXPENSE_COST_CENTERS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select className={filterSelectClass(!!filterSupplier)} style={{ width: "auto" }} value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)}>
              <option value="">All Suppliers</option>
              {supplierOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select className={filterSelectClass(!!filterService)} style={{ width: "auto" }} value={filterService} onChange={(e) => setFilterService(e.target.value)}>
              <option value="">All Services</option>
              {serviceOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </FilterPanel>

          {filtered.length === 0 ? (
            <div className="card empty-state">
              <Receipt size={48} className="mx-auto mb-3" style={{ color: "#d1d5db" }} />
              <div className="mb-1 text-lg font-medium text-slate-700">No expenses match these filters</div>
              <div className="text-sm text-slate-500">Try adjusting or clearing the filters above.</div>
            </div>
          ) : (
          <>
          {/* KPIs */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Expense Records"
              value={filtered.length.toLocaleString("en-MY")}
              icon={Receipt}
              from="#3b82f6"
              to="#6366f1"
              subtext={hasFilters ? `of ${expenses.length.toLocaleString("en-MY")} total records` : "All records"}
            />
            <KpiCard
              label="Total Spend"
              value={formatRM(total)}
              icon={Wallet}
              from="#10b981"
              to="#0d9488"
              subtext={filtered.length > 0 ? `Avg ${formatRM(total / filtered.length)} per record` : undefined}
            />
            <KpiCard
              label="OPEX"
              value={formatRM(opexTotal)}
              icon={TrendingUp}
              from="#2a78d6"
              to="#06b6d4"
              subtext={total > 0 ? `${Math.round(opexShare)}% of total` : undefined}
              share={opexShare}
            />
            <KpiCard
              label="CAPEX"
              value={formatRM(capexTotal)}
              icon={Building2}
              from="#eb6834"
              to="#f59e0b"
              subtext={total > 0 ? `${Math.round(capexShare)}% of total` : undefined}
              share={capexShare}
            />
          </div>

          {/* Charts */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            <ChartCard title="Spend by Category" icon={BarChart3} accent="#2a78d6">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byCategory} margin={{ top: 20, right: 4, bottom: 0, left: 0 }} barCategoryGap="22%">
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS_TICK} tickFormatter={formatCompact} axisLine={false} tickLine={false} width={44} />
                  <Tooltip cursor={{ fill: "#f1f5f9" }} content={<ChartTooltip total={total} />} />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]} minPointSize={3}>
                    {byCategory.map((d) => (
                      <Cell key={d.name} fill={colorFor(CATEGORY_NAMES, d.name)} />
                    ))}
                    <LabelList dataKey="total" position="top" fontSize={10} fill="#475569" formatter={(v) => formatCompact(Number(v))} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="OPEX vs CAPEX" icon={PieIcon} accent="#eb6834">
              <Donut data={natureSplit} colors={(n) => NATURE_COLORS[n] ?? NEUTRAL} centerLabel="Total" centerValue={`RM ${formatCompact(total)}`} />
            </ChartCard>

            <ChartCard title="Spend Trend by Year" icon={CalendarRange} accent="#4a3aa7">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={yearlyTrend} margin={{ top: 24, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="yearGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#4a3aa7" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="year" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS_TICK} tickFormatter={formatCompact} axisLine={false} tickLine={false} width={44} />
                  <Tooltip cursor={{ fill: "#f5f3ff" }} content={<ChartTooltip />} />
                  <Bar dataKey="total" name="Spend" fill="url(#yearGradient)" radius={[4, 4, 0, 0]} minPointSize={3} maxBarSize={56}>
                    <LabelList dataKey="total" position="top" fontSize={11} fill="#475569" formatter={(v) => `RM ${formatCompact(Number(v))}`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Spend by Cost Centre" icon={Landmark} accent="#1baf7a">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byCostCtr} margin={{ top: 20, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS_TICK} tickFormatter={formatCompact} axisLine={false} tickLine={false} width={44} />
                  <Tooltip cursor={{ fill: "#f1f5f9" }} content={<ChartTooltip total={total} />} />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]} minPointSize={3} maxBarSize={64}>
                    {byCostCtr.map((d) => (
                      <Cell key={d.name} fill={colorFor(EXPENSE_COST_CENTERS, d.name)} />
                    ))}
                    <LabelList dataKey="total" position="top" fontSize={10} fill="#475569" formatter={(v) => formatCompact(Number(v))} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Top Suppliers by Spend" icon={Truck} accent="#e87ba4" className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topSuppliers} layout="vertical" margin={{ top: 0, right: 56, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="supplierGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#f9a8d4" />
                      <stop offset="100%" stopColor="#db2777" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={AXIS_TICK} tickFormatter={formatCompact} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={150} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "#fdf2f8" }} content={<ChartTooltip total={total} />} />
                  <Bar dataKey="total" fill="url(#supplierGradient)" radius={[0, 4, 4, 0]} minPointSize={3} maxBarSize={22}>
                    <LabelList dataKey="total" position="right" fontSize={10} fill="#475569" formatter={(v) => formatCompact(Number(v))} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Spend by Type of Renewal" icon={RefreshCw} accent="#eda100">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byRenewalType} margin={{ top: 20, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS_TICK} tickFormatter={formatCompact} axisLine={false} tickLine={false} width={44} />
                  <Tooltip cursor={{ fill: "#f1f5f9" }} content={<ChartTooltip total={total} />} />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]} minPointSize={3}>
                    {byRenewalType.map((d) => (
                      <Cell key={d.name} fill={colorFor(EXPENSE_RENEWAL_TYPES, d.name)} />
                    ))}
                    <LabelList dataKey="total" position="top" fontSize={10} fill="#475569" formatter={(v) => formatCompact(Number(v))} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Spend by Sub Category" icon={Layers} accent="#0891b2">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={bySubCategory} layout="vertical" margin={{ top: 0, right: 48, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="subCatGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#67e8f9" />
                      <stop offset="100%" stopColor="#0e7490" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={AXIS_TICK} tickFormatter={formatCompact} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={130} tick={{ ...AXIS_TICK, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "#ecfeff" }} content={<ChartTooltip total={total} />} />
                  <Bar dataKey="total" fill="url(#subCatGradient)" radius={[0, 4, 4, 0]} minPointSize={3} maxBarSize={20}>
                    <LabelList dataKey="total" position="right" fontSize={10} fill="#475569" formatter={(v) => formatCompact(Number(v))} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Cost Breakdown (Sub Total vs SST)" icon={Percent} accent="#e34948" className="lg:col-span-2 xl:col-span-1">
              <Donut
                data={costBreakdown}
                colors={(n) => COST_COLORS[n] ?? NEUTRAL}
                centerLabel="Grand"
                centerValue={`RM ${formatCompact(subTotalSum + sstTotalSum)}`}
              />
            </ChartCard>
          </div>

          {/* Recent expenses */}
          <div className="card scroll-light" style={{ padding: 0, overflowX: "auto", borderTop: "3px solid #6366f1" }}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                  <Clock size={16} />
                </div>
                <h3 className="text-sm font-semibold text-slate-700">Recent Expenses</h3>
              </div>
              <Link href="/expenses" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline">
                View all <ArrowRight size={13} />
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
                  <tr key={e.id} className="transition-colors hover:bg-indigo-50/40">
                    <td className="text-xs text-slate-500">{formatDate(e.dateEntry)}</td>
                    <td>
                      <span className={`badge ${e.nature === "OPEX" ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"}`}>
                        {e.nature}
                      </span>
                    </td>
                    <td className="text-sm">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ background: colorFor(CATEGORY_NAMES, e.category ?? "") }}
                        />
                        {e.category}
                      </span>
                    </td>
                    <td className="text-sm">{e.supplier}</td>
                    <td className="text-sm font-semibold text-slate-800">
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
