"use client";

// Warna hanya bermakna status (aturan UI): brand = netral, sisanya peringatan/bahaya/selesai.
const NADA = {
  brand: { teks: "text-brand-700", aktif: "ring-2 ring-brand-400 border-brand-200 bg-brand-50", titik: "bg-brand-500" },
  amber: { teks: "text-amber-700", aktif: "ring-2 ring-amber-400 border-amber-200 bg-amber-50", titik: "bg-amber-500" },
  orange: { teks: "text-orange-700", aktif: "ring-2 ring-orange-400 border-orange-200 bg-orange-50", titik: "bg-orange-500" },
  red: { teks: "text-red-700", aktif: "ring-2 ring-red-400 border-red-200 bg-red-50", titik: "bg-red-500" },
  emerald: { teks: "text-emerald-700", aktif: "ring-2 ring-emerald-400 border-emerald-200 bg-emerald-50", titik: "bg-emerald-500" },
  slate: { teks: "text-slate-700", aktif: "ring-2 ring-slate-400 border-slate-200 bg-slate-50", titik: "bg-slate-500" },
};

/** Kartu angka ringkasan di atas daftar. Dengan `onClick` menjadi tombol filter. */
export default function KartuRingkasan({ label, value, nada = "brand", active = false, onClick }) {
  const s = NADA[nada] || NADA.brand;
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-pressed={onClick ? active : undefined}
      className={`border rounded-2xl p-3 sm:p-3.5 text-left w-full transition-all duration-150 ${
        onClick ? "hover:shadow-md hover:-translate-y-px active:translate-y-0" : ""
      } ${active ? s.aktif : `bg-white border-slate-200 ${s.teks}`} ${active ? s.teks : ""}`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.titik}`} aria-hidden="true" />
        <p className="text-xs font-semibold opacity-80 leading-tight">{label}</p>
      </div>
      <p className="text-xl sm:text-2xl font-bold mt-0.5 tabular-nums">{value ?? "-"}</p>
    </Tag>
  );
}
