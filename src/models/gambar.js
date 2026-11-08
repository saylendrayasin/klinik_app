import mongoose from "mongoose";

/**
 * Gambar master surat: tanda tangan petugas, cap klinik, logo kop.
 *
 * TIDAK PERNAH diubah atau dihapus. Mengganti tanda tangan/cap membuat
 * dokumen baru; surat yang sudah terbit menyimpan _id versi yang dipakainya,
 * jadi surat lama tetap tercetak persis seperti saat diterbitkan tanpa harus
 * menyalin gambar ke setiap surat (hemat ruang MongoDB).
 */
const gambarSchema = new mongoose.Schema(
  {
    jenis: { type: String, enum: ["ttd", "cap", "logo"], required: true },
    dataUrl: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Gambar = mongoose.models.Gambar || mongoose.model("Gambar", gambarSchema);

/** { idString: dataUrl } untuk sekumpulan id — satu query, id kosong diabaikan. */
export async function petaGambar(ids) {
  const unik = [...new Set(ids.filter(Boolean).map(String))];
  if (!unik.length) return {};
  const list = await Gambar.find({ _id: { $in: unik } }).select("dataUrl").lean();
  return Object.fromEntries(list.map((g) => [String(g._id), g.dataUrl]));
}
