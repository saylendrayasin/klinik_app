/**
 * Penanganan tanggal surat.
 *
 * Masalah yang dicegah di sini: Vercel menjalankan server dengan zona waktu
 * UTC, sedangkan klinik berada di WITA (UTC+8). Kalau tanggal surat disimpan
 * sebagai stempel waktu penuh, surat tertanggal 1 Maret bisa terbaca sebagai
 * 28 Februari di server — nomornya masuk bulan yang salah dan tanggal yang
 * tercetak meleset sehari.
 *
 * Solusinya: tanggal surat selalu disimpan sebagai tengah malam UTC pada
 * tanggal kalender yang dimaksud, dan semua pembacaan memakai getter UTC.
 * Dengan begitu hasilnya sama persis di laptop bidan maupun di server Vercel,
 * tanpa bergantung pada variabel TZ.
 */

/** Ubah nilai apa pun menjadi Date tengah malam UTC pada tanggal kalendernya. */
export function keTanggalUTC(nilai) {
  if (!nilai) return null;

  // Bentuk "YYYY-MM-DD" dari <input type="date"> — inilah jalur normal.
  if (typeof nilai === "string") {
    const m = nilai.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    }
  }

  const d = new Date(nilai);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Tanggal hari ini sebagai tengah malam UTC. */
export function hariIniUTC() {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

/** Komponen bulan & tahun untuk penomoran surat. */
export function bulanTahunUTC(nilai) {
  const d = keTanggalUTC(nilai) || hariIniUTC();
  return { bulan: d.getUTCMonth() + 1, tahun: d.getUTCFullYear() };
}

/** "28 Februari 2026" — dibaca sebagai UTC agar tidak bergeser sehari. */
export function tanggalPanjang(nilai, kosong = "……………………") {
  const d = keTanggalUTC(nilai);
  if (!d) return kosong;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

const SINGKAT = { day: "numeric", month: "short", year: "numeric" };

/** "28 Feb 2026" untuk tabel dan daftar surat (dibaca sebagai UTC). */
export function tanggalPendek(nilai, kosong = "-") {
  const d = keTanggalUTC(nilai);
  if (!d) return kosong;
  return d.toLocaleDateString("id-ID", { ...SINGKAT, timeZone: "UTC" });
}

/**
 * "28 Feb 2026" untuk tanggal klinis (kunjungan, HPL, persalinan).
 * Sengaja memakai zona waktu perangkat seperti sebelumnya: tanggal persalinan
 * bisa membawa jam, jadi membacanya sebagai UTC justru bisa mundur sehari.
 */
export function tanggalSingkat(nilai, kosong = "-") {
  if (!nilai) return kosong;
  // "YYYY-MM-DD" dari <input type="date"> adalah tanggal kalender, bukan stempel waktu
  const m = typeof nilai === "string" && nilai.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(nilai);
  if (Number.isNaN(d.getTime())) return kosong;
  return d.toLocaleDateString("id-ID", SINGKAT);
}
