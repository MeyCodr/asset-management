"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Monitor,
  Users,
  ArrowLeftRight,
  Wrench,
  Key,
  AlertTriangle,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { formatCurrency, formatDate, STATUS_COLORS, BASE_PATH } from "@/lib/utils";
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
} from "recharts";

const PIE_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#84cc16",
];

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
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  const isEmpty = !data || data.stats.totalAssets === 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">IT Asset Dashboard</h1>
          <p className="page-subtitle">
            Overview of all IT department assets and resources
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isEmpty && !seeded && (
            <button
              className="btn btn-primary"
              onClick={handleSeed}
              disabled={seeding}
            >
              {seeding ? "Loading demo data..." : "Load Demo Data"}
            </button>
          )}
          {seeded && (
            <span className="text-green-600 text-sm font-medium">
              ✓ Demo data loaded!
            </span>
          )}
        </div>
      </div>

      {isEmpty ? (
        <div className="card empty-state">
          <Monitor
            size={48}
            className="mx-auto mb-3"
            style={{ color: "#d1d5db" }}
          />
          <div className="text-lg font-medium text-slate-700 mb-1">
            No assets yet
          </div>
          <div className="text-sm text-slate-500 mb-4">
            Get started by loading demo data or adding your first asset.
          </div>
          <button
            className="btn btn-primary mx-auto"
            onClick={handleSeed}
            disabled={seeding}
          >
            {seeding ? "Loading..." : "Load Demo Data"}
          </button>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div
            className="grid gap-4 mb-6"
            style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
          >
            <StatCard
              label="Total Assets"
              value={data!.stats.totalAssets}
              icon={Monitor}
              color="#3b82f6"
              subtext={`${data!.stats.activeAssets} active`}
            />
            <StatCard
              label="Total Value"
              value={formatCurrency(data!.stats.totalCost)}
              icon={DollarSign}
              color="#10b981"
            />
            <StatCard
              label="Assigned Assets"
              value={data!.stats.activeAssignments}
              icon={ArrowLeftRight}
              color="#8b5cf6"
              subtext={`to ${data!.stats.totalEmployees} employees`}
            />
            <StatCard
              label="Repair"
              value={data!.stats.inRepairAssets}
              icon={Wrench}
              color="#f59e0b"
              subtext={`${data!.stats.scheduledMaintenance} scheduled`}
            />
          </div>

          {/* Alert Row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div
              className="card flex items-center gap-3 py-3"
              style={{ borderLeft: "4px solid #f59e0b" }}
            >
              <AlertTriangle size={20} color="#f59e0b" />
              <div>
                <div className="font-semibold text-sm">
                  {data!.stats.expiringWarranties} warranties
                </div>
                <div className="text-xs text-slate-500">
                  expiring in 90 days
                </div>
              </div>
            </div>
            <div
              className="card flex items-center gap-3 py-3"
              style={{ borderLeft: "4px solid #ef4444" }}
            >
              <Key size={20} color="#ef4444" />
              <div>
                <div className="font-semibold text-sm">
                  {data!.stats.expiringLicenses} licenses
                </div>
                <div className="text-xs text-slate-500">
                  expiring in 90 days
                </div>
              </div>
            </div>
            <div
              className="card flex items-center gap-3 py-3"
              style={{ borderLeft: "4px solid #3b82f6" }}
            >
              <TrendingUp size={20} color="#3b82f6" />
              <div>
                <div className="font-semibold text-sm">
                  {data!.stats.inStockAssets} assets
                </div>
                <div className="text-xs text-slate-500">available in stock</div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="card">
              <h3 className="font-semibold text-sm text-slate-700 mb-4">
                Assets by Category
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={data!.assetsByCategory}
                  margin={{ top: 0, right: 0, bottom: 0, left: -20 }}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="font-semibold text-sm text-slate-700 mb-4">
                Asset Status Distribution
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={data!.assetsByStatus}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={75}
                  >
                    {data!.assetsByStatus.map((_, i) => (
                      <Cell
                        key={i}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent tables */}
          <div className="grid grid-cols-2 gap-6">
            <div className="card" style={{ padding: 0, overflowX: "auto" }}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-sm text-slate-700">
                  Recent Assets
                </h3>
                <Link href="/assets" className="text-xs text-blue-600 hover:underline">
                  View all →
                </Link>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Tag</th>
                    <th>Name</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.recentAssets.map((asset) => (
                    <tr key={asset.id}>
                      <td className="font-mono text-xs text-blue-600">
                        {asset.assetTag}
                      </td>
                      <td>
                        <div className="font-medium text-xs">{asset.name}</div>
                        <div className="text-xs text-slate-400">
                          {asset.category.name}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${STATUS_COLORS[asset.status] ?? "bg-gray-100 text-gray-700"}`}
                        >
                          {asset.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card" style={{ padding: 0, overflowX: "auto" }}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-sm text-slate-700">
                  Active Assignments
                </h3>
                <Link href="/assignments" className="text-xs text-blue-600 hover:underline">
                  View all →
                </Link>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Asset</th>
                    <th>Since</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.recentAssignments.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div className="font-medium text-xs">
                          {a.employee.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {a.employee.jobTitle}
                        </div>
                      </td>
                      <td>
                        <div className="text-xs">{a.asset.name}</div>
                        <div className="text-xs text-slate-400">
                          {a.asset.assetTag}
                        </div>
                      </td>
                      <td className="text-xs text-slate-500">
                        {formatDate(a.assignedDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stats footer */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <StatCard
              label="Software Licenses"
              value={data!.stats.totalLicenses}
              icon={Key}
              color="#06b6d4"
            />
            <StatCard
              label="Employees"
              value={data!.stats.totalEmployees}
              icon={Users}
              color="#8b5cf6"
            />
            <StatCard
              label="Disposed Assets"
              value={data!.stats.retiredAssets}
              icon={Monitor}
              color="#6b7280"
            />
          </div>
        </>
      )}
    </div>
  );
}
