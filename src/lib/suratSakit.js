/**
 * Aturan isi & penerbitan surat keterangan sakit.
 * Handler route-nya generik (lib/surat.js); di sini hanya yang khas surat sakit.
 */

import { SuratSakit, FIELD_DATA_SAKIT } from "@/models/suratSakit";
import { ApiError } from "@/lib/response";
import { hitungLamaHari, idAtauNull, salinPetugas, tanggalWajib, teks, umur } from "@/lib/surat";

const MAKS_HARI = 366;

function terapkan(doc, d) {
  if (d.tanggalSurat !== undefined) doc.tanggalSurat = tanggalWajib(d.tanggalSurat, "Tanggal surat");
  if (d.nama !== undefined) doc.nama = teks(d.nama, 100);
  if (d.umur !== undefined) doc.umur = umur(d.umur);
  if (d.pekerjaan !== undefined) doc.pekerjaan = teks(d.pekerjaan, 100);
  if (d.alamat !== undefined) doc.alamat = teks(d.alamat, 300);
  if (d.mulai !== undefined) doc.mulai = tanggalWajib(d.mulai, "Tanggal mulai istirahat");
  if (d.selesai !== undefined) doc.selesai = tanggalWajib(d.selesai, "Tanggal selesai istirahat");
  if (d.pemeriksa) doc.pemeriksa = { penandatanganId: idAtauNull(d.pemeriksa.penandatanganId) };
  if (d.ttdBasah !== undefined) doc.ttdBasah = d.ttdBasah === true;

  if (!doc.nama) throw new ApiError("Nama wajib diisi", 400);
  if (!doc.mulai || !doc.selesai) throw new ApiError("Tanggal mulai dan selesai istirahat wajib diisi", 400);
  const lama = hitungLamaHari(doc.mulai, doc.selesai);
  if (lama < 1) throw new ApiError("Tanggal selesai tidak boleh sebelum tanggal mulai", 400);
  if (lama > MAKS_HARI) throw new ApiError(`Lama istirahat maksimal ${MAKS_HARI} hari`, 400);
  doc.lamaHari = lama;
}

async function terbitkan(doc) {
  const p = await salinPetugas(doc.pemeriksa?.penandatanganId, "Pemeriksa");
  // TTD basah: kolom dikosongkan, cap tidak dibubuhkan.
  if (doc.ttdBasah) p.ttdId = null;
  doc.pemeriksa = p;
  return !!p.ttdId;
}

export const KONFIG_SAKIT = {
  Model: SuratSakit,
  jenis: "sakit",
  label: "surat keterangan sakit",
  Label: "Surat keterangan sakit",
  fields: FIELD_DATA_SAKIT,
  terapkan,
  terbitkan,
  cari: ["nama", "pekerjaan"],
  sort: { tanggalSurat: "tanggalSurat", createdAt: "createdAt", nomor: "nomorSurat", nama: "nama" },
  listFields: "nomorSurat tanggalSurat nama umur mulai selesai lamaHari status createdAt",
};
