"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, CheckCircle, Clock } from "lucide-react";
import { BASE_PATH } from "@/lib/utils";
import Logo from "@/components/Logo";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", staffId: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "approved">("idle");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_PATH}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, staffId: form.staffId, email: form.email, password: form.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Registration failed.");
        return;
      }

      if (data.status === "approved") {
        // First user → admin, auto-logged in
        setStatus("approved");
        setTimeout(() => router.push("/"), 1500);
      } else {
        setStatus("pending");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "approved") {
    return (
      <div style={{ width: 400 }}>
        <div className="card text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle size={48} color="#10b981" />
          </div>
          <h2 className="font-bold text-lg text-slate-800 mb-2">Account Created!</h2>
          <p className="text-sm text-slate-500">
            You are the first user and have been set as administrator. Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div style={{ width: 400 }}>
        <div className="card text-center">
          <div className="flex justify-center mb-4">
            <Clock size={48} color="#f59e0b" />
          </div>
          <h2 className="font-bold text-lg text-slate-800 mb-2">Request Submitted</h2>
          <p className="text-sm text-slate-500 mb-4">
            Your account is pending administrator approval. You will be able to log in once an admin approves your request.
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
      {/* Logo */}
      <div className="shrink-0">
        <Logo width={600} />
      </div>

      {/* Card */}
      <div className="card" style={{ flex: 1 }}>
        <h2 className="font-semibold text-slate-700 mb-6">Create Account</h2>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm text-red-700" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="John Smith"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="form-label">Staff ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. PHN-001"
                value={form.staffId}
                onChange={(e) => setForm((f) => ({ ...f, staffId: e.target.value }))}
              />
            </div>
            <div className="col-span-2">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@phn.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.confirm}
                onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                required
              />
            </div>
          </div>

          <div
            className="p-3 rounded-lg text-xs text-amber-700 mb-4"
            style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
          >
            Your account will require admin approval before you can sign in.
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full justify-center"
            disabled={loading}
          >
            <UserPlus size={16} />
            {loading ? "Submitting..." : "Request Access"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
