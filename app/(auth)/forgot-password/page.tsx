"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Mail, CheckCircle } from "lucide-react";
import { BASE_PATH } from "@/lib/utils";
import Logo from "@/components/Logo";

export default function ForgotPasswordPage() {
  const [staffId, setStaffId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_PATH}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Request failed."); return; }
      setSent(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div style={{ width: 400 }}>
        <div className="card text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle size={48} color="#10b981" />
          </div>
          <h2 className="font-bold text-lg text-slate-800 mb-2">Check Your Email</h2>
          <p className="text-sm text-slate-500 mb-4">
            If your Staff ID is registered, a password reset link has been sent to your email address. The link expires in 1 hour.
          </p>
          <Link href="/login" className="btn btn-secondary justify-center w-full">
            Back to Sign In
          </Link>
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
        <h2 className="font-semibold text-slate-700 mb-2">Forgot Password</h2>
        <p className="text-sm text-slate-500 mb-6">
          Enter your Staff ID and we will send a reset link to your registered email.
        </p>

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
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full justify-center"
            disabled={loading}
          >
            <Mail size={16} />
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-5">
          Remembered your password?{" "}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
