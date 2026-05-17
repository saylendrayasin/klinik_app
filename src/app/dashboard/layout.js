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
} from "react-icons/fa";
import { useAuth } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Settings2 } from "lucide-react";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <FaHome />,
    activeColor: "text-blue-400",
  },
  {
    href: "/dashboard/patients",
    label: "Pasien",
    icon: <FaUsers />,
    activeColor: "text-blue-400",
  },
  {
    href: "/dashboard/kb",
    label: "KB",
    icon: <FaHeartbeat />,
    activeColor: "text-purple-400",
  },
  {
    href: "/dashboard/kehamilan",
    label: "Kehamilan",
    icon: <FaBaby />,
    activeColor: "text-rose-400",
  },
  {
    href: "/dashboard/config",
    label: "Konfigurasi",
    icon: <Settings2 size={16} />,
    activeColor: "text-slate-300",
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
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 border-l-2 ${
        active
          ? "bg-white/[0.09] text-white border-white/30"
          : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200 border-transparent"
      }`}
    >
      <span className={`text-base shrink-0 transition-colors ${active ? item.activeColor : "text-slate-500 group-hover:text-slate-300"}`}>
        {item.icon}
      </span>
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function SidebarContent({ pathname, onLinkClick, onSignOut }) {
  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 shadow-lg">
          <img src="/icons/icon-192x192.png" alt="Logo" className="w-5 h-5 object-contain" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm truncate">Klinik Iya</p>
          <p className="text-slate-500 text-xs">Manajemen Klinik</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-2">Menu</p>
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
      <div className="px-3 py-4 border-t border-slate-800">
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/[0.05] hover:text-red-400 transition border-l-2 border-transparent"
        >
          <FaSignOutAlt className="text-base shrink-0" />
          <span>Logout</span>
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
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40 sm:hidden"
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
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 flex flex-col sm:hidden shadow-2xl"
          >
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:text-white hover:bg-slate-800 transition"
            >
              <FaTimes size={14} />
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
      <aside className="hidden sm:flex sm:flex-col w-60 bg-slate-900 fixed inset-y-0 left-0 z-50 shadow-xl">
        <SidebarContent
          pathname={pathname}
          onSignOut={signOut}
        />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden sm:ml-60">
        {/* Mobile topbar */}
        <header className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3 sm:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
          >
            <FaBars size={18} className="text-gray-600" />
          </button>

          <div className="flex items-center gap-2">
            <span className={`text-base ${activeItem?.activeColor || "text-gray-500"}`}>
              {activeItem?.icon}
            </span>
            <span className="text-sm font-bold text-gray-800">
              {activeItem?.label || "Dashboard"}
            </span>
          </div>

          <button
            onClick={signOut}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 transition"
          >
            <FaSignOutAlt size={16} />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
