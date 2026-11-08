import { Pencil, Trash2 } from "lucide-react";
import { tanggalSingkat } from "@/lib/tanggal";

/**
 * Kartu satu kunjungan di tab riwayat (Pasien, KB, ANC, nifas).
 * Header dua baris — kode + tanggal singkat di atas, keterangan (`meta`) di
 * bawah — supaya di HP 360px tanggal tidak terpotong jadi tiga baris di
 * samping tombol Edit/Hapus.
 */
export default function KartuKunjungan({ kode, tanggal, meta, onEdit, onHapus, children }) {
  return (
    <article className="bg-white border border-slate-200 rounded-2xl shadow-sm shadow-slate-900/[0.03] overflow-hidden">
      <header className="flex items-center gap-3 px-4 py-2.5 bg-slate-50/70 border-b border-slate-100">
        <span className="shrink-0 min-w-9 h-7 px-2 rounded-lg bg-brand-600 text-white text-xs font-bold flex items-center justify-center tabular-nums">
          {kode}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800 whitespace-nowrap">{tanggalSingkat(tanggal)}</p>
          {meta && (
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">{meta}</div>
          )}
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="min-h-11 lg:min-h-9 px-3 bg-white hover:bg-brand-50 text-brand-700 border border-slate-200 hover:border-brand-200 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition active:scale-[0.98]"
          >
            <Pencil size={14} aria-hidden="true" /> Edit
          </button>
          <button
            type="button"
            onClick={onHapus}
            aria-label="Hapus kunjungan"
            className="min-h-11 min-w-11 lg:min-h-9 lg:min-w-9 bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 rounded-xl flex items-center justify-center transition active:scale-[0.98]"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      </header>
      {children}
    </article>
  );
}
