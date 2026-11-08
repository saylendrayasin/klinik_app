"use client";

import Modal, { btnBatal, btnExcel } from "@/components/Modal";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetcher, fetchBlob } from "@/lib/fetcher";
import { FaEye, FaTrash, FaHeartbeat, FaFileExcel, FaPlus } from "react-icons/fa";
import {
  Search,
  SlidersHorizontal,
} from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import toast from "react-hot-toast";
import Paginasi from "@/components/Paginasi";

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
      const blob = await fetchBlob(url);
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md shadow-brand-200 shrink-0">
            <FaHeartbeat size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">Daftar KB</h1>
            <p className="text-slate-500 text-xs mt-0.5">Data keluarga berencana dan kunjungan akseptor</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            onClick={() => setExportOpen(true)}
            className="inline-flex items-center justify-center gap-2 min-h-11 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all duration-150 active:scale-95"
          >
            <FaFileExcel size={13} />
            Export Excel
          </button>
          <Link
            href="/dashboard/kb/new"
            className="inline-flex items-center justify-center gap-2 min-h-11 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-all duration-150 shadow-md shadow-brand-200 hover:shadow-lg hover:-translate-y-px active:scale-95"
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
          <input aria-label="Cari nama / NIK akseptor"
            type="text"
            placeholder="Cari nama / NIK akseptor..."
            value={search}
            onChange={handleSearchChange}
            className="field pl-10"
          />
        </div>
        <div className="relative w-full sm:w-44">
          <SlidersHorizontal size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select aria-label="Urutkan daftar"
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="field pl-9"
          >
            <option value="name">Nama A–Z</option>
            <option value="dateOfBirth">Umur</option>
          </select>
        </div>
      </div>

      {/* Table Desktop */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-brand-50 to-brand-50/50 border-b border-brand-100">
              <th className="py-3.5 px-5 text-left text-[11px] font-bold text-brand-700 uppercase tracking-wider">Nama</th>
              <th className="py-3.5 px-5 text-left text-[11px] font-bold text-brand-700 uppercase tracking-wider">NIK</th>
              <th className="py-3.5 px-5 text-left text-[11px] font-bold text-brand-700 uppercase tracking-wider">Umur</th>
              <th className="py-3.5 px-5 text-left text-[11px] font-bold text-brand-700 uppercase tracking-wider">Jumlah Anak</th>
              <th className="py-3.5 px-5 text-center text-[11px] font-bold text-brand-700 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 anim-stagger">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx}>
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
                  <td className="py-3.5 px-5 text-slate-500 tabular-nums text-xs">{kb.nik}</td>
                  <td className="py-3.5 px-5 text-slate-600 whitespace-nowrap">{calculateAge(kb.dateOfBirth)} tahun</td>
                  <td className="py-3.5 px-5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      kb.numberOfChildren > 3 ? "bg-red-100 text-red-700" : "bg-brand-100 text-brand-700"
                    }`}>
                      {kb.numberOfChildren} anak
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex justify-center gap-2">
                      <Link href={`/dashboard/kb/${kb._id}`} className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-3.5 py-1.5 min-h-11 lg:min-h-9 rounded-lg text-xs font-semibold transition active:scale-95">
                        <FaEye size={11} /> Lihat
                      </Link>
                      <button onClick={() => setDeleteTarget({ id: kb._id, name: kb.name })} className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-500 px-3.5 py-1.5 min-h-11 lg:min-h-9 rounded-lg text-xs font-semibold transition active:scale-95">
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
      <div className="block sm:hidden space-y-3 anim-stagger">
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
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
              <div className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-bold text-slate-800 flex-1 truncate min-w-0">{kb.name}</h2>
                  <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    kb.numberOfChildren > 3 ? "bg-red-100 text-red-700" : "bg-brand-100 text-brand-700"
                  }`}>
                    {kb.numberOfChildren} anak
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span className="tabular-nums">{kb.nik}</span>
                  <span>{calculateAge(kb.dateOfBirth)} tahun</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Link href={`/dashboard/kb/${kb._id}`} className="flex-1 min-h-11 bg-brand-50 hover:bg-brand-100 text-brand-700 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition active:scale-[0.98]">
                    <FaEye size={12} /> Lihat
                  </Link>
                  <button onClick={() => setDeleteTarget({ id: kb._id, name: kb.name })} aria-label={`Hapus ${kb.name}`} className="shrink-0 min-h-11 min-w-11 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 flex items-center justify-center rounded-xl transition active:scale-[0.98]">
                    <FaTrash size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {kbList.length > 0 && (
        <Paginasi page={page} totalPages={totalPages} loading={loading} onChange={setPage} />
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
      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export Data KB"
        subtitle="Pilih bulan & tahun laporan"
        size="sm:max-w-md"
        aksen="bg-emerald-500"
        tutupDiLuar
        footer={
          <>
            <button type="button" onClick={() => setExportOpen(false)} className={btnBatal}>Batal</button>
            <button type="button" onClick={handleExport} className={btnExcel}>
              <FaFileExcel size={13} /> Download Excel
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="export-kb-bulan" className="text-sm font-semibold text-slate-700">Bulan</label>
            <select id="export-kb-bulan" value={exportMonth} onChange={(e) => setExportMonth(Number(e.target.value))} className="field">
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="export-kb-tahun" className="text-sm font-semibold text-slate-700">Tahun</label>
            <input id="export-kb-tahun" type="number" value={exportYear} onChange={(e) => setExportYear(Number(e.target.value))} min={1900} className="field" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="export-kb-mode-export" className="text-sm font-semibold text-slate-700">Mode Export</label>
          <select id="export-kb-mode-export" value={exportMode} onChange={(e) => setExportMode(e.target.value)} className="field">
            <option value="visits">Kunjungan (per baris)</option>
            <option value="people">Orang (unik per orang)</option>
          </select>
          <p className="text-xs text-slate-400 mt-0.5">* Kunjungan cocok untuk laporan layanan bulanan.</p>
        </div>

      </Modal>
    </div>
  );
}

