import mongoose from "mongoose";
import { petugasFields, terbitFields, pasangIndeksNomor } from "@/models/suratBersama";

/**
 * Surat keterangan sakit. Berdiri sendiri seperti consent: data orang
 * diketik (atau disalin dari data pasien sebagai bantuan), tanpa relasi.
 * `lamaHari` dihitung server dari `mulai`–`selesai` (inklusif).
 */
const suratSakitSchema = new mongoose.Schema(
  {
    tanggalSurat: { type: Date, required: true },
    nama: { type: String, trim: true, required: true },
    umur: { type: Number, min: 0, max: 150, default: null },
    pekerjaan: { type: String, trim: true, default: "" },
    alamat: { type: String, trim: true, default: "" },
    mulai: { type: Date, required: true },
    selesai: { type: Date, required: true },
    lamaHari: { type: Number, default: 1 },

    pemeriksa: petugasFields,
    // Pemeriksa menandatangani di kertas: kolom dikosongkan dan tanpa cap.
    ttdBasah: { type: Boolean, default: false },

    ...terbitFields,
  },
  { timestamps: true }
);

pasangIndeksNomor(suratSakitSchema);

export const FIELD_DATA_SAKIT = [
  "tanggalSurat", "nama", "umur", "pekerjaan", "alamat", "mulai", "selesai",
  "pemeriksa", "ttdBasah",
];

export const SuratSakit =
  mongoose.models.SuratSakit || mongoose.model("SuratSakit", suratSakitSchema);
