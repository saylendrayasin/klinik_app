"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { FaEye, FaTrash, FaFileExcel, FaHospital, FaPlus } from "react-icons/fa";
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Search, SlidersHorizontal,
} from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import toast from "react-hot-toast";

function calcAge(dob) {
  if (!dob) return "-";
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return "-";
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
}

function fmtDate(d) {
  if (!d) return "-";
  try { return new Date(d).toLocaleDateString("id-ID"); } catch { return "-"; }
}

function getFlags(doc) {
  return {
    bblr: doc.bayi?.beratLahir != null && doc.bayi.beratLahir < 2500,
    apgarRendah: doc.bayi?.nilaiApgar5 != null && doc.bayi.nilaiApgar5 < 7,
    komplikasi: !!(doc.komplikasiIbu || doc.bayi?.komplikasiBayi),
    kfTerlewat: !!doc.kfTerlewat,
  };
}

const STATUS_BADGE = {
  terdaftar: "bg-sky-100 text-sky-700",
  aktif: "bg-emerald-100 text-emerald-700",
  selesai: "bg-green-100 text-green-700",
  rujuk: "bg-amber-100 text-amber-700",
  meninggal: "bg-slate-100 text-slate-600",
};

const STATUS_ICON = {
  terdaftar: "○",
  aktif: "●",
  selesai: "✓",
  rujuk: "→",
  meninggal: "×",
};

