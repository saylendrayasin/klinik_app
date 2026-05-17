"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { FaEye, FaTrash, FaHeartbeat, FaFileExcel } from "react-icons/fa";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";

export default function DashboardKbPage() {
  const [kbList, setKbList] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // ===== Export modal state =====
  const [exportOpen, setExportOpen] = useState(false);
  const now = useMemo(() => new Date(), []);
  const [exportMonth, setExportMonth] = useState(now.getMonth() + 1); // 1-12
  const [exportYear, setExportYear] = useState(now.getFullYear());
  const [exportMode, setExportMode] = useState("visits"); // visits | people

  const limit = 5;

  const fetchKbList = async () => {
    setLoading(true);
    try {
      const data = await fetcher(
        `/api/kb?page=${page}&limit=${limit}&search=${search}&sort=${sort}`
      );

      setKbList(data.data);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKbList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sort, page]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus data KB ini?")) return;
    try {
      await fetcher(`/api/kb/${id}`, { method: "DELETE" });
      fetchKbList();
    } catch (error) {
      console.error(error);
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return "-";

    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return "-";

    const today = new Date();

    if (birth > today) return 0;

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return Math.max(0, age);
  };

  // ===== Export handler (download excel) =====
  const handleExport = () => {
    const m = Number(exportMonth);
    const y = Number(exportYear);

    if (!m || m < 1 || m > 12) return toast.error("Bulan tidak valid");
    if (!y || y < 1900) return toast.error("Tahun tidak valid");

    setExportOpen(false);
    downloadExport({ month: m, year: y, mode: exportMode });
  };

  const downloadExport = async ({ month, year, mode }) => {
    const qs = new URLSearchParams({
      month: String(month),
      year: String(year),
      mode: String(mode),
    });

    const url = `/api/kb/export?${qs.toString()}`;

    const toastId = toast.loading("Menyiapkan file...");
    try {
      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        // export endpoint kamu pakai errorResponse => json
        let msg = "Gagal export";
        try {
          const err = await res.json();
          msg = err?.message || msg;
        } catch {}
        throw new Error(msg);
      }

      const blob = await res.blob();
      const filename = `kb-${year}-${String(month).padStart(2, "0")}.xlsx`;

      const a = document.createElement("a");
      const objectUrl = window.URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(objectUrl);

      toast.success("File berhasil diunduh", { id: toastId });
    } catch (e) {
      toast.error(e?.message || "Gagal download", { id: toastId });
    }
  };

  return (
    <div className="sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-sm shrink-0">
            <FaHeartbeat size={17} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 leading-tight">Daftar KB</h1>
            <p className="text-gray-500 text-xs mt-0.5">Data keluarga berencana dan kunjungan akseptor</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => setExportOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-5 rounded-md text-center transition"
          >
            <FaFileExcel />
            Export
          </button>

          <Link
            href="/dashboard/kb/new"
            className="w-full sm:w-auto inline-flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-5 rounded-md text-center transition"
          >
            + Tambah KB
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
        <div className="relative w-full sm:w-48">
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="appearance-none w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 pr-10"
          >
            <option value="name">Nama A–Z</option>
            <option value="dateOfBirth">Umur</option>
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
      </div>

      {/* Table (Desktop) */}
      <div className="hidden sm:block overflow-x-auto bg-white rounded-md shadow-md">
        <table className="min-w-full text-sm">
          <thead className="bg-purple-50 border-b border-purple-100">
            <tr>
              <th className="py-3.5 px-6 text-left text-xs font-semibold text-purple-800 uppercase tracking-wide">
                Nama
              </th>
              <th className="py-3.5 px-6 text-left text-xs font-semibold text-purple-800 uppercase tracking-wide">
                NIK
              </th>
              <th className="py-3.5 px-6 text-left text-xs font-semibold text-purple-800 uppercase tracking-wide">
                Umur
              </th>
              <th className="py-3.5 px-6 text-left text-xs font-semibold text-purple-800 uppercase tracking-wide">
                Jumlah Anak
              </th>
              <th className="py-3.5 px-6 text-center text-xs font-semibold text-purple-800 uppercase tracking-wide">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse border-t">
                  <td className="py-4 px-6">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="mx-auto h-8 bg-gray-300 rounded w-24"></div>
                  </td>
                </tr>
              ))
            ) : kbList.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-12 text-center">
                  <FaHeartbeat size={28} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-sm font-medium text-gray-400">Tidak ada data KB ditemukan.</p>
                  <p className="text-xs text-gray-300 mt-0.5">Coba ubah pencarian atau tambah data baru.</p>
                </td>
              </tr>
            ) : (
              kbList.map((kb) => (
                <tr
                  key={kb._id}
                  className="border-t hover:bg-gray-50 transition-all"
                >
                  <td className="py-4 px-6">{kb.name}</td>
                  <td className="py-4 px-6">{kb.nik}</td>
                  <td className="py-4 px-6">
                    {calculateAge(kb.dateOfBirth)} Tahun
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                        kb.numberOfChildren > 3
                          ? "bg-red-100 text-red-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {kb.numberOfChildren} anak
                    </span>
                  </td>
                  <td className="py-4 px-6 flex justify-center gap-3">
                    <Link
                      href={`/dashboard/kb/${kb._id}`}
                      className="bg-purple-500 hover:bg-purple-600 text-white flex items-center gap-2 px-4 py-2 rounded-md text-sm"
                    >
                      <FaEye />
                      <span className="hidden md:inline">Lihat</span>
                    </Link>
                    <button
                      onClick={() => handleDelete(kb._id)}
                      className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-2 px-4 py-2 rounded-md text-sm"
                    >
                      <FaTrash />
                      <span className="hidden md:inline">Hapus</span>
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
              <div className="h-5 bg-gray-300 rounded w-1/2 skeleton"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3 skeleton"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 skeleton"></div>
              <div className="flex gap-2 mt-4">
                <div className="flex-1 h-8 bg-gray-300 rounded-md skeleton"></div>
                <div className="flex-1 h-8 bg-gray-300 rounded-md skeleton"></div>
              </div>
            </div>
          ))
        ) : kbList.length === 0 ? (
          <div className="text-center py-12">
            <FaHeartbeat size={32} className="mx-auto text-gray-200 mb-2" />
            <p className="text-sm font-medium text-gray-400">Tidak ada data KB ditemukan.</p>
            <p className="text-xs text-gray-300 mt-0.5">Coba ubah pencarian atau tambah data baru.</p>
          </div>
        ) : (
          kbList.map((kb) => (
            <div
              key={kb._id}
              className="bg-white border-l-4 border-purple-500 rounded-lg shadow-sm p-4 space-y-2"
            >
              <h2 className="text-base font-bold text-gray-800">{kb.name}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-gray-500">
                <span>NIK: {kb.nik}</span>
                <span>{calculateAge(kb.dateOfBirth)} tahun</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${
                    kb.numberOfChildren > 3
                      ? "bg-red-100 text-red-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {kb.numberOfChildren} anak
                </span>
              </div>
              <div className="flex gap-2 pt-2">
                <Link
                  href={`/dashboard/kb/${kb._id}`}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <FaEye />
                  Lihat
                </Link>
                <button
                  onClick={() => handleDelete(kb._id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <FaTrash />
                  Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {kbList.length > 0 && (
        <div className="flex items-center justify-center gap-1.5 mt-10">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1 || loading}
            className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition shadow-sm"
          >
            <ChevronsLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1 || loading}
            className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition shadow-sm"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="px-3 py-1.5 rounded-md border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-sm min-w-[60px] text-center">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages || loading}
            className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition shadow-sm"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages || loading}
            className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition shadow-sm"
          >
            <ChevronsRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}

      {/* ===== Export Modal ===== */}
      {exportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setExportOpen(false)}
          />

          {/* modal */}
          <div className="relative w-full max-w-md rounded-xl bg-white shadow-lg border">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-800">
                  Export Data KB
                </h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  Pilih bulan & tahun laporan
                </p>
              </div>
              <button
                onClick={() => setExportOpen(false)}
                className="p-2 rounded-md hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-gray-700 mb-1">
                    Bulan
                  </label>
                  <select
                    value={exportMonth}
                    onChange={(e) => setExportMonth(Number(e.target.value))}
                    className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    {Array.from({ length: 12 }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-gray-700 mb-1">
                    Tahun
                  </label>
                  <input
                    type="number"
                    value={exportYear}
                    onChange={(e) => setExportYear(Number(e.target.value))}
                    min={1900}
                    className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">
                  Mode Export
                </label>
                <select
                  value={exportMode}
                  onChange={(e) => setExportMode(e.target.value)}
                  className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="visits">Kunjungan (per baris)</option>
                  <option value="people">Orang (unik per orang)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  * Kunjungan cocok untuk laporan layanan bulanan.
                </p>
              </div>
            </div>

            <div className="p-4 border-t flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setExportOpen(false)}
                className="w-full sm:w-auto flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded-md transition"
              >
                Batal
              </button>
              <button
                onClick={handleExport}
                className="w-full sm:w-auto flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-md transition inline-flex items-center justify-center gap-2"
              >
                <FaFileExcel />
                Download Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
