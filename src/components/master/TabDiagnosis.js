"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { toast } from "react-hot-toast";
import { FaEdit, FaPlus } from "react-icons/fa";
import {
  Settings2,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import Paginasi from "@/components/Paginasi";

export default function TabDiagnosis() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("label");
  const [type, setType] = useState("diagnosis");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [toggling, setToggling] = useState(false);

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
      const tp = data?.totalPages || 1;
      setTotalPages(tp);
      if (page > tp) setPage(Math.max(1, tp));
    } catch (error) {
      toast.error("Gagal memuat data diagnosis");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, [queryUrl]); // eslint-disable-line

  const handleToggleConfirm = async () => {
    if (!toggleTarget) return;
    setToggling(true);
    const toastId = toast.loading("Memperbarui status...");
    try {
      await fetcher(`/api/config/${toggleTarget._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !toggleTarget.isActive }),
      });
      setToggleTarget(null);
      await fetchConfigs();
      toast.success("Status berhasil diperbarui", { id: toastId });
    } catch (error) {
      toast.error("Gagal memperbarui status", { id: toastId });
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-slate-500">Daftar diagnosis yang dipilih di form kunjungan.</p>
        <Link
          href="/dashboard/master/diagnosis/new"
          className="inline-flex items-center justify-center gap-2 min-h-11 bg-brand-700 hover:bg-brand-800 text-white font-semibold px-5 rounded-xl text-sm transition shadow-md shadow-brand-600/20 active:scale-95"
        >
          <FaPlus size={11} aria-hidden="true" /> Tambah Diagnosis
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input aria-label="Cari label diagnosis"
            type="text"
            placeholder="Cari label diagnosis..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="field pl-10"
          />
        </div>
        <div className="relative sm:w-44">
          <SlidersHorizontal size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select aria-label="Saring tipe"
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1); }}
            className="field pl-9"
          >
            <option value="diagnosis">Diagnosis</option>
          </select>
        </div>
        <div className="relative sm:w-44">
          <select aria-label="Urutkan daftar"
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="field"
          >
            <option value="label">Label A–Z</option>
            <option value="code">Kode A–Z</option>
          </select>
        </div>
        <label className="flex items-center gap-2.5 min-h-11 text-slate-600 text-sm font-medium cursor-pointer select-none whitespace-nowrap">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => { setIncludeInactive(e.target.checked); setPage(1); }}
            className="w-5 h-5 accent-brand-600 rounded"
          />
          Tampilkan nonaktif
        </label>
      </div>

      {/* Table Desktop */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-brand-50 to-brand-50/40 border-b border-brand-100">
              <th className="py-3.5 px-5 text-left text-[11px] font-bold text-brand-700 uppercase tracking-wider">Label</th>
              <th className="py-3.5 px-5 text-left text-[11px] font-bold text-brand-700 uppercase tracking-wider">Kode</th>
              <th className="py-3.5 px-5 text-left text-[11px] font-bold text-brand-700 uppercase tracking-wider">Status</th>
              <th className="py-3.5 px-5 text-center text-[11px] font-bold text-brand-700 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 anim-stagger">
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={idx}>
                  <td className="py-3.5 px-5"><div className="h-4 bg-slate-100 rounded-lg w-3/4 skeleton" /></td>
                  <td className="py-3.5 px-5"><div className="h-4 bg-slate-100 rounded-lg w-1/2 skeleton" /></td>
                  <td className="py-3.5 px-5"><div className="h-4 bg-slate-100 rounded-lg w-1/3 skeleton" /></td>
                  <td className="py-3.5 px-5"><div className="mx-auto h-8 bg-slate-100 rounded-lg w-36 skeleton" /></td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr><td colSpan="4" className="py-14 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3"><Settings2 size={24} className="text-slate-300" /></div>
                <p className="text-sm font-semibold text-slate-400">Tidak ada data ditemukan</p>
              </td></tr>
            ) : (
              items.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-5 font-medium text-slate-800">{item.label}</td>
                  <td className="py-3.5 px-5 font-mono text-xs text-slate-500">{item.code}</td>
                  <td className="py-3.5 px-5">
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${item.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {item.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex justify-center gap-2">
                      <Link href={`/dashboard/master/diagnosis/${item._id}`} className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-3.5 py-1.5 min-h-11 lg:min-h-9 rounded-lg text-xs font-semibold transition active:scale-95">
                        <FaEdit size={10} /> Edit
                      </Link>
                      <button
                        onClick={() => setToggleTarget(item)}
                        className={`inline-flex items-center justify-center px-3.5 py-1.5 min-h-11 lg:min-h-9 rounded-lg text-xs font-semibold transition active:scale-95 min-w-[100px] ${
                          item.isActive
                            ? "bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 hover:border-red-500"
                            : "bg-green-50 hover:bg-green-500 text-green-600 hover:text-white border border-green-200 hover:border-green-500"
                        }`}
                      >
                        {item.isActive ? "Nonaktifkan" : "Aktifkan"}
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
              <div className="h-5 bg-slate-100 rounded-lg w-2/3 skeleton" />
              <div className="h-4 bg-slate-100 rounded-lg w-1/2 skeleton" />
              <div className="flex gap-2 mt-3">
                <div className="flex-1 h-9 bg-slate-100 rounded-xl skeleton" />
                <div className="flex-1 h-9 bg-slate-100 rounded-xl skeleton" />
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-2xl border border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3"><Settings2 size={24} className="text-slate-300" /></div>
            <p className="text-sm font-semibold text-slate-400">Tidak ada data ditemukan</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-bold text-slate-800 flex-1 min-w-0">{item.label}</h2>
                  <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${item.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {item.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                <p className="text-xs text-slate-500">Kode: <span className="font-mono text-slate-700">{item.code}</span></p>
                <div className="flex gap-2 pt-1">
                  <Link href={`/dashboard/master/diagnosis/${item._id}`} className="flex-1 min-h-11 bg-brand-50 hover:bg-brand-100 text-brand-700 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition active:scale-[0.98]">
                    <FaEdit size={12} /> Edit
                  </Link>
                  <button
                    onClick={() => setToggleTarget(item)}
                    className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-sm font-semibold transition active:scale-95 ${
                      item.isActive
                        ? "bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 hover:border-red-500"
                        : "bg-green-50 hover:bg-green-500 text-green-600 hover:text-white border border-green-200 hover:border-green-500"
                    }`}
                  >
                    {item.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        open={!!toggleTarget}
        onClose={() => !toggling && setToggleTarget(null)}
        onConfirm={handleToggleConfirm}
        loading={toggling}
        title={toggleTarget?.isActive ? "Nonaktifkan Diagnosis" : "Aktifkan Diagnosis"}
        message={
          toggleTarget?.isActive
            ? `Nonaktifkan diagnosis "${toggleTarget?.label}"? Diagnosis nonaktif tidak akan muncul di pilihan form kunjungan.`
            : `Aktifkan kembali diagnosis "${toggleTarget?.label}"?`
        }
        confirmLabel={toggleTarget?.isActive ? "Ya, Nonaktifkan" : "Ya, Aktifkan"}
      />

      {/* Pagination */}
      {items.length > 0 && (
        <Paginasi page={page} totalPages={totalPages} loading={loading} onChange={setPage} />
      )}
    </div>
  );
}

