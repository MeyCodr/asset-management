"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, CheckCircle2, Eye, EyeOff, User } from "lucide-react";
import { BASE_PATH } from "@/lib/utils";

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  staffId?: string;
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  minLength,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  minLength?: number;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          className="form-input pr-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          autoComplete={autoComplete}
          minLength={minLength}
          placeholder={placeholder ?? "••••••••"}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${BASE_PATH}/api/auth/me`)
      .then((r) => {
        if (r.status === 401) { router.replace("/login"); return null; }
        return r.ok ? r.json() : null;
      })
      .then(setUser);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_PATH}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to change password.");
      } else {
        setSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm">
        Loading...
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">View your account details and update your password.</p>
      </div>

      {/* Account details card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Blue top strip */}
        <div className="h-2" style={{ background: "linear-gradient(90deg, #3b82f6, #6366f1)" }} />
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div
              className="flex items-center justify-center rounded-full text-white font-bold text-lg shrink-0"
              style={{ width: 56, height: 56, background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
            >
              {initials}
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-800">{user.name}</div>
              <div className="text-sm text-slate-500 capitalize">{user.role}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <User size={15} className="text-slate-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Details</span>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {[
              { label: "Full Name", value: user.name },
              { label: "Staff ID", value: user.staffId ?? "—" },
              { label: "Email Address", value: user.email },
              { label: "Role", value: user.role.charAt(0).toUpperCase() + user.role.slice(1) },
            ].map(({ label, value }) => (
              <div key={label} className="space-y-0.5">
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</div>
                <div
                  className="text-sm font-medium text-slate-800 rounded-lg px-3 py-2 border border-slate-100"
                  style={{ background: "#f8fafc" }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Change password card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-2" style={{ background: "linear-gradient(90deg, #f59e0b, #ef4444)" }} />
        <div className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound size={17} className="text-amber-500" />
            <h2 className="text-base font-semibold text-slate-800">Change Password</h2>
          </div>
          <p className="text-xs text-slate-400 mb-5">
            Choose a strong password with at least 6 characters.
          </p>

          {success && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm mb-5">
              <CheckCircle2 size={16} className="shrink-0" />
              Password changed successfully.
            </div>
          )}

          {error && (
            <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordField
              id="currentPassword"
              label="Current Password"
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
              placeholder="Enter your current password"
            />

            <div className="grid grid-cols-2 gap-4">
              <PasswordField
                id="newPassword"
                label="New Password"
                value={newPassword}
                onChange={setNewPassword}
                autoComplete="new-password"
                minLength={6}
                placeholder="Min. 6 characters"
              />
              <PasswordField
                id="confirmPassword"
                label="Confirm New Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
                placeholder="Repeat new password"
              />
            </div>

            {/* Strength hint */}
            {newPassword.length > 0 && (
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((bar) => {
                  const strength =
                    newPassword.length >= 12
                      ? 4
                      : newPassword.length >= 9
                      ? 3
                      : newPassword.length >= 6
                      ? 2
                      : 1;
                  return (
                    <div
                      key={bar}
                      className="h-1.5 flex-1 rounded-full transition-all"
                      style={{
                        background:
                          bar <= strength
                            ? strength >= 4
                              ? "#22c55e"
                              : strength === 3
                              ? "#f59e0b"
                              : strength === 2
                              ? "#f97316"
                              : "#ef4444"
                            : "#e5e7eb",
                      }}
                    />
                  );
                })}
                <span className="text-xs text-slate-400 w-16 text-right">
                  {newPassword.length >= 12
                    ? "Strong"
                    : newPassword.length >= 9
                    ? "Good"
                    : newPassword.length >= 6
                    ? "Fair"
                    : "Weak"}
                </span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="btn"
                style={{ background: "#3b82f6", color: "#fff" }}
                disabled={loading}
              >
                {loading ? "Saving…" : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
