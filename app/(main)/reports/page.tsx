"use client";

import { useEffect, useState } from "react";
import {
  Download,
  BarChart3,
  AlertTriangle,
  Boxes,
  UserCheck,
  ShieldCheck,
  KeyRound,
  Activity,
  Handshake,
  CalendarClock,
  Shield,
  Tag,
  Monitor,
  MemoryStick,
  FileText,
  CalendarRange,
  ClipboardList,
  CheckCircle2,
} from "lucide-react";
import { formatDate, STATUS_COLORS, BASE_PATH } from "@/lib/utils";
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
import { differenceInDays, parseISO } from "date-fns";
import {
  PALETTE,
  NEUTRAL,
  AXIS_TICK,
  ASSET_STATUS_CHART_COLORS,
  colorFor,
  ChartTooltip,
  ChartCard,
  KpiCard,
  Donut,
  DashboardHero,
  HERO_BUTTON_CLASS,
} from "@/components/DashboardUI";

interface Asset {
  id: string;
  assetTag: string;
  name: string;
  brand: string | null;
  model: string | null;
  status: string;
  assetStatus: string | null;
  operatingSystem: string | null;
  officeLicense: string | null;
  ram: string | null;
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
  renewalEnd: string | null;
  status: string;
  itSection: string | null;
  licenseType: string;
}

const REPORT_PAGE_SIZE = 50;
const SOON_DAYS = 90;

const WARRANTY_COLORS: Record<string, string> = {
  Active: PALETTE[2],
  [`Expiring ≤ ${SOON_DAYS}d`]: PALETTE[3],
  Expired: PALETTE[7],
  "Not recorded": NEUTRAL,
};

const OWNERSHIP_ORDER = ["Purchase", "Buyout", "Leasing"];
const OS_ORDER = ["Windows 11", "Windows 10", "Other"];

function formatCount(n: number): string {
  return n.toLocaleString("en-MY");
}

function formatAssets(n: number): string {
  return `${n.toLocaleString("en-MY")} asset${n !== 1 ? "s" : ""}`;
}

// Known values first (in list order), anything else after.
function orderIndex(order: string[], name: string): number {
  const i = order.indexOf(name);
  return i === -1 ? order.length : i;
}

function daysUntil(date: string): number {
  return differenceInDays(parseISO(date), new Date());
}

// Source data mixes "LEASING" / "Leasing" etc.
function normalizeOwnership(v: string | null): string {
  const key = (v ?? "").trim().toUpperCase();
  if (key === "PURCHASE") return "Purchase";
  if (key === "BUYOUT") return "Buyout";
  if (key === "LEASING") return "Leasing";
  return "Not Set";
}

function normalizeOS(v: string | null): string {
  const key = (v ?? "").trim().toUpperCase();
  if (!key) return "Not recorded";
  if (key === "WIN 11") return "Windows 11";
  if (key === "WIN 10") return "Windows 10";
  return "Other";
}

function normalizeOffice(v: string | null): string {
  const key = (v ?? "").trim().toUpperCase().replace(/\s*\(.*\)$/, "");
  if (!key) return "None";
  if (key === "MICROSOFT 365 BUSINESS STANDARD") return "M365 Business Std";
  const hb = key.match(/^MICROSOFT OFFICE HOME & BUSINESS (\d{4})$/);
  if (hb) return `Office H&B ${hb[1]}`;
  return key;
}

function ramToGb(v: string): number {
  const m = v.trim().match(/^([\d.]+)\s*(GB|TB)$/i);
  if (!m) return Number.POSITIVE_INFINITY;
  return parseFloat(m[1]) * (m[2].toUpperCase() === "TB" ? 1024 : 1);
}

function countBy<T>(items: T[], key: (item: T) => string | null | undefined): { name: string; value: number }[] {
  return Object.values(
    items.reduce<Record<string, { name: string; value: number }>>((acc, item) => {
      const k = key(item);
      if (!k) return acc;
      acc[k] ??= { name: k, value: 0 };
      acc[k].value += 1;
      return acc;
    }, {})
  );
}

