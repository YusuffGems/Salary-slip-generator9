"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [alreadySetUp, setAlreadySetUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/setup/create-first-admin")
      .then((res) => res.json())
      .then((json) => {
        setAlreadySetUp(!!json.setupComplete);
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/setup/create-first-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to create admin account");
        setSubmitting(false);
        return;
      }
      toast.success("Admin account created — you can now sign in");
      router.push("/login");
    } catch {
      toast.error("Something went wrong");
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0e1a]">
        <Loader2 size={24} className="animate-spin text-white" />
      </div>
    );
  }

  if (alreadySetUp) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0e1a] p-4">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#14162b] p-8 text-center shadow-2xl">
          <ShieldCheck size={32} className="mx-auto mb-3 text-emerald-500" />
          <h1 className="mb-2 text-lg font-semibold text-white">Setup Already Complete</h1>
          <p className="mb-5 text-sm text-[var(--text-secondary)]">
            An admin account already exists for this app. Please sign in instead.
          </p>
          
            href="/login"
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Go to Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0e1a] p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#14162b] p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-semibold text-white">Create Admin Account</h1>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            This is a one-time setup — this account will have full access to the app.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Full Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-brand-500"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {submitting ? "Creating..." : "Create Admin Account"}
          </button>
        </form>
      </div>
    </div>
  );
}