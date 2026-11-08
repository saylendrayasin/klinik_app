import mongoose from "mongoose";
import { petugasFields, terbitFields, pasangIndeksNomor } from "@/models/suratBersama";

export const HUBUNGAN = ["diri_sendiri", "anak", "istri", "suami", "ayah", "ibu"];

const orang = {
  nama: { type: String, trim: true, default: "" },
  umur: { type: Number, min: 0, max: 150, default: null },
  jenisKelamin: { type: String, enum: ["", "L", "P"], default: "" },
  alamat: { type: String, trim: true, default: "" },
};

// "gambar" = digores di layar, "basah" = kolom dikosongkan untuk ditandatangani di kertas.
const modeTtd = { type: String, enum: ["gambar", "basah"], default: "gambar" };

/**
 * Persetujuan / penolakan tindakan medik (informed consent).
 *
 * Sengaja berdiri sendiri: semua data orang diketik (atau disalin) ke surat,
 * tanpa relasi ke koleksi pasien — surat adalah potret fakta saat terbit.
 * Satu-satunya rujukan adalah master Penanda Tangan & Gambar, dan keduanya
 * disalin (nama/jabatan/NIP + id versi gambar) saat terbit.
 */
const consentSchema = new mongoose.Schema(
  {
    tanggalSurat: { type: Date, required: true },
    keputusan: { type: String, enum: ["setuju", "menolak"], default: "setuju" },
    tindakan: { type: String, trim: true, required: true },

    pembuat: orang,
    hubungan: { type: String, enum: HUBUNGAN, default: "diri_sendiri" },
    pasien: orang,

    petugas: petugasFields,

    ttdPembuat: { mode: modeTtd, dataUrl: { type: String, default: "" } },

    // Saksi klinik: dari master (penandatanganId terisi) atau diketik manual.
    saksiKlinik: {
      aktif: { type: Boolean, default: true },
      ...petugasFields,
      mode: modeTtd,
      dataUrl: { type: String, default: "" },
    },
    saksiKeluarga: {
      aktif: { type: Boolean, default: true },
      nama: { type: String, trim: true, default: "" },
      mode: modeTtd,
      dataUrl: { type: String, default: "" },
    },

    ...terbitFields,
  },
  { timestamps: true }
);

pasangIndeksNomor(consentSchema);

/** Field yang boleh dikirim client saat membuat / mengubah draf. */
export const FIELD_DATA_CONSENT = [
  "tanggalSurat", "keputusan", "tindakan", "pembuat", "hubungan", "pasien",
  "petugas", "ttdPembuat", "saksiKlinik", "saksiKeluarga",
];

export const Consent = mongoose.models.Consent || mongoose.model("Consent", consentSchema);
