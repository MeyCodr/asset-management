"use client";

import { useState, FormEvent, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, CheckCircle } from "lucide-react";
import { BASE_PATH } from "@/lib/utils";
import Logo from "@/components/Logo";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_PATH}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Reset failed."); return; }
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div style={{ width: 400 }}>
        <div className="card text-center">
          <h2 className="font-bold text-lg text-slate-800 mb-2">Invalid Link</h2>
          <p className="text-sm text-slate-500 mb-4">This reset link is missing or invalid.</p>
          <Link href="/forgot-password" className="btn btn-primary justify-center w-full">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ width: 400 }}>
        <div className="card text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle size={48} color="#10b981" />
          </div>
          <h2 className="font-bold text-lg text-slate-800 mb-2">Password Updated</h2>
          <p className="text-sm text-slate-500">Your password has been reset. Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-10" style={{ width: 1060 }}>
      <div className="shrink-0">
        <Logo width={600} />
      </div>

      <div className="card" style={{ flex: 1 }}>
        <h2 className="font-semibold text-slate-700 mb-2">Set New Password</h2>
        <p className="text-sm text-slate-500 mb-6">Choose a new password for your account.</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm text-red-700" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.confirm}
              onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full justify-center"
            disabled={loading}
          >
            <KeyRound size={16} />
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-slate-400">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
