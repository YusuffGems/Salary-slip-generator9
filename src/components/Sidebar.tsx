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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LOGO_URL = "https://efomqjkebwxwfltddvie.supabase.co/storage/v1/object/public/Leatherssc-assets/lssc%20logo%20png.png";

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
  const [collapsed, setCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("sidebarCollapsed") === "true";
    setCollapsed(saved);
    document.body.classList.toggle("sidebar-collapsed", saved);
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebarCollapsed", String(next));
    document.body.classList.toggle("sidebar-collapsed", next);
  }

  const NavContent = (
    <div className="flex h-full flex-col">
      <div className={cn("flex items-center gap-2 px-6 py-6", collapsed && "justify-center px-3")}>
        <img src={LOGO_URL} alt="LSSC Logo" className="h-9 w-9 flex-shrink-0 rounded-xl object-contain bg-white p-1" />
        {!collapsed && <span className="text-base font-semibold tracking-tight">Leather SSC PaySlip </span>}
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                collapsed && "justify-center px-0",
                active
                  ? "bg-brand-600 text-white shadow-card"
                  : "text-[var(--text-secondary)] hover:bg-brand-50 dark:hover:bg-white/5"
              )}
            >
              <Icon size={18} />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title={collapsed ? "Toggle theme" : undefined}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-white/10 transition-colors"
          )}
        >
          {mounted ? (
            <>
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              {!collapsed && (theme === "dark" ? "Light Mode" : "Dark Mode")}
            </>
          ) : (
            <>
              <Moon size={16} />
              {!collapsed && "Dark Mode"}
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-white/10 glass-card transition-all duration-200 md:block",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {NavContent}
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-8 hidden h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-brand-600 text-white shadow-card md:flex"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {/* Mobile header bar - permanent, full width */}
      <header className="fixed inset-x-0 top-0 z-[70] flex h-14 items-center justify-between border-b border-white/10 bg-white px-4 shadow-md md:hidden dark:bg-[#14162b]">
        <div className="flex items-center gap-2">
          <img src={LOGO_URL} alt="LSSC Logo" className="h-8 w-8 rounded-lg object-contain bg-white p-0.5" />
          <span className="text-sm font-semibold text-[#1a1a1a] dark:text-white">Leather SSC PaySlip</span>
        </div>
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-[#1a1a1a] dark:text-white"
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        )}
      </header>

      {/* Floating iOS-style dock navbar (mobile only) */}
      <nav
       className="fixed bottom-5 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-1.5 rounded-3xl border border-white/10 bg-white px-2 py-2 shadow-2xl md:hidden dark:bg-[#14162b]"
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