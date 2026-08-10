"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Monitor,
  Users,
  ArrowLeftRight,
  Wrench,
  Key,
  BarChart3,
  Settings,
  LogOut,
  UserCog,
  AlertTriangle,
  Receipt,
  Landmark,
  ChevronDown,
  ChevronUp,
  Table2,
} from "lucide-react";
import { BASE_PATH } from "@/lib/utils";

interface NavChild {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavItem {
  href?: string;
  label: string;
  icon: React.ElementType;
  children?: NavChild[];
}

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assets", label: "Assets", icon: Monitor },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/assignments", label: "Assignments", icon: ArrowLeftRight },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/licenses", label: "Licenses", icon: Key },
  {
    label: "IT Expenses",
    icon: Receipt,
    children: [
      { href: "/expenses/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/expenses", label: "Expense Records", icon: Table2 },
    ],
  },
  { href: "/fin-assets", label: "IT Fin Asset", icon: Landmark },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

// 30 minutes inactivity → show warning; 60 s to act before forced logout
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_COUNTDOWN_S = 60;
// Warn 5 minutes before absolute session expiry
const SESSION_WARN_BEFORE_S = 5 * 60;

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  exp?: number;
}

function formatSeconds(s: number) {
  if (s >= 60) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${s}s`;
}

function isGroupActive(item: NavItem, pathname: string): boolean {
  if (!item.children) return false;
  return item.children.some((c) => pathname === c.href);
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
const [user, setUser] = useState<CurrentUser | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_COUNTDOWN_S);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [sessionCountdown, setSessionCountdown] = useState(SESSION_WARN_BEFORE_S);

  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionWarnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionLogoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionCountdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-expand a submenu group when navigating to one of its child routes
  useEffect(() => {
    const active = navItems.find((item) => isGroupActive(item, pathname));
    if (active) {
      setExpandedGroups((prev) => new Set(prev).add(active.label));
    }
  }, [pathname]);

  function toggleGroup(label: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  useEffect(() => {
    fetch(`${BASE_PATH}/api/auth/me`)
      .then((r) => {
        if (r.status === 401) {
          router.replace("/login");
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((data: CurrentUser | null) => {
        setUser(data);
        if (!data?.exp) return;

        const msLeft = data.exp * 1000 - Date.now();
        if (msLeft <= 0) { handleLogout(); return; }

        const msUntilWarn = msLeft - SESSION_WARN_BEFORE_S * 1000;
        if (msUntilWarn > 0) {
          sessionWarnTimer.current = setTimeout(() => {
            setSessionWarning(true);
            setSessionCountdown(SESSION_WARN_BEFORE_S);
          }, msUntilWarn);
        } else {
          setSessionWarning(true);
          setSessionCountdown(Math.ceil(msLeft / 1000));
        }

        sessionLogoutTimer.current = setTimeout(() => {
          handleLogout();
        }, msLeft);
      })
      .catch(() => null);

    return () => {
      if (sessionWarnTimer.current) clearTimeout(sessionWarnTimer.current);
      if (sessionLogoutTimer.current) clearTimeout(sessionLogoutTimer.current);
      if (sessionCountdownTimer.current) clearInterval(sessionCountdownTimer.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLogout() {
    await fetch(`${BASE_PATH}/api/auth/logout`, { method: "POST" });
    router.push("/login");
  }

  // Reset idle timer on any user activity
  function resetIdle() {
    if (showWarning) return; // don't reset once warning is shown — user must click Stay
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(WARNING_COUNTDOWN_S);
    }, IDLE_TIMEOUT_MS);
  }

  // Start countdown when warning appears
  useEffect(() => {
    if (!showWarning) return;
    if (idleTimer.current) clearTimeout(idleTimer.current);
    countdownTimer.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(countdownTimer.current!);
          handleLogout();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(countdownTimer.current!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showWarning]);

  // Session expiry countdown
  useEffect(() => {
    if (!sessionWarning) return;
    sessionCountdownTimer.current = setInterval(() => {
      setSessionCountdown((c) => {
        if (c <= 1) { clearInterval(sessionCountdownTimer.current!); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(sessionCountdownTimer.current!);
  }, [sessionWarning]);

  // Attach / detach activity listeners
  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }));
    resetIdle(); // start timer immediately on mount
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdle));
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleStayLoggedIn() {
    setShowWarning(false);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    resetIdle();
  }

  return (
    <>
    {/* Inactivity warning modal */}
    {showWarning && !sessionWarning && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.5)" }}
      >
        <div className="bg-white rounded-xl shadow-2xl p-6 w-80 text-center">
          <div className="flex justify-center mb-3">
            <AlertTriangle size={36} color="#f59e0b" />
          </div>
          <h2 className="text-base font-bold text-slate-800 mb-1">Still there?</h2>
          <p className="text-sm text-slate-500 mb-4">
            You have been inactive. You will be logged out in{" "}
            <span className="font-bold text-red-600">{countdown}s</span>.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleStayLoggedIn}
              className="btn flex-1"
              style={{ background: "#3b82f6", color: "#fff", borderColor: "#3b82f6" }}
            >
              Stay Logged In
            </button>
            <button onClick={handleLogout} className="btn btn-secondary flex-1">
              Log Out
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Session expiry warning modal */}
    {sessionWarning && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.5)" }}
      >
        <div className="bg-white rounded-xl shadow-2xl p-6 w-80 text-center">
          <div className="flex justify-center mb-3">
            <AlertTriangle size={36} color="#dc2626" />
          </div>
          <h2 className="text-base font-bold text-slate-800 mb-1">Session Expiring</h2>
          <p className="text-sm text-slate-500 mb-4">
            Your session will expire in{" "}
            <span className="font-bold text-red-600">{formatSeconds(sessionCountdown)}</span>.
            You will be automatically logged out.
          </p>
          <button onClick={handleLogout} className="btn btn-secondary w-full">
            Log Out Now
          </button>
        </div>
      </div>
    )}
    <aside
      style={{ width: 240, minWidth: 240, background: "#1e293b" }}
      className="flex flex-col h-full"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div
          className="flex items-center justify-center rounded-lg overflow-hidden"
          style={{ width: 36, height: 36 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${BASE_PATH}/PHNIAMS_shield.png`} alt="PHNIAMS" style={{ width: 36, height: 36, objectFit: "contain" }} />
        </div>
        <div>
          <div className="text-white font-semibold text-sm leading-none">
            IT Assets
          </div>
          <div className="text-slate-400 text-xs mt-0.5">Management System</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-3">
          Main Menu
        </div>
        {navItems.map((item) => {
          if (item.children) {
            const isOpen = expandedGroups.has(item.label);
            const isActive = isGroupActive(item, pathname);
            const GroupIcon = item.icon;
            return (
              <div key={item.label}>
                <button
                  type="button"
                  onClick={() => toggleGroup(item.label)}
                  className={`sidebar-link w-full ${isActive ? "active" : ""}`}
                  style={{ background: "none", border: "none", cursor: "pointer", justifyContent: "space-between" }}
                >
                  <span className="flex items-center gap-3">
                    <GroupIcon size={17} />
                    {item.label}
                  </span>
                  {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {isOpen && (
                  <div className="mt-0.5 space-y-0.5">
                    {item.children.map((child) => {
                      const childActive = pathname === child.href;
                      const ChildIcon = child.icon;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`sidebar-link text-sm ${childActive ? "active" : ""}`}
                          style={{ paddingLeft: "2.25rem" }}
                        >
                          <ChildIcon size={15} />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const href = item.href!;
          const Icon = item.icon;
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-link ${isActive ? "active" : ""}`}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10 space-y-0.5">
        {user?.role === "admin" && (
          <Link
            href="/settings"
            className={`sidebar-link ${pathname.startsWith("/settings") ? "active" : ""}`}
          >
            <Settings size={17} />
            Settings
          </Link>
        )}

        {user?.role === "admin" && (
          <Link
            href="/user-management"
            className={`sidebar-link ${pathname.startsWith("/user-management") ? "active" : ""}`}
          >
            <UserCog size={17} />
            User Management
          </Link>
        )}

        {/* Current user */}
        {user && (
          <div className="mt-3 px-3 py-2 rounded-lg" style={{ background: "#0f172a" }}>
            <Link href="/profile" className="flex items-center gap-2 mb-2 group">
              <div
                className="flex items-center justify-center rounded-full text-white text-xs font-bold shrink-0"
                style={{ width: 28, height: 28, background: "#3b82f6" }}
              >
                {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-white text-xs font-medium truncate group-hover:text-blue-300 transition-colors">{user.name}</div>
                <div className="text-slate-400 text-xs capitalize">{user.role}</div>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-red-400 transition-colors w-full"
            >
              <LogOut size={13} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
    </>
  );
}
