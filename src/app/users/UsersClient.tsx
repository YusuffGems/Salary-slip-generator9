"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, X, Loader2, ShieldCheck, Copy, Check } from "lucide-react";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const roleStyles: Record<string, string> = {
  ADMIN: "bg-brand-600/20 text-brand-400",
  MANAGER: "bg-amber-500/15 text-amber-500",
  USER: "bg-white/10 text-[var(--text-secondary)]",
};

export default function UsersClient({
  initialUsers,
  currentUserId,
}: {
  initialUsers: UserRow[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MANAGER" | "USER">("MANAGER");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to create user");
        return;
      }
      setUsers((prev) => [...prev, json.user]);
      toast.success("User created");
      setCreatedCreds({ email, password });
      setFormOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setRole("MANAGER");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, userName: string) {
    if (!confirm(`Remove ${userName}'s account? They will no longer be able to sign in.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to remove user");
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("User removed");
    } finally {
      setDeletingId(null);
    }
  }

  function copyCredentials() {
    if (!createdCreds) return;
    navigator.clipboard.writeText(`Email: ${createdCreds.email}\nPassword: ${createdCreds.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-[var(--text-secondary)]">{users.length} accounts</p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-card hover:bg-brand-700"
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="glass-card overflow-x-auto rounded-2xl shadow-card">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-[var(--text-secondary)]">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 font-medium">
                  {u.name}
                  {u.id === currentUserId && <span className="ml-2 text-xs text-[var(--text-secondary)]">(you)</span>}
                </td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${roleStyles[u.role]}`}>
                    {u.role === "ADMIN" && <ShieldCheck size={12} />}
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {u.id !== currentUserId && (
                    <button
                      onClick={() => handleDelete(u.id, u.name)}
                      disabled={deletingId === u.id}
                      className="rounded-lg p-2 text-rose-500 hover:bg-rose-500/10 disabled:opacity-50"
                      title="Remove user"
                    >
                      {deletingId === u.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <div
          onClick={() => setFormOpen(false)}
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
            backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: "#14162b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, width: "100%", maxWidth: 420, padding: 24 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Add User</h2>
              <button onClick={() => setFormOpen(false)}><X size={18} className="text-white" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Full Name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Password</label>
                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value as any)} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-brand-500">
                  <option value="ADMIN" style={{ color: "#000" }}>Admin - full access</option>
                  <option value="MANAGER" style={{ color: "#000" }}>Manager - day-to-day operations</option>
                  <option value="USER" style={{ color: "#000" }}>User - view only</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                {saving ? "Creating..." : "Create User"}
              </button>
            </form>
          </div>
        </div>
      )}

      {createdCreds && (
        <div
          onClick={() => setCreatedCreds(null)}
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
            backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: "#14162b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, width: "100%", maxWidth: 420, padding: 24 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">User Created — Share These Details</h2>
              <button onClick={() => setCreatedCreds(null)}><X size={18} className="text-white" /></button>
            </div>
            <p className="mb-4 text-xs text-[var(--text-secondary)]">
              Copy this now — for security, the password cannot be shown again after you close this window.
            </p>
            <div className="mb-4 space-y-2 rounded-lg border border-white/10 bg-white/5 p-4 font-mono text-sm text-white">
              <p>Email: {createdCreds.email}</p>
              <p>Password: {createdCreds.password}</p>
            </div>
            <button
              onClick={copyCredentials}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}