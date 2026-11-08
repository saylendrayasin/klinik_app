"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

// A4 dalam piksel CSS: 1mm = 96/25.4 px
const MM = 96 / 25.4;
const A4_W = 210 * MM; // ±793.7
const A4_H = 297 * MM; // ±1122.5
const PAD = 24; // p-3 di area gulir, atas + bawah

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.5;

/**
 * Pratinjau surat berukuran A4 yang diperkecil mengikuti wadahnya.
 *
 * Suratnya sendiri tetap 210mm — yang diskalakan hanya tampilannya lewat
 * transform. Jadi apa yang terlihat di HP benar-benar proporsional dengan
 * kertas yang akan keluar dari printer, bukan tata letak versi mobile.
 *
 * pasHalaman (layar lebar): kartu setinggi `className` memberi, dan 100% =
 * seluruh lembar terlihat sekaligus — tanpa gulir di dalam pratinjau.
 * Tanpa itu (HP/tablet): 100% = pas lebar, halaman yang digulir.
 */
export default function PreviewSurat({ children, pasHalaman = false, className = "" }) {
  const areaRef = useRef(null);
  const isiRef = useRef(null);
  const [ukuran, setUkuran] = useState({ w: 0, h: 0, isi: A4_H });
  const [zoom, setZoom] = useState(1);

  // ResizeObserver: wadah berubah saat layar diputar, sidebar dibuka, atau
  // tab pratinjau ditampilkan; isi berubah saat form diisi (surat memanjang).
  useLayoutEffect(() => {
    const area = areaRef.current;
    const ukur = () => {
      // Saat panel disembunyikan (display:none) lebarnya 0 — pertahankan
      // nilai terakhir supaya tidak berkedip ke skala nol saat tab dibuka.
      if (area.clientWidth === 0) return;
      setUkuran({
        w: area.clientWidth - PAD,
        h: area.clientHeight - PAD,
        isi: Math.max(A4_H, isiRef.current?.offsetHeight || 0),
      });
    };
    ukur();
    const ro = new ResizeObserver(ukur);
    ro.observe(area);
    if (isiRef.current) ro.observe(isiRef.current);
    return () => ro.disconnect();
  }, []);

  const pasLebar = ukuran.w > 0 ? ukuran.w / A4_W : 0;
  const skalaPas = pasHalaman && ukuran.h > 0 ? Math.min(pasLebar, ukuran.h / ukuran.isi) : pasLebar;
  const skala = skalaPas * zoom;
  const siap = skala > 0;
  const labelPas = pasHalaman ? "Pas halaman" : "Pas lebar";

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col ${className}`}>
      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-bold text-slate-800 text-sm">Pratinjau Surat</h2>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">Tampilan sesuai hasil cetak A4</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <BtnZoom onClick={() => setZoom((z) => Math.max(ZOOM_MIN, +(z - 0.25).toFixed(2)))} disabled={zoom <= ZOOM_MIN} label="Perkecil">
            <ZoomOut size={14} />
          </BtnZoom>
          <button
            type="button"
            onClick={() => setZoom(1)}
            title={labelPas}
            className="px-2 h-9 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition tabular-nums min-w-[48px]"
          >
            {Math.round(zoom * 100)}%
          </button>
          <BtnZoom onClick={() => setZoom((z) => Math.min(ZOOM_MAX, +(z + 0.25).toFixed(2)))} disabled={zoom >= ZOOM_MAX} label="Perbesar">
            <ZoomIn size={14} />
          </BtnZoom>
          <BtnZoom onClick={() => setZoom(1)} label={labelPas}>
            <Maximize2 size={13} />
          </BtnZoom>
        </div>
      </div>

      {/* Area gulir hanya terpakai saat di-zoom; selebihnya roda tetikus di
          atas pratinjau menggulir halaman seperti biasa */}
      <div ref={areaRef} className={`flex-1 min-h-0 bg-slate-200/60 overflow-auto p-3 ${zoom > 1 ? "overscroll-contain" : ""}`}>
        <div style={{ height: siap ? ukuran.isi * skala : 320, width: siap ? A4_W * skala : "100%" }} className="relative mx-auto">
          <div
            ref={isiRef}
            style={{ width: A4_W, transform: `scale(${skala})`, transformOrigin: "top left", visibility: siap ? "visible" : "hidden" }}
            className="absolute top-0 left-0"
          >
            {children}
          </div>
        </div>
      </div>

      <p className="px-4 py-2 text-[11px] text-slate-500 border-t border-slate-100">
        Kolom yang sedang Anda isi akan ditandai kuning di pratinjau.
      </p>
    </div>
  );
}

function BtnZoom({ onClick, disabled, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition"
    >
      {children}
    </button>
  );
}
