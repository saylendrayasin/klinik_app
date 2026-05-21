"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { FaEye, FaTrash, FaFileExcel, FaHospital } from "react-icons/fa";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const KF_SCHEDULE = [
  { kf: 1, windowStart: 0, windowEnd: 2 },
  { kf: 2, windowStart: 3, windowEnd: 7 },
  { kf: 3, windowStart: 8, windowEnd: 28 },
  { kf: 4, windowStart: 29, windowEnd: 42 },
];

function calcAge(dob) {
  if (!dob) return "-";
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return "-";
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  )
    age--;
  return Math.max(0, age);
}

function fmtDate(d) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("id-ID");
  } catch {
    return "-";
  }
}

function getFlags(doc) {
  const bblr = doc.bayi?.beratLahir != null && doc.bayi.beratLahir < 2500;
  const apgarRendah = doc.bayi?.nilaiApgar5 != null && doc.bayi.nilaiApgar5 < 7;
  const komplikasi = !!(doc.komplikasiIbu || doc.bayi?.komplikasiBayi);

  let kfTerlewat = false;
  if (doc.tanggalPersalinan && doc.status === "aktif") {
    const today = new Date();
    const hariToday = Math.floor((today - new Date(doc.tanggalPersalinan)) / MS_PER_DAY);
    if (hariToday >= 0) {
      kfTerlewat = KF_SCHEDULE.some((s) => {
        if (hariToday <= s.windowEnd) return false;
        const hasVisit = (doc.visits || []).some((v) => {
          const vh = Math.floor((new Date(v.date) - new Date(doc.tanggalPersalinan)) / MS_PER_DAY);
          return vh >= s.windowStart && vh <= s.windowEnd;
        });
        return !hasVisit;
      });
    }
  }

  return { bblr, apgarRendah, komplikasi, kfTerlewat };
}

const STATUS_BADGE = {
  terdaftar: "bg-blue-100 text-blue-700",
  aktif: "bg-emerald-100 text-emerald-700",
  selesai: "bg-green-100 text-green-700",
  rujuk: "bg-amber-100 text-amber-700",
  meninggal: "bg-gray-100 text-gray-600",
};

