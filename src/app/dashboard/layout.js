"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaTachometerAlt,
  FaUserInjured,
  FaHeartbeat,
} from "react-icons/fa";
import { useAuth } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut } = useAuth();
  const sidebarRef = useRef(null);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    { href: "/dashboard/patients", label: "Pasien", icon: <FaUserInjured /> },
    { href: "/dashboard/kb", label: "KB", icon: <FaHeartbeat /> },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Overlay (Mobile) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40 sm:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar (Mobile) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            key="sidebar-mobile"
            ref={sidebarRef}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-md flex flex-col sm:hidden"
          >
            <div className="flex items-center gap-3 px-3 py-6 border-b">
              <img
                src="/icons/icon-192x192.png"
                alt="Logo Klinik"
                className="w-10 h-10 object-contain"
              />
              <h1 className="text-xl font-bold text-blue-700">Klinik App</h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="ml-auto focus:outline-none"
              >
                <FaTimes size={20} className="text-gray-500" />
              </button>
            </div>

            <nav className="flex-1 flex flex-col gap-1 px-2 py-4">
              {navItems.map((item) => {
                const isActive =
                  (item.href === "/dashboard" && pathname === "/dashboard") ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 p-3 rounded-lg font-medium transition-all duration-200 ease-in-out ${
                      isActive
                        ? "bg-blue-600 text-white border-l-4 border-blue-800"
                        : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-5 border-t">
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  signOut();
                }}
                className="flex items-center gap-2 w-full rounded-lg font-medium text-red-600 hover:bg-gray-100 transition"
              >
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Sidebar (Desktop) */}
      <aside className="hidden sm:flex sm:flex-col w-72 bg-white shadow-md fixed inset-y-0 left-0 z-50">
        <div className="flex items-center gap-3 px-6 py-6 border-b">
          <img
            src="/icons/icon-192x192.png"
            alt="Logo Klinik"
            className="w-12 h-12 object-contain"
          />
          <h1 className="text-2xl font-bold text-blue-700">Klinik App</h1>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-4 py-4">
          {navItems.map((item) => {
            const isActive =
              (item.href === "/dashboard" && pathname === "/dashboard") ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 p-4 rounded-lg font-medium transition-all duration-200 ease-in-out ${
                  isActive
                    ? "bg-blue-600 text-white border-l-4 border-blue-800"
                    : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t">
          <button
            onClick={signOut}
            className="flex items-center gap-2 w-full p-4 rounded-lg font-medium text-red-600 hover:bg-gray-100 transition"
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden sm:ml-72">
        <header className="flex items-center justify-between bg-white shadow px-4 py-3 sm:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <FaBars size={24} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-blue-700">
            {navItems.find(
              (item) =>
                (item.href === "/dashboard" && pathname === "/dashboard") ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href))
            )?.label || "Dashboard"}
          </h1>
          <button
            onClick={signOut}
            className="text-red-600 font-bold text-sm flex items-center gap-1"
          >
            <FaSignOutAlt size={18} />
            <span>Logout</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
