/**
 * Data surat → bentuk tampilan untuk SuratConsent / SuratSakit.
 * Murni (tanpa hook) supaya dipakai halaman cetak (server) dan pratinjau (klien).
 *
 * `src(id)` mengubah id Gambar menjadi alamat gambar: di server berupa data
 * URL (halaman cetak lengkap sejak awal), di klien `/api/gambar/<id>`.
 */

export const LOGO_BAWAAN = "/kop/logo-klinik.png";
export const urlGambar = (id) => (id ? `/api/gambar/${id}` : "");

const SATUAN = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];

/** 3 → "tiga", 15 → "lima belas", 120 → "seratus dua puluh". Cukup untuk 0–999. */
export function terbilang(n) {
  n = Math.floor(Number(n) || 0);
  if (n < 12) return SATUAN[n] || "nol";
  if (n < 20) return `${SATUAN[n - 10]} belas`;
  if (n < 100) return `${SATUAN[Math.floor(n / 10)]} puluh ${terbilang(n % 10 || 0).replace("nol", "")}`.trim();
  if (n < 200) return `seratus ${n % 100 ? terbilang(n % 100) : ""}`.trim();
  if (n < 1000) return `${SATUAN[Math.floor(n / 100)]} ratus ${n % 100 ? terbilang(n % 100) : ""}`.trim();
  return String(n);
}

/** Jumlah hari inklusif antara dua tanggal "YYYY-MM-DD" / Date (dibaca UTC). */
export function lamaHari(mulai, selesai) {
  const a = Date.parse(String(mulai instanceof Date ? mulai.toISOString() : mulai).slice(0, 10));
  const b = Date.parse(String(selesai instanceof Date ? selesai.toISOString() : selesai).slice(0, 10));
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86_400_000) + 1;
}

/**
 * Draf belum punya salinan master: isi kop, logo, cap, dan petugas dari
 * master saat ini supaya pratinjau draf memperlihatkan hasil saat terbit.
 * Surat terbit tidak pernah melewati fungsi ini — ia memakai salinannya sendiri.
 */
export function timpaMaster(data, { pengaturan, penandatangan = [] }) {
  const salin = (id) => {
    const p = id && penandatangan.find((x) => String(x._id) === String(id));
    return p
      ? { penandatanganId: p._id, nama: p.nama, jabatan: p.jabatan, nip: p.nip || "", ttdId: p.ttdId || null }
      : { penandatanganId: id || null, nama: "", jabatan: "", nip: "", ttdId: null };
  };
  const hasil = { ...data, kop: pengaturan?.kop || {}, logoId: pengaturan?.logoId || null };

  let ttdUtama;
  if ("pemeriksa" in data) {
    const p = salin(data.pemeriksa?.penandatanganId);
    if (data.ttdBasah) p.ttdId = null;
    hasil.pemeriksa = p;
    ttdUtama = p.ttdId;
  } else {
    hasil.petugas = salin(data.petugas?.penandatanganId);
    if (data.saksiKlinik?.penandatanganId) {
      hasil.saksiKlinik = { ...data.saksiKlinik, ...salin(data.saksiKlinik.penandatanganId), dataUrl: "" };
    }
    ttdUtama = hasil.petugas.ttdId;
  }
  hasil.capId = ttdUtama ? pengaturan?.capId || null : null;
  return hasil;
}

const dasar = (d, src) => ({
  nomorSurat: d.nomorSurat || "",
  tanggalSurat: d.tanggalSurat || null,
  draft: d.status !== "issued",
  kop: d.kop || {},
  logo: d.logoId ? src(d.logoId) : LOGO_BAWAAN,
});

const kolomPetugas = (judul, p, cap) => ({
  judul,
  nama: p?.nama || "",
  nip: p?.nip || "",
  ttd: p?.ttdId ? cap.src(p.ttdId) : "",
  cap: p?.ttdId && cap.id ? cap.src(cap.id) : "",
});

const goresan = (t) => (t?.mode === "gambar" ? t.dataUrl || "" : "");

export function consentKeSurat(d, src = urlGambar) {
  const capInfo = { id: d.capId, src };
  const sk = d.saksiKlinik || {};
  const sp = d.saksiKeluarga || {};
  return {
    ...dasar(d, src),
    keputusan: d.keputusan || "setuju",
    tindakan: d.tindakan || "",
    hubungan: d.hubungan || "diri_sendiri",
    pembuat: d.pembuat || {},
    pasien: d.hubungan === "diri_sendiri" ? d.pembuat || {} : d.pasien || {},
    jabatanPetugas: d.petugas?.jabatan || "",
    petugas: kolomPetugas(d.petugas?.jabatan || "Petugas", d.petugas, capInfo),
    pembuatTtd: { judul: "Yang Membuat Pernyataan", nama: d.pembuat?.nama || "", ttd: goresan(d.ttdPembuat) },
    saksiKlinik: sk.aktif === false ? null
      : sk.penandatanganId
        ? kolomPetugas("Saksi dari Klinik", sk, { id: null, src })
        : { judul: "Saksi dari Klinik", nama: sk.nama || "", ttd: goresan(sk) },
    saksiKeluarga: sp.aktif === false ? null
      : { judul: "Saksi dari Keluarga Pasien", nama: sp.nama || "", ttd: goresan(sp) },
  };
}

export function sakitKeSurat(d, src = urlGambar) {
  return {
    ...dasar(d, src),
    nama: d.nama || "",
    umur: d.umur ?? "",
    pekerjaan: d.pekerjaan || "",
    alamat: d.alamat || "",
    mulai: d.mulai || null,
    selesai: d.selesai || null,
    lamaHari: d.mulai && d.selesai ? lamaHari(d.mulai, d.selesai) : 0,
    pemeriksa: kolomPetugas("Pemeriksa", d.pemeriksa, { id: d.capId, src }),
  };
}
