import mongoose from "mongoose";

/**
 * Potongan skema yang sama untuk semua jenis surat (consent, surat sakit).
 */

const { ObjectId } = mongoose.Schema.Types;

/**
 * Petugas dari master Penanda Tangan, disalin ke surat. Saat draf hanya
 * `penandatanganId` yang berarti; saat terbit nama/jabatan/NIP/ttdId disalin
 * supaya surat lama tidak berubah kalau master diedit. `ttdId` null = kolom
 * tanda tangan basah (tanpa cap).
 */
export const petugasFields = {
  penandatanganId: { type: ObjectId, ref: "Penandatangan", default: null },
  nama: { type: String, trim: true, default: "" },
  jabatan: { type: String, default: "" },
  nip: { type: String, default: "" },
  ttdId: { type: ObjectId, ref: "Gambar", default: null },
};

/** Bagian surat yang hanya terisi saat terbit. */
export const terbitFields = {
  status: { type: String, enum: ["draft", "issued"], default: "draft", index: true },
  // Tanpa default: indeks unik parsial di bawah hanya berlaku untuk string.
  nomorSurat: { type: String },
  nomorUrut: { type: Number },
  bulan: { type: Number },
  tahun: { type: Number },
  kop: {
    baris1: String,
    baris2: String,
    alamat: String,
    telepon: String,
    kota: String,
  },
  logoId: { type: ObjectId, ref: "Gambar", default: null },
  capId: { type: ObjectId, ref: "Gambar", default: null },
  terbitAt: { type: Date, default: null },
  dibatalkanAt: { type: Date, default: null },
};

export function pasangIndeksNomor(schema) {
  schema.index(
    { nomorSurat: 1 },
    { unique: true, partialFilterExpression: { nomorSurat: { $type: "string" } } }
  );
  schema.index({ tanggalSurat: -1 });
}
