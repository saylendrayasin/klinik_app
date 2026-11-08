"use client";

import Modal, { btnBatal, btnExcel } from "@/components/Modal";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetcher, fetchBlob } from "@/lib/fetcher";
import { FaEye, FaTrash, FaFileExcel, FaHospital, FaPlus } from "react-icons/fa";
import {
  Search,
  SlidersHorizontal,
} from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import toast from "react-hot-toast";
import { tanggalSingkat as fmtDate } from "@/lib/tanggal";
import Paginasi from "@/components/Paginasi";
import KartuRingkasan from "@/components/KartuRingkasan";

function calcAge(dob) {
  if (!dob) return "-";
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return "-";
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
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
  terdaftar: "bg-slate-100 text-slate-600",
  aktif: "bg-brand-100 text-brand-700",
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
      const blob = await fetchBlob(`/api/persalinan/export?${qs}`);
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-md shadow-brand-200 shrink-0">
            <FaHospital size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">Daftar Persalinan</h1>
            <p className="text-slate-500 text-xs mt-0.5">Pencatatan persalinan dan kunjungan nifas ibu</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button onClick={() => setExportOpen(true)} className="inline-flex items-center justify-center gap-2 min-h-11 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all duration-150 active:scale-95">
            <FaFileExcel size={13} /> Export Excel
          </button>
          <Link href="/dashboard/persalinan/new" className="inline-flex items-center justify-center gap-2 min-h-11 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-all duration-150 shadow-md shadow-brand-200 hover:shadow-lg hover:-translate-y-px active:scale-95">
            <FaPlus size={11} /> Tambah
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 anim-stagger [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1">
          <KartuRingkasan label="Belum Bersalin" value={summary.belumPersalinan} nada="brand" active={filter === "belumPersalinan"} onClick={() => { setFilter("belumPersalinan"); setStatus(""); setPage(1); }} />
          <KartuRingkasan label="Persalinan Bulan Ini" value={summary.totalBulanIni} nada="brand" active={false} onClick={() => { setFilter(""); setStatus(""); setPage(1); }} />
          <KartuRingkasan label="Nifas Aktif" value={summary.aktif} nada="brand" active={!filter && status === "aktif"} onClick={() => { setFilter(""); setStatus("aktif"); setPage(1); }} />
          <KartuRingkasan label="Kunjungan Terlewat" value={summary.kunjunganTerlewat} nada="orange" active={false} onClick={() => { setFilter(""); setStatus("aktif"); setPage(1); }} />
          <KartuRingkasan label="Perlu Perhatian" value={summary.perluPerhatian} nada="red" active={filter === "perluPerhatian"} onClick={() => { setFilter("perluPerhatian"); setStatus(""); setPage(1); }} />
        </div>
      )}

      {/* Active filter chip */}
      {filter && (
        <div className="flex items-center gap-2 text-sm">
          <span className="bg-brand-100 text-brand-700 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            {filter === "perluPerhatian" ? "Perlu Perhatian" : filter === "belumPersalinan" ? "Belum Bersalin" : filter}
          </span>
          <button onClick={() => { setFilter(""); setStatus(""); setPage(1); }} className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2">Hapus filter</button>
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
            <option value="terdaftar">Terdaftar</option>
            <option value="aktif">Aktif</option>
            <option value="selesai">Selesai</option>
            <option value="rujuk">Rujuk</option>
            <option value="meninggal">Meninggal</option>
          </select>
        </div>
        <div className="relative min-w-0 sm:w-48">
          <select aria-label="Urutkan daftar" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="field">
            <option value="tanggalPersalinan">Tanggal Terbaru</option>
            <option value="name">Nama</option>
            <option value="createdAt">Ditambahkan</option>
          </select>
        </div>
      </div>

      {/* Table Desktop */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-brand-50 to-brand-50/40 border-b border-brand-100">
              {["Nama", "NIK", "Umur", "Tanggal Persalinan", "Status", "Aksi"].map((h) => (
                <th key={h} className={`py-3.5 px-4 text-[11px] font-bold text-brand-700 uppercase tracking-wider ${h === "Aksi" ? "text-center" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 anim-stagger">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
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
                        {flags.komplikasi && <span className="text-[11px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">Komplikasi</span>}
                        {flags.bblr && <span className="text-[11px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">BBLR</span>}
                        {flags.apgarRendah && <span className="text-[11px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-semibold">Apgar Rendah</span>}
                        {flags.kfTerlewat && <span className="text-[11px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-semibold">KF Terlewat</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 tabular-nums text-xs">{doc.nik}</td>
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
                        <Link href={`/dashboard/persalinan/${doc._id}`} className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 min-h-11 lg:min-h-9 rounded-lg text-xs font-semibold transition active:scale-95">
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
                  <div className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <h2 className="text-sm font-bold text-slate-800 truncate flex-1 min-w-0">{doc.name}</h2>
                      <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[doc.status] || "bg-slate-100 text-slate-600"}`}>{doc.status}</span>
                    </div>
                    {(flags.komplikasi || flags.bblr || flags.apgarRendah || flags.kfTerlewat) && (
                      <div className="flex gap-1.5 flex-wrap">
                        {flags.komplikasi && <span className="text-[11px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">Komplikasi</span>}
                        {flags.bblr && <span className="text-[11px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">BBLR</span>}
                        {flags.apgarRendah && <span className="text-[11px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-semibold">Apgar Rendah</span>}
                        {flags.kfTerlewat && <span className="text-[11px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-semibold">KF Terlewat</span>}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="tabular-nums">{doc.nik}</span>
                      <span>{calcAge(doc.dateOfBirth)} tahun</span>
                      {doc.tanggalPersalinan ? <span>Tgl: <strong className="text-slate-700">{fmtDate(doc.tanggalPersalinan)}</strong></span> : <span className="text-amber-600 font-semibold">Belum bersalin</span>}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Link href={`/dashboard/persalinan/${doc._id}`} className="flex-1 min-h-11 bg-brand-50 hover:bg-brand-100 text-brand-700 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition active:scale-[0.98]">
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
        title="Hapus Data Persalinan"
        message={`Apakah Anda yakin ingin menghapus data persalinan "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
      />

      {/* Export Modal */}
      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export Data Persalinan"
        subtitle="Pilih mode dan rentang tanggal"
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
          <label htmlFor="export-salin-mode-export" className="text-sm font-semibold text-slate-700">Mode Export</label>
          <select id="export-salin-mode-export" value={exportMode} onChange={(e) => setExportMode(e.target.value)} className="field">
            <option value="persalinan">Data Persalinan (per rentang tanggal)</option>
            <option value="nifas">Kunjungan Nifas (per rentang tanggal)</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="export-salin-dari" className="text-sm font-semibold text-slate-700">Dari</label>
            <input id="export-salin-dari" type="date" value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} className="field" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="export-salin-sampai" className="text-sm font-semibold text-slate-700">Sampai</label>
            <input id="export-salin-sampai" type="date" value={exportTo} onChange={(e) => setExportTo(e.target.value)} className="field" />
          </div>
        </div>

      </Modal>
    </div>
  );
}

