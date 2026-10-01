"use client";

import Link from "next/link";
import { Filter, X } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

// Validated categorical palette (fixed order — CVD-safe for adjacent bars).
// Colors are assigned by entity (its position in a fixed option list), never by
// rank, so filtering never repaints a category.
export const PALETTE = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];
export const NEUTRAL = "#94a3b8";

// Matches the status badge colors used elsewhere (Check In blue, Check Out green,
// Repair yellow, Disposed gray).
export const ASSET_STATUS_CHART_COLORS: Record<string, string> = {
  "Check In": PALETTE[0],
  "Check Out": PALETTE[2],
  Repair: PALETTE[3],
  Disposed: NEUTRAL,
};

export const AXIS_TICK = { fontSize: 11, fill: "#64748b" };

export function colorFor(list: readonly string[], name: string): string {
  const i = list.indexOf(name);
  return i >= 0 ? PALETTE[i % PALETTE.length] : NEUTRAL;
}

export function formatRM(n: number): string {
  return `RM ${n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return `${n}`;
}

interface TooltipEntry {
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: { fill?: string; name?: string };
}

export function ChartTooltip({
  active,
  payload,
  label,
  total,
  format = formatRM,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  total?: number;
  format?: (n: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const value = Number(entry.value ?? 0);
  const name = entry.payload?.name ?? label ?? entry.name;
  const color = entry.payload?.fill ?? entry.color ?? PALETTE[0];
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        {name}
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{format(value)}</div>
      {total ? (
        <div className="text-xs text-slate-500">{((value / total) * 100).toFixed(1)}% of total</div>
      ) : null}
    </div>
  );
}

export const HERO_BUTTON_CLASS =
  "inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow transition hover:bg-indigo-50";

export function DashboardHero({
  badgeIcon: BadgeIcon,
  badge,
  title,
  subtitle,
  metricLabel,
  metricValue,
  linkHref,
  linkLabel,
  linkIcon: LinkIcon,
  gradient,
  actions,
}: {
  badgeIcon: React.ElementType;
  badge: string;
  title: string;
  subtitle: string;
  metricLabel?: string;
  metricValue?: string;
  linkHref?: string;
  linkLabel?: string;
  linkIcon?: React.ElementType;
  gradient: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl p-6 text-white shadow-lg" style={{ background: gradient }}>
      <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-20 right-40 h-48 w-48 rounded-full bg-white/10" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <BadgeIcon size={13} /> {badge}
          </div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-white/80">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {metricValue && (
            <div className="rounded-xl bg-white/15 px-5 py-3 backdrop-blur">
              <div className="text-xs font-medium uppercase tracking-wide text-white/75">{metricLabel}</div>
              <div className="text-2xl font-bold">{metricValue}</div>
            </div>
          )}
          {linkHref && (
            <Link href={linkHref} className={HERO_BUTTON_CLASS}>
              {LinkIcon && <LinkIcon size={16} />} {linkLabel}
            </Link>
          )}
          {actions}
        </div>
      </div>
    </div>
  );
}

export function FilterPanel({
  activeCount,
  onClear,
  children,
}: {
  activeCount: number;
  onClear: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Row 1: title + clear */}
      <div className="mb-3 flex min-h-[32px] items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <Filter size={14} />
          </div>
          Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">{activeCount}</span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
            onClick={onClear}
          >
            <X size={13} /> Clear filters
          </button>
        )}
      </div>
      {/* Row 2: every dropdown shares one row, each taking an equal slice
          (wraps only on narrow screens) */}
      <div className="flex flex-wrap gap-3 lg:flex-nowrap [&>select]:min-w-[140px] [&>select]:flex-1 lg:[&>select]:min-w-0">
        {children}
      </div>
    </div>
  );
}

export const filterSelectClass = (active: boolean) =>
  `form-input transition-colors ${active ? "!border-indigo-400 !bg-indigo-50 !text-indigo-800 font-medium" : ""}`;

export function ChartCard({
  title,
  subtitle,
  icon: Icon,
  accent,
  className = "",
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  accent: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`card relative overflow-hidden transition-shadow duration-200 hover:shadow-lg ${className}`}
      style={{ borderTop: `3px solid ${accent}` }}
    >
      <div className="mb-4 flex items-center gap-2.5">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: `${accent}1a`, color: accent }}
        >
          <Icon size={16} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
          {subtitle && <div className="text-xs text-slate-400">{subtitle}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  from,
  to,
  subtext,
  share,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  from: string;
  to: string;
  subtext?: string;
  share?: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div
        className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-15"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      />
      <div className="relative flex items-start gap-4">
        <div
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-white shadow-md"
          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
        >
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
          <div className="mt-1 truncate text-2xl font-bold text-slate-900">{value}</div>
          {subtext && <div className="mt-1 text-xs text-slate-500">{subtext}</div>}
          {share != null && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min(share, 100)}%`, background: `linear-gradient(90deg, ${from}, ${to})` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Donut({
  data,
  colors,
  centerLabel,
  centerValue,
  format = formatRM,
}: {
  data: { name: string; value: number }[];
  colors: (name: string) => string;
  centerLabel: string;
  centerValue: string;
  format?: (n: number) => string;
}) {
  const sum = data.reduce((s, d) => s + d.value, 0);
  return (
    <div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={190}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={82}
              paddingAngle={data.length > 1 ? 2 : 0}
              stroke="#fff"
              strokeWidth={2}
              cornerRadius={4}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={colors(d.name)} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip total={sum} format={format} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{centerLabel}</div>
          <div className="text-sm font-bold text-slate-900">{centerValue}</div>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: colors(d.name) }} />
              {d.name}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">{format(d.value)}</span>
              <span className="w-10 text-right text-slate-500">{sum > 0 ? `${Math.round((d.value / sum) * 100)}%` : "—"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