export default function DashboardPersalinanPage() {
  const [list, setList] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("tanggalPersalinan");
  const [status, setStatus] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const now = useMemo(() => new Date(), []);
  const [exportMode, setExportMode] = useState("persalinan");
  const [exportFrom, setExportFrom] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
  );
  const [exportTo, setExportTo] = useState(now.toISOString().slice(0, 10));

  const limit = 10;

  const fetchList = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page, limit, search, sort });
      if (filter) {
        qs.set("filter", filter);
      } else if (status) {
        qs.set("status", status);
      }
      const data = await fetcher(`/api/persalinan?${qs}`);
      setList(data.data);
      setTotalPages(data.totalPages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await fetcher("/api/persalinan/summary");
      setSummary(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sort, status, filter, page]);

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleDelete = async (id) => {
    setPendingDeleteId(null);
    const toastId = toast.loading("Menghapus...");
    try {
      await fetcher(`/api/persalinan/${id}`, { method: "DELETE" });
      toast.success("Data berhasil dihapus", { id: toastId });
      fetchList();
      fetchSummary();
    } catch (e) {
      toast.error(e?.message || "Gagal menghapus", { id: toastId });
    }
  };

  const handleExport = async () => {
    if (!exportFrom || !exportTo) {
      return toast.error("Tanggal dari dan sampai wajib diisi");
    }
    const qs = new URLSearchParams({ mode: exportMode, from: exportFrom, to: exportTo });
    setExportOpen(false);
    const toastId = toast.loading("Menyiapkan file...");
    try {
      const res = await fetch(`/api/persalinan/export?${qs}`, { credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Gagal export");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = exportMode === "persalinan"
        ? `data-persalinan-${exportFrom}-sd-${exportTo}.xlsx`
        : `kunjungan-nifas-${exportFrom}-sd-${exportTo}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("File berhasil diunduh", { id: toastId });
    } catch (e) {
      toast.error(e?.message || "Gagal download", { id: toastId });
    }
  };

  return (
    <div className="sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm shrink-0">
            <FaHospital size={17} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 leading-tight">Daftar Persalinan</h1>
            <p className="text-gray-500 text-xs mt-0.5">Pencatatan persalinan dan kunjungan nifas ibu</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => setExportOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-5 rounded-md transition"
          >
            <FaFileExcel /> Export
          </button>
          <Link
            href="/dashboard/persalinan/new"
            className="w-full sm:w-auto inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-5 rounded-md transition"
          >
            + Tambah
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <SummaryCard
            label="Belum Bersalin"
            value={summary.belumPersalinan}
            color="blue"
            active={filter === "belumPersalinan"}
            onClick={() => { setFilter("belumPersalinan"); setStatus(""); setPage(1); }}
          />
          <SummaryCard
            label="Persalinan Bulan Ini"
            value={summary.totalBulanIni}
            color="emerald"
            active={false}
            onClick={() => { setFilter(""); setStatus(""); setPage(1); }}
          />
          <SummaryCard
            label="Nifas Aktif"
            value={summary.aktif}
            color="emerald"
            active={!filter && status === "aktif"}
            onClick={() => { setFilter(""); setStatus("aktif"); setPage(1); }}
          />
          <SummaryCard
            label="Kunjungan Terlewat"
            value={summary.kunjunganTerlewat}
            color="orange"
            active={!filter && status === "aktif" && false}
            onClick={() => { setFilter(""); setStatus("aktif"); setPage(1); }}
          />
          <SummaryCard
            label="Perlu Perhatian"
            value={summary.perluPerhatian}
            color="red"
            active={filter === "perluPerhatian"}
            onClick={() => { setFilter("perluPerhatian"); setStatus(""); setPage(1); }}
          />
        </div>
      )}

      {/* Active filter chip */}
      {filter && (
        <div className="mb-3 flex items-center gap-2 text-sm">
          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">
            Filter aktif: {filter === "perluPerhatian" ? "Perlu Perhatian" : filter === "belumPersalinan" ? "Belum Bersalin" : filter}
          </span>
          <button
            onClick={() => { setFilter(""); setStatus(""); setPage(1); }}
            className="text-gray-500 hover:text-gray-700 underline text-xs"
          >
            Hapus filter
          </button>
        </div>
      )}

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama / NIK..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setFilter(""); setStatus(e.target.value); setPage(1); }}
          disabled={!!filter}
          className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400 sm:w-40 disabled:opacity-50"
        >
          <option value="">Semua Status</option>
          <option value="terdaftar">Terdaftar</option>
          <option value="aktif">Aktif</option>
          <option value="selesai">Selesai</option>
          <option value="rujuk">Rujuk</option>
          <option value="meninggal">Meninggal</option>
        </select>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400 sm:w-48"
        >
          <option value="tanggalPersalinan">Tanggal Terbaru</option>
          <option value="name">Nama</option>
          <option value="createdAt">Ditambahkan</option>
        </select>
      </div>

      {/* Table Desktop */}
      <div className="hidden sm:block overflow-x-auto bg-white rounded-md shadow-md">
        <table className="min-w-full text-sm">
          <thead className="bg-emerald-50 border-b border-emerald-100">
            <tr>
              {["Nama", "NIK", "Umur", "Tanggal Persalinan", "Status", "Aksi"].map((h) => (
                <th
                  key={h}
                  className={`py-3.5 px-4 text-xs font-semibold text-emerald-800 uppercase tracking-wide ${h === "Aksi" ? "text-center" : "text-left"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse border-t">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="py-4 px-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              : list.length === 0
              ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    Tidak ada data persalinan ditemukan.
                  </td>
                </tr>
              )
              : list.map((doc) => {
                  const flags = getFlags(doc);
                  return (
                    <tr key={doc._id} className="border-t hover:bg-gray-50 transition-all">
                      <td className="py-3 px-4 font-medium">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {doc.name}
                          {flags.komplikasi && (
                            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Komplikasi</span>
                          )}
                          {flags.bblr && (
                            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">BBLR</span>
                          )}
                          {flags.apgarRendah && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">Apgar Rendah</span>
                          )}
                          {flags.kfTerlewat && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">KF Terlewat</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{doc.nik}</td>
                      <td className="py-3 px-4">{calcAge(doc.dateOfBirth)} th</td>
                      <td className="py-3 px-4">
                        {doc.tanggalPersalinan ? fmtDate(doc.tanggalPersalinan) : (
                          <span className="text-amber-600 text-xs font-medium">Belum bersalin</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${STATUS_BADGE[doc.status] || "bg-gray-100 text-gray-600"}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-2">
                          <Link
                            href={`/dashboard/persalinan/${doc._id}`}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm"
                          >
                            <FaEye />
                            <span className="hidden md:inline">Lihat</span>
                          </Link>
                          {pendingDeleteId === doc._id ? (
                            <>
                              <button
                                onClick={() => handleDelete(doc._id)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm font-semibold"
                              >
                                Yakin?
                              </button>
                              <button
                                onClick={() => setPendingDeleteId(null)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-sm"
                              >
                                Batal
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setPendingDeleteId(doc._id)}
                              className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm"
                            >
                              <FaTrash />
                              <span className="hidden md:inline">Hapus</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* Cards Mobile */}
      <div className="block sm:hidden space-y-4 mt-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border rounded-lg shadow p-4 animate-pulse space-y-3">
                <div className="h-5 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="flex gap-2 mt-2">
                  <div className="flex-1 h-8 bg-gray-200 rounded-md" />
                  <div className="flex-1 h-8 bg-gray-200 rounded-md" />
                </div>
              </div>
            ))
          : list.length === 0
          ? <p className="text-center text-gray-500 mt-6">Tidak ada data persalinan.</p>
          : list.map((doc) => {
              const flags = getFlags(doc);
              return (
                <div key={doc._id} className="bg-white border-l-4 border-emerald-500 rounded-lg shadow-sm p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <h2 className="text-base font-bold text-gray-800 truncate flex-1 min-w-0">{doc.name}</h2>
                    <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[doc.status] || "bg-gray-100 text-gray-600"}`}>
                      {doc.status}
                    </span>
                  </div>
                  {(flags.komplikasi || flags.bblr || flags.apgarRendah || flags.kfTerlewat) && (
                    <div className="flex gap-1.5 flex-wrap">
                      {flags.komplikasi && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Komplikasi</span>}
                      {flags.bblr && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">BBLR</span>}
                      {flags.apgarRendah && <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">Apgar Rendah</span>}
                      {flags.kfTerlewat && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">KF Terlewat</span>}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-gray-500">
                    <span>NIK: {doc.nik}</span>
                    <span>G{doc.gravida || 0}P{doc.para || 0}A{doc.abortus || 0}</span>
                    <span>{calcAge(doc.dateOfBirth)} tahun</span>
                    {doc.tanggalPersalinan ? (
                      <span>Tgl Salin: <strong className="text-gray-700">{fmtDate(doc.tanggalPersalinan)}</strong></span>
                    ) : (
                      <span className="text-amber-600 font-medium">Belum bersalin</span>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Link
                      href={`/dashboard/persalinan/${doc._id}`}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium"
                    >
                      <FaEye /> Lihat
                    </Link>
                    {pendingDeleteId === doc._id ? (
                      <>
                        <button
                          onClick={() => handleDelete(doc._id)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-md text-sm font-semibold"
                        >
                          Yakin?
                        </button>
                        <button
                          onClick={() => setPendingDeleteId(null)}
                          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-md text-sm"
                        >
                          Batal
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setPendingDeleteId(doc._id)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium"
                      >
                        <FaTrash /> Hapus
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
      </div>

      {/* Pagination */}
      {list.length > 0 && (
        <div className="flex items-center justify-center gap-1.5 mt-8">
          <PagBtn onClick={() => setPage(1)} disabled={page === 1 || loading}><ChevronsLeft className="w-4 h-4 text-gray-600" /></PagBtn>
          <PagBtn onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1 || loading}><ChevronLeft className="w-4 h-4 text-gray-600" /></PagBtn>
          <span className="px-3 py-1.5 rounded-md border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-sm min-w-[60px] text-center">
            {page} / {totalPages}
          </span>
          <PagBtn onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages || loading}><ChevronRight className="w-4 h-4 text-gray-600" /></PagBtn>
          <PagBtn onClick={() => setPage(totalPages)} disabled={page === totalPages || loading}><ChevronsRight className="w-4 h-4 text-gray-600" /></PagBtn>
        </div>
      )}

      {/* Export Modal */}
      {exportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setExportOpen(false)} />
          <div className="relative w-full max-w-md rounded-xl bg-white shadow-lg border">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div>
                <h3 className="font-bold text-gray-800">Export Data Persalinan</h3>
                <p className="text-xs text-gray-500">Pilih mode dan rentang tanggal</p>
              </div>
              <button onClick={() => setExportOpen(false)} className="p-2 rounded-md hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700">Mode Export</label>
                <select
                  value={exportMode}
                  onChange={(e) => setExportMode(e.target.value)}
                  className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="persalinan">Data Persalinan (per rentang tanggal)</option>
                  <option value="nifas">Kunjungan Nifas (per rentang tanggal)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Dari</label>
                  <input
                    type="date"
                    value={exportFrom}
                    onChange={(e) => setExportFrom(e.target.value)}
                    className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Sampai</label>
                  <input
                    type="date"
                    value={exportTo}
                    onChange={(e) => setExportTo(e.target.value)}
                    className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex gap-2">
              <button onClick={() => setExportOpen(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded-md transition">
                Batal
              </button>
              <button
                onClick={handleExport}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-md transition inline-flex items-center justify-center gap-2"
              >
                <FaFileExcel /> Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color, active, onClick }) {
  const colors = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
    red: "bg-red-50 border-red-200 text-red-700",
  };
  const activeRing = {
    blue: "ring-2 ring-blue-500",
    emerald: "ring-2 ring-emerald-500",
    orange: "ring-2 ring-orange-500",
    red: "ring-2 ring-red-500",
  };
  return (
    <button
      onClick={onClick}
      className={`border rounded-lg p-3 text-left w-full hover:shadow-md transition ${colors[color]} ${active ? activeRing[color] : ""}`}
    >
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-0.5">{value ?? "-"}</p>
      {active && <p className="text-xs mt-1 opacity-60">▼ aktif</p>}
    </button>
  );
}

function PagBtn({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition shadow-sm"
    >
      {children}
    </button>
  );
}
