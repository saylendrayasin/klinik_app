"use client";

import { useState, useEffect } from "react";
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
  FaFileSignature,
  FaFileMedical,
} from "react-icons/fa";
import { useAuth } from "@/lib/auth";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { Database } from "lucide-react";

const navGroups = [
  {
    judul: "Menu Utama",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: <FaHome /> },
      { href: "/dashboard/patients", label: "Pasien", icon: <FaUsers /> },
      { href: "/dashboard/kb", label: "KB", icon: <FaHeartbeat /> },
      { href: "/dashboard/kehamilan", label: "Kehamilan", icon: <FaBaby /> },
      { href: "/dashboard/persalinan", label: "Persalinan", icon: <FaHospital /> },
    ],
  },
  {
    judul: "Surat",
    items: [
      { href: "/dashboard/consent", label: "Persetujuan Tindakan", icon: <FaFileSignature /> },
      { href: "/dashboard/surat-sakit", label: "Surat Keterangan Sakit", icon: <FaFileMedical /> },
    ],
  },
  {
    judul: "Pengaturan",
    items: [{ href: "/dashboard/master", label: "Master Data", icon: <Database size={16} /> }],
  },
];
const navItems = navGroups.flatMap((g) => g.items);

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
      aria-current={active ? "page" : undefined}
      className={`group relative flex items-center gap-3 px-3 min-h-11 rounded-xl text-sm font-medium transition-colors duration-150 ${
        active
          ? "bg-white/[0.12] text-white"
          : "text-brand-100/70 hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-brand-300" aria-hidden="true" />
      )}
      <span
        className={`text-base shrink-0 transition-colors ${
          active ? "text-brand-200" : "text-brand-100/50 group-hover:text-brand-100"
        }`}
        aria-hidden="true"
      >
        {item.icon}
      </span>
      <span className="truncate flex-1">{item.label}</span>
    </Link>
  );
}

function SidebarContent({ pathname, onLinkClick, onSignOut }) {
  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.08]">
        <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-lg shadow-black/20 ring-1 ring-white/20">
          <img src="/kop/logo-klinik.png" alt="Logo Klinik Iya" className="w-9 h-9 object-contain" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-[15px] truncate leading-tight">Klinik Iya</p>
          <p className="text-brand-200/70 text-xs mt-0.5">
            Sistem Manajemen
            {process.env.NEXT_PUBLIC_APP_VERSION && (
              <span className="ml-1.5 text-brand-200/50 font-mono">v{process.env.NEXT_PUBLIC_APP_VERSION}</span>
            )}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav aria-label="Menu utama" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navGroups.map((g, i) => (
          <div key={g.judul} role="group" aria-labelledby={`nav-${i}`} className={`space-y-1 ${i ? "pt-4" : ""}`}>
            <p id={`nav-${i}`} className="text-[11px] font-bold text-brand-200/50 uppercase tracking-widest px-3 mb-2">{g.judul}</p>
            {g.items.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} onClick={onLinkClick} />
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/[0.08]">
        <div className="flex items-center gap-2.5 px-3 py-2.5 mb-2 rounded-xl bg-white/[0.05]">
          <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-semibold truncate">Admin</p>
            <p className="text-brand-200/60 text-xs truncate">klinik-iya</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 w-full px-3 min-h-11 rounded-xl text-sm font-medium text-brand-100/70 hover:bg-red-500/15 hover:text-red-300 transition-colors duration-150"
        >
          <FaSignOutAlt className="text-sm shrink-0" aria-hidden="true" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );
}

const SIDEBAR_BG = "bg-gradient-to-b from-brand-900 to-brand-950";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut } = useAuth();

  const activeItem = navItems.find((item) => isItemActive(item, pathname));

  // Laci menu: tutup dengan Escape, kunci gulir halaman di belakangnya.
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e) => e.key === "Escape" && setSidebarOpen(false);
    document.addEventListener("keydown", onKey);
    const overflowLama = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflowLama;
    };
  }, [sidebarOpen]);

  // Pindah halaman → laci tertutup.
  useEffect(() => setSidebarOpen(false), [pathname]);

  return (
    <MotionConfig reducedMotion="user">
    <div className="flex h-dvh overflow-hidden bg-[var(--background)]">
      {/* Overlay laci (HP & tablet) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-brand-950/60 backdrop-blur-[2px] z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Laci menu (HP & tablet) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            key="sidebar-mobile"
            id="laci-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] ${SIDEBAR_BG} flex flex-col lg:hidden shadow-2xl`}
          >
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Tutup menu"
              autoFocus
              className="absolute top-4 right-3 w-11 h-11 flex items-center justify-center rounded-xl text-brand-100/70 hover:text-white hover:bg-white/[0.08] transition"
            >
              <FaTimes size={16} />
            </button>
            <SidebarContent
              pathname={pathname}
              onLinkClick={() => setSidebarOpen(false)}
              onSignOut={() => { setSidebarOpen(false); signOut(); }}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Sidebar desktop */}
      <aside className={`hidden lg:flex lg:flex-col w-64 ${SIDEBAR_BG} fixed inset-y-0 left-0 z-30`}>
        <SidebarContent pathname={pathname} onSignOut={signOut} />
      </aside>

      {/* Area utama */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        {/* Topbar HP & tablet */}
        <header className="flex items-center justify-between gap-2 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-5 py-2 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka menu"
            aria-expanded={sidebarOpen}
            aria-controls="laci-menu"
            className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 transition"
          >
            <FaBars size={18} />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <img src="/kop/logo-klinik.png" alt="" className="w-7 h-7 object-contain shrink-0" />
            <span className="text-[15px] font-bold text-slate-800 truncate">
              {activeItem?.label || "Dashboard"}
            </span>
          </div>

          <button
            onClick={signOut}
            aria-label="Keluar"
            className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
          >
            <FaSignOutAlt size={16} />
          </button>
        </header>

        {/* Isi halaman */}
        {/* relative: elemen absolute tanpa induk berposisi (input sr-only di Saklar/Segmen)
            harus ikut gulir di sini, bukan memanjangkan dokumen di luar <main> */}
        <main className="relative flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
    </MotionConfig>
  );
}
