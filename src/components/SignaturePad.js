"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Eraser } from "lucide-react";

const MAX_LEBAR_HASIL = 600;

/**
 * Kanvas tanda tangan.
 *
 * Catatan teknis yang menentukan enak-tidaknya dipakai:
 *  - Pointer Events → satu kode untuk jari, stylus, dan mouse
 *  - touch-action: none → menggambar tidak ikut men-scroll halaman di HP
 *  - kanvas di-skala devicePixelRatio → garis tidak pecah di layar HP
 *  - hasil di-trim area kosongnya lalu diperkecil sebelum disimpan
 */
export default function SignaturePad({ onChange, tinggi = 200 }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const [kosong, setKosong] = useState(true);

  // Siapkan ukuran kanvas mengikuti lebar wadah & kerapatan piksel layar.
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const dpr = window.devicePixelRatio || 1;
    const lebar = wrap.clientWidth;

    // Simpan gambar lama supaya tidak hilang saat layar diputar.
    const lama = kosong ? null : canvas.toDataURL("image/png");

    canvas.width = Math.floor(lebar * dpr);
    canvas.height = Math.floor(tinggi * dpr);
    canvas.style.width = `${lebar}px`;
    canvas.style.height = `${tinggi}px`;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";

    if (lama) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, lebar, tinggi);
      img.src = lama;
    }
  }, [tinggi, kosong]);

  useEffect(() => {
    setupCanvas();
    const onResize = () => setupCanvas();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const posisi = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const mulai = (e) => {
    e.preventDefault();
    canvasRef.current.setPointerCapture?.(e.pointerId);
    drawing.current = true;
    last.current = posisi(e);
  };

  const gerak = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const p = posisi(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    if (kosong) setKosong(false);
  };

  const selesai = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    drawing.current = false;
    canvasRef.current.releasePointerCapture?.(e.pointerId);
    onChange?.(ambilHasil());
  };

  const hapus = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    setKosong(true);
    onChange?.("");
  };

  /** Potong area kosong di sekeliling coretan, lalu perkecil. */
  const ambilHasil = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { width: w, height: h } = canvas;
    const data = ctx.getImageData(0, 0, w, h).data;

    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 8) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return "";

    const pad = 8;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(w - 1, maxX + pad);
    maxY = Math.min(h - 1, maxY + pad);

    const lebarPotong = maxX - minX + 1;
    const tinggiPotong = maxY - minY + 1;
    const skala = Math.min(1, MAX_LEBAR_HASIL / lebarPotong);

    const out = document.createElement("canvas");
    out.width = Math.round(lebarPotong * skala);
    out.height = Math.round(tinggiPotong * skala);
    const octx = out.getContext("2d");
    octx.drawImage(
      canvas,
      minX, minY, lebarPotong, tinggiPotong,
      0, 0, out.width, out.height
    );

    return out.toDataURL("image/png");
  };

  return (
    <div className="space-y-2">
      <div
        ref={wrapRef}
        className="relative rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={mulai}
          onPointerMove={gerak}
          onPointerUp={selesai}
          onPointerLeave={selesai}
          onPointerCancel={selesai}
          className="block w-full cursor-crosshair"
          style={{ touchAction: "none", height: tinggi }}
        />
        {kosong && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-slate-400 font-medium">
              Tanda tangan di sini
            </p>
          </div>
        )}
        {/* Garis bantu */}
        <div className="absolute left-6 right-6 bottom-8 border-b border-slate-300 pointer-events-none" />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          Gunakan jari atau stylus. Putar HP ke posisi lanskap untuk ruang lebih lega.
        </p>
        <button
          type="button"
          onClick={hapus}
          disabled={kosong}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 disabled:opacity-40 disabled:hover:text-slate-600 transition px-2.5 py-1.5 rounded-lg hover:bg-slate-100"
        >
          <Eraser size={13} /> Ulangi
        </button>
      </div>
    </div>
  );
}
