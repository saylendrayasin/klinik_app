"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import {
  FaEye,
  FaTrash,
  FaBaby,
  FaFileExcel,
} from "react-icons/fa";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

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
  const today = new Date();
  const hpl = doc.hpl ? new Date(doc.hpl) : null;
  const daysToHPL = hpl ? Math.floor((hpl - today) / MS_PER_DAY) : null;
  const lastVisit = [...(doc.visits || [])].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  )[0];
  const jadwalLewat =
    lastVisit?.jadwalBerikutnya &&
    new Date(lastVisit.jadwalBerikutnya) < today;

  return {
    overdue: hpl && today > hpl,
    hplDekat: daysToHPL != null && daysToHPL >= 0 && daysToHPL <= 14,
    jadwalTerlewat: !!jadwalLewat,
  };
}

const STATUS_BADGE = {
  aktif: "bg-rose-100 text-rose-700",
  selesai: "bg-green-100 text-green-700",
  keguguran: "bg-gray-100 text-gray-600",
  rujuk: "bg-amber-100 text-amber-700",
};

export default function DashboardKehamilanPage() {
  const [list, setList] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("hpl");
  const [status, setStatus] = useState("");
  const [filter, setFilter] = useState(""); // hplDekat | overdue | jadwalTerlewat
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [exportOpen, setExportOpen] = useState(false);
  const now = useMemo(() => new Date(), []);
  const [exportMode, setExportMode] = useState("aktif");
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
      const data = await fetcher(`/api/kehamilan?${qs}`);
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
      const data = await fetcher("/api/kehamilan/summary");
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
    if (!confirm("Yakin ingin menghapus data kehamilan ini?")) return;
    try {
      await fetcher(`/api/kehamilan/${id}`, { method: "DELETE" });
      toast.success("Data berhasil dihapus");
      fetchList();
      fetchSummary();
    } catch (e) {
      toast.error(e?.message || "Gagal menghapus");
    }
  };

  const handleExport = async () => {
    if (exportMode === "visits" && (!exportFrom || !exportTo)) {
      return toast.error("Tanggal dari dan sampai wajib diisi");
    }

    const qs = new URLSearchParams({ mode: exportMode });
    if (exportMode === "visits") {
      qs.set("from", exportFrom);
      qs.set("to", exportTo);
    }

    setExportOpen(false);
    const toastId = toast.loading("Menyiapkan file...");
    try {
      const res = await fetch(`/api/kehamilan/export?${qs}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Gagal export");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        exportMode === "aktif"
          ? "ibu-hamil-aktif.xlsx"
          : `kunjungan-anc-${exportFrom}-sd-${exportTo}.xlsx`;
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
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaBaby className="text-rose-600" />
          Daftar Kehamilan
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => setExportOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-5 rounded-md transition"
          >
            <FaFileExcel /> Export
          </button>
          <Link
            href="/dashboard/kehamilan/new"
            className="w-full sm:w-auto inline-flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2 px-5 rounded-md transition"
          >
            + Tambah
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <SummaryCard
            label="Total Aktif"
            value={summary.aktif}
            color="rose"
            active={!filter && status === "aktif"}
            onClick={() => { setFilter(""); setStatus("aktif"); setPage(1); }}
          />
          <SummaryCard
            label="HPL ≤ 2 Minggu"
            value={summary.hplDekat}
            color="amber"
            active={filter === "hplDekat"}
            onClick={() => { setFilter("hplDekat"); setStatus(""); setPage(1); }}
          />
          <SummaryCard
            label="Jadwal Terlewat"
            value={summary.jadwalTerlewat}
            color="orange"
            active={filter === "jadwalTerlewat"}
            onClick={() => { setFilter("jadwalTerlewat"); setStatus(""); setPage(1); }}
          />
          <SummaryCard
            label="Overdue"
            value={summary.overdue}
            color="red"
            active={filter === "overdue"}
            onClick={() => { setFilter("overdue"); setStatus(""); setPage(1); }}
          />
        </div>
      )}

      {/* Filter & Sort */}
      {filter && (
        <div className="mb-3 flex items-center gap-2 text-sm">
          <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full font-medium">
            Filter aktif:{" "}
            {filter === "hplDekat" && "HPL ≤ 2 Minggu"}
            {filter === "overdue" && "Overdue"}
            {filter === "jadwalTerlewat" && "Jadwal Terlewat"}
          </span>
          <button
            onClick={() => { setFilter(""); setStatus(""); setPage(1); }}
            className="text-gray-500 hover:text-gray-700 underline text-xs"
          >
            Hapus filter
          </button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Cari nama / NIK..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-400"
        />
        <select
          value={status}
          onChange={(e) => { setFilter(""); setStatus(e.target.value); setPage(1); }}
          disabled={!!filter}
          className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-400 sm:w-40 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="selesai">Selesai</option>
          <option value="keguguran">Keguguran</option>
          <option value="rujuk">Rujuk</option>
        </select>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-400 sm:w-48"
        >
          <option value="hpl">HPL Terdekat</option>
          <option value="name">Nama</option>
          <option value="createdAt">Terbaru</option>
        </select>
      </div>

      {/* Table Desktop */}
      <div className="hidden sm:block overflow-x-auto bg-white rounded-md shadow-md">
        <table className="min-w-full text-sm">
          <thead className="bg-rose-50 border-b border-rose-100">
            <tr>
              {["Nama", "NIK", "Umur", "G/P/A", "HPL", "UK (mg)", "Status", "Aksi"].map((h) => (
                <th key={h} className={`py-3.5 px-4 text-xs font-semibold text-rose-800 uppercase tracking-wide ${h === "Aksi" ? "text-center" : "text-left"}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse border-t">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="py-4 px-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              : list.length === 0
              ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-gray-500">
                    Tidak ada data kehamilan ditemukan.
                  </td>
                </tr>
              )
              : list.map((doc) => {
                  const flags = getFlags(doc);
                  const today = new Date();
                  const ukNow = doc.hpht
                    ? Math.floor((today - new Date(doc.hpht)) / (7 * MS_PER_DAY))
                    : null;
                  return (
                    <tr key={doc._id} className="border-t hover:bg-gray-50 transition-all">
                      <td className="py-3 px-4 font-medium">
                        {doc.name}
                        {flags.overdue && (
                          <span className="ml-1.5 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Overdue</span>
                        )}
                        {!flags.overdue && flags.hplDekat && (
                          <span className="ml-1.5 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">HPL Dekat</span>
                        )}
                        {flags.jadwalTerlewat && (
                          <span className="ml-1.5 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">Jadwal Lewat</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{doc.nik}</td>
                      <td className="py-3 px-4">{calcAge(doc.dateOfBirth)} th</td>
                      <td className="py-3 px-4 text-gray-600">
                        G{doc.gravida || 0}P{doc.para || 0}A{doc.abortus || 0}
                      </td>
                      <td className="py-3 px-4">{fmtDate(doc.hpl)}</td>
                      <td className="py-3 px-4">
                        {ukNow != null ? (
                          <span className="font-semibold text-rose-700">{ukNow} mg</span>
                        ) : "-"}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${STATUS_BADGE[doc.status] || "bg-gray-100 text-gray-600"}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-2">
                          <Link
                            href={`/dashboard/kehamilan/${doc._id}`}
                            className="bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm"
                          >
                            <FaEye />
                            <span className="hidden md:inline">Lihat</span>
                          </Link>
                          <button
                            onClick={() => handleDelete(doc._id)}
                            className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm"
                          >
                            <FaTrash />
                            <span className="hidden md:inline">Hapus</span>
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
      <div className="block sm:hidden space-y-4 mt-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border rounded-lg shadow p-4 animate-pulse space-y-3">
                <div className="h-5 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="flex gap-2 mt-2">
                  <div className="flex-1 h-8 bg-gray-200 rounded-md" />
                  <div className="flex-1 h-8 bg-gray-200 rounded-md" />
                </div>
              </div>
            ))
          : list.length === 0
          ? <p className="text-center text-gray-500 mt-6">Tidak ada data kehamilan.</p>
          : list.map((doc) => {
              const flags = getFlags(doc);
              const today = new Date();
              const ukNow = doc.hpht
                ? Math.floor((today - new Date(doc.hpht)) / (7 * MS_PER_DAY))
                : null;
              return (
                <div key={doc._id} className="bg-white border-l-4 border-rose-500 rounded-lg shadow-sm p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <h2 className="text-base font-bold text-gray-800 truncate flex-1 min-w-0">{doc.name}</h2>
                    <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[doc.status] || "bg-gray-100 text-gray-600"}`}>
                      {doc.status}
                    </span>
                  </div>
                  {(flags.overdue || flags.hplDekat || flags.jadwalTerlewat) && (
                    <div className="flex gap-1.5 flex-wrap">
                      {flags.overdue && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Overdue</span>}
                      {!flags.overdue && flags.hplDekat && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">HPL Dekat</span>}
                      {flags.jadwalTerlewat && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">Jadwal Lewat</span>}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-gray-500">
                    <span>NIK: {doc.nik}</span>
                    <span>G{doc.gravida || 0}P{doc.para || 0}A{doc.abortus || 0}</span>
                    <span>{calcAge(doc.dateOfBirth)} tahun</span>
                    <span>HPL: <strong className="text-gray-700">{fmtDate(doc.hpl)}</strong></span>
                    {ukNow != null && <span className="font-semibold text-rose-700">UK: {ukNow} mg</span>}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Link
                      href={`/dashboard/kehamilan/${doc._id}`}
                      className="flex-1 bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium"
                    >
                      <FaEye /> Lihat
                    </Link>
                    <button
                      onClick={() => handleDelete(doc._id)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium"
                    >
                      <FaTrash /> Hapus
                    </button>
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
                <h3 className="font-bold text-gray-800">Export Data Kehamilan</h3>
                <p className="text-xs text-gray-500">Pilih mode export</p>
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
                  <option value="aktif">Ibu Hamil Aktif (snapshot hari ini)</option>
                  <option value="visits">Kunjungan ANC (rentang tanggal)</option>
                </select>
              </div>

              {exportMode === "visits" && (
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
              )}
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
    rose: "bg-rose-50 border-rose-200 text-rose-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
    red: "bg-red-50 border-red-200 text-red-700",
  };
  const activeRing = {
    rose: "ring-2 ring-rose-500",
    amber: "ring-2 ring-amber-500",
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
