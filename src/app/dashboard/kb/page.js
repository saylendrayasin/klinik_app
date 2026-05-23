"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { FaEye, FaTrash, FaHeartbeat, FaFileExcel, FaPlus } from "react-icons/fa";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import toast from "react-hot-toast";

export default function DashboardKbPage() {
  const [kbList, setKbList] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [exportOpen, setExportOpen] = useState(false);
  const now = useMemo(() => new Date(), []);
  const [exportMonth, setExportMonth] = useState(now.getMonth() + 1);
  const [exportYear, setExportYear] = useState(now.getFullYear());
  const [exportMode, setExportMode] = useState("visits");

  const limit = 10;

  const fetchKbList = async () => {
    setLoading(true);
    try {
      const data = await fetcher(`/api/kb?page=${page}&limit=${limit}&search=${search}&sort=${sort}`);
      setKbList(data.data);
      const tp = data.totalPages || 1;
      setTotalPages(tp);
      if (page > tp) setPage(Math.max(1, tp));
    } catch (error) {
      toast.error("Gagal memuat data KB");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKbList();
  }, [search, sort, page]); // eslint-disable-line

  useEffect(() => {
    if (!exportOpen) return;
    const handler = (e) => { if (e.key === "Escape") setExportOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [exportOpen]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetcher(`/api/kb/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      toast.success("Data KB berhasil dihapus");
      fetchKbList();
    } catch (error) {
      toast.error(error?.message || "Gagal menghapus data KB");
    } finally {
      setDeleting(false);
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
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return Math.max(0, age);
  };

  const handleExport = () => {
    const m = Number(exportMonth);
    const y = Number(exportYear);
    if (!m || m < 1 || m > 12) return toast.error("Bulan tidak valid");
    if (!y || y < 1900) return toast.error("Tahun tidak valid");
    setExportOpen(false);
    downloadExport({ month: m, year: y, mode: exportMode });
  };

  const downloadExport = async ({ month, year, mode }) => {
    const qs = new URLSearchParams({ month: String(month), year: String(year), mode: String(mode) });
    const url = `/api/kb/export?${qs.toString()}`;
    const toastId = toast.loading("Menyiapkan file...");
    try {
      const res = await fetch(url, { method: "GET", credentials: "include" });
      if (!res.ok) {
        let msg = "Gagal export";
        try { const err = await res.json(); msg = err?.message || msg; } catch {}
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
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-md shadow-violet-200 shrink-0">
            <FaHeartbeat size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">Daftar KB</h1>
            <p className="text-slate-500 text-xs mt-0.5">Data keluarga berencana dan kunjungan akseptor</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setExportOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-500 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all duration-150 active:scale-95"
          >
            <FaFileExcel size={13} />
            Export Excel
          </button>
          <Link
            href="/dashboard/kb/new"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-all duration-150 shadow-md shadow-violet-200 hover:shadow-lg hover:-translate-y-px active:scale-95"
          >
            <FaPlus size={11} />
            Tambah KB
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama akseptor..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-300 transition shadow-sm placeholder:text-slate-400"
          />
        </div>
        <div className="relative w-full sm:w-44">
          <SlidersHorizontal size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="appearance-none w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-300 transition shadow-sm text-slate-700"
          >
            <option value="name">Nama A–Z</option>
            <option value="dateOfBirth">Umur</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" stroke="currentColor">
              <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Table Desktop */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-violet-50 to-violet-50/50 border-b border-violet-100">
              <th className="py-3.5 px-5 text-left text-[11px] font-bold text-violet-700 uppercase tracking-wider">Nama</th>
              <th className="py-3.5 px-5 text-left text-[11px] font-bold text-violet-700 uppercase tracking-wider">NIK</th>
              <th className="py-3.5 px-5 text-left text-[11px] font-bold text-violet-700 uppercase tracking-wider">Umur</th>
              <th className="py-3.5 px-5 text-left text-[11px] font-bold text-violet-700 uppercase tracking-wider">Jumlah Anak</th>
              <th className="py-3.5 px-5 text-center text-[11px] font-bold text-violet-700 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  {[3/4, 2/3, 1/2, 1/3, null].map((w, j) => (
                    <td key={j} className="py-3.5 px-5">
                      <div className={`h-4 bg-slate-100 rounded-lg skeleton ${w ? `w-[${Math.round(w*100)}%]` : "mx-auto w-24"}`} style={w ? { width: `${w*100}%` } : { width: "6rem", margin: "0 auto" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : kbList.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-14 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <FaHeartbeat size={24} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-400">Tidak ada data KB ditemukan</p>
                  <p className="text-xs text-slate-300 mt-1">Coba ubah pencarian atau tambah data baru.</p>
                </td>
              </tr>
            ) : (
              kbList.map((kb) => (
                <tr key={kb._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-5 font-medium text-slate-800">{kb.name}</td>
                  <td className="py-3.5 px-5 text-slate-500 font-mono text-xs">{kb.nik}</td>
                  <td className="py-3.5 px-5 text-slate-600">{calculateAge(kb.dateOfBirth)} tahun</td>
                  <td className="py-3.5 px-5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      kb.numberOfChildren > 3 ? "bg-red-100 text-red-700" : "bg-violet-100 text-violet-700"
                    }`}>
                      {kb.numberOfChildren} anak
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex justify-center gap-2">
                      <Link href={`/dashboard/kb/${kb._id}`} className="inline-flex items-center gap-1.5 bg-violet-500 hover:bg-violet-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95">
                        <FaEye size={11} /> Lihat
                      </Link>
                      <button onClick={() => setDeleteTarget({ id: kb._id, name: kb.name })} className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white border border-red-200 hover:border-red-500 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95">
                        <FaTrash size={10} /> Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Card Mobile */}
      <div className="block sm:hidden space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 animate-pulse shadow-sm">
              <div className="h-5 bg-slate-100 rounded-lg w-1/2 skeleton" />
              <div className="h-4 bg-slate-100 rounded-lg w-1/3 skeleton" />
              <div className="flex gap-2 mt-3">
                <div className="flex-1 h-9 bg-slate-100 rounded-xl skeleton" />
                <div className="flex-1 h-9 bg-slate-100 rounded-xl skeleton" />
              </div>
            </div>
          ))
        ) : kbList.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-2xl border border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <FaHeartbeat size={24} className="text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-400">Tidak ada data KB ditemukan</p>
          </div>
        ) : (
          kbList.map((kb) => (
            <div key={kb._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-violet-500 to-violet-400" />
              <div className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-bold text-slate-800 flex-1 truncate min-w-0">{kb.name}</h2>
                  <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    kb.numberOfChildren > 3 ? "bg-red-100 text-red-700" : "bg-violet-100 text-violet-700"
                  }`}>
                    {kb.numberOfChildren} anak
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span className="font-mono">{kb.nik}</span>
                  <span>{calculateAge(kb.dateOfBirth)} tahun</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Link href={`/dashboard/kb/${kb._id}`} className="flex-1 bg-violet-500 hover:bg-violet-600 text-white flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition active:scale-95">
                    <FaEye size={12} /> Lihat
                  </Link>
                  <button onClick={() => setDeleteTarget({ id: kb._id, name: kb.name })} className="flex-1 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white border border-red-200 hover:border-red-500 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition active:scale-95">
                    <FaTrash size={11} /> Hapus
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {kbList.length > 0 && (
        <div className="flex items-center justify-center gap-1.5 pt-2">
          <PagBtn onClick={() => setPage(1)} disabled={page === 1 || loading}><ChevronsLeft className="w-4 h-4" /></PagBtn>
          <PagBtn onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1 || loading}><ChevronLeft className="w-4 h-4" /></PagBtn>
          <span className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-sm min-w-[64px] text-center">
            {page} / {totalPages}
          </span>
          <PagBtn onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages || loading}><ChevronRight className="w-4 h-4" /></PagBtn>
          <PagBtn onClick={() => setPage(totalPages)} disabled={page === totalPages || loading}><ChevronsRight className="w-4 h-4" /></PagBtn>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title="Hapus Data KB"
        message={`Apakah Anda yakin ingin menghapus data KB "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
      />

      {/* Export Modal */}
      {exportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setExportOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800">Export Data KB</h3>
                <p className="text-xs text-slate-500 mt-0.5">Pilih bulan & tahun laporan</p>
              </div>
              <button onClick={() => setExportOpen(false)} aria-label="Tutup" className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Bulan</label>
                  <select value={exportMonth} onChange={(e) => setExportMonth(Number(e.target.value))} className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 bg-white">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Tahun</label>
                  <input type="number" value={exportYear} onChange={(e) => setExportYear(Number(e.target.value))} min={1900} className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 bg-white" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Mode Export</label>
                <select value={exportMode} onChange={(e) => setExportMode(e.target.value)} className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 bg-white">
                  <option value="visits">Kunjungan (per baris)</option>
                  <option value="people">Orang (unik per orang)</option>
                </select>
                <p className="text-xs text-slate-400 mt-0.5">* Kunjungan cocok untuk laporan layanan bulanan.</p>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex gap-2.5">
              <button onClick={() => setExportOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-sm transition">
                Batal
              </button>
              <button onClick={handleExport} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold py-2.5 rounded-xl text-sm transition inline-flex items-center justify-center gap-2">
                <FaFileExcel size={13} /> Download Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PagBtn({ onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled} className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-35 disabled:cursor-not-allowed transition shadow-sm">
      {children}
    </button>
  );
}
