"use client";

import { FaPrint } from "react-icons/fa";
import { ArrowLeft } from "lucide-react";

/**
 * Bilah aksi di atas halaman cetak. Tidak ikut tercetak (.no-print).
 * Dipisah jadi komponen klien supaya halaman suratnya sendiri
 * bisa dirender di server — tanpa kedipan "memuat" sebelum dicetak.
 */
export default function PrintToolbar() {
  return (
    <div className="no-print sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-[210mm] mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <button
          onClick={() => window.close()}
          className="inline-flex items-center gap-1.5 min-h-11 -ml-2 px-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
        >
          <ArrowLeft size={15} /> Tutup
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-semibold min-h-11 px-4 rounded-xl text-sm transition active:scale-95"
          >
            <FaPrint size={13} /> Cetak / Simpan PDF
          </button>
        </div>
      </div>
    </div>
  );
}
