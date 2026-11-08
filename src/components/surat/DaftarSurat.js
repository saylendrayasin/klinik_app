"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { FaEye, FaTrash, FaPlus } from "react-icons/fa";
import { Search, SlidersHorizontal } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import Paginasi from "@/components/Paginasi";
import KartuRingkasan from "@/components/KartuRingkasan";
import KeadaanKosong from "@/components/KeadaanKosong";
import HapusSuratModal from "@/components/surat/HapusSuratModal";

const BADGE = {
  draft: ["Draf", "bg-slate-100 text-slate-600"],
  issued: ["Terbit", "bg-emerald-100 text-emerald-700"],
};

export function BadgeStatus({ status }) {
  const [label, kelas] = BADGE[status] || BADGE.draft;
  return <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${kelas}`}>{label}</span>;
}

export const Nomor = ({ nomor }) =>
  nomor
    ? <span className="text-xs font-bold text-slate-800 tabular-nums">{nomor}</span>
    : <span className="text-xs text-slate-400 italic">belum terbit</span>;

/**
 * Halaman daftar surat (consent, surat sakit): ringkasan sebagai filter,
 * cari, urutkan, tabel di desktop / kartu di HP, hapus bertingkat.
 * cfg: { api, dasar, judul, ket, ikon, cari, kolom: [[judul, (s) => isi]], judulKartu(s), isiKartu(s), rincian(s) }
 */
export default function DaftarSurat({ cfg }) {
  const [list, setList] = useState([]);
  const [summary, setSummary] = useState(null);
  const [ketikan, setKetikan] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("tanggalSurat");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [segar, setSegar] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(ketikan); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [ketikan]);

  useEffect(() => {
    let hidup = true;
    (async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ page, limit: 10, search, sort });
        if (status) qs.set("status", status);
        const res = await fetcher(`${cfg.api}?${qs}`);
        if (!hidup) return;
        setList(res.data);
        setTotalPages(res.totalPages || 1);
        if (page > (res.totalPages || 1)) setPage(Math.max(1, res.totalPages || 1));
      } catch {
        toast.error("Gagal memuat daftar surat");
      } finally {
        if (hidup) setLoading(false);
      }
    })();
    return () => { hidup = false; };
  }, [cfg.api, search, status, sort, page, segar]);

  useEffect(() => {
    fetcher(`${cfg.api}/summary`).then((r) => setSummary(r.data)).catch(() => {});
  }, [cfg.api, segar]);

  const filter = (s) => { setStatus(s); setPage(1); };

  const hapus = async (konfirmasi) => {
    setDeleting(true);
    try {
      const qs = konfirmasi ? `?konfirmasi=${encodeURIComponent(konfirmasi)}` : "";
      await fetcher(`${cfg.api}/${target._id}${qs}`, { method: "DELETE" });
      setTarget(null);
      toast.success("Surat dihapus");
      setSegar((n) => n + 1);
    } catch (e) {
      toast.error(e?.message || "Gagal menghapus");
    } finally {
      setDeleting(false);
    }
  };

  const Ikon = cfg.ikon;
  const kosong = (
    <KeadaanKosong
      ikon={Ikon}
      judul={search || status ? "Tidak ada surat yang cocok" : "Belum ada surat"}
      ket={search || status ? "Ubah kata kunci atau filter." : "Surat yang dibuat akan tampil di sini."}
    />
  );

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center shadow-md shadow-brand-600/25 shrink-0">
            <Ikon size={17} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">{cfg.judul}</h1>
            <p className="text-slate-500 text-sm mt-0.5">{cfg.ket}</p>
          </div>
        </div>
        <Link
          href={`${cfg.dasar}/new`}
          className="inline-flex items-center justify-center gap-2 min-h-11 bg-brand-700 hover:bg-brand-800 text-white font-semibold px-5 rounded-xl text-sm transition shadow-md shadow-brand-600/20 active:scale-95"
        >
          <FaPlus size={11} aria-hidden="true" /> Buat Surat
        </Link>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 anim-stagger">
          <KartuRingkasan label="Total Surat" value={summary.total} nada="brand" active={!status} onClick={() => filter("")} />
          <KartuRingkasan label="Terbit" value={summary.issued} nada="emerald" active={status === "issued"} onClick={() => filter("issued")} />
          <KartuRingkasan label="Draf" value={summary.draft} nada="slate" active={status === "draft"} onClick={() => filter("draft")} />
          <KartuRingkasan label="Terbit Bulan Ini" value={summary.bulanIni} nada="brand" />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search size={14} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="search"
            aria-label={cfg.cari}
            placeholder={`${cfg.cari}...`}
            value={ketikan}
            onChange={(e) => setKetikan(e.target.value)}
            className="field pl-10"
          />
        </div>
        <div className="relative sm:w-48">
          <SlidersHorizontal size={13} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select aria-label="Urutkan daftar" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="field pl-9">
            <option value="tanggalSurat">Tanggal Terbaru</option>
            <option value="nomor">Nomor Terbesar</option>
            <option value="nama">Nama A–Z</option>
            <option value="createdAt">Dibuat Terbaru</option>
          </select>
        </div>
      </div>

      {!loading && !list.length ? kosong : (<>
        {/* Tabel desktop */}
        <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-brand-50/60 border-b border-brand-100">
                  {[...cfg.kolom.map(([j]) => j), "Status", "Aksi"].map((h) => (
                    <th key={h} scope="col" className={`py-3.5 px-4 text-[11px] font-bold text-brand-800 uppercase tracking-wider ${h === "Aksi" ? "text-center" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 anim-stagger">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: cfg.kolom.length + 2 }).map((__, j) => (
                        <td key={j} className="py-3.5 px-4"><div className="h-4 bg-slate-100 rounded-lg w-3/4 skeleton" /></td>
                      ))}
                    </tr>
                  ))
                  : list.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/80 transition-colors">
                      {cfg.kolom.map(([j, isi]) => (
                        <td key={j} className="py-3 px-4 text-slate-700">{isi(s)}</td>
                      ))}
                      <td className="py-3 px-4"><BadgeStatus status={s.status} /></td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-2">
                          <Link href={`${cfg.dasar}/${s._id}`} className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-3 min-h-11 lg:min-h-9 rounded-lg text-xs font-semibold transition active:scale-95">
                            <FaEye size={10} aria-hidden="true" /> Lihat
                          </Link>
                          <button type="button" onClick={() => setTarget(s)} className="inline-flex items-center gap-1.5 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 px-3 min-h-11 lg:min-h-9 rounded-lg text-xs font-semibold transition active:scale-95">
                            <FaTrash size={10} aria-hidden="true" /> Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
        </div>

        {/* Kartu HP */}
        <div className="sm:hidden space-y-3 anim-stagger">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
                <div className="h-5 bg-slate-100 rounded-lg w-1/2 skeleton" />
                <div className="h-4 bg-slate-100 rounded-lg w-1/3 skeleton" />
                <div className="h-11 bg-slate-100 rounded-xl skeleton" />
              </div>
            ))
          ) : list.map((s) => (
            <div key={s._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2 min-w-0">
                <h2 className="text-sm font-bold text-slate-800 truncate flex-1 min-w-0">{cfg.judulKartu(s)}</h2>
                <BadgeStatus status={s.status} />
              </div>
              <div className="text-xs text-slate-500 space-y-1">{cfg.isiKartu(s)}</div>
              <div className="flex gap-2 pt-1">
                <Link href={`${cfg.dasar}/${s._id}`} className="flex-1 min-h-11 bg-brand-50 hover:bg-brand-100 text-brand-700 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition active:scale-[0.98]">
                  <FaEye size={12} aria-hidden="true" /> Lihat
                </Link>
                <button type="button" onClick={() => setTarget(s)} aria-label={`Hapus surat ${cfg.judulKartu(s) || ""}`} className="shrink-0 min-h-11 min-w-11 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 flex items-center justify-center rounded-xl transition active:scale-[0.98]">
                  <FaTrash size={14} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </>)}

      {list.length > 0 && <Paginasi page={page} totalPages={totalPages} loading={loading} onChange={setPage} />}

      <HapusSuratModal
        open={!!target}
        onClose={() => !deleting && setTarget(null)}
        onConfirm={hapus}
        loading={deleting}
        surat={target}
        rincian={target ? cfg.rincian(target) : []}
      />
    </div>
  );
}
