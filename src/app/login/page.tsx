"use client";

import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Loader2, Eye, EyeOff, ArrowRight, Lock, Mail, Check } from "lucide-react";

const LOGO_URL =
  "https://efomqjkebwxwfltddvie.supabase.co/storage/v1/object/public/Leatherssc-assets/lssc%20logo%20png.png";

const REMEMBER_KEY = "lssc_remembered_email";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 150, damping: 20 });
  const shineX = useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"]);
  const shineY = useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"]);

  function handleCardMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function handleCardMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  const readyToSubmit = email.trim().length > 0 && password.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!readyToSubmit) return;
    setLoading(true);
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (!res || res.error) {
        toast.error("Invalid email or password");
        setLoading(false);
        return;
      }
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, email);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Something went wrong - please try again");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-black" style={{ perspective: "1400px" }}>
      {/* Faint blue vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(90,140,212,0.08)_0%,transparent_60%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: "radial-gradient(rgba(90,140,212,0.8) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
      />

      <motion.div
        ref={cardRef}
        onMouseMove={handleCardMouseMove}
        onMouseLeave={handleCardMouseLeave}
        initial={{ opacity: 0, y: 30, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative z-10 w-full max-w-[400px] px-4"
      >
        <div
          className="relative overflow-hidden rounded-[28px] p-9 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)]"
          style={{
            background: "linear-gradient(155deg, #141414 0%, #0a0a0a 100%)",
            border: "1px solid rgba(90,140,212,0.2)",
          }}
        >
          {/* Cursor-tracking blue shine sweeping across the card */}
          <motion.div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background: useTransform(
                [shineX, shineY],
                ([x, y]) => `radial-gradient(circle 300px at ${x} ${y}, rgba(90,140,212,0.18), transparent 70%)`
              ),
            }}
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(90,140,212,0.5)] to-transparent" />

          <div style={{ transform: "translateZ(40px)" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15, type: "spring", stiffness: 180, damping: 14 }}
              className="mb-6 flex justify-center"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-xl" style={{ background: "rgba(90,140,212,0.35)" }} />
                <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white p-2.5 shadow-2xl">
                  <img src={LOGO_URL} alt="LSSC Logo" className="h-full w-full object-contain" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28 }}
              className="mb-8 text-center"
            >
              <h1 className="text-2xl font-semibold tracking-tight text-white">Welcome back</h1>
              <p className="mt-1.5 text-sm" style={{ color: "rgba(120,165,225,0.6)" }}>
                Leather SSC PaySlip
              </p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.36 }}
                className="relative"
              >
                <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(120,165,225,0.6)" }} />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="h-12 w-full rounded-2xl pl-10 pr-4 text-sm text-white outline-none transition-all placeholder:text-white/20"
                  style={{ backgroundColor: "rgba(90,140,212,0.06)", border: "1px solid rgba(90,140,212,0.18)" }}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.44 }}
                className="relative"
              >
                <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(120,165,225,0.6)" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="h-12 w-full rounded-2xl pl-10 pr-11 text-sm text-white outline-none transition-all placeholder:text-white/20"
                  style={{ backgroundColor: "rgba(90,140,212,0.06)", border: "1px solid rgba(90,140,212,0.18)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors hover:text-white"
                  style={{ color: "rgba(120,165,225,0.6)" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </motion.div>

              <motion.label
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="flex cursor-pointer items-center gap-2 pt-0.5 text-xs select-none"
                style={{ color: "rgba(120,165,225,0.45)" }}
              >
                <span
                  onClick={() => setRememberMe((v) => !v)}
                  className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded transition-colors"
                  style={{
                    backgroundColor: rememberMe ? "#4a90d9" : "rgba(90,140,212,0.08)",
                    border: rememberMe ? "none" : "1px solid rgba(90,140,212,0.3)",
                  }}
                >
                  {rememberMe && <Check size={11} className="text-white" strokeWidth={3} />}
                </span>
                <span onClick={() => setRememberMe((v) => !v)}>Remember my email</span>
              </motion.label>

              <AnimatePresence>
                {readyToSubmit && (
                  <motion.button
                    key="signin-btn"
                    initial={{ opacity: 0, height: 0, y: -8 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -8 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="group !mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold shadow-lg"
                    style={{
                      background: "linear-gradient(135deg, #5a9de0, #2e5f9e)",
                      color: "#ffffff",
                      boxShadow: "0 10px 40px rgba(90,140,212,0.35)",
                    }}
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        Sign In
                        <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </motion.button>
                )}
              </AnimatePresence>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}