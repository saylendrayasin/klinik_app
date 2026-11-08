"use client";

import { useId, useState } from "react";
import toast from "react-hot-toast";
import { ImageUp, Trash2 } from "lucide-react";
import { perkecilGambar } from "@/lib/gambarKlien";

/**
 * Kotak pratinjau + tombol pilih gambar. Gambar diperkecil di browser
 * (lib/gambarKlien) lalu diserahkan sebagai data URL lewat onPilih.
 */
export default function UnggahGambar({ label, ket, src, onPilih, onHapus, labelHapus = "Hapus", tinggi = "h-28" }) {
  const id = useId();
  const [proses, setProses] = useState(false);

  const pilih = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // memilih berkas yang sama lagi tetap memicu onChange
    if (!file) return;
    setProses(true);
    try {
      onPilih(await perkecilGambar(file));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProses(false);
    }
  };

  return (
    <div className="space-y-2">
      <p id={`${id}-label`} className="text-sm font-semibold text-slate-700">{label}</p>
      <div className={`${tinggi} rounded-xl border border-dashed border-slate-300 bg-[repeating-conic-gradient(#f1f5f9_0_25%,#fff_0_50%)] bg-[length:16px_16px] flex items-center justify-center overflow-hidden p-2`}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={label} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-xs text-slate-400">Belum ada gambar</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <label
          htmlFor={id}
          className={`inline-flex items-center gap-1.5 min-h-11 px-3.5 rounded-xl text-sm font-semibold bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-100 transition cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500 ${proses ? "opacity-60 pointer-events-none" : ""}`}
        >
          <ImageUp size={15} aria-hidden="true" /> {proses ? "Memproses..." : src ? "Ganti Gambar" : "Pilih Gambar"}
          <input id={id} type="file" accept="image/png,image/jpeg,image/webp" onChange={pilih} className="sr-only" aria-describedby={`${id}-label`} />
        </label>
        {src && onHapus && (
          <button
            type="button"
            onClick={onHapus}
            className="inline-flex items-center gap-1.5 min-h-11 px-3.5 rounded-xl text-sm font-semibold bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 transition"
          >
            <Trash2 size={15} aria-hidden="true" /> {labelHapus}
          </button>
        )}
      </div>
      {ket && <p className="text-xs text-slate-500">{ket}</p>}
    </div>
  );
}