function DaysBadge({ days }: { days: number }) {
  return (
    <span className={`badge ${days <= 30 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
      {days}d
    </span>
  );
}

function AlertTable({
  title,
  icon: Icon,
  accent,
  count,
  emptyText,
  children,
}: {
  title: string;
  icon: React.ElementType;
  accent: string;
  count: number;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card scroll-light" style={{ padding: 0, overflowX: "auto", borderTop: `3px solid ${accent}` }}>
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${accent}1a`, color: accent }}>
            <Icon size={16} />
          </div>
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        </div>
        <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: `${accent}1a`, color: accent }}>
          {count}
        </span>
      </div>
      {count === 0 ? (
        <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-slate-400">
          <CheckCircle2 size={28} className="text-emerald-400" />
          {emptyText}
        </div>
      ) : (
        <div className="max-h-[320px] overflow-y-auto">{children}</div>
      )}
    </div>
  );
}

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

  // ── Computed ──────────────────────────────────────────────────────────────
  // "Fleet" = assets still in service; disposed units are excluded from
  // warranty / OS / spec breakdowns since those no longer matter for them.
  const fleet = assets.filter((a) => a.status !== "Disposed");
  const disposedCount = assets.length - fleet.length;

  const byStatus = countBy(assets, (a) => a.status).sort((a, b) => b.value - a.value);

  const categoryNames = Array.from(new Set(assets.map((a) => a.category.name))).sort();
  const byCategory = countBy(assets, (a) => a.category.name).sort((a, b) => b.value - a.value);

  const byOwnership = countBy(fleet, (a) => normalizeOwnership(a.assetStatus)).sort(
    (a, b) => orderIndex(OWNERSHIP_ORDER, a.name) - orderIndex(OWNERSHIP_ORDER, b.name)
  );

  const byPurchaseYear = countBy(assets, (a) => a.purchaseDate?.slice(0, 4)).sort((a, b) => a.name.localeCompare(b.name));

  const warrantyBucket = (a: Asset) => {
    if (!a.warrantyExpiry) return "Not recorded";
    const d = daysUntil(a.warrantyExpiry);
    if (d < 0) return "Expired";
    if (d <= SOON_DAYS) return `Expiring ≤ ${SOON_DAYS}d`;
    return "Active";
  };
  const byWarranty = Object.keys(WARRANTY_COLORS)
    .map((name) => ({ name, value: fleet.filter((a) => warrantyBucket(a) === name).length }))
    .filter((d) => d.value > 0);
  const underWarranty = fleet.filter((a) => {
    const b = warrantyBucket(a);
    return b === "Active" || b.startsWith("Expiring");
  }).length;
  const warrantyExpired = fleet.filter((a) => warrantyBucket(a) === "Expired").length;

  const byBrand = countBy(fleet, (a) => a.brand?.trim().toUpperCase() || "Not recorded").sort((a, b) => b.value - a.value);

  const byOS = countBy(fleet, (a) => normalizeOS(a.operatingSystem)).sort(
    (a, b) => orderIndex(OS_ORDER, a.name) - orderIndex(OS_ORDER, b.name)
  );
  const win10Count = byOS.find((d) => d.name === "Windows 10")?.value ?? 0;

  const byRam = countBy(fleet, (a) => a.ram?.trim().toUpperCase()).sort((a, b) => ramToGb(a.name) - ramToGb(b.name));

  const byOffice = countBy(fleet, (a) => normalizeOffice(a.officeLicense)).sort((a, b) => b.value - a.value);

  const byRenewalYear = countBy(licenses, (l) => l.renewalEnd?.slice(0, 4)).sort((a, b) => a.name.localeCompare(b.name));
  const currentYear = String(new Date().getFullYear());

  const activeLicenses = licenses.filter((l) => l.status !== "Closed").length;

  const warrantyExpiring = fleet
    .filter((a) => a.warrantyExpiry && warrantyBucket(a).startsWith("Expiring"))
    .sort((a, b) => (a.warrantyExpiry ?? "").localeCompare(b.warrantyExpiry ?? ""));

  const licenseExpiring = licenses
    .filter((l) => {
      if (!l.renewalEnd || l.status === "Closed") return false;
      const days = daysUntil(l.renewalEnd);
      return days >= 0 && days <= SOON_DAYS;
    })
    .sort((a, b) => (a.renewalEnd ?? "").localeCompare(b.renewalEnd ?? ""));

  const unassigned = fleet.filter((a) => !a.assignments.find((x) => !x.returnedDate));
  const assignedCount = fleet.length - unassigned.length;

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
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
          Loading reports...
        </div>
      </div>
    );
  }

  return (
    <div>
      <DashboardHero
        badgeIcon={ClipboardList}
        badge="Analytics"
        title="Reports"
        subtitle="IT asset analytics and summaries"
        metricLabel="Assets in service"
        metricValue={`${formatCount(fleet.length)} / ${formatCount(assets.length)}`}
        gradient="linear-gradient(120deg, #312e81 0%, #6d28d9 40%, #c026d3 72%, #f97316 100%)"
        actions={
          <button className={HERO_BUTTON_CLASS} onClick={exportCSV}>
            <Download size={16} /> Export CSV
          </button>
        }
      />

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Assets"
          value={formatCount(assets.length)}
          icon={Boxes}
          from="#6366f1"
          to="#8b5cf6"
          subtext={`${formatCount(fleet.length)} in service · ${formatCount(disposedCount)} disposed`}
          share={assets.length > 0 ? (fleet.length / assets.length) * 100 : 0}
        />
        <KpiCard
          label="Assigned to Staff"
          value={formatCount(assignedCount)}
          icon={UserCheck}
          from="#2a78d6"
          to="#06b6d4"
          subtext={`${formatCount(unassigned.length)} unassigned & available`}
          share={fleet.length > 0 ? (assignedCount / fleet.length) * 100 : 0}
        />
        <KpiCard
          label="Under Warranty"
          value={formatCount(underWarranty)}
          icon={ShieldCheck}
          from="#10b981"
          to="#65a30d"
          subtext={`${formatCount(warrantyExpired)} expired · of ${formatCount(fleet.length)} in service`}
          share={fleet.length > 0 ? (underWarranty / fleet.length) * 100 : 0}
        />
        <KpiCard
          label="Active Licenses"
          value={formatCount(activeLicenses)}
          icon={KeyRound}
          from="#eb6834"
          to="#f59e0b"
          subtext={`of ${formatCount(licenses.length)} · ${licenseExpiring.length} renewal${licenseExpiring.length !== 1 ? "s" : ""} due in ${SOON_DAYS}d`}
          share={licenses.length > 0 ? (activeLicenses / licenses.length) * 100 : 0}
        />
      </div>

      {/* Charts */}
      <div className="mb-6 grid grid-flow-row-dense grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <ChartCard title="Status Distribution" subtitle="All assets" icon={Activity} accent="#1baf7a">
          <Donut
            data={byStatus}
            colors={(n) => ASSET_STATUS_CHART_COLORS[n] ?? NEUTRAL}
            centerLabel="Assets"
            centerValue={formatCount(assets.length)}
            format={formatAssets}
          />
        </ChartCard>

        <ChartCard title="Assets by Category" subtitle="All assets" icon={BarChart3} accent="#2a78d6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byCategory} margin={{ top: 20, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
              <Tooltip cursor={{ fill: "#f1f5f9" }} content={<ChartTooltip total={assets.length} format={formatAssets} />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={56}>
                {byCategory.map((d) => (
                  <Cell key={d.name} fill={colorFor(categoryNames, d.name)} />
                ))}
                <LabelList dataKey="value" position="top" fontSize={11} fill="#475569" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Ownership Type" subtitle="Assets in service" icon={Handshake} accent="#eb6834">
          <Donut
            data={byOwnership}
            colors={(n) => colorFor(OWNERSHIP_ORDER, n)}
            centerLabel="In service"
            centerValue={formatCount(fleet.length)}
            format={formatAssets}
          />
        </ChartCard>

        <ChartCard title="Assets by Purchase Year" subtitle="Shows the age profile of the fleet" icon={CalendarRange} accent="#4a3aa7" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byPurchaseYear} margin={{ top: 20, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="purchaseYearGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#4a3aa7" />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} interval={0} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
              <Tooltip cursor={{ fill: "#f5f3ff" }} content={<ChartTooltip format={formatAssets} />} />
              <Bar dataKey="value" fill="url(#purchaseYearGradient)" radius={[4, 4, 0, 0]} maxBarSize={40}>
                <LabelList dataKey="value" position="top" fontSize={10} fill="#475569" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Warranty Status" subtitle="Assets in service" icon={Shield} accent="#e34948">
          <Donut
            data={byWarranty}
            colors={(n) => WARRANTY_COLORS[n] ?? NEUTRAL}
            centerLabel="In service"
            centerValue={formatCount(fleet.length)}
            format={formatAssets}
          />
        </ChartCard>

        <ChartCard title="Assets by Brand" subtitle="Assets in service" icon={Tag} accent="#0891b2">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byBrand} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="brandGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#67e8f9" />
                  <stop offset="100%" stopColor="#0e7490" />
                </linearGradient>
              </defs>
              <CartesianGrid horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={90} tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "#ecfeff" }} content={<ChartTooltip total={fleet.length} format={formatAssets} />} />
              <Bar dataKey="value" fill="url(#brandGradient)" radius={[0, 4, 4, 0]} maxBarSize={24}>
                <LabelList dataKey="value" position="right" fontSize={11} fill="#475569" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Operating System" subtitle="Assets in service" icon={Monitor} accent="#2a78d6">
          <Donut
            data={byOS}
            colors={(n) => colorFor(OS_ORDER, n)}
            centerLabel="In service"
            centerValue={formatCount(fleet.length)}
            format={formatAssets}
          />
          {win10Count > 0 && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
              <span>
                <b>{formatCount(win10Count)}</b> device{win10Count !== 1 ? "s are" : " is"} still on Windows 10, which
                reached end of support in October 2025.
              </span>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Memory (RAM)" subtitle="Assets in service with RAM recorded" icon={MemoryStick} accent="#e87ba4">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byRam} margin={{ top: 20, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="ramGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f9a8d4" />
                  <stop offset="100%" stopColor="#db2777" />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
              <Tooltip cursor={{ fill: "#fdf2f8" }} content={<ChartTooltip format={formatAssets} />} />
              <Bar dataKey="value" fill="url(#ramGradient)" radius={[4, 4, 0, 0]} maxBarSize={40}>
                <LabelList dataKey="value" position="top" fontSize={10} fill="#475569" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Microsoft Office License" subtitle="Assets in service" icon={FileText} accent="#eda100" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byOffice} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="officeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#fcd34d" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>
              <CartesianGrid horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={140} tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "#fffbeb" }} content={<ChartTooltip total={fleet.length} format={formatAssets} />} />
              <Bar dataKey="value" fill="url(#officeGradient)" radius={[0, 4, 4, 0]} maxBarSize={24}>
                <LabelList dataKey="value" position="right" fontSize={11} fill="#475569" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="License Renewals by Year" subtitle={`Software licenses · ${currentYear} highlighted`} icon={CalendarClock} accent="#4a3aa7">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byRenewalYear} margin={{ top: 20, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "#f5f3ff" }}
                content={<ChartTooltip format={(n) => `${n} license${n !== 1 ? "s" : ""}`} />}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={44}>
                {byRenewalYear.map((d) => (
                  <Cell key={d.name} fill={d.name === currentYear ? "#4a3aa7" : "#a5b4fc"} />
                ))}
                <LabelList dataKey="value" position="top" fontSize={11} fill="#475569" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Alert Tables */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AlertTable
          title={`Warranties Expiring (next ${SOON_DAYS} days)`}
          icon={AlertTriangle}
          accent="#eda100"
          count={warrantyExpiring.length}
          emptyText={`No warranties expiring in the next ${SOON_DAYS} days.`}
        >
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
              {warrantyExpiring.map((a) => (
                <tr key={a.id} className="transition-colors hover:bg-amber-50/40">
                  <td>
                    <div className="font-mono text-xs text-blue-600">{a.assetTag}</div>
                    <div className="text-xs text-slate-500">{a.name}</div>
                  </td>
                  <td className="text-xs">{a.category.name}</td>
                  <td className="text-xs">{formatDate(a.warrantyExpiry)}</td>
                  <td><DaysBadge days={daysUntil(a.warrantyExpiry!)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </AlertTable>

        <AlertTable
          title={`License Renewals Due (next ${SOON_DAYS} days)`}
          icon={KeyRound}
          accent="#e34948"
          count={licenseExpiring.length}
          emptyText={`No license renewals due in the next ${SOON_DAYS} days.`}
        >
          <table>
            <thead>
              <tr>
                <th>License</th>
                <th>Section</th>
                <th>Renewal End</th>
                <th>Days Left</th>
              </tr>
            </thead>
            <tbody>
              {licenseExpiring.map((l) => (
                <tr key={l.id} className="transition-colors hover:bg-rose-50/40">
                  <td>
                    <div className="text-xs font-medium">{l.name}</div>
                    <div className="text-xs text-slate-400">{l.vendor}</div>
                  </td>
                  <td>
                    {l.itSection ? (
                      <span className="badge bg-violet-50 text-xs text-violet-700">{l.itSection}</span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="text-xs">{formatDate(l.renewalEnd)}</td>
                  <td><DaysBadge days={daysUntil(l.renewalEnd!)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </AlertTable>
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
          <div className="card scroll-light" style={{ padding: 0, overflowX: "auto", borderTop: "3px solid #6366f1" }}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                  <ClipboardList size={16} />
                </div>
                <h3 className="text-sm font-semibold text-slate-700">
                  Complete Asset Registry ({assets.length})
                  {assets.length > 0 && (
                    <span className="ml-2 font-normal text-slate-400">— showing {start}–{end}</span>
                  )}
                </h3>
              </div>
              <button
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                onClick={exportCSV}
              >
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
                  <th>Purchased</th>
                  <th>Warranty</th>
                  <th>Assigned To</th>
                </tr>
              </thead>
              <tbody>
                {pageAssets.map((a, idx) => {
                  const assignee = a.assignments.find((x) => !x.returnedDate)?.employee.name;
                  const warrantyExpired = a.warrantyExpiry != null && daysUntil(a.warrantyExpiry) < 0;
                  return (
                    <tr key={a.id} className="transition-colors hover:bg-indigo-50/40">
                      <td className="text-center text-xs text-slate-400">{start + idx}</td>
                      <td className="font-mono text-xs text-blue-600">{a.assetTag}</td>
                      <td>
                        <div className="text-sm font-medium">{a.name}</div>
                        {a.brand && <div className="text-xs text-slate-400">{a.brand}</div>}
                      </td>
                      <td className="text-sm">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ background: colorFor(categoryNames, a.category.name) }}
                          />
                          {a.category.name}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="text-sm text-slate-500">{formatDate(a.purchaseDate)}</td>
                      <td className={`text-sm ${warrantyExpired ? "text-red-600" : "text-slate-500"}`}>
                        {formatDate(a.warrantyExpiry)}
                      </td>
                      <td className="text-sm">{assignee ?? <span className="text-slate-400">Unassigned</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                <span className="text-xs text-slate-500">
                  Page {reportPage} of {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    className="btn btn-secondary px-2 py-1 text-xs"
                    disabled={reportPage === 1}
                    onClick={() => setReportPage((p) => p - 1)}
                  >
                    Previous
                  </button>
                  {pageButtons.map((p) =>
                    p < 0 ? (
                      <span key={p} className="px-1 text-xs text-slate-400">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setReportPage(p)}
                        className={`btn px-2 py-1 text-xs ${p === reportPage ? "!bg-indigo-600 !text-white" : "hover:bg-indigo-50"}`}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    className="btn btn-secondary px-2 py-1 text-xs"
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
