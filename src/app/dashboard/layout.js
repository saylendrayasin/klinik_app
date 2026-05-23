"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaHome,
  FaUsers,
  FaHeartbeat,
  FaBaby,
  FaHospital,
} from "react-icons/fa";
import { useAuth } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Settings2 } from "lucide-react";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <FaHome />,
    activeColor: "text-sky-400",
    activeBg: "bg-sky-500/10",
    dot: "bg-sky-400",
  },
  {
    href: "/dashboard/patients",
    label: "Pasien",
    icon: <FaUsers />,
    activeColor: "text-blue-400",
    activeBg: "bg-blue-500/10",
    dot: "bg-blue-400",
  },
  {
    href: "/dashboard/kb",
    label: "KB",
    icon: <FaHeartbeat />,
    activeColor: "text-violet-400",
    activeBg: "bg-violet-500/10",
    dot: "bg-violet-400",
  },
  {
    href: "/dashboard/kehamilan",
    label: "Kehamilan",
    icon: <FaBaby />,
    activeColor: "text-pink-400",
    activeBg: "bg-pink-500/10",
    dot: "bg-pink-400",
  },
  {
    href: "/dashboard/persalinan",
    label: "Persalinan",
    icon: <FaHospital />,
    activeColor: "text-emerald-400",
    activeBg: "bg-emerald-500/10",
    dot: "bg-emerald-400",
  },
  {
    href: "/dashboard/config",
    label: "Konfigurasi",
    icon: <Settings2 size={16} />,
    activeColor: "text-slate-300",
    activeBg: "bg-slate-500/10",
    dot: "bg-slate-400",
  },
];

function isItemActive(item, pathname) {
  return (
    (item.href === "/dashboard" && pathname === "/dashboard") ||
    (item.href !== "/dashboard" && pathname.startsWith(item.href))
  );
}

function NavLink({ item, pathname, onClick }) {
  const active = isItemActive(item, pathname);
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
        active
          ? `${item.activeBg} ${item.activeColor} ring-1 ring-white/10`
          : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
      }`}
    >
      <span className={`text-base shrink-0 transition-colors ${active ? item.activeColor : "text-slate-500 group-hover:text-slate-300"}`}>
        {item.icon}
      </span>
      <span className="truncate flex-1">{item.label}</span>
      {active && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.dot}`} />}
    </Link>
  );
}

function SidebarContent({ pathname, onLinkClick, onSignOut }) {
  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.07]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/40">
          <img src="/icons/icon-192x192.png" alt="Logo" className="w-5 h-5 object-contain" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm truncate leading-tight">Klinik Iya</p>
          <p className="text-slate-500 text-xs mt-0.5">
            Sistem Manajemen
            {process.env.NEXT_PUBLIC_APP_VERSION && (
              <span className="ml-1.5 text-slate-600 font-mono">v{process.env.NEXT_PUBLIC_APP_VERSION}</span>
            )}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-3">Menu Utama</p>
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            pathname={pathname}
            onClick={onLinkClick}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/[0.07]">
        <div className="flex items-center gap-2.5 px-3 py-2.5 mb-2 rounded-xl bg-white/[0.03]">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-semibold truncate">Admin</p>
            <p className="text-slate-500 text-[10px] truncate">klinik-iya</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
        >
          <FaSignOutAlt className="text-sm shrink-0" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut } = useAuth();
  const sidebarRef = useRef(null);

  const activeItem = navItems.find((item) => isItemActive(item, pathname));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.65 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900 z-40 sm:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            key="sidebar-mobile"
            ref={sidebarRef}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-[#0f172a] flex flex-col sm:hidden shadow-2xl shadow-slate-900/60"
          >
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.08] transition"
            >
              <FaTimes size={13} />
            </button>
            <SidebarContent
              pathname={pathname}
              onLinkClick={() => setSidebarOpen(false)}
              onSignOut={() => { setSidebarOpen(false); signOut(); }}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Sidebar Desktop */}
      <aside className="hidden sm:flex sm:flex-col w-60 bg-[#0f172a] fixed inset-y-0 left-0 z-50 shadow-xl shadow-slate-900/30">
        <SidebarContent
          pathname={pathname}
          onSignOut={signOut}
        />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden sm:ml-60">
        {/* Mobile topbar */}
        <header className="flex items-center justify-between bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 sm:hidden shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition"
          >
            <FaBars size={16} className="text-slate-600" />
          </button>

          <div className="flex items-center gap-2">
            <span className={`text-sm ${activeItem?.activeColor || "text-slate-500"}`}>
              {activeItem?.icon}
            </span>
            <span className="text-sm font-bold text-slate-800">
              {activeItem?.label || "Dashboard"}
            </span>
          </div>

          <button
            onClick={signOut}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition"
          >
            <FaSignOutAlt size={14} />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-3 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
