/**
 * Aturan isi & penerbitan surat persetujuan tindakan (informed consent).
 * Handler route-nya generik (lib/surat.js); di sini hanya yang khas consent.
 */

import { Consent, FIELD_DATA_CONSENT, HUBUNGAN } from "@/models/consent";
import { ApiError } from "@/lib/response";
import { goresanValid, idAtauNull, salinPetugas, tanggalWajib, teks, umur } from "@/lib/surat";

const orang = (o = {}) => ({
  nama: teks(o.nama, 100),
  umur: umur(o.umur),
  jenisKelamin: ["L", "P"].includes(o.jenisKelamin) ? o.jenisKelamin : "",
  alamat: teks(o.alamat, 300),
});

const mode = (m) => (m === "basah" ? "basah" : "gambar");

/** Goresan baru wajib ada untuk kolom mode "gambar"; kolom basah selalu kosong. */
function goresan(m, dataUrl, label) {
  if (m === "basah") return "";
  if (!goresanValid(dataUrl)) throw new ApiError(`${label} belum dibubuhkan`, 400);
  return dataUrl;
}

function terapkan(doc, d) {
  if (d.tanggalSurat !== undefined) doc.tanggalSurat = tanggalWajib(d.tanggalSurat, "Tanggal surat");
  if (d.keputusan !== undefined) doc.keputusan = d.keputusan === "menolak" ? "menolak" : "setuju";
  if (d.tindakan !== undefined) doc.tindakan = teks(d.tindakan, 200);
  if (d.hubungan !== undefined) {
    if (!HUBUNGAN.includes(d.hubungan)) throw new ApiError("Hubungan dengan pasien tidak valid", 400);
    doc.hubungan = d.hubungan;
  }
  if (d.pembuat) doc.pembuat = orang(d.pembuat);
  if (d.pasien) doc.pasien = orang(d.pasien);
  // Hanya id yang diterima; nama/jabatan/TTD disalin server dari master saat terbit.
  if (d.petugas) doc.petugas = { penandatanganId: idAtauNull(d.petugas.penandatanganId) };
  if (d.ttdPembuat) doc.ttdPembuat.mode = mode(d.ttdPembuat.mode);
  if (d.saksiKlinik) {
    const s = d.saksiKlinik;
    const id = idAtauNull(s.penandatanganId);
    doc.saksiKlinik = { aktif: s.aktif !== false, penandatanganId: id, nama: id ? "" : teks(s.nama, 100), mode: mode(s.mode) };
  }
  if (d.saksiKeluarga) {
    const s = d.saksiKeluarga;
    doc.saksiKeluarga = { aktif: s.aktif !== false, nama: teks(s.nama, 100), mode: mode(s.mode) };
  }

  // Pasien = yang membuat pernyataan bila untuk diri sendiri.
  if (doc.hubungan === "diri_sendiri") doc.pasien = doc.toObject().pembuat;

  if (!doc.pembuat?.nama) throw new ApiError("Nama yang membuat pernyataan wajib diisi", 400);
  if (!doc.tindakan) throw new ApiError("Tindakan medik wajib diisi", 400);
}

async function terbitkan(doc, body) {
  const ttd = body.ttd || {};
  if (!doc.pasien?.nama) throw new ApiError("Nama pasien wajib diisi", 400);

  doc.petugas = await salinPetugas(doc.petugas?.penandatanganId, "Petugas");
  doc.ttdPembuat.dataUrl = goresan(doc.ttdPembuat.mode, ttd.pembuat, "Tanda tangan yang membuat pernyataan");

  const sk = doc.saksiKlinik;
  if (sk.aktif && sk.penandatanganId) {
    // Saksi dari master: TTD digital dari master (atau basah bila master tak punya TTD).
    Object.assign(sk, await salinPetugas(sk.penandatanganId, "Saksi dari klinik"), { dataUrl: "" });
  } else if (sk.aktif) {
    if (!sk.nama) throw new ApiError("Nama saksi dari klinik wajib diisi", 400);
    sk.dataUrl = goresan(sk.mode, ttd.saksiKlinik, "Tanda tangan saksi dari klinik");
  }

  const sp = doc.saksiKeluarga;
  if (sp.aktif) {
    if (sp.mode === "gambar" && !sp.nama) throw new ApiError("Nama saksi dari keluarga wajib diisi", 400);
    sp.dataUrl = goresan(sp.mode, ttd.saksiKeluarga, "Tanda tangan saksi dari keluarga");
  }

  // Cap klinik hanya dibubuhkan bersama TTD digital petugas.
  return !!doc.petugas.ttdId;
}

/** Batal terbit: goresan dihapus — isi akan diedit, jadi harus ditandatangani ulang. */
function batalkan(doc) {
  doc.ttdPembuat.dataUrl = "";
  doc.saksiKlinik.dataUrl = "";
  doc.saksiKeluarga.dataUrl = "";
}

export const KONFIG_CONSENT = {
  Model: Consent,
  jenis: "consent",
  label: "surat persetujuan",
  Label: "Surat persetujuan",
  fields: FIELD_DATA_CONSENT,
  terapkan,
  terbitkan,
  batalkan,
  cari: ["tindakan", "pembuat.nama", "pasien.nama"],
  sort: { tanggalSurat: "tanggalSurat", createdAt: "createdAt", nomor: "nomorSurat", nama: "pembuat.nama" },
  listFields: "nomorSurat tanggalSurat tindakan keputusan status pembuat.nama pasien.nama hubungan createdAt",
};
