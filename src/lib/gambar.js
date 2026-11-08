"use client";

/**
 * Konversi gambar ke data URL PNG untuk disimpan di MongoDB.
 *
 * Kenapa base64 di database, bukan file di server: Vercel menjalankan aplikasi
 * di filesystem yang read-only dan sementara — file yang ditulis saat runtime
 * akan hilang. Menyimpannya di dokumen MongoDB membuatnya ikut ter-backup dan
 * langsung tersedia di semua instance.
 */

const bacaFile = (file) =>
  new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(new Error("Gagal membaca berkas"));
    fr.readAsDataURL(file);
  });

const muatGambar = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Berkas bukan gambar yang valid"));
    img.src = src;
  });

/**
 * Perkecil lewat canvas hanya kalau perlu.
 *
 * Kalau gambar sudah cukup kecil, data aslinya dipakai apa adanya — melewatkan
 * PNG yang sudah teroptimasi melalui canvas justru sering memperbesar ukurannya
 * karena canvas mengekspor tanpa optimasi palet.
 */
export async function keDataUrl(sumber, { maksPx = 420, maksByte = 220 * 1024 } = {}) {
  const asal = typeof sumber === "string" ? sumber : await bacaFile(sumber);
  const img = await muatGambar(asal);

  const cukupKecil =
    img.width <= maksPx && img.height <= maksPx && asal.length <= maksByte;
  if (cukupKecil && asal.startsWith("data:image/png")) return asal;

  const skala = Math.min(1, maksPx / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * skala));
  const h = Math.max(1, Math.round(img.height * skala));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/png");
}

/** Ambil berkas bawaan dari /public lalu ubah ke data URL. */
export async function bawaanKeDataUrl(url, opts) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal memuat berkas bawaan");
  const blob = await res.blob();
  return keDataUrl(blob, opts);
}

export const ukuranKB = (dataUrl) =>
  dataUrl ? Math.round((dataUrl.length * 3) / 4 / 1024) : 0;
