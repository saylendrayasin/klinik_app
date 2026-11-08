import { connectDB } from "@/lib/database";
import { Patient } from "@/models/patient";
import { Kb } from "@/models/kb";
import { Kehamilan } from "@/models/kehamilan";
import { Persalinan } from "@/models/persalinan";
import { successResponse, errorResponse, serverError } from "@/lib/response";
import { MS_PER_DAY, jadwalTerlewatQuery } from "@/lib/kehamilan";

export async function GET() {
  try {
    await connectDB();

    const today = new Date();
    const twoWeeksLater = new Date(today.getTime() + 14 * MS_PER_DAY);

    const [
      totalPasien,
      totalKb,
      kehamilanAktif,
      persalinanAktif,
      hplDekat,
      hplOverdue,
      jadwalTerlewat,
    ] = await Promise.all([
      Patient.countDocuments({}),
      Kb.countDocuments({}),
      Kehamilan.countDocuments({ status: "aktif" }),
      Persalinan.countDocuments({ status: "aktif" }),
      Kehamilan.countDocuments({ status: "aktif", hpl: { $gte: today, $lte: twoWeeksLater } }),
      Kehamilan.countDocuments({ status: "aktif", hpl: { $lt: today } }),
      Kehamilan.countDocuments({
        status: "aktif",
        ...jadwalTerlewatQuery(today),
      }),
    ]);

    return successResponse("Statistik dashboard berhasil diambil", {
      pasien: totalPasien,
      kb: totalKb,
      kehamilanAktif,
      persalinanAktif,
      alerts: { hplDekat, hplOverdue, jadwalTerlewat },
    });
  } catch (error) {
    return serverError(error, "Gagal mengambil statistik dashboard");
  }
}
