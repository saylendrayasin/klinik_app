import { connectDB } from "@/lib/database";
import { Patient } from "@/models/patient";
import { Kb } from "@/models/kb";
import { Kehamilan } from "@/models/kehamilan";
import { Persalinan } from "@/models/persalinan";
import { escapeRegex } from "@/lib/query";
import { successResponse, serverError } from "@/lib/response";

const MAKS = 8;
const SUMBER = [
  [Patient, "Pasien"],
  [Kb, "KB"],
  [Kehamilan, "Kehamilan"],
  [Persalinan, "Persalinan"],
];

/**
 * Pencarian ringan nama di semua modul untuk mengisi surat. Hanya bantuan
 * menyalin — surat tidak menyimpan rujukan ke data ini. Sengaja hanya memilih
 * identitas (tanpa visits[]) dan maksimal 8 per modul.
 */
export async function GET(req) {
  try {
    const q = (new URL(req.url).searchParams.get("q") || "").trim().slice(0, 60);
    if (q.length < 2) return successResponse("Ketik minimal 2 huruf", []);

    await connectDB();
    const filter = { name: { $regex: escapeRegex(q), $options: "i" } };
    const hasil = await Promise.all(
      SUMBER.map(([Model, sumber]) =>
        Model.find(filter)
          .select("name dateOfBirth address gender")
          .sort({ updatedAt: -1 })
          .limit(MAKS)
          .lean()
          .then((list) => list.map((d) => ({ ...d, sumber })))
      )
    );

    // Orang yang sama bisa tercatat di beberapa modul: tampilkan sekali.
    const terlihat = new Set();
    const data = [];
    for (const d of hasil.flat()) {
      const kunci = `${d.name.trim().toLowerCase()}|${d.dateOfBirth ? new Date(d.dateOfBirth).toISOString().slice(0, 10) : ""}`;
      if (terlihat.has(kunci)) continue;
      terlihat.add(kunci);
      data.push({
        nama: d.name,
        tanggalLahir: d.dateOfBirth || null,
        alamat: d.address || "",
        // KB, kehamilan, dan persalinan hanya mencatat perempuan.
        jenisKelamin: d.gender === "Male" ? "L" : "P",
        sumber: d.sumber,
      });
      if (data.length === MAKS) break;
    }
    return successResponse("Hasil pencarian pasien", data);
  } catch (error) {
    return serverError(error, "Gagal mencari data pasien");
  }
}
