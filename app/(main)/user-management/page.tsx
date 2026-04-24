"use client";

import { useEffect, useState } from "react";
import { Users, Check, X, Trash2 } from "lucide-react";
import { BASE_PATH } from "@/lib/utils";
import ConfirmModal from "@/components/ConfirmModal";

interface User {
  id: string;
  name: string;
  email: string;
  staffId: string | null;
  role: string;
  status: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BASE_PATH}/api/auth/me`)
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => {
        if (me?.role === "admin") {
          setIsAdmin(true);
          fetchUsers();
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchUsers() {
    const res = await fetch(`${BASE_PATH}/api/users`);
    if (res.ok) setUsers(await res.json());
  }

  async function updateUser(id: string, data: { status?: string; role?: string }) {
    const res = await fetch(`${BASE_PATH}/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) fetchUsers();
  }

  async function deleteUser() {
    if (!deleteUserId) return;
    const res = await fetch(`${BASE_PATH}/api/users/${deleteUserId}`, { method: "DELETE" });
    setDeleteUserId(null);
    if (res.ok) fetchUsers();
  }

  const pending = users.filter((u) => u.status === "pending");

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Access restricted to administrators.
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage system users and roles</p>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-sm text-slate-700 mb-4 flex items-center gap-2">
          <Users size={16} color="#3b82f6" />
          Users ({users.length})
          {pending.length > 0 && (
            <span className="badge bg-amber-100 text-amber-700 ml-1">
              {pending.length} pending
            </span>
          )}
        </h3>

        {users.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-4">No users found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Staff ID</th>
                <th>Email</th>
                <th style={{ minWidth: 140 }}>Role</th>
                <th>Status</th>
                <th>Registered</th>
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="font-medium text-sm">{u.name}</td>
                  <td className="text-sm text-slate-500">{u.staffId ?? "—"}</td>
                  <td className="text-sm text-slate-500">{u.email}</td>
                  <td>
                    <select
                      className="form-input"
                      style={{ width: "auto", padding: "2px 28px 2px 8px", fontSize: 12 }}
                      value={u.role}
                      onChange={(e) => updateUser(u.id, { role: e.target.value })}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <span className={`badge ${STATUS_STYLES[u.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="text-xs text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      {u.status === "pending" && (
                        <>
                          <button
                            className="p-1.5 rounded hover:bg-green-50 text-slate-500 hover:text-green-600"
                            title="Approve"
                            onClick={() => updateUser(u.id, { status: "approved" })}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            className="p-1.5 rounded hover:bg-red-50 text-slate-500 hover:text-red-600"
                            title="Reject"
                            onClick={() => updateUser(u.id, { status: "rejected" })}
                          >
                            <X size={14} />
                          </button>
                        </>
                      )}
                      {u.status === "rejected" && (
                        <button
                          className="p-1.5 rounded hover:bg-green-50 text-slate-500 hover:text-green-600"
                          title="Re-approve"
                          onClick={() => updateUser(u.id, { status: "approved" })}
                        >
                          <Check size={14} />
                        </button>
                      )}
                      {u.status === "approved" && (
                        <button
                          className="p-1.5 rounded hover:bg-red-50 text-slate-500 hover:text-red-600"
                          title="Revoke access"
                          onClick={() => updateUser(u.id, { status: "rejected" })}
                        >
                          <X size={14} />
                        </button>
                      )}
                      <button
                        className="p-1.5 rounded hover:bg-red-50 text-slate-500 hover:text-red-600"
                        title="Delete user"
                        onClick={() => setDeleteUserId(u.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleteUserId && (
        <ConfirmModal
          title="Delete User"
          message="Are you sure you want to delete this user? This cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={deleteUser}
          onCancel={() => setDeleteUserId(null)}
        />
      )}
    </div>
  );
}
