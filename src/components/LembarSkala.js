"use client";

import { useLayoutEffect, useRef, useState } from "react";

const MM = 96 / 25.4;
const A4_W = 210 * MM;
const A4_H = 297 * MM;

/**
 * Pembungkus surat untuk halaman cetak.
 *
 * Di layar sempit (HP/tablet) surat A4 diperkecil agar muat utuh — tanpa itu
 * separuh kanan surat, termasuk kolom tanda tangan bidan dan capnya, terpotong
 * dan harus digeser mendatar untuk dilihat.
 *
 * Saat dicetak, penskalaan dibatalkan lewat `@media print` di globals.css
 * (kelas .lembar-skala), sehingga kertas tetap menerima ukuran A4 penuh.
 *
 * Isinya dioper sebagai children agar suratnya sendiri tetap dirender di
 * server — halaman cetak tidak boleh menunggu JavaScript untuk tampil.
 */
export default function LembarSkala({ children }) {
  const wadahRef = useRef(null);
  const [lebar, setLebar] = useState(0);

  useLayoutEffect(() => {
    const el = wadahRef.current;
    if (!el) return;
    const ukur = () => {
      const w = el.clientWidth;
      if (w > 0) setLebar(w);
    };
    ukur();
    const ro = new ResizeObserver(ukur);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Hanya diperkecil, tidak pernah diperbesar melebihi ukuran asli.
  const skala = lebar > 0 ? Math.min(1, lebar / A4_W) : 1;
  const perluSkala = skala < 1;

  return (
    <div ref={wadahRef} className="w-full">
      <div
        className="lembar-skala mx-auto"
        style={
          perluSkala
            ? { width: A4_W * skala, height: A4_H * skala, position: "relative" }
            : undefined
        }
      >
        <div
          className="lembar-skala-isi"
          style={
            perluSkala
              ? {
                  width: A4_W,
                  transform: `scale(${skala})`,
                  transformOrigin: "top left",
                  position: "absolute",
                  top: 0,
                  left: 0,
                }
              : undefined
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}
