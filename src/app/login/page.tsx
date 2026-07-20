"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loader2, Eye, EyeOff, ShieldCheck, ArrowRight } from "lucide-react";

const LOGO_URL =
  "https://efomqjkebwxwfltddvie.supabase.co/storage/v1/object/public/Leatherssc-assets/lssc%20logo%20png.png";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (!res || res.error) {
        toast.error("Invalid email or password");
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Something went wrong — please try again");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-[#05060d]">
      {/* Animated floating gradient orbs */}
      <motion.div
        className="pointer-events-none absolute h-[420px] w-[420px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(61,100,244,0.35), transparent 70%)", top: "-10%", left: "-10%" }}
        animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute h-[380px] w-[380px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.28), transparent 70%)", bottom: "-8%", right: "-8%" }}
        animate={{ x: [0, -50, 0], y: [0, -30, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className="pointer-events-none absolute h-[280px] w-[280px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.18), transparent 70%)", top: "40%", left: "60%" }}
        animate={{ x: [0, 30, 0], y: [0, 50, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* Faint dot grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />

      {/* Centered content */}
      <div className="relative z-10 flex w-full items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[380px]"
        >
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_20px_70px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 200 }}
              className="mb-5 flex justify-center"
            >
              <div className="rounded-2xl bg-white p-2.5 shadow-lg">
                <img src={LOGO_URL} alt="LSSC Logo" className="h-14 w-14 object-contain" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mb-7 text-center"
            >
              <h1 className="text-xl font-semibold text-white">Leather SSC PaySlip</h1>
              <p className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-white/40">
                <ShieldCheck size={13} className="text-brand-400" />
                Secure sign-in
              </p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.28 }}>
                <label className="mb-1.5 block text-xs font-medium text-white/50">Email</label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3.5 text-sm text-white outline-none transition-all placeholder:text-white/20 focus:border-brand-400 focus:bg-white/[0.09] focus:shadow-[0_0_0_3px_rgba(61,100,244,0.15)]"
                />
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.34 }}>
                <label className="mb-1.5 block text-xs font-medium text-white/50">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3.5 pr-10 text-sm text-white outline-none transition-all placeholder:text-white/20 focus:border-brand-400 focus:bg-white/[0.09] focus:shadow-[0_0_0_3px_rgba(61,100,244,0.15)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.42 }}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                type="submit"
                disabled={loading}
                className="group mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-shadow hover:shadow-brand-600/40 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </motion.button>
            </form>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-5 text-center text-[11px] text-white/25"
          >
            Leather Sector Skill Council · Payroll System
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}