"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Landmark,
  Wallet,
  Cpu,
  AppWindow,
  BarChart3,
  Activity,
  Users,
  Truck,
  LineChart as LineIcon,
  Factory,
  Shapes,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  LabelList,
} from "recharts";
import { format, parseISO } from "date-fns";
import { BASE_PATH, FIN_ASSET_CATEGORIES, FIN_ASSET_TYPES, ASSET_STATUSES, FIN_ASSET_PLANTS } from "@/lib/utils";
import type { FinAsset } from "@/components/FinAssetModal";
import {
  NEUTRAL,
  ASSET_STATUS_CHART_COLORS,
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

function formatCount(n: number): string {
  return `${n} asset${n !== 1 ? "s" : ""}`;
}

function formatMonth(month: string): string {
  try {
    return format(parseISO(`${month}-01`), "MMM yy");
  } catch {
    return month;
  }
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
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  const isEmpty = finAssets.length === 0;

  const brandOptions = Array.from(new Set(finAssets.map((f) => f.brand).filter((b): b is string => !!b))).sort();
  const departmentOptions = Array.from(new Set(finAssets.map((f) => f.department).filter((d): d is string => !!d))).sort();
  const supplierOptions = Array.from(new Set(finAssets.map((f) => f.supplier).filter((s): s is string => !!s))).sort();

  const activeFilterCount = [filterCategory, filterType, filterStatus, filterBrand, filterPlant, filterDepartment, filterSupplier].filter(Boolean).length;
  const hasFilters = activeFilterCount > 0;

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

  const hardwareShare = totalValue > 0 ? (hardwareValue / totalValue) * 100 : 0;
  const softwareShare = totalValue > 0 ? (softwareValue / totalValue) * 100 : 0;

  function clearFilters() {
    setFilterCategory("");
    setFilterType("");
    setFilterStatus("");
    setFilterBrand("");
    setFilterPlant("");
    setFilterDepartment("");
    setFilterSupplier("");
  }

  return (
    <div>
      <DashboardHero
        badgeIcon={Landmark}
        badge="Finance"
        title="IT Fin Asset Dashboard"
        subtitle="Overview of IT financial assets and valuations"
        metricLabel={hasFilters ? "Filtered value" : "Total asset value"}
        metricValue={isEmpty ? undefined : formatRM(totalValue)}
        linkHref="/fin-assets"
        linkLabel="View Financial Assets"
        linkIcon={Landmark}
        gradient="linear-gradient(120deg, #064e3b 0%, #0f766e 40%, #0891b2 72%, #2563eb 100%)"
      />

      {isEmpty ? (
        <div className="card empty-state">
          <Landmark size={48} className="mx-auto mb-3" style={{ color: "#d1d5db" }} />
          <div className="mb-1 text-lg font-medium text-slate-700">No financial assets yet</div>
          <div className="mb-4 text-sm text-slate-500">
            Add financial asset records to see valuation trends here.
          </div>
          <Link href="/fin-assets" className="btn btn-primary mx-auto">
            Go to Financial Assets
          </Link>
        </div>
      ) : (
        <>
          {/* Filters */}
          <FilterPanel activeCount={activeFilterCount} onClear={clearFilters}>
            <select className={filterSelectClass(!!filterCategory)} style={{ width: "auto" }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">All Categories</option>
              {FIN_ASSET_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select className={filterSelectClass(!!filterType)} style={{ width: "auto" }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              {FIN_ASSET_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <select className={filterSelectClass(!!filterStatus)} style={{ width: "auto" }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {ASSET_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select className={filterSelectClass(!!filterBrand)} style={{ width: "auto" }} value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)}>
              <option value="">All Brands</option>
              {brandOptions.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <select className={filterSelectClass(!!filterPlant)} style={{ width: "auto" }} value={filterPlant} onChange={(e) => setFilterPlant(e.target.value)}>
              <option value="">All Plants</option>
              {FIN_ASSET_PLANTS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <select className={filterSelectClass(!!filterDepartment)} style={{ width: "auto" }} value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}>
              <option value="">All Departments</option>
              {departmentOptions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select className={filterSelectClass(!!filterSupplier)} style={{ width: "auto" }} value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)}>
              <option value="">All Suppliers</option>
              {supplierOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </FilterPanel>

          {filtered.length === 0 ? (
            <div className="card empty-state">
              <Landmark size={48} className="mx-auto mb-3" style={{ color: "#d1d5db" }} />
              <div className="mb-1 text-lg font-medium text-slate-700">No financial assets match these filters</div>
              <div className="text-sm text-slate-500">Try adjusting or clearing the filters above.</div>
            </div>
          ) : (
          <>
          {/* KPIs */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Total Assets"
              value={filtered.length.toLocaleString("en-MY")}
              icon={Landmark}
              from="#0d9488"
              to="#0891b2"
              subtext={hasFilters ? `of ${finAssets.length.toLocaleString("en-MY")} total assets` : "All assets"}
            />
            <KpiCard
              label="Total Value"
              value={formatRM(totalValue)}
              icon={Wallet}
              from="#10b981"
              to="#65a30d"
              subtext={filtered.length > 0 ? `Avg ${formatRM(totalValue / filtered.length)} per asset` : undefined}
            />
            <KpiCard
              label="Hardware Value"
              value={formatRM(hardwareValue)}
              icon={Cpu}
              from="#2a78d6"
              to="#6366f1"
              subtext={totalValue > 0 ? `${Math.round(hardwareShare)}% of total` : undefined}
              share={hardwareShare}
            />
            <KpiCard
              label="Software Value"
              value={formatRM(softwareValue)}
              icon={AppWindow}
              from="#eb6834"
              to="#f59e0b"
              subtext={totalValue > 0 ? `${Math.round(softwareShare)}% of total` : undefined}
              share={softwareShare}
            />
          </div>

          {/* Charts */}
          <div className="mb-6 grid grid-flow-row-dense grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            <ChartCard title="Value by Category" icon={BarChart3} accent="#2a78d6">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byCategory} margin={{ top: 20, right: 4, bottom: 0, left: 0 }} barCategoryGap="22%">
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS_TICK} tickFormatter={formatCompact} axisLine={false} tickLine={false} width={44} />
                  <Tooltip cursor={{ fill: "#f1f5f9" }} content={<ChartTooltip total={totalValue} />} />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]} minPointSize={3}>
                    {byCategory.map((d) => (
                      <Cell key={d.name} fill={colorFor(FIN_ASSET_CATEGORIES, d.name)} />
                    ))}
                    <LabelList dataKey="total" position="top" fontSize={10} fill="#475569" formatter={(v) => formatCompact(Number(v))} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Value by Department" icon={Users} accent="#eda100">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byDepartment} margin={{ top: 20, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="deptGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 9 }} interval={0} angle={-30} textAnchor="end" height={70} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS_TICK} tickFormatter={formatCompact} axisLine={false} tickLine={false} width={44} />
                  <Tooltip cursor={{ fill: "#fffbeb" }} content={<ChartTooltip total={totalValue} />} />
                  <Bar dataKey="total" fill="url(#deptGradient)" radius={[4, 4, 0, 0]} minPointSize={3} maxBarSize={48}>
                    <LabelList dataKey="total" position="top" fontSize={10} fill="#475569" formatter={(v) => formatCompact(Number(v))} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Assets by Type" icon={Shapes} accent="#e87ba4">
              <Donut
                data={byType}
                colors={(n) => colorFor(FIN_ASSET_TYPES, n)}
                centerLabel="Assets"
                centerValue={filtered.length.toLocaleString("en-MY")}
                format={formatCount}
              />
            </ChartCard>

            <ChartCard title="Top Suppliers by Value" icon={Truck} accent="#4a3aa7" className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topSuppliers} layout="vertical" margin={{ top: 0, right: 56, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="finSupplierGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#a5b4fc" />
                      <stop offset="100%" stopColor="#4a3aa7" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={AXIS_TICK} tickFormatter={formatCompact} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={150} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "#eef2ff" }} content={<ChartTooltip total={totalValue} />} />
                  <Bar dataKey="total" fill="url(#finSupplierGradient)" radius={[0, 4, 4, 0]} minPointSize={3} maxBarSize={22}>
                    <LabelList dataKey="total" position="right" fontSize={10} fill="#475569" formatter={(v) => formatCompact(Number(v))} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Assets by Status" icon={Activity} accent="#1baf7a">
              <Donut
                data={byStatus}
                colors={(n) => ASSET_STATUS_CHART_COLORS[n] ?? NEUTRAL}
                centerLabel="Assets"
                centerValue={filtered.length.toLocaleString("en-MY")}
                format={formatCount}
              />
            </ChartCard>

            <ChartCard title="Purchase Value Trend Over Time" icon={LineIcon} accent="#0891b2" className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={monthlyTrend} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0891b2" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#0891b2" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={AXIS_TICK} tickFormatter={formatMonth} axisLine={false} tickLine={false} minTickGap={16} />
                  <YAxis tick={AXIS_TICK} tickFormatter={formatCompact} axisLine={false} tickLine={false} width={44} />
                  <Tooltip
                    cursor={{ stroke: "#94a3b8", strokeDasharray: "4 4" }}
                    content={({ active, payload, label }) => (
                      <ChartTooltip
                        active={active}
                        payload={payload?.map((p) => ({ value: p.value as number, color: "#0891b2" }))}
                        label={label != null ? formatMonth(String(label)) : undefined}
                      />
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#0891b2"
                    strokeWidth={2}
                    fill="url(#trendGradient)"
                    dot={{ r: 3, fill: "#fff", stroke: "#0891b2", strokeWidth: 2 }}
                    activeDot={{ r: 5, fill: "#0891b2", stroke: "#fff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Value by Plant" icon={Factory} accent="#1baf7a" className="lg:col-span-2 xl:col-span-1">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byPlant} margin={{ top: 20, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS_TICK} tickFormatter={formatCompact} axisLine={false} tickLine={false} width={44} />
                  <Tooltip cursor={{ fill: "#f1f5f9" }} content={<ChartTooltip total={totalValue} />} />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]} minPointSize={3} maxBarSize={48}>
                    {byPlant.map((d) => (
                      <Cell key={d.name} fill={colorFor(FIN_ASSET_PLANTS, d.name)} />
                    ))}
                    <LabelList dataKey="total" position="top" fontSize={10} fill="#475569" formatter={(v) => formatCompact(Number(v))} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
          </>
          )}
        </>
      )}
    </div>
  );
}