export default function DashboardPersalinanPage() {
  const [list, setList] = useState([]);
  const [summary, setSummary] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("tanggalPersalinan");
  const [status, setStatus] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const now = useMemo(() => new Date(), []);
  const [exportMode, setExportMode] = useState("persalinan");
  const [exportFrom, setExportFrom] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`);
  const [exportTo, setExportTo] = useState(now.toISOString().slice(0, 10));

  const limit = 10;

  const fetchList = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page, limit, search, sort });
      if (filter) qs.set("filter", filter);
      else if (status) qs.set("status", status);
      const data = await fetcher(`/api/persalinan?${qs}`);
      setList(data.data);
      const tp = data.totalPages || 1;
      setTotalPages(tp);
      if (page > tp) setPage(Math.max(1, tp));
    } catch (e) { toast.error("Gagal memuat data persalinan"); } finally { setLoading(false); }
  };

  const fetchSummary = async () => {
    try { const data = await fetcher("/api/persalinan/summary"); setSummary(data.data); } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]); // eslint-disable-line

  useEffect(() => { fetchList(); }, [search, sort, status, filter, page]); // eslint-disable-line
  useEffect(() => { fetchSummary(); }, []);

  useEffect(() => {
    if (!exportOpen) return;
    const handler = (e) => { if (e.key === "Escape") setExportOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [exportOpen]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const toastId = toast.loading("Menghapus...");
    try {
      await fetcher(`/api/persalinan/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      toast.success("Data berhasil dihapus", { id: toastId });
      fetchList(); fetchSummary();
    } catch (e) { toast.error(e?.message || "Gagal menghapus", { id: toastId }); }
    finally { setDeleting(false); }
  };

  const handleExport = async () => {
    if (!exportFrom || !exportTo) return toast.error("Tanggal wajib diisi");
    if (exportFrom > exportTo) return toast.error("Tanggal 'Dari' harus lebih awal dari 'Sampai'");
    const qs = new URLSearchParams({ mode: exportMode, from: exportFrom, to: exportTo });
    setExportOpen(false);
    const toastId = toast.loading("Menyiapkan file...");
    try {
      const res = await fetch(`/api/persalinan/export?${qs}`, { credentials: "include" });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.message || "Gagal export"); }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = exportMode === "persalinan" ? `data-persalinan-${exportFrom}-sd-${exportTo}.xlsx` : `kunjungan-nifas-${exportFrom}-sd-${exportTo}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("File berhasil diunduh", { id: toastId });
    } catch (e) { toast.error(e?.message || "Gagal download", { id: toastId }); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-200 shrink-0">
            <FaHospital size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">Daftar Persalinan</h1>
            <p className="text-slate-500 text-xs mt-0.5">Pencatatan persalinan dan kunjungan nifas ibu</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={() => setExportOpen(true)} className="inline-flex items-center justify-center gap-2 bg-teal-50 hover:bg-teal-500 text-teal-600 hover:text-white border border-teal-200 hover:border-teal-500 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all duration-150 active:scale-95">
            <FaFileExcel size={13} /> Export Excel
          </button>
          <Link href="/dashboard/persalinan/new" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-all duration-150 shadow-md shadow-emerald-200 hover:shadow-lg hover:-translate-y-px active:scale-95">
            <FaPlus size={11} /> Tambah
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <SummaryCard label="Belum Bersalin" value={summary.belumPersalinan} color="blue" active={filter === "belumPersalinan"} onClick={() => { setFilter("belumPersalinan"); setStatus(""); setPage(1); }} />
          <SummaryCard label="Persalinan Bulan Ini" value={summary.totalBulanIni} color="emerald" active={false} onClick={() => { setFilter(""); setStatus(""); setPage(1); }} />
          <SummaryCard label="Nifas Aktif" value={summary.aktif} color="teal" active={!filter && status === "aktif"} onClick={() => { setFilter(""); setStatus("aktif"); setPage(1); }} />
          <SummaryCard label="Kunjungan Terlewat" value={summary.kunjunganTerlewat} color="orange" active={false} onClick={() => { setFilter(""); setStatus("aktif"); setPage(1); }} />
          <SummaryCard label="Perlu Perhatian" value={summary.perluPerhatian} color="red" active={filter === "perluPerhatian"} onClick={() => { setFilter("perluPerhatian"); setStatus(""); setPage(1); }} />
        </div>
      )}

      {/* Active filter chip */}
      {filter && (
        <div className="flex items-center gap-2 text-sm">
          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {filter === "perluPerhatian" ? "Perlu Perhatian" : filter === "belumPersalinan" ? "Belum Bersalin" : filter}
          </span>
          <button onClick={() => { setFilter(""); setStatus(""); setPage(1); }} className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2">Hapus filter</button>
        </div>
      )}

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input type="text" placeholder="Cari nama / NIK..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-300 transition shadow-sm placeholder:text-slate-400" />
        </div>
        <div className="relative sm:w-40">
          <SlidersHorizontal size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select value={status} onChange={(e) => { setFilter(""); setStatus(e.target.value); setPage(1); }} disabled={!!filter}
            className="appearance-none w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition shadow-sm text-slate-700 disabled:opacity-50">
            <option value="">Semua Status</option>
            <option value="terdaftar">Terdaftar</option>
            <option value="aktif">Aktif</option>
            <option value="selesai">Selesai</option>
            <option value="rujuk">Rujuk</option>
            <option value="meninggal">Meninggal</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"><svg className="h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" stroke="currentColor"><path d="M7 7l3-3 3 3m0 6l-3 3-3-3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
        </div>
        <div className="relative sm:w-48">
          <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="appearance-none w-full px-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition shadow-sm text-slate-700">
            <option value="tanggalPersalinan">Tanggal Terbaru</option>
            <option value="name">Nama</option>
            <option value="createdAt">Ditambahkan</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"><svg className="h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" stroke="currentColor"><path d="M7 7l3-3 3 3m0 6l-3 3-3-3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
        </div>
      </div>

      {/* Table Desktop */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-emerald-50 to-teal-50/40 border-b border-emerald-100">
              {["Nama", "NIK", "Umur", "Tanggal Persalinan", "Status", "Aksi"].map((h) => (
                <th key={h} className={`py-3.5 px-4 text-[11px] font-bold text-emerald-700 uppercase tracking-wider ${h === "Aksi" ? "text-center" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="py-3.5 px-4"><div className="h-4 bg-slate-100 rounded-lg w-3/4 skeleton" /></td>
                    ))}
                  </tr>
                ))
              : list.length === 0 ? (
                <tr><td colSpan={6} className="py-14 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3"><FaHospital size={24} className="text-slate-300" /></div>
                  <p className="text-sm font-semibold text-slate-400">Tidak ada data persalinan ditemukan</p>
                </td></tr>
              ) : list.map((doc) => {
                const flags = getFlags(doc);
                return (
                  <tr key={doc._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-800">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {doc.name}
                        {flags.komplikasi && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">Komplikasi</span>}
                        {flags.bblr && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">BBLR</span>}
                        {flags.apgarRendah && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-semibold">Apgar Rendah</span>}
                        {flags.kfTerlewat && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-semibold">KF Terlewat</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-xs">{doc.nik}</td>
                    <td className="py-3 px-4 text-slate-600">{calcAge(doc.dateOfBirth)} th</td>
                    <td className="py-3 px-4">
                      {doc.tanggalPersalinan ? <span className="text-slate-700">{fmtDate(doc.tanggalPersalinan)}</span> : (
                        <span className="text-amber-600 text-xs font-semibold">Belum bersalin</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize inline-flex items-center gap-1 ${STATUS_BADGE[doc.status] || "bg-slate-100 text-slate-600"}`}><span aria-hidden="true">{STATUS_ICON[doc.status] || "●"}</span>{doc.status}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center gap-2">
                        <Link href={`/dashboard/persalinan/${doc._id}`} className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95">
                          <FaEye size={10} /> Lihat
                        </Link>
                        <button onClick={() => setDeleteTarget({ id: doc._id, name: doc.name })} className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white border border-red-200 hover:border-red-500 px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95">
                          <FaTrash size={10} /> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Cards Mobile */}
      <div className="block sm:hidden space-y-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 animate-pulse space-y-3 shadow-sm">
                <div className="h-5 bg-slate-100 rounded-lg w-1/2 skeleton" />
                <div className="h-4 bg-slate-100 rounded-lg w-2/3 skeleton" />
                <div className="flex gap-2 mt-2"><div className="flex-1 h-9 bg-slate-100 rounded-xl skeleton" /><div className="flex-1 h-9 bg-slate-100 rounded-xl skeleton" /></div>
              </div>
            ))
          : list.length === 0
          ? <div className="text-center py-14 bg-white rounded-2xl border border-slate-200"><div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3"><FaHospital size={24} className="text-slate-300" /></div><p className="text-sm font-semibold text-slate-400">Tidak ada data persalinan</p></div>
          : list.map((doc) => {
              const flags = getFlags(doc);
              return (
                <div key={doc._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
                  <div className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <h2 className="text-sm font-bold text-slate-800 truncate flex-1 min-w-0">{doc.name}</h2>
                      <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[doc.status] || "bg-slate-100 text-slate-600"}`}>{doc.status}</span>
                    </div>
                    {(flags.komplikasi || flags.bblr || flags.apgarRendah || flags.kfTerlewat) && (
                      <div className="flex gap-1.5 flex-wrap">
                        {flags.komplikasi && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">Komplikasi</span>}
                        {flags.bblr && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">BBLR</span>}
                        {flags.apgarRendah && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-semibold">Apgar Rendah</span>}
                        {flags.kfTerlewat && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-semibold">KF Terlewat</span>}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="font-mono">{doc.nik}</span>
                      <span>{calcAge(doc.dateOfBirth)} tahun</span>
                      {doc.tanggalPersalinan ? <span>Tgl: <strong className="text-slate-700">{fmtDate(doc.tanggalPersalinan)}</strong></span> : <span className="text-amber-600 font-semibold">Belum bersalin</span>}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Link href={`/dashboard/persalinan/${doc._id}`} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition active:scale-95">
                        <FaEye size={12} /> Lihat
                      </Link>
                      <button onClick={() => setDeleteTarget({ id: doc._id, name: doc.name })} className="flex-1 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white border border-red-200 hover:border-red-500 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition active:scale-95">
                        <FaTrash size={11} /> Hapus
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Pagination */}
      {list.length > 0 && (
        <div className="flex items-center justify-center gap-1.5 pt-2">
          <PagBtn onClick={() => setPage(1)} disabled={page === 1 || loading}><ChevronsLeft className="w-4 h-4" /></PagBtn>
          <PagBtn onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1 || loading}><ChevronLeft className="w-4 h-4" /></PagBtn>
          <span className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-sm min-w-[64px] text-center">{page} / {totalPages}</span>
          <PagBtn onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages || loading}><ChevronRight className="w-4 h-4" /></PagBtn>
          <PagBtn onClick={() => setPage(totalPages)} disabled={page === totalPages || loading}><ChevronsRight className="w-4 h-4" /></PagBtn>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title="Hapus Data Persalinan"
        message={`Apakah Anda yakin ingin menghapus data persalinan "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
      />

      {/* Export Modal */}
      {exportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setExportOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div><h3 className="font-bold text-slate-800">Export Data Persalinan</h3><p className="text-xs text-slate-500 mt-0.5">Pilih mode dan rentang tanggal</p></div>
              <button onClick={() => setExportOpen(false)} aria-label="Tutup" className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Mode Export</label>
                <select value={exportMode} onChange={(e) => setExportMode(e.target.value)} className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 bg-white">
                  <option value="persalinan">Data Persalinan (per rentang tanggal)</option>
                  <option value="nifas">Kunjungan Nifas (per rentang tanggal)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Dari</label>
                  <input type="date" value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 bg-white" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Sampai</label>
                  <input type="date" value={exportTo} onChange={(e) => setExportTo(e.target.value)} className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 bg-white" />
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex gap-2.5">
              <button onClick={() => setExportOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-sm transition">Batal</button>
              <button onClick={handleExport} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold py-2.5 rounded-xl text-sm transition inline-flex items-center justify-center gap-2">
                <FaFileExcel size={13} /> Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color, active, onClick }) {
  const styles = {
    blue: { card: "bg-white border-slate-200 text-blue-700", active: "ring-2 ring-blue-400 border-blue-200 bg-blue-50", dot: "bg-blue-500" },
    emerald: { card: "bg-white border-slate-200 text-emerald-700", active: "ring-2 ring-emerald-400 border-emerald-200 bg-emerald-50", dot: "bg-emerald-500" },
    teal: { card: "bg-white border-slate-200 text-teal-700", active: "ring-2 ring-teal-400 border-teal-200 bg-teal-50", dot: "bg-teal-500" },
    orange: { card: "bg-white border-slate-200 text-orange-700", active: "ring-2 ring-orange-400 border-orange-200 bg-orange-50", dot: "bg-orange-500" },
    red: { card: "bg-white border-slate-200 text-red-700", active: "ring-2 ring-red-400 border-red-200 bg-red-50", dot: "bg-red-500" },
  };
  const s = styles[color];
  return (
    <button onClick={onClick} className={`border rounded-2xl p-3.5 text-left w-full hover:shadow-md transition-all duration-150 ${active ? s.active : s.card}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        <p className="text-xs font-semibold opacity-75 leading-tight">{label}</p>
      </div>
      <p className="text-2xl font-bold mt-0.5">{value ?? "-"}</p>
    </button>
  );
}

function PagBtn({ onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled} className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-35 disabled:cursor-not-allowed transition shadow-sm">
      {children}
    </button>
  );
}
