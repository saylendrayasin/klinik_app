"use client";

import { cloneElement, isValidElement, useId } from "react";

const KONTROL = new Set(["input", "select", "textarea"]);

/** Komponen yang meneruskan prop `id` ke elemen form aslinya bisa ditandai `Komp.kontrolForm = true`. */
function kontrolTunggal(anak) {
  if (!isValidElement(anak)) return false;
  return typeof anak.type === "string" ? KONTROL.has(anak.type) : !!anak.type?.kontrolForm;
}

/**
 * Label + isi form. Bila isinya satu kontrol, label disambungkan lewat id
 * (ketuk label = fokus ke kolom, pembaca layar menyebut nama kolom).
 * Bila isinya beberapa kontrol, label menjadi judul grup (role="group").
 */
export default function Field({ label, required, ket, children, className = "", ...rest }) {
  const idOtomatis = useId();
  const tunggal = kontrolTunggal(children);
  const idKontrol = tunggal ? children.props.id || idOtomatis : undefined;
  const idLabel = `${idOtomatis}-label`;

  const isiLabel = (
    <>
      {label}
      {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
    </>
  );
  const kelasLabel = "text-sm font-semibold text-slate-700";

  return (
    <div
      className={`flex flex-col gap-1.5 ${className}`}
      role={tunggal ? undefined : "group"}
      aria-labelledby={tunggal ? undefined : idLabel}
      {...rest}
    >
      {tunggal ? (
        <label htmlFor={idKontrol} className={kelasLabel}>{isiLabel}</label>
      ) : (
        <span id={idLabel} className={kelasLabel}>{isiLabel}</span>
      )}
      {tunggal ? cloneElement(children, { id: idKontrol }) : children}
      {ket && <p className="text-xs text-slate-400">{ket}</p>}
    </div>
  );
}
