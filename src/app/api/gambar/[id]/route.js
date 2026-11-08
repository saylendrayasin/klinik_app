import mongoose from "mongoose";
import { connectDB } from "@/lib/database";
import { Gambar } from "@/models/gambar";
import { bacaDataUrl } from "@/lib/surat";
import { errorResponse, serverError } from "@/lib/response";

/**
 * Gambar master (TTD, cap, logo) untuk pratinjau di dashboard. Hanya untuk
 * pengguna yang login (dijaga proxy) dan tidak boleh tersimpan di cache mana
 * pun — tanda tangan dan cap klinik bukan aset publik.
 */
export async function GET(req, context) {
  try {
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) return errorResponse("Gambar tidak ditemukan", 404);
    await connectDB();
    const g = await Gambar.findById(id).select("dataUrl").lean();
    const isi = g && bacaDataUrl(g.dataUrl, Infinity);
    if (!isi) return errorResponse("Gambar tidak ditemukan", 404);
    return new Response(isi.buffer, {
      headers: {
        "Content-Type": isi.mime,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return serverError(error, "Gagal mengambil gambar");
  }
}
