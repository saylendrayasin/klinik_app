import { connectDB } from "@/lib/database";
import { Penandatangan } from "@/models/penandatangan";
import { terapkanPenandatangan } from "@/lib/surat";
import { successResponse, serverError } from "@/lib/response";

/** Daftar lengkap — jumlah petugas klinik kecil, jadi tanpa paginasi. */
export async function GET() {
  try {
    await connectDB();
    const data = await Penandatangan.find().sort({ aktif: -1, nama: 1 }).lean();
    return successResponse("Data penanda tangan berhasil diambil", data);
  } catch (error) {
    return serverError(error, "Gagal mengambil data penanda tangan");
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const doc = new Penandatangan();
    await terapkanPenandatangan(doc, await req.json());
    await doc.save();
    return successResponse("Penanda tangan berhasil ditambahkan", doc, 201);
  } catch (error) {
    return serverError(error, "Gagal menambah penanda tangan");
  }
}
