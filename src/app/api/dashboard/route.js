import { connectDB } from "@/lib/database";
import { Patient } from "@/models/patient";
import { Kb } from "@/models/kb";
import { Kehamilan } from "@/models/kehamilan";
import { Persalinan } from "@/models/persalinan";
import { successResponse, errorResponse } from "@/lib/response";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

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
        "visits.jadwalBerikutnya": { $exists: true, $lt: today },
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
    console.error(error);
    return errorResponse("Gagal mengambil statistik dashboard", 500);
  }
}
