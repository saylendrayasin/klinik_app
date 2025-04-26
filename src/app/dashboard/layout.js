"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { FaBars, FaTimes, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "@/lib/auth";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut } = useAuth();

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/patients", label: "Pasien" },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-md transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-200 ease-in-out sm:translate-x-0 sm:static sm:inset-0 flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h1 className="text-2xl font-bold text-blue-700">Klinik App</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="sm:hidden focus:outline-none"
          >
            <FaTimes size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Sidebar Menu */}
        <nav className="flex-1 flex flex-col p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 rounded-lg font-medium transition-colors ${
                (item.href === "/dashboard" && pathname === "/dashboard") ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href))
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Sidebar Logout */}
        <div className="p-4 border-t">
          <button
            onClick={() => {
              setSidebarOpen(false);
              signOut();
            }}
            className="flex items-center gap-2 w-full px-4 py-2 rounded-lg font-medium text-red-600 hover:bg-gray-100 transition-colors"
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar (Mobile Only) */}
        <header className="flex items-center justify-between bg-white shadow px-4 py-3 sm:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <FaBars size={24} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-blue-700">Dashboard</h1>

          {/* Logout Button Mobile */}
          <button
            onClick={signOut}
            className="text-red-600 font-bold text-sm flex items-center gap-1"
          >
            <FaSignOutAlt size={18} />
            <span>Logout</span>
          </button>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
