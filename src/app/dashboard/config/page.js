"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { toast } from "react-hot-toast";
import { FaEdit } from "react-icons/fa";
import { Settings2 } from "lucide-react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export default function DashboardConfigPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("label");
  const [type, setType] = useState("diagnosis");
  const [includeInactive, setIncludeInactive] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const limit = 10;

  const queryUrl = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("page", String(page));
    sp.set("limit", String(limit));
    sp.set("search", search);
    sp.set("sort", sort);
    sp.set("type", type);
    if (includeInactive) sp.set("includeInactive", "1");
    return `/api/config?${sp.toString()}`;
  }, [page, limit, search, sort, type, includeInactive]);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const data = await fetcher(queryUrl);
      setItems(data?.data || []);
      setTotalPages(data?.totalPages || 1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryUrl]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSortChange = (e) => {
    setSort(e.target.value);
    setPage(1);
  };

  const handleTypeChange = (e) => {
    setType(e.target.value);
    setPage(1);
  };

  const handleToggleInactive = (e) => {
    setIncludeInactive(e.target.checked);
    setPage(1);
  };

  const handleToggleActive = async (item) => {
    const toastId = toast.loading("Memperbarui status...");
    try {
      await fetcher(`/api/config/${item._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      await fetchConfigs();
      toast.success("Status berhasil diperbarui", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Gagal memperbarui status", { id: toastId });
    }
  };

  return (
    <div className="sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0 flex items-center gap-2">
          <Settings2 className="text-teal-600" />
          Daftar Konfigurasi
        </h1>
        <Link
          href="/dashboard/config/new"
          className="w-full sm:w-auto inline-flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-5 rounded-md text-center transition"
        >
          + Tambah Config
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <input
          type="text"
          placeholder="Cari label..."
          value={search}
          onChange={handleSearchChange}
          className="flex-1 p-2 border border-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400"
        />

        <div className="relative w-full sm:w-56">
          <select
            value={type}
            onChange={handleTypeChange}
            className="appearance-none w-full p-2 border border-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 pr-10"
          >
            <option value="diagnosis">Diagnosis</option>
            {/* nanti kalau nambah type lain, tambahkan option di sini */}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className="h-4 w-4 text-gray-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 20"
              stroke="currentColor"
            >
              <path
                d="M7 7l3-3 3 3m0 6l-3 3-3-3"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className="relative w-full sm:w-56">
          <select
            value={sort}
            onChange={handleSortChange}
            className="appearance-none w-full p-2 border border-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 pr-10"
          >
            <option value="label">Urutkan Label</option>
            <option value="code">Urutkan Code</option>
            <option value="isActive">Urutkan Status</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className="h-4 w-4 text-gray-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 20"
              stroke="currentColor"
            >
              <path
                d="M7 7l3-3 3 3m0 6l-3 3-3-3"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <label className="flex items-center gap-2 text-gray-700 w-full sm:w-auto">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={handleToggleInactive}
          />
          Tampilkan nonaktif
        </label>
      </div>

      {/* Table (Desktop) */}
      <div className="hidden sm:block overflow-x-auto bg-white rounded-md shadow-md">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-4 px-6 text-left font-semibold text-gray-700">
                Label
              </th>
              <th className="py-4 px-6 text-left font-semibold text-gray-700">
                Code
              </th>
              <th className="py-4 px-6 text-left font-semibold text-gray-700">
                Status
              </th>
              <th className="py-4 px-6 text-center font-semibold text-gray-700">
                Aksi
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse border-t">
                  <td className="py-4 px-6">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="mx-auto h-8 bg-gray-300 rounded w-36"></div>
                  </td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-10 text-gray-500">
                  Tidak ada data ditemukan.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item._id}
                  className="border-t hover:bg-gray-50 transition-all"
                >
                  <td className="py-4 px-6">{item.label}</td>
                  <td className="py-4 px-6 font-mono text-gray-600">
                    {item.code}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`font-semibold ${
                        item.isActive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {item.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>

                  <td className="py-4 px-6 flex justify-center gap-3">
                    <Link
                      href={`/dashboard/config/${item._id}`}
                      className="bg-teal-400 hover:bg-teal-500 text-white flex items-center gap-2 px-4 py-2 rounded-md text-sm"
                    >
                      <FaEdit />
                      <span className="hidden md:inline">Edit</span>
                    </Link>

                    <button
                      onClick={() => handleToggleActive(item)}
                      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold min-w-[140px] transition ${
                        item.isActive
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-green-600 hover:bg-green-700"
                      } text-white`}
                    >
                      <span>{item.isActive ? "Nonaktifkan" : "Aktifkan"}</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Card (Mobile) */}
      <div className="block sm:hidden space-y-6 mt-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white border rounded-lg shadow p-4 space-y-3 animate-pulse"
            >
              <div className="h-5 bg-gray-300 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="flex gap-2 mt-4">
                <div className="flex-1 h-8 bg-gray-300 rounded-md"></div>
                <div className="flex-1 h-8 bg-gray-300 rounded-md"></div>
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            Tidak ada data ditemukan.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item._id}
              className="bg-white border rounded-lg shadow p-4 space-y-2"
            >
              <h2 className="text-lg font-semibold text-gray-800">
                {item.label}
              </h2>

              <p className="text-gray-600 text-sm">
                Code: <span className="font-mono">{item.code}</span>
              </p>

              <p className="text-gray-600 text-sm">
                Status:{" "}
                <span
                  className={`font-semibold ${
                    item.isActive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {item.isActive ? "Aktif" : "Nonaktif"}
                </span>
              </p>

              <div className="flex gap-2 mt-4">
                <Link
                  href={`/dashboard/config/${item._id}`}
                  className="flex-1 bg-teal-400 hover:bg-teal-500 text-white flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm"
                >
                  <FaEdit />
                  <span>Edit</span>
                </Link>

                <button
                  onClick={() => handleToggleActive(item)}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition ${
                    item.isActive
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  } text-white`}
                >
                  <span>{item.isActive ? "Nonaktifkan" : "Aktifkan"}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {items.length > 0 && (
        <div className="flex items-center justify-center gap-3 sm:gap-4 mt-10">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1 || loading}
            className="p-3 sm:p-2 rounded bg-gray-300 hover:bg-gray-400 disabled:opacity-50 transition"
          >
            <ChevronsLeft className="w-6 h-6 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1 || loading}
            className="p-3 sm:p-2 rounded bg-gray-300 hover:bg-gray-400 disabled:opacity-50 transition"
          >
            <ChevronLeft className="w-6 h-6 sm:w-5 sm:h-5" />
          </button>

          <div className="text-base sm:text-sm font-semibold text-gray-700">
            {page}/{totalPages}
          </div>

          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages || loading}
            className="p-3 sm:p-2 rounded bg-gray-300 hover:bg-gray-400 disabled:opacity-50 transition"
          >
            <ChevronRight className="w-6 h-6 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages || loading}
            className="p-3 sm:p-2 rounded bg-gray-300 hover:bg-gray-400 disabled:opacity-50 transition"
          >
            <ChevronsRight className="w-6 h-6 sm:w-5 sm:h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
