"use client";

import Modal, { btnBatal, btnExcel } from "@/components/Modal";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetcher, fetchBlob } from "@/lib/fetcher";
import { FaEye, FaTrash, FaBaby, FaFileExcel, FaPlus } from "react-icons/fa";
import {
  Search,
  SlidersHorizontal,
} from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import toast from "react-hot-toast";
import { tanggalSingkat as fmtDate } from "@/lib/tanggal";
import Paginasi from "@/components/Paginasi";
import KartuRingkasan from "@/components/KartuRingkasan";

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

// Harus sama dengan /api/kehamilan/summary: peringatan hanya untuk kehamilan aktif.
function getFlags(doc, today) {
  if (doc.status !== "aktif") return { overdue: false, hplDekat: false, jadwalTerlewat: false };
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
  aktif: "bg-brand-100 text-brand-700",
  selesai: "bg-green-100 text-green-700",
  keguguran: "bg-slate-100 text-slate-600",
  rujuk: "bg-amber-100 text-amber-700",
};

const STATUS_ICON = {
  aktif: "●",
  selesai: "✓",
  keguguran: "○",
  rujuk: "→",
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
      const tp = data.totalPages || 1;
      setTotalPages(tp);
      if (page > tp) setPage(Math.max(1, tp));
    } catch (e) { toast.error("Gagal memuat data kehamilan"); } finally { setLoading(false); }
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
      await fetcher(`/api/kehamilan/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      toast.success("Data berhasil dihapus", { id: toastId });
      fetchList(); fetchSummary();
    } catch (e) { toast.error(e?.message || "Gagal menghapus", { id: toastId }); }
    finally { setDeleting(false); }
  };

  const handleExport = async () => {
    if (exportMode === "visits" && (!exportFrom || !exportTo)) return toast.error("Tanggal wajib diisi");
    if (exportMode === "visits" && exportFrom > exportTo) return toast.error("Tanggal 'Dari' harus lebih awal dari 'Sampai'");
    const qs = new URLSearchParams({ mode: exportMode });
    if (exportMode === "visits") { qs.set("from", exportFrom); qs.set("to", exportTo); }
    setExportOpen(false);
    const toastId = toast.loading("Menyiapkan file...");
    try {
      const blob = await fetchBlob(`/api/kehamilan/export?${qs}`);
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-md shadow-brand-200 shrink-0">
            <FaBaby size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">Daftar Kehamilan</h1>
            <p className="text-slate-500 text-xs mt-0.5">Monitoring ANC, jadwal kunjungan, dan HPL ibu hamil</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button onClick={() => setExportOpen(true)} className="inline-flex items-center justify-center gap-2 min-h-11 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all duration-150 active:scale-95">
            <FaFileExcel size={13} /> Export Excel
          </button>
          <Link href="/dashboard/kehamilan/new" className="inline-flex items-center justify-center gap-2 min-h-11 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-all duration-150 shadow-md shadow-brand-200 hover:shadow-lg hover:-translate-y-px active:scale-95">
            <FaPlus size={11} /> Tambah
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 anim-stagger">
          <KartuRingkasan label="Total Aktif" value={summary.aktif} nada="brand" active={!filter && status === "aktif"} onClick={() => { setFilter(""); setStatus("aktif"); setPage(1); }} />
          <KartuRingkasan label="HPL ≤ 2 Minggu" value={summary.hplDekat} nada="amber" active={filter === "hplDekat"} onClick={() => { setFilter("hplDekat"); setStatus(""); setPage(1); }} />
          <KartuRingkasan label="Jadwal Terlewat" value={summary.jadwalTerlewat} nada="orange" active={filter === "jadwalTerlewat"} onClick={() => { setFilter("jadwalTerlewat"); setStatus(""); setPage(1); }} />
          <KartuRingkasan label="Overdue" value={summary.overdue} nada="red" active={filter === "overdue"} onClick={() => { setFilter("overdue"); setStatus(""); setPage(1); }} />
        </div>
      )}

      {/* Filter chip */}
      {filter && (
        <div className="flex items-center gap-2 text-sm">
          <span className="bg-brand-100 text-brand-700 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
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
      <div className="grid grid-cols-2 gap-2.5 sm:flex">
        <div className="relative col-span-2 sm:flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input aria-label="Cari nama / NIK" type="text" placeholder="Cari nama / NIK..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            className="field pl-10" />
        </div>
        <div className="relative min-w-0 sm:w-40">
          <SlidersHorizontal size={13} className="hidden sm:block absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select aria-label="Saring status" value={status} onChange={(e) => { setFilter(""); setStatus(e.target.value); setPage(1); }} disabled={!!filter}
            className="field sm:pl-9 disabled:opacity-50">
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="selesai">Selesai</option>
            <option value="keguguran">Keguguran</option>
            <option value="rujuk">Rujuk</option>
          </select>
        </div>
        <div className="relative min-w-0 sm:w-48">
          <select aria-label="Urutkan daftar" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="field">
            <option value="hpl">HPL Terdekat</option>
            <option value="name">Nama</option>
            <option value="createdAt">Terbaru</option>
          </select>
        </div>
      </div>

      {/* Table Desktop */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-brand-50 to-brand-50/40 border-b border-brand-100">
              {["Nama", "NIK", "Umur", "G/P/A", "HPL", "UK (mg)", "Status", "Aksi"].map((h) => (
                <th key={h} className={`py-3.5 px-4 text-[11px] font-bold text-brand-700 uppercase tracking-wider ${h === "Aksi" ? "text-center" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 anim-stagger">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
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
                const ukNow = doc.status === "aktif" && doc.hpht ? Math.floor((today - new Date(doc.hpht)) / (7 * MS_PER_DAY)) : null;
                return (
                  <tr key={doc._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-800">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {doc.name}
                        {flags.overdue && <span className="text-[11px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">Overdue</span>}
                        {!flags.overdue && flags.hplDekat && <span className="text-[11px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">HPL Dekat</span>}
                        {flags.jadwalTerlewat && <span className="text-[11px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-semibold">Jadwal Lewat</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 tabular-nums text-xs">{doc.nik}</td>
                    <td className="py-3 px-4 text-slate-600">{calcAge(doc.dateOfBirth)} th</td>
                    <td className="py-3 px-4 text-slate-600">G{doc.gravida || 0}P{doc.para || 0}A{doc.abortus || 0}</td>
                    <td className="py-3 px-4 text-slate-700">{fmtDate(doc.hpl)}</td>
                    <td className="py-3 px-4">{ukNow != null ? <span className="font-bold text-brand-700">{ukNow} mg</span> : "-"}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize inline-flex items-center gap-1 ${STATUS_BADGE[doc.status] || "bg-slate-100 text-slate-600"}`}><span aria-hidden="true">{STATUS_ICON[doc.status] || "●"}</span>{doc.status}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center gap-2">
                        <Link href={`/dashboard/kehamilan/${doc._id}`} className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 min-h-11 lg:min-h-9 rounded-lg text-xs font-semibold transition active:scale-95">
                          <FaEye size={10} /> Lihat
                        </Link>
                        <button onClick={() => setDeleteTarget({ id: doc._id, name: doc.name })} className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-500 px-3 py-1.5 min-h-11 lg:min-h-9 rounded-lg text-xs font-semibold transition active:scale-95">
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
      <div className="block sm:hidden space-y-3 anim-stagger">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
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
              const ukNow = doc.status === "aktif" && doc.hpht ? Math.floor((today - new Date(doc.hpht)) / (7 * MS_PER_DAY)) : null;
              return (
                <div key={doc._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <h2 className="text-sm font-bold text-slate-800 truncate flex-1 min-w-0">{doc.name}</h2>
                      <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[doc.status] || "bg-slate-100 text-slate-600"}`}>{doc.status}</span>
                    </div>
                    {(flags.overdue || flags.hplDekat || flags.jadwalTerlewat) && (
                      <div className="flex gap-1.5 flex-wrap">
                        {flags.overdue && <span className="text-[11px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">Overdue</span>}
                        {!flags.overdue && flags.hplDekat && <span className="text-[11px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">HPL Dekat</span>}
                        {flags.jadwalTerlewat && <span className="text-[11px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-semibold">Jadwal Lewat</span>}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="tabular-nums">{doc.nik}</span>
                      <span>G{doc.gravida || 0}P{doc.para || 0}A{doc.abortus || 0}</span>
                      <span>{calcAge(doc.dateOfBirth)} thn</span>
                      <span>HPL: <strong className="text-slate-700">{fmtDate(doc.hpl)}</strong></span>
                      {ukNow != null && <span className="font-bold text-brand-700">UK: {ukNow} mg</span>}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Link href={`/dashboard/kehamilan/${doc._id}`} className="flex-1 min-h-11 bg-brand-50 hover:bg-brand-100 text-brand-700 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition active:scale-[0.98]">
                        <FaEye size={12} /> Lihat
                      </Link>
                      <button onClick={() => setDeleteTarget({ id: doc._id, name: doc.name })} aria-label={`Hapus ${doc.name}`} className="shrink-0 min-h-11 min-w-11 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 flex items-center justify-center rounded-xl transition active:scale-[0.98]">
                        <FaTrash size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Pagination */}
      {list.length > 0 && (
        <Paginasi page={page} totalPages={totalPages} loading={loading} onChange={setPage} />
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
      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export Data Kehamilan"
        subtitle="Pilih mode export"
        size="sm:max-w-md"
        aksen="bg-emerald-500"
        tutupDiLuar
        footer={
          <>
            <button type="button" onClick={() => setExportOpen(false)} className={btnBatal}>Batal</button>
            <button type="button" onClick={handleExport} className={btnExcel}>
              <FaFileExcel size={13} /> Download
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="export-anc-mode-export" className="text-sm font-semibold text-slate-700">Mode Export</label>
          <select id="export-anc-mode-export" value={exportMode} onChange={(e) => setExportMode(e.target.value)} className="field">
            <option value="aktif">Ibu Hamil Aktif (snapshot hari ini)</option>
            <option value="visits">Kunjungan ANC (rentang tanggal)</option>
          </select>
        </div>
        {exportMode === "visits" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="export-anc-dari" className="text-sm font-semibold text-slate-700">Dari</label>
              <input id="export-anc-dari" type="date" value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} className="field" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="export-anc-sampai" className="text-sm font-semibold text-slate-700">Sampai</label>
              <input id="export-anc-sampai" type="date" value={exportTo} onChange={(e) => setExportTo(e.target.value)} className="field" />
            </div>
          </div>
        )}

      </Modal>
    </div>
  );
}

