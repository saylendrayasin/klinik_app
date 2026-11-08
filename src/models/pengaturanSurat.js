import mongoose from "mongoose";
import { POLA_BAWAAN } from "@/lib/nomorSurat";

/**
 * Pengaturan surat — satu dokumen (_id "surat") untuk semua jenis surat:
 * kop klinik, logo & cap (id versi di koleksi Gambar), dan pola nomor
 * per jenis surat.
 */
const polaSchema = (polaDefault) =>
  new mongoose.Schema(
    {
      pola: { type: String, default: polaDefault },
      reset: { type: String, enum: ["tahunan", "bulanan", "tidak_pernah"], default: "tahunan" },
    },
    { _id: false }
  );

const pengaturanSuratSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "surat" },
    kop: {
      baris1: { type: String, default: "BIDAN PRAKTIK MANDIRI" },
      baris2: { type: String, default: "KLINIK IYA" },
      alamat: { type: String, default: "Jln. Kumersot Tendeki, Kota Bitung" },
      telepon: { type: String, default: "0822 9123 7607" },
      kota: { type: String, default: "Bitung" },
    },
    logoId: { type: mongoose.Schema.Types.ObjectId, ref: "Gambar", default: null },
    capId: { type: mongoose.Schema.Types.ObjectId, ref: "Gambar", default: null },
    penomoran: {
      consent: { type: polaSchema(POLA_BAWAAN.consent), default: () => ({}) },
      sakit: { type: polaSchema(POLA_BAWAAN.sakit), default: () => ({}) },
    },
  },
  { timestamps: true }
);

export const PengaturanSurat =
  mongoose.models.PengaturanSurat || mongoose.model("PengaturanSurat", pengaturanSuratSchema);

/** Ambil pengaturan; dibuat dengan nilai default kalau belum ada. */
export async function getPengaturanSurat() {
  return PengaturanSurat.findOneAndUpdate(
    { _id: "surat" },
    { $setOnInsert: { _id: "surat" } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}
