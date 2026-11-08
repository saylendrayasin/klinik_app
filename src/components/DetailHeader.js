"use client";

import { FaArrowLeft } from "react-icons/fa";

/**
 * Kepala halaman detail: tombol kembali + kartu identitas (nama, badge, info singkat).
 * `meta` adalah daftar node kecil di bawah nama; nilai kosong dilewati.
 */
export default function DetailHeader({ onBack, title, badge, meta = [], loading }) {
  return (
    <div className="mb-4 space-y-3">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 min-h-11 -ml-2 px-2 rounded-xl text-sm font-semibold text-brand-700 hover:bg-brand-50 transition"
      >
        <FaArrowLeft aria-hidden="true" /> Kembali
      </button>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl px-4 sm:px-5 py-4 space-y-2">
          <div className="h-5 w-48 max-w-full rounded-lg skeleton" />
          <div className="h-4 w-64 max-w-full rounded-lg skeleton" />
        </div>
      ) : title ? (
        <div className="bg-white border border-slate-200 rounded-2xl px-4 sm:px-5 py-4 shadow-sm shadow-slate-900/[0.03]">
          <div className="flex items-start gap-3 min-w-0">
            <h1 className="font-bold text-slate-900 text-lg leading-snug flex-1 min-w-0 break-words">{title}</h1>
            {badge}
          </div>
          {meta.filter(Boolean).length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-slate-500">
              {meta.filter(Boolean).map((m, i) => (
                <span key={i}>{m}</span>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
