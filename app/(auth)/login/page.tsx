"use client";

import { Suspense, useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { BASE_PATH } from "@/lib/utils";
import Logo from "@/components/Logo";

// Redirecting after login to a URL supplied by the caller (?redirect=...) is an
// open-redirect risk if left unchecked, so only same-host (any port — local dev
// commonly runs each app on a different port) or an explicitly allow-listed
// production origin may be used as a target.
function isAllowedRedirectOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return true;
    const allowed = (process.env.NEXT_PUBLIC_ALLOWED_REDIRECT_ORIGINS ?? "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    return allowed.includes(url.origin);
  } catch {
    return false;
  }
}

function safeRedirectTarget(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return isAllowedRedirectOrigin(url.origin) ? url.toString() : null;
  } catch {
    return null;
  }
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = safeRedirectTarget(searchParams.get("redirect"));
  const [form, setForm] = useState({ staffId: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  function goToTarget() {
    if (redirectTarget) {
      window.location.href = redirectTarget;
    } else {
      router.push("/");
    }
  }

  // Already signed in (e.g. following a link with ?redirect=... while a valid
  // session cookie is still present) — skip the form and bounce straight through.
  useEffect(() => {
    let cancelled = false;
    fetch(`${BASE_PATH}/api/auth/me`)
      .then((res) => {
        if (cancelled) return;
        if (res.ok) {
          goToTarget();
        } else {
          setCheckingSession(false);
        }
      })
      .catch(() => {
        if (!cancelled) setCheckingSession(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${BASE_PATH}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Login failed.");
        return;
      }

      goToTarget();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return null;
  }

  return (
    <div className="flex items-center gap-10" style={{ width: 1060 }}>
      {/* Logo */}
      <div className="shrink-0">
        <Logo width={600} />
      </div>

      {/* Card */}
      <div className="card" style={{ flex: 1 }}>
        <h2 className="font-semibold text-slate-700 mb-6">Sign In</h2>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm text-red-700" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Staff ID</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. M0750"
              value={form.staffId}
              onChange={(e) => setForm((f) => ({ ...f, staffId: e.target.value }))}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
            />
          </div>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full justify-center"
            style={{ marginTop: 8 }}
            disabled={loading}
          >
            <LogIn size={16} />
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-5">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-blue-600 hover:underline font-medium">
            Request access
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
