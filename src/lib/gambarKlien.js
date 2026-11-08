/**
 * Gambar unggahan (logo, cap, tanda tangan) diperkecil di browser sebelum
 * dikirim: foto HP 3–5 MB menjadi PNG ±600px, cukup tajam untuk cetak A4
 * (cap 24mm ≈ 280px di 300 dpi) dan tetap hemat ruang MongoDB.
 * PNG dipertahankan supaya latar transparan cap/TTD tidak berubah putih.
 */
const TIPE = ["image/png", "image/jpeg", "image/webp"];

export async function perkecilGambar(file, maks = 600) {
  if (!file || !TIPE.includes(file.type)) {
    throw new Error("Pilih gambar PNG, JPG, atau WebP");
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, gagal) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => gagal(new Error("Gambar tidak bisa dibaca"));
      i.src = url;
    });
    const skala = Math.min(1, maks / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * skala);
    c.height = Math.round(img.naturalHeight * skala);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    const hasil = c.toDataURL("image/png");
    if (hasil.length > 700_000) throw new Error("Gambar terlalu rumit/besar. Pangkas atau gunakan gambar lain.");
    return hasil;
  } finally {
    URL.revokeObjectURL(url);
  }
}
