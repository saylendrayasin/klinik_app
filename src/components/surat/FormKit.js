"use client";

import { createContext, useContext, useId } from "react";
import FieldDasar from "@/components/Field";

/**
 * Bagian kecil form surat. Field yang difokus dilaporkan lewat konteks
 * supaya pratinjau menandai bagian surat yang sedang diisi.
 */
export const FokusContext = createContext(() => {});

/** Kartu bernomor. Nomor dari CSS counter (.daftar-bagian) agar tetap urut bila ada kartu yang disembunyikan. */
export function Kartu({ judul, ket, aksi, children }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="bg-white rounded-2xl shadow-sm shadow-slate-900/[0.03] border border-slate-200">
      <div className="flex items-start gap-3 px-5 pt-5 pb-1">
        <span aria-hidden="true" className="nomor-bagian w-7 h-7 rounded-full bg-brand-50 text-brand-700 ring-1 ring-brand-100 text-sm font-bold flex items-center justify-center shrink-0" />
        <div className="min-w-0 flex-1">
          <h2 id={id} className="font-bold text-slate-800 leading-7">{judul}</h2>
          {ket && <p className="text-sm text-slate-500">{ket}</p>}
        </div>
        {aksi}
      </div>
      <div className="p-5 pt-3 space-y-4">{children}</div>
    </section>
  );
}

export function Isian({ fokus, ...props }) {
  const lapor = useContext(FokusContext);
  return (
    <FieldDasar
      {...props}
      onFocusCapture={() => fokus && lapor(fokus)}
      onBlurCapture={() => fokus && lapor(null)}
    />
  );
}

export function Input({ value, onChange, angka, type = "text", ...rest }) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      inputMode={angka ? "numeric" : undefined}
      className={`field ${angka ? "tabular-nums" : ""}`}
      {...rest}
    />
  );
}
Input.kontrolForm = true;

export function Pilih({ value, onChange, children, ...rest }) {
  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="field" {...rest}>
      {children}
    </select>
  );
}
Pilih.kontrolForm = true;

/**
 * Pilihan sedikit opsi sebagai tombol bersebelahan (radio asli, jadi
 * panah kiri/kanan dan pembaca layar bekerja). Dibungkus Isian → role="group".
 */
export function Segmen({ name, value, onChange, opsi, disabled }) {
  return (
    <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
      {opsi.map(([v, label]) => (
        <label
          key={v}
          className={`flex-1 min-w-fit min-h-10 px-3 inline-flex items-center justify-center rounded-lg text-sm font-semibold transition cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500 ${
            value === v ? "bg-white text-brand-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <input
            type="radio"
            name={name}
            value={v}
            checked={value === v}
            onChange={() => onChange(v)}
            disabled={disabled}
            className="sr-only"
          />
          {label}
        </label>
      ))}
    </div>
  );
}

/** Saklar ya/tidak dengan label yang bisa diketuk (min 44px). */
export function Saklar({ checked, onChange, label, ket, disabled }) {
  return (
    <label className={`flex items-start gap-3 min-h-11 py-1 ${disabled ? "opacity-60" : "cursor-pointer"}`}>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="mt-0.5 w-10 h-6 shrink-0 rounded-full bg-slate-300 peer-checked:bg-brand-600 relative transition after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2"
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-700">{label}</span>
        {ket && <span className="block text-xs text-slate-500 mt-0.5">{ket}</span>}
      </span>
    </label>
  );
}

/** "YYYY-MM-DD" dari Date/ISO yang disimpan sebagai tengah malam UTC. */
export const keInputTanggal = (v) => (v ? new Date(v).toISOString().slice(0, 10) : "");

/** "YYYY-MM-DD" hari ini menurut kalender perangkat. */
export function hariIni(tambahHari = 0) {
  const d = new Date();
  d.setDate(d.getDate() + tambahHari);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Umur (tahun penuh) pada tanggal tertentu. */
export function hitungUmur(tanggalLahir, padaTanggal) {
  if (!tanggalLahir) return "";
  const lahir = new Date(tanggalLahir);
  const pada = padaTanggal ? new Date(padaTanggal) : new Date();
  let u = pada.getFullYear() - lahir.getFullYear();
  const m = pada.getMonth() - lahir.getMonth();
  if (m < 0 || (m === 0 && pada.getDate() < lahir.getDate())) u--;
  return u >= 0 ? String(u) : "";
}
