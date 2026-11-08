import { connectDB } from "@/lib/database";
import { Persalinan } from "@/models/persalinan";
import { successResponse, errorResponse, serverError } from "@/lib/response";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const KF_SCHEDULE = [
  { kf: 1, windowStart: 0, windowEnd: 2 },
  { kf: 2, windowStart: 3, windowEnd: 7 },
  { kf: 3, windowStart: 8, windowEnd: 28 },
  { kf: 4, windowStart: 29, windowEnd: 42 },
];

export async function GET() {
  try {
    await connectDB();

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const [totalBulanIni, aktif, belumPersalinan, perluPerhatian, aktifDocs] = await Promise.all([
      Persalinan.countDocuments({
        tanggalPersalinan: { $gte: startOfMonth, $lte: endOfMonth },
      }),
      Persalinan.countDocuments({ status: "aktif", tanggalPersalinan: { $ne: null } }),
      Persalinan.countDocuments({ tanggalPersalinan: null }),
      Persalinan.countDocuments({
        tanggalPersalinan: { $ne: null },
        $or: [
          { komplikasiIbu: { $exists: true, $ne: "" } },
          { "bayi.komplikasiBayi": { $exists: true, $ne: "" } },
          { "bayi.beratLahir": { $lt: 2500 } },
          { "bayi.nilaiApgar5": { $lt: 7 } },
        ],
      }),
      Persalinan.find({ status: "aktif", tanggalPersalinan: { $ne: null } })
        .select("tanggalPersalinan visits")
        .lean(),
    ]);

    let kunjunganTerlewat = 0;
    for (const doc of aktifDocs) {
      if (!doc.tanggalPersalinan) continue;
      const hariToday = Math.floor((today - new Date(doc.tanggalPersalinan)) / MS_PER_DAY);
      if (hariToday < 0) continue;

      const missed = KF_SCHEDULE.some((s) => {
        if (hariToday <= s.windowEnd) return false;
        const hasVisit = (doc.visits || []).some((v) => {
          const vh = Math.floor((new Date(v.date) - new Date(doc.tanggalPersalinan)) / MS_PER_DAY);
          return vh >= s.windowStart && vh <= s.windowEnd;
        });
        return !hasVisit;
      });

      if (missed) kunjunganTerlewat++;
    }

    return successResponse("Ringkasan persalinan berhasil diambil", {
      totalBulanIni,
      aktif,
      belumPersalinan,
      kunjunganTerlewat,
      perluPerhatian,
    });
  } catch (error) {
    return serverError(error, "Gagal mengambil ringkasan persalinan");
  }
}
