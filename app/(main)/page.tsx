"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Monitor,
  Users,
  ArrowLeftRight,
  Wrench,
  Key,
  ShieldAlert,
  Package,
  Archive,
  BarChart3,
  ArrowRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency, STATUS_COLORS, BASE_PATH } from "@/lib/utils";
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
  CartesianGrid,
  LabelList,
} from "recharts";
import { format, parseISO } from "date-fns";
import {
  NEUTRAL,
  AXIS_TICK,
  ASSET_STATUS_CHART_COLORS,
  colorFor,
  ChartTooltip,
} from "@/components/DashboardUI";

interface DashboardData {
  stats: {
    totalAssets: number;
    activeAssets: number;
    inRepairAssets: number;
    inStockAssets: number;
    retiredAssets: number;
    lostAssets: number;
    totalEmployees: number;
    activeAssignments: number;
    expiringWarranties: number;
    scheduledMaintenance: number;
    totalLicenses: number;
    expiringLicenses: number;
    totalCost: number;
  };
  assetsByCategory: { name: string; count: number }[];
  assetsByStatus: { name: string; count: number }[];
  recentAssets: Array<{
    id: string;
    assetTag: string;
    name: string;
    status: string;
    category: { name: string };
    department: { name: string };
    purchaseCost: number | null;
  }>;
  recentAssignments: Array<{
    id: string;
    assignedDate: string;
    asset: { assetTag: string; name: string; category: { name: string } };
    employee: { name: string; jobTitle: string };
  }>;
}

// ── Bento building blocks ───────────────────────────────────────────────────
// Every tile shares the same radius, padding, border and type scale; only the
// grid span changes. Spans are passed in as classes so the composition lives
// in one place (the grid below).

function Tile({
  className = "",
  tone = "plain",
  children,
}: {
  className?: string;
  tone?: "plain" | "hero" | "amber" | "rose";
  children: React.ReactNode;
}) {
  const toneClass = {
    plain: "bg-white",
    hero: "bg-gradient-to-br from-indigo-50 via-white to-violet-50",
    amber: "bg-gradient-to-br from-amber-50 to-white",
    rose: "bg-gradient-to-br from-rose-50 to-white",
  }[tone];
  return (
    <div
      className={`flex min-w-0 flex-col rounded-2xl border border-slate-200/70 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow duration-200 hover:shadow-md ${toneClass} ${className}`}
    >
      {children}
    </div>
  );
}

function TileHeader({
  icon: Icon,
  title,
  color,
  href,
  linkLabel = "View all",
}: {
  icon: React.ElementType;
  title: string;
  color: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: `${color}1a`, color }}>
          <Icon size={16} />
        </div>
        <h3 className="truncate text-sm font-semibold text-slate-700">{title}</h3>
      </div>
      {href && (
        <Link href={href} className="inline-flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline">
          {linkLabel} <ArrowRight size={13} />
        </Link>
      )}
    </div>
  );
}

