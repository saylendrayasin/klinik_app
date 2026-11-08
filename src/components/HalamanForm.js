"use client";

import { useId } from "react";
import { Check } from "lucide-react";
import { btnBatal, btnUtama, Spinner } from "@/components/Modal";

const tombol = "sm:flex-none sm:px-6";

// Kartu form tanpa overflow-hidden: itu akan mematikan `sticky` pada bilah aksi.
const kartuForm = "bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-900/[0.03]";

/** Bilah tombol yang menempel di bawah layar selama kartu form masih terlihat. */
function BilahAksi({ children }) {
  return (
    <div className="sticky bottom-0 z-10 flex gap-2.5 sm:justify-end px-4 sm:px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-slate-100 bg-white/90 backdrop-blur rounded-b-2xl">
      {children}
    </div>
  );
}

/**
 * Kerangka halaman "tambah data": judul, satu kartu berisi `BagianForm`,
 * dan bilah aksi yang menempel di bawah layar — pada form panjang di HP
 * tombol Simpan tetap terlihat tanpa harus menggulir ke paling bawah.
 * Bagian sengaja tidak bisa dilipat: kolom wajib yang tersembunyi
 * membuat kesalahan isian sulit ditemukan.
 */
export default function HalamanForm({
  ikon: Ikon,
  judul,
  sub,
  onSubmit,
  onBatal,
  busy = false,
  labelSimpan = "Simpan",
  labelBatal = "Kembali",
  lebar = "max-w-3xl",
  children,
}) {
  return (
    <div className={`${lebar} mx-auto`}>
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center shadow-md shadow-brand-600/25 shrink-0">
          <Ikon size={17} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-slate-800 leading-tight">{judul}</h1>
          {sub && <p className="text-slate-500 text-sm mt-0.5">{sub}</p>}
        </div>
      </div>

      <form onSubmit={onSubmit} className={kartuForm}>
        <div className="divide-y divide-slate-100">{children}</div>
        <BilahAksi>
          <button type="button" onClick={onBatal} disabled={busy} className={`${btnBatal} ${tombol}`}>
            {labelBatal}
          </button>
          <button type="submit" disabled={busy} className={`${btnUtama} ${tombol}`}>
            {busy ? <><Spinner /> Menyimpan...</> : labelSimpan}
          </button>
        </BilahAksi>
      </form>
    </div>
  );
}

/**
 * Form "Edit Data" di halaman detail — kartu dan bilah aksi yang sama dengan
 * HalamanForm, tanpa judul halaman (judul sudah ada di DetailHeader).
 * - `dirty` true/false: tombol Simpan mati saat tidak ada perubahan dan
 *   tombol Batalkan hanya muncul bila ada yang bisa dibatalkan.
 * - `dirty` tidak diisi: kedua tombol selalu aktif.
 * - `busy` mengunci tombol selama menyimpan agar tidak terkirim dua kali.
 */
export function FormEdit({
  onSubmit,
  busy = false,
  dirty,
  onBatal,
  labelBatal = "Batalkan",
  labelSimpan = "Simpan Perubahan",
  children,
}) {
  const bersih = dirty === false;
  return (
    <form onSubmit={onSubmit} className={kartuForm}>
      <div className="divide-y divide-slate-100">{children}</div>
      <BilahAksi>
        {onBatal && !bersih && (
          <button type="button" onClick={onBatal} disabled={busy} className={`${btnBatal} ${tombol}`}>
            {labelBatal}
          </button>
        )}
        <button
          type="submit"
          disabled={busy || bersih}
          className={
            bersih
              ? `flex-1 ${tombol} min-h-11 inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold bg-slate-100 text-slate-500 cursor-default`
              : `${btnUtama} ${tombol}`
          }
        >
          {busy ? (
            <><Spinner /> Menyimpan...</>
          ) : bersih ? (
            <><Check size={16} aria-hidden="true" /> Tersimpan</>
          ) : (
            labelSimpan
          )}
        </button>
      </BilahAksi>
    </form>
  );
}

/** Satu kelompok isian dengan nomor urut, judul, dan keterangan singkat. */
export function BagianForm({ no, judul, ket, children }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-4 sm:mb-5">
        {no != null && (
          <span
            aria-hidden="true"
            className="w-7 h-7 rounded-full bg-brand-50 text-brand-700 ring-1 ring-brand-100 text-sm font-bold flex items-center justify-center shrink-0"
          >
            {no}
          </span>
        )}
        <div className="min-w-0">
          <h2 id={id} className="font-bold text-slate-800 leading-7">{judul}</h2>
          {ket && <p className="text-sm text-slate-500">{ket}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
