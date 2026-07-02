"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export default function StatCard({
  label,
  value,
  icon,
  gradient,
  delay = 0,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  gradient: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass-card relative overflow-hidden rounded-2xl p-5 shadow-card"
    >
      <div
        className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl ${gradient}`}
      />
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-white ${gradient}`}>
          {icon}
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
    </motion.div>
  );
}
