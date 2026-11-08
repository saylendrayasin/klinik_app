import { connectDB } from "@/lib/database";
import { Consent } from "@/models/consent";
import { successResponse, serverError } from "@/lib/response";

/**
 * Daftar tindakan yang pernah dipakai — untuk saran ketik (<datalist>).
 * Ini murni bantuan mengetik; nilainya tetap teks bebas, bukan referensi.
 */
export async function GET() {
  try {
    await connectDB();

    const list = await Consent.distinct("tindakan");
    const bersih = list
      .filter((t) => typeof t === "string" && t.trim() !== "")
      .sort((a, b) => a.localeCompare(b, "id"))
      .slice(0, 200);

    return successResponse("Daftar tindakan berhasil diambil", bersih);
  } catch (error) {
    return serverError(error, "Gagal mengambil daftar tindakan");
  }
}