// Compact single-number tile.
function MiniStat({
  className,
  label,
  value,
  icon: Icon,
  color,
  hint,
}: {
  className?: string;
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  hint?: string;
}) {
  return (
    <Tile className={`justify-between ${className ?? ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${color}1a`, color }}>
          <Icon size={14} />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {hint && <div className="mt-0.5 text-xs text-slate-500">{hint}</div>}
      </div>
    </Tile>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function shortDate(d: string): string {
  try {
    return format(parseISO(d), "dd MMM yyyy");
  } catch {
    return "—";
  }
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);

  async function fetchData() {
    try {
      const res = await fetch(`${BASE_PATH}/api/dashboard`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      const res = await fetch(`${BASE_PATH}/api/seed`, { method: "POST" });
      if (res.ok) {
        setSeeded(true);
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSeeding(false);
    }
  }

  useEffect(() => {
    fetchData();
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

  const isEmpty = !data || data.stats.totalAssets === 0;

  const header = (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="mb-1 text-xs font-medium uppercase tracking-wider text-indigo-600">
          {format(new Date(), "EEEE, d MMMM yyyy")}
        </div>
        <h1 className="page-title">IT Asset Dashboard</h1>
        <p className="page-subtitle">Overview of all IT department assets and resources</p>
      </div>
      <div className="flex items-center gap-3">
        {isEmpty && !seeded && (
          <button className="btn btn-primary" onClick={handleSeed} disabled={seeding}>
            {seeding ? "Loading demo data..." : "Load Demo Data"}
          </button>
        )}
        {seeded && <span className="text-sm font-medium text-green-600">✓ Demo data loaded!</span>}
      </div>
    </div>
  );

  if (isEmpty) {
    return (
      <div>
        {header}
        <div className="card empty-state">
          <Monitor size={48} className="mx-auto mb-3" style={{ color: "#d1d5db" }} />
          <div className="mb-1 text-lg font-medium text-slate-700">No assets yet</div>
          <div className="mb-4 text-sm text-slate-500">
            Get started by loading demo data or adding your first asset.
          </div>
          <button className="btn btn-primary mx-auto" onClick={handleSeed} disabled={seeding}>
            {seeding ? "Loading..." : "Load Demo Data"}
          </button>
        </div>
      </div>
    );
  }

  const { stats, assetsByCategory, assetsByStatus, recentAssets, recentAssignments } = data!;
  const statusTotal = assetsByStatus.reduce((s, d) => s + d.count, 0);
  const inService = stats.totalAssets - stats.retiredAssets;
  const assignedShare = inService > 0 ? Math.min(100, (stats.activeAssignments / inService) * 100) : 0;
  const categoryNames = assetsByCategory.map((c) => c.name).sort();

  return (
    <div>
      {header}

      {/*
        Bento grid
        ─ lg (12 cols):
          [ Hero: Total Assets 6×2       ][ Assigned 3 ][ Repair 3 ]
          [                              ][ Stock 2 ][ Disposed 2 ][ Staff 2 ]
          [ Assets by Category 8×2                  ][ Licenses 4  ]
          [                                         ][ Warranties 4]
          [ Recent Assets 7                ][ Active Assignments 5 ]
        ─ md (6 cols): hero & chart go full width, KPIs pair up 3+3 / 2+2+2.
        ─ base: single column in the same order (most important first).
      */}
      <div className="grid grid-flow-row-dense grid-cols-1 gap-5 md:grid-cols-6 lg:grid-cols-12">
        {/* ── Hero: Total assets + status breakdown ── */}
        <Tile tone="hero" className="md:col-span-6 lg:col-span-6 lg:row-span-2">
          <div className="flex h-full flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-indigo-600">
                <Monitor size={14} /> Total Assets
              </div>
              <div className="mt-2 text-5xl font-bold tracking-tight text-slate-900">
                {stats.totalAssets.toLocaleString("en-MY")}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                <span className="font-semibold text-emerald-600">{stats.activeAssets.toLocaleString("en-MY")}</span> active ·{" "}
                {inService.toLocaleString("en-MY")} in service
              </div>

              <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
                {assetsByStatus.map((s) => (
                  <div key={s.name} className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: ASSET_STATUS_CHART_COLORS[s.name] ?? NEUTRAL }} />
                      <span className="truncate">{s.name}</span>
                    </div>
                    <div className="text-lg font-semibold text-slate-800">
                      {s.count.toLocaleString("en-MY")}
                      <span className="ml-1 text-xs font-normal text-slate-400">
                        {statusTotal > 0 ? `${Math.round((s.count / statusTotal) * 100)}%` : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-5 text-xs text-slate-500">
                Value in service: <span className="font-semibold text-slate-700">RM {formatCurrency(stats.totalCost)}</span>
              </div>
            </div>

            <div className="relative mx-auto h-[220px] w-[220px] flex-shrink-0">
              <PieChart width={220} height={220}>
                <Pie
                  data={assetsByStatus}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={assetsByStatus.length > 1 ? 2 : 0}
                  stroke="#fff"
                  strokeWidth={2}
                  cornerRadius={4}
                >
                  {assetsByStatus.map((s) => (
                    <Cell key={s.name} fill={ASSET_STATUS_CHART_COLORS[s.name] ?? NEUTRAL} />
                  ))}
                </Pie>
                <Tooltip
                  content={<ChartTooltip total={statusTotal} format={(n) => `${n.toLocaleString("en-MY")} assets`} />}
                />
              </PieChart>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Status</div>
                <div className="text-sm font-bold text-slate-800">{assetsByStatus.length} groups</div>
              </div>
            </div>
          </div>
        </Tile>

        {/* ── Medium KPIs ── */}
        <Tile className="md:col-span-3 lg:col-span-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Assigned Assets</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
              <ArrowLeftRight size={16} />
            </div>
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.activeAssignments.toLocaleString("en-MY")}</div>
          <div className="mt-1 text-xs text-slate-500">to {stats.totalEmployees.toLocaleString("en-MY")} employees</div>
          <div className="mt-auto pt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" style={{ width: `${assignedShare}%` }} />
            </div>
            <div className="mt-1 text-[11px] text-slate-400">{Math.round(assignedShare)}% of assets in service</div>
          </div>
        </Tile>

        <Tile className="md:col-span-3 lg:col-span-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">In Repair</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Wrench size={16} />
            </div>
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.inRepairAssets.toLocaleString("en-MY")}</div>
          <div className="mt-1 text-xs text-slate-500">{stats.scheduledMaintenance} maintenance scheduled</div>
          <Link href="/maintenance" className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-semibold text-amber-700 hover:underline">
            Maintenance log <ArrowRight size={13} />
          </Link>
        </Tile>

        {/* ── Compact KPIs ── */}
        <MiniStat
          className="md:col-span-2 lg:col-span-2"
          label="In Stock"
          value={stats.inStockAssets.toLocaleString("en-MY")}
          icon={Package}
          color="#2a78d6"
          hint="available"
        />
        <MiniStat
          className="md:col-span-2 lg:col-span-2"
          label="Disposed"
          value={stats.retiredAssets.toLocaleString("en-MY")}
          icon={Archive}
          color="#64748b"
          hint="retired"
        />
        <MiniStat
          className="md:col-span-2 lg:col-span-2"
          label="Employees"
          value={stats.totalEmployees.toLocaleString("en-MY")}
          icon={Users}
          color="#1baf7a"
          hint="in directory"
        />

        {/* ── Primary chart ── */}
        <Tile className="md:col-span-6 lg:col-span-8 lg:row-span-2">
          <TileHeader icon={BarChart3} title="Assets by Category" color="#2a78d6" href="/assets" />
          <div className="flex flex-1 flex-col justify-end">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={assetsByCategory} margin={{ top: 24, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  content={<ChartTooltip total={stats.totalAssets} format={(n) => `${n.toLocaleString("en-MY")} assets`} />}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={72}>
                  {assetsByCategory.map((c) => (
                    <Cell key={c.name} fill={colorFor(categoryNames, c.name)} />
                  ))}
                  <LabelList dataKey="count" position="top" fontSize={12} fontWeight={600} fill="#334155" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Tile>

        {/* ── Attention tiles (stacked beside the chart) ── */}
        <Tile tone="rose" className="md:col-span-3 lg:col-span-4">
          <TileHeader icon={Key} title="Software Licenses" color="#e34948" href="/licenses" />
          <div className="mt-auto flex items-end justify-between gap-3">
            <div>
              <div className="text-3xl font-bold text-slate-900">{stats.totalLicenses.toLocaleString("en-MY")}</div>
              <div className="text-xs text-slate-500">licenses tracked</div>
            </div>
            {stats.expiringLicenses > 0 ? (
              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                {stats.expiringLicenses} expiring in 90 days
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 size={12} /> None expiring soon
              </span>
            )}
          </div>
        </Tile>

        <Tile tone="amber" className="md:col-span-3 lg:col-span-4">
          <TileHeader icon={ShieldAlert} title="Warranties" color="#d97706" href="/reports" linkLabel="Report" />
          <div className="mt-auto flex items-end justify-between gap-3">
            <div>
              <div className="text-3xl font-bold text-slate-900">{stats.expiringWarranties.toLocaleString("en-MY")}</div>
              <div className="text-xs text-slate-500">expiring in the next 90 days</div>
            </div>
            {stats.expiringWarranties > 0 ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Needs review</span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 size={12} /> All clear
              </span>
            )}
          </div>
        </Tile>

        {/* ── Activity lists (asymmetric 7 / 5) ── */}
        <Tile className="md:col-span-6 lg:col-span-7">
          <TileHeader icon={Monitor} title="Recent Assets" color="#4a3aa7" href="/assets" />
          <ul className="-mx-2 divide-y divide-slate-100">
            {recentAssets.map((asset) => (
              <li key={asset.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-slate-50">
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ background: colorFor(categoryNames, asset.category.name) }}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-800">{asset.name}</div>
                  <div className="truncate text-xs text-slate-400">
                    <span className="font-mono text-indigo-600">{asset.assetTag}</span> · {asset.category.name}
                  </div>
                </div>
                <span className={`badge flex-shrink-0 ${STATUS_COLORS[asset.status] ?? "bg-gray-100 text-gray-700"}`}>
                  {asset.status}
                </span>
              </li>
            ))}
          </ul>
        </Tile>

        <Tile className="md:col-span-6 lg:col-span-5">
          <TileHeader icon={Clock} title="Active Assignments" color="#0891b2" href="/assignments" />
          <ul className="-mx-2 divide-y divide-slate-100">
            {recentAssignments.map((a) => (
              <li key={a.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-slate-50">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 text-[11px] font-bold text-white">
                  {initials(a.employee.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-800">{a.employee.name}</div>
                  <div className="truncate text-xs text-slate-400">{a.employee.jobTitle}</div>
                </div>
                <div className="min-w-0 max-w-[45%] text-right">
                  <div className="truncate text-xs text-slate-600" title={a.asset.name}>
                    <span className="font-mono text-indigo-600">{a.asset.assetTag}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">since {shortDate(a.assignedDate)}</div>
                </div>
              </li>
            ))}
          </ul>
        </Tile>
      </div>
    </div>
  );
}
