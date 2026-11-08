"use client";

import { useId, useState } from "react";
import { CalendarRange, Check, ChevronDown, X } from "lucide-react";

const LINGKAR = {
  sudah: "bg-brand-600 ring-brand-600 text-white",
  berikutnya: "bg-white ring-brand-400 text-brand-700 ring-offset-2 ring-offset-white",
  terlewat: "bg-red-50 ring-red-200 text-red-500",
  belum: "bg-white ring-slate-200 text-slate-400",
};
const TEKS = {
  sudah: "text-brand-700 font-semibold",
  berikutnya: "text-brand-700 font-semibold",
  terlewat: "text-red-500",
  belum: "text-slate-400",
};
const SR = { sudah: "sudah", berikutnya: "berikutnya", terlewat: "terlewat", belum: "belum" };

/**
 * Progres kunjungan berjadwal (ANC K1–K6, nifas KF1–KF4): stepper + daftar
 * jadwal anjuran yang bisa dibuka. Tombol jadwal sengaja di baris sendiri —
 * di samping judul ia terlipat dua baris pada layar HP.
 *
 * langkah: [{ kode: "K1", ket: "UK < 12 minggu", status: "sudah"|"berikutnya"|"terlewat"|"belum", info? }]
 */
export default function ProgresKunjungan({ judul, langkah, judulJadwal = "Jadwal anjuran Kemenkes" }) {
  const [buka, setBuka] = useState(false);
  const idDaftar = useId();
  const selesai = langkah.filter((l) => l.status === "sudah").length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm shadow-slate-900/[0.03]">
      <div className="p-4 sm:p-5">
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <p className="text-sm font-semibold text-slate-700">{judul}</p>
          <p className="text-sm text-slate-500 shrink-0">
            <strong className="text-slate-800 tabular-nums">{selesai}</strong> dari {langkah.length}
          </p>
        </div>

        <ol className="flex" aria-label={judul}>
          {langkah.map(({ kode, status }, i) => (
            <li key={kode} className="relative flex-1 flex flex-col items-center gap-1.5">
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className={`absolute top-4 right-1/2 w-full h-0.5 -translate-y-1/2 ${status === "sudah" ? "bg-brand-600" : "bg-slate-200"}`}
                />
              )}
              <span className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-2 ${LINGKAR[status]}`}>
                {status === "sudah" ? (
                  <Check size={15} strokeWidth={3} aria-hidden="true" />
                ) : status === "terlewat" ? (
                  <X size={15} strokeWidth={3} aria-hidden="true" />
                ) : (
                  i + 1
                )}
              </span>
              <span className={`text-xs ${TEKS[status]}`}>
                {kode}
                <span className="sr-only"> {SR[status]}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <button
        type="button"
        onClick={() => setBuka((v) => !v)}
        aria-expanded={buka}
        aria-controls={idDaftar}
        className={`w-full min-h-11 px-4 sm:px-5 flex items-center justify-between gap-3 border-t border-slate-100 text-sm font-semibold text-brand-700 hover:bg-brand-50/60 transition ${buka ? "" : "rounded-b-2xl"}`}
      >
        <span className="flex items-center gap-2">
          <CalendarRange size={16} aria-hidden="true" /> {judulJadwal}
        </span>
        <ChevronDown size={18} aria-hidden="true" className={`transition-transform ${buka ? "rotate-180" : ""}`} />
      </button>

      {buka && (
        <ul id={idDaftar} className="anim-masuk border-t border-slate-100 divide-y divide-slate-100">
          {langkah.map(({ kode, ket, status, info }) => (
            <li
              key={kode}
              className={`flex items-center gap-3 px-4 sm:px-5 py-2.5 text-sm last:rounded-b-2xl ${status === "berikutnya" ? "bg-brand-50/50" : ""}`}
            >
              <span className={`w-9 shrink-0 font-bold ${status === "belum" ? "text-slate-400" : status === "terlewat" ? "text-red-500" : "text-brand-700"}`}>
                {kode}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-slate-700">{ket}</span>
                {info && <span className="block text-xs text-slate-500">{info}</span>}
              </span>
              {status === "sudah" ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 shrink-0">
                  <Check size={14} strokeWidth={3} aria-hidden="true" /> Sudah
                </span>
              ) : status === "berikutnya" ? (
                <span className="shrink-0 text-xs font-semibold text-brand-700 bg-brand-100 px-2 py-0.5 rounded-full">Berikutnya</span>
              ) : status === "terlewat" ? (
                <span className="shrink-0 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Terlewat</span>
              ) : (
                <span className="shrink-0 text-xs text-slate-400">Belum</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
