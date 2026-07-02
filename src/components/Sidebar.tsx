"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Mail,
  Settings,
  Sun,
  Moon,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/payroll", label: "Payroll", icon: Wallet },
  { href: "/email-history", label: "Email", icon: Mail },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const NavContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-card">
          <Receipt size={18} />
        </div>
        <span className="text-base font-semibold tracking-tight">PaySlip Pro</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-brand-600 text-white shadow-card"
                  : "text-[var(--text-secondary)] hover:bg-brand-50 dark:hover:bg-white/5"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-white/10 transition-colors"
        >
          {mounted ? (
            <>
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </>
          ) : (
            <>
              <Moon size={16} />
              Dark Mode
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/10 glass-card md:block">
        {NavContent}
      </aside>

      {/* Floating iOS-style dock navbar (mobile only) */}
      <nav
        className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1.5 rounded-3xl border border-white/10 bg-white/95 px-2 py-2 shadow-2xl backdrop-blur-xl md:hidden dark:bg-[#14162b]/95"
        style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}
      >
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl px-3 py-2 transition-all",
                active ? "bg-[#1a1a1a] text-white dark:bg-white dark:text-black" : "text-[#1a1a1a] dark:text-white"
              )}
              style={{ minWidth: "56px" }}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl border",
                  active ? "border-transparent" : "border-black/10 dark:border-white/15"
                )}
              >
                <Icon size={16} />
              </div>
              <span className="text-[9px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}