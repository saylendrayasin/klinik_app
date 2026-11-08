import { connectDB } from "@/lib/database";
import { Kehamilan } from "@/models/kehamilan";
import { successResponse, errorResponse, serverError } from "@/lib/response";
import { jadwalTerlewatQuery } from "@/lib/kehamilan";

export async function GET() {
  try {
    await connectDB();

    const today = new Date();
    const twoWeeksLater = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

    const [total, aktif, overdue, hplDekat, jadwalTerlewatResult] =
      await Promise.all([
        Kehamilan.countDocuments(),
        Kehamilan.countDocuments({ status: "aktif" }),
        Kehamilan.countDocuments({ status: "aktif", hpl: { $lt: today } }),
        Kehamilan.countDocuments({
          status: "aktif",
          hpl: { $gte: today, $lte: twoWeeksLater },
        }),
        Kehamilan.countDocuments({
          status: "aktif",
          ...jadwalTerlewatQuery(today),
        }),
      ]);

    return successResponse("Ringkasan kehamilan berhasil diambil", {
      total,
      aktif,
      overdue,
      hplDekat,
      jadwalTerlewat: jadwalTerlewatResult,
    });
  } catch (error) {
    return serverError(error, "Gagal mengambil ringkasan kehamilan");
  }
}
