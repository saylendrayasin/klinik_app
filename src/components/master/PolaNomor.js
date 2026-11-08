"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { RotateCcw } from "lucide-react";
import { contohNomor } from "@/lib/nomorSurat";

const MAKS = 80;
// Contoh di tombol dihitung dari tanggal hari ini, jadi "XI"/"2026" selalu cocok.
const SISIPAN = [
  { judul: "Nomor urut", isi: [["{urut3}", "3 digit"], ["{urut2}", "2 digit"], ["{urut}", "tanpa nol"]] },
  { judul: "Bulan", isi: [["{romawi}", "romawi"], ["{bulan}", "angka"]] },
  { judul: "Tahun", isi: [["{tahun}", "4 digit"], ["{tahun2}", "2 digit"]] },
  { judul: "Pemisah", isi: [["/", "garis miring"], ["-", "strip"], [".", "titik"]] },
];
const TOKEN_DI_AKHIR = /\{[a-z0-9]+\}$/;

/**
 * Kolom pola nomor + tombol sisip. Tombol menyisipkan di posisi kursor
 * (atau mengganti teks yang dipilih); kalau kolom belum disentuh, ditambahkan
 * di akhir tanpa memunculkan keyboard HP. Hapus mundur tepat setelah token
 * menghapus seluruh token, bukan satu huruf.
 */
export default function PolaNomor({ id, value, onChange, polaBawaan, invalid, hasil }) {
  const ref = useRef(null);
  const kursor = useRef(null); // posisi kursor yang dipasang setelah render
  const nilai = useRef(value);
  nilai.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useLayoutEffect(() => {
    const k = kursor.current;
    kursor.current = null;
    if (k != null && document.activeElement === ref.current) ref.current.setSelectionRange(k, k);
  });

  // beforeinput (bukan keydown): keyboard HP sering tidak mengirim kode Backspace
  useEffect(() => {
    const el = ref.current;
    const hapus = (e) => {
      if (e.inputType !== "deleteContentBackward" || el.selectionStart !== el.selectionEnd) return;
      const token = nilai.current.slice(0, el.selectionStart).match(TOKEN_DI_AKHIR);
      if (!token) return;
      e.preventDefault();
      const akhir = el.selectionStart;
      const awal = akhir - token[0].length;
      kursor.current = awal;
      onChangeRef.current(nilai.current.slice(0, awal) + nilai.current.slice(akhir));
    };
    el.addEventListener("beforeinput", hapus);
    return () => el.removeEventListener("beforeinput", hapus);
  }, []);

  const sisipkan = (teks) => {
    const el = ref.current;
    const fokus = document.activeElement === el;
    const awal = fokus ? el.selectionStart : value.length;
    const akhir = fokus ? el.selectionEnd : value.length;
    const baru = value.slice(0, awal) + teks + value.slice(akhir);
    if (baru.length > MAKS) return;
    kursor.current = awal + teks.length;
    onChange(baru);
  };

  return (
    <div className="space-y-2.5">
      <input
        ref={ref}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={MAKS}
        spellCheck={false}
        autoCapitalize="none"
        autoComplete="off"
        aria-invalid={invalid || undefined}
        className="field tabular-nums"
      />
      {/* Contoh / galat tepat di bawah kolom: hasil tiap ketukan langsung terlihat */}
      {hasil}

      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-slate-500">Ketuk untuk menyisipkan di posisi kursor.</p>
          <button
            type="button"
            onClick={() => { kursor.current = polaBawaan.length; onChange(polaBawaan); }}
            disabled={value === polaBawaan}
            className="shrink-0 inline-flex items-center gap-1.5 min-h-9 px-2.5 rounded-lg text-xs font-semibold text-brand-700 hover:bg-brand-50 disabled:text-slate-400 disabled:hover:bg-transparent transition"
          >
            <RotateCcw size={13} aria-hidden="true" /> Pola bawaan
          </button>
        </div>

        {SISIPAN.map(({ judul, isi }) => (
          <div key={judul} role="group" aria-label={judul} className="grid sm:grid-cols-[5.5rem_1fr] items-start gap-1.5 sm:gap-2">
            <span className="text-xs font-semibold text-slate-600 sm:pt-3 lg:pt-2.5">{judul}</span>
            <div className="flex flex-wrap gap-1.5">
              {isi.map(([teks, ket]) => (
                <button
                  key={teks}
                  type="button"
                  // mousedown dicegah: fokus & kursor tetap di kolom pola
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => sisipkan(teks)}
                  aria-label={`Sisipkan ${judul.toLowerCase()} ${ket} ${teks}`}
                  title={teks}
                  className="inline-flex flex-col items-center justify-center min-h-11 lg:min-h-10 min-w-14 px-2.5 rounded-lg bg-white border border-slate-200 hover:border-brand-300 hover:bg-brand-50 active:scale-95 transition"
                >
                  <span className="text-sm font-bold text-slate-800 tabular-nums leading-tight">
                    {teks.startsWith("{") ? contohNomor(teks, 1) : teks}
                  </span>
                  <span className="text-[11px] text-slate-500 leading-tight">{ket}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        <p className="text-xs text-slate-500">Hapus mundur tepat setelah satu bagian akan menghapus bagian itu sekaligus.</p>
      </div>
    </div>
  );
}
PolaNomor.kontrolForm = true;
