import mongoose from "mongoose";

export const JABATAN = ["Dokter", "Bidan", "Perawat"];

/**
 * Master petugas yang menandatangani surat (pelaksana consent, saksi klinik,
 * pemeriksa surat sakit). `ttdId` menunjuk versi tanda tangan terbaru di
 * koleksi Gambar; surat menyalin id versi itu saat terbit.
 *
 * Petugas yang sudah dipakai surat terbit tidak boleh dihapus — hanya
 * dinonaktifkan — supaya riwayat siapa yang menandatangani tetap utuh.
 */
const penandatanganSchema = new mongoose.Schema(
  {
    nama: { type: String, required: true, trim: true },
    jabatan: { type: String, enum: JABATAN, required: true },
    nip: { type: String, trim: true, default: "" },
    ttdId: { type: mongoose.Schema.Types.ObjectId, ref: "Gambar", default: null },
    aktif: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Penandatangan =
  mongoose.models.Penandatangan || mongoose.model("Penandatangan", penandatanganSchema);
