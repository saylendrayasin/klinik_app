"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { FaEye, FaTrash, FaBaby, FaFileExcel, FaPlus } from "react-icons/fa";
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Search, SlidersHorizontal,
} from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import toast from "react-hot-toast";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

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

function getFlags(doc, today) {
  const hpl = doc.hpl ? new Date(doc.hpl) : null;
  const daysToHPL = hpl ? Math.floor((hpl - today) / MS_PER_DAY) : null;
  const lastVisit = [...(doc.visits || [])].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const jadwalLewat = lastVisit?.jadwalBerikutnya && new Date(lastVisit.jadwalBerikutnya) < today;
  return {
    overdue: hpl && today > hpl,
    hplDekat: daysToHPL != null && daysToHPL >= 0 && daysToHPL <= 14,
    jadwalTerlewat: !!jadwalLewat,
  };
}

const STATUS_BADGE = {
  aktif: "bg-pink-100 text-pink-700",
  selesai: "bg-green-100 text-green-700",
  keguguran: "bg-slate-100 text-slate-600",
  rujuk: "bg-amber-100 text-amber-700",
};

export default function DashboardKehamilanPage() {
  const [list, setList] = useState([]);
  const [summary, setSummary] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("hpl");
  const [status, setStatus] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const now = useMemo(() => new Date(), []);
  const [exportMode, setExportMode] = useState("aktif");
  const [exportFrom, setExportFrom] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`);
  const [exportTo, setExportTo] = useState(now.toISOString().slice(0, 10));

  const limit = 10;

  const fetchList = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page, limit, search, sort });
      if (filter) qs.set("filter", filter);
      else if (status) qs.set("status", status);
      const data = await fetcher(`/api/kehamilan?${qs}`);
      setList(data.data);
      setTotalPages(data.totalPages);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchSummary = async () => {
    try { const data = await fetcher("/api/kehamilan/summary"); setSummary(data.data); } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]); // eslint-disable-line

  useEffect(() => { fetchList(); }, [search, sort, status, filter, page]); // eslint-disable-line
  useEffect(() => { fetchSummary(); }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const toastId = toast.loading("Menghapus...");
    try {
      await fetcher(`/api/kehamilan/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      toast.success("Data berhasil dihapus", { id: toastId });
      fetchList(); fetchSummary();
    } catch (e) { toast.error(e?.message || "Gagal menghapus", { id: toastId }); }
    finally { setDeleting(false); }
  };

  const handleExport = async () => {
    if (exportMode === "visits" && (!exportFrom || !exportTo)) return toast.error("Tanggal wajib diisi");
    const qs = new URLSearchParams({ mode: exportMode });
    if (exportMode === "visits") { qs.set("from", exportFrom); qs.set("to", exportTo); }
    setExportOpen(false);
    const toastId = toast.loading("Menyiapkan file...");
    try {
      const res = await fetch(`/api/kehamilan/export?${qs}`, { credentials: "include" });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.message || "Gagal export"); }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = exportMode === "aktif" ? "ibu-hamil-aktif.xlsx" : `kunjungan-anc-${exportFrom}-sd-${exportTo}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("File berhasil diunduh", { id: toastId });
    } catch (e) { toast.error(e?.message || "Gagal download", { id: toastId }); }
  };

  const today = new Date();

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-md shadow-pink-200 shrink-0">
            <FaBaby size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">Daftar Kehamilan</h1>
            <p className="text-slate-500 text-xs mt-0.5">Monitoring ANC, jadwal kunjungan, dan HPL ibu hamil</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={() => setExportOpen(true)} className="inline-flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-500 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all duration-150 active:scale-95">
            <FaFileExcel size={13} /> Export Excel
          </button>
          <Link href="/dashboard/kehamilan/new" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-all duration-150 shadow-md shadow-pink-200 hover:shadow-lg hover:-translate-y-px active:scale-95">
            <FaPlus size={11} /> Tambah
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <SummaryCard label="Total Aktif" value={summary.aktif} color="pink" active={!filter && status === "aktif"} onClick={() => { setFilter(""); setStatus("aktif"); setPage(1); }} />
          <SummaryCard label="HPL ≤ 2 Minggu" value={summary.hplDekat} color="amber" active={filter === "hplDekat"} onClick={() => { setFilter("hplDekat"); setStatus(""); setPage(1); }} />
          <SummaryCard label="Jadwal Terlewat" value={summary.jadwalTerlewat} color="orange" active={filter === "jadwalTerlewat"} onClick={() => { setFilter("jadwalTerlewat"); setStatus(""); setPage(1); }} />
          <SummaryCard label="Overdue" value={summary.overdue} color="red" active={filter === "overdue"} onClick={() => { setFilter("overdue"); setStatus(""); setPage(1); }} />
        </div>
      )}

      {/* Filter chip */}
      {filter && (
        <div className="flex items-center gap-2 text-sm">
          <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
            {filter === "hplDekat" && "HPL ≤ 2 Minggu"}
            {filter === "overdue" && "Overdue"}
            {filter === "jadwalTerlewat" && "Jadwal Terlewat"}
          </span>
          <button onClick={() => { setFilter(""); setStatus(""); setPage(1); }} className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2">
            Hapus filter
          </button>
        </div>
      )}

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input type="text" placeholder="Cari nama / NIK..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-pink-300 transition shadow-sm placeholder:text-slate-400" />
        </div>
        <div className="relative sm:w-40">
          <SlidersHorizontal size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select value={status} onChange={(e) => { setFilter(""); setStatus(e.target.value); setPage(1); }} disabled={!!filter}
            className="appearance-none w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400/50 transition shadow-sm text-slate-700 disabled:opacity-50">
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="selesai">Selesai</option>
            <option value="keguguran">Keguguran</option>
            <option value="rujuk">Rujuk</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"><svg className="h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" stroke="currentColor"><path d="M7 7l3-3 3 3m0 6l-3 3-3-3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
        </div>
        <div className="relative sm:w-48">
          <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="appearance-none w-full px-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400/50 transition shadow-sm text-slate-700">
            <option value="hpl">HPL Terdekat</option>
            <option value="name">Nama</option>
            <option value="createdAt">Terbaru</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"><svg className="h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" stroke="currentColor"><path d="M7 7l3-3 3 3m0 6l-3 3-3-3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
        </div>
      </div>

      {/* Table Desktop */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-pink-50 to-rose-50/40 border-b border-pink-100">
              {["Nama", "NIK", "Umur", "G/P/A", "HPL", "UK (mg)", "Status", "Aksi"].map((h) => (
                <th key={h} className={`py-3.5 px-4 text-[11px] font-bold text-pink-700 uppercase tracking-wider ${h === "Aksi" ? "text-center" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="py-3.5 px-4"><div className="h-4 bg-slate-100 rounded-lg w-3/4 skeleton" /></td>
                    ))}
                  </tr>
                ))
              : list.length === 0 ? (
                <tr><td colSpan={8} className="py-14 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3"><FaBaby size={24} className="text-slate-300" /></div>
                  <p className="text-sm font-semibold text-slate-400">Tidak ada data kehamilan ditemukan</p>
                </td></tr>
              ) : list.map((doc) => {
                const flags = getFlags(doc, today);
                const ukNow = doc.hpht ? Math.floor((today - new Date(doc.hpht)) / (7 * MS_PER_DAY)) : null;
                return (
                  <tr key={doc._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-800">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {doc.name}
                        {flags.overdue && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">Overdue</span>}
                        {!flags.overdue && flags.hplDekat && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">HPL Dekat</span>}
                        {flags.jadwalTerlewat && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-semibold">Jadwal Lewat</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-xs">{doc.nik}</td>
                    <td className="py-3 px-4 text-slate-600">{calcAge(doc.dateOfBirth)} th</td>
                    <td className="py-3 px-4 text-slate-600">G{doc.gravida || 0}P{doc.para || 0}A{doc.abortus || 0}</td>
                    <td className="py-3 px-4 text-slate-700">{fmtDate(doc.hpl)}</td>
                    <td className="py-3 px-4">{ukNow != null ? <span className="font-bold text-pink-700">{ukNow} mg</span> : "-"}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${STATUS_BADGE[doc.status] || "bg-slate-100 text-slate-600"}`}>{doc.status}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center gap-2">
                        <Link href={`/dashboard/kehamilan/${doc._id}`} className="inline-flex items-center gap-1.5 bg-pink-500 hover:bg-pink-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95">
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
                <div className="h-4 bg-slate-100 rounded-lg w-1/3 skeleton" />
                <div className="h-4 bg-slate-100 rounded-lg w-2/3 skeleton" />
                <div className="flex gap-2 mt-2"><div className="flex-1 h-9 bg-slate-100 rounded-xl skeleton" /><div className="flex-1 h-9 bg-slate-100 rounded-xl skeleton" /></div>
              </div>
            ))
          : list.length === 0
          ? <div className="text-center py-14 bg-white rounded-2xl border border-slate-200"><div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3"><FaBaby size={24} className="text-slate-300" /></div><p className="text-sm font-semibold text-slate-400">Tidak ada data kehamilan</p></div>
          : list.map((doc) => {
              const flags = getFlags(doc, today);
              const ukNow = doc.hpht ? Math.floor((today - new Date(doc.hpht)) / (7 * MS_PER_DAY)) : null;
              return (
                <div key={doc._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-pink-500 to-rose-400" />
                  <div className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <h2 className="text-sm font-bold text-slate-800 truncate flex-1 min-w-0">{doc.name}</h2>
                      <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[doc.status] || "bg-slate-100 text-slate-600"}`}>{doc.status}</span>
                    </div>
                    {(flags.overdue || flags.hplDekat || flags.jadwalTerlewat) && (
                      <div className="flex gap-1.5 flex-wrap">
                        {flags.overdue && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">Overdue</span>}
                        {!flags.overdue && flags.hplDekat && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">HPL Dekat</span>}
                        {flags.jadwalTerlewat && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-semibold">Jadwal Lewat</span>}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="font-mono">{doc.nik}</span>
                      <span>G{doc.gravida || 0}P{doc.para || 0}A{doc.abortus || 0}</span>
                      <span>{calcAge(doc.dateOfBirth)} thn</span>
                      <span>HPL: <strong className="text-slate-700">{fmtDate(doc.hpl)}</strong></span>
                      {ukNow != null && <span className="font-bold text-pink-700">UK: {ukNow} mg</span>}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Link href={`/dashboard/kehamilan/${doc._id}`} className="flex-1 bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition active:scale-95">
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
        title="Hapus Data Kehamilan"
        message={`Apakah Anda yakin ingin menghapus data kehamilan "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
      />

      {/* Export Modal */}
      {exportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setExportOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div><h3 className="font-bold text-slate-800">Export Data Kehamilan</h3><p className="text-xs text-slate-500 mt-0.5">Pilih mode export</p></div>
              <button onClick={() => setExportOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Mode Export</label>
                <select value={exportMode} onChange={(e) => setExportMode(e.target.value)} className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 bg-white">
                  <option value="aktif">Ibu Hamil Aktif (snapshot hari ini)</option>
                  <option value="visits">Kunjungan ANC (rentang tanggal)</option>
                </select>
              </div>
              {exportMode === "visits" && (
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
              )}
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
    pink: { card: "bg-white border-slate-200 text-pink-700", active: "ring-2 ring-pink-400 border-pink-200 bg-pink-50", dot: "bg-pink-500" },
    amber: { card: "bg-white border-slate-200 text-amber-700", active: "ring-2 ring-amber-400 border-amber-200 bg-amber-50", dot: "bg-amber-500" },
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
