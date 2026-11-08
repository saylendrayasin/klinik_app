"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

function Tombol({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="min-w-11 min-h-11 lg:min-w-9 lg:min-h-9 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-35 disabled:cursor-not-allowed transition shadow-sm"
    >
      {children}
    </button>
  );
}

/** Navigasi halaman untuk daftar ber-pagination. */
export default function Paginasi({ page, totalPages, loading = false, onChange }) {
  const awal = page <= 1 || loading;
  const akhir = page >= totalPages || loading;
  return (
    <nav aria-label="Halaman daftar" className="flex items-center justify-center gap-1.5 pt-2">
      <Tombol label="Halaman pertama" onClick={() => onChange(1)} disabled={awal}>
        <ChevronsLeft className="w-4 h-4" aria-hidden="true" />
      </Tombol>
      <Tombol label="Halaman sebelumnya" onClick={() => onChange(Math.max(page - 1, 1))} disabled={awal}>
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
      </Tombol>
      <span
        aria-live="polite"
        className="px-4 min-h-11 lg:min-h-9 inline-flex items-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-sm min-w-[64px] justify-center tabular-nums"
      >
        {page} / {totalPages}
      </span>
      <Tombol label="Halaman berikutnya" onClick={() => onChange(Math.min(page + 1, totalPages))} disabled={akhir}>
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </Tombol>
      <Tombol label="Halaman terakhir" onClick={() => onChange(totalPages)} disabled={akhir}>
        <ChevronsRight className="w-4 h-4" aria-hidden="true" />
      </Tombol>
    </nav>
  );
}
