import mongoose from "mongoose";
import { connectDB } from "@/lib/database";
import { Penandatangan } from "@/models/penandatangan";
import { Consent } from "@/models/consent";
import { SuratSakit } from "@/models/suratSakit";
import { terapkanPenandatangan } from "@/lib/surat";
import { successResponse, errorResponse, serverError } from "@/lib/response";

const ambil = async (context) => {
  const { id } = await context.params;
  return mongoose.isValidObjectId(id) ? Penandatangan.findById(id) : null;
};

export async function PATCH(req, context) {
  try {
    await connectDB();
    const doc = await ambil(context);
    if (!doc) return errorResponse("Penanda tangan tidak ditemukan", 404);
    await terapkanPenandatangan(doc, await req.json());
    await doc.save();
    return successResponse("Penanda tangan berhasil diperbarui", doc);
  } catch (error) {
    return serverError(error, "Gagal memperbarui penanda tangan");
  }
}

/** Yang sudah menandatangani surat terbit hanya boleh dinonaktifkan, tidak dihapus. */
export async function DELETE(req, context) {
  try {
    await connectDB();
    const doc = await ambil(context);
    if (!doc) return errorResponse("Penanda tangan tidak ditemukan", 404);
    const [diConsent, diSakit] = await Promise.all([
      Consent.exists({
        status: "issued",
        $or: [{ "petugas.penandatanganId": doc._id }, { "saksiKlinik.penandatanganId": doc._id }],
      }),
      SuratSakit.exists({ status: "issued", "pemeriksa.penandatanganId": doc._id }),
    ]);
    if (diConsent || diSakit) {
      return errorResponse(`${doc.nama} sudah menandatangani surat terbit. Nonaktifkan saja agar riwayatnya tetap utuh.`, 409);
    }
    await doc.deleteOne();
    return successResponse("Penanda tangan berhasil dihapus", { _id: doc._id });
  } catch (error) {
    return serverError(error, "Gagal menghapus penanda tangan");
  }
}
