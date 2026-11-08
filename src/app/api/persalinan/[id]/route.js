import { connectDB } from "@/lib/database";
import { Persalinan, FIELD_DATA_PERSALINAN } from "@/models/persalinan";
import { successResponse, errorResponse, serverError } from "@/lib/response";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function calcHariPascaSalin(tanggalPersalinan, visitDate) {
  return Math.floor((new Date(visitDate) - new Date(tanggalPersalinan)) / MS_PER_DAY);
}

function getKFNumber(hari) {
  if (hari >= 0 && hari <= 2) return 1;
  if (hari >= 3 && hari <= 7) return 2;
  if (hari >= 8 && hari <= 28) return 3;
  if (hari >= 29 && hari <= 42) return 4;
  return null;
}

export async function GET(req, context) {
  const params = await context.params;
  try {
    await connectDB();
    const doc = await Persalinan.findById(params.id);
    if (!doc) return errorResponse("Data persalinan tidak ditemukan", 404);
    return successResponse("Berhasil mengambil data persalinan", doc);
  } catch (error) {
    return serverError(error, "Gagal mengambil data persalinan");
  }
}

export async function PATCH(req, context) {
  const params = await context.params;
  try {
    await connectDB();
    const body = await req.json();
    const doc = await Persalinan.findById(params.id);
    if (!doc) return errorResponse("Data persalinan tidak ditemukan", 404);

    const { action } = body;

    if (action === "addVisit") {
      if (!doc.tanggalPersalinan) {
        return errorResponse("Lengkapi tanggal persalinan terlebih dahulu sebelum menambah kunjungan nifas", 400);
      }

      const visit = body.visit || {};
      if (!visit.date) return errorResponse("Tanggal kunjungan wajib diisi", 400);

      const hari = calcHariPascaSalin(doc.tanggalPersalinan, visit.date);
      visit.hariPascaSalin = hari;
      visit.nomorKF = getKFNumber(hari);

      doc.visits.push(visit);
    } else if (action === "editVisit") {
      if (!doc.tanggalPersalinan) {
        return errorResponse("Lengkapi tanggal persalinan terlebih dahulu", 400);
      }

      const visitId = body.visitId;
      const idx = doc.visits.findIndex((v) => String(v._id) === String(visitId));
      if (idx === -1) return errorResponse("Kunjungan tidak ditemukan", 404);

      const visit = body.visit || {};
      if (visit.date) {
        const hari = calcHariPascaSalin(doc.tanggalPersalinan, visit.date);
        visit.hariPascaSalin = hari;
        visit.nomorKF = getKFNumber(hari);
      }

      doc.visits[idx] = { ...doc.visits[idx].toObject(), ...visit };
    } else if (action === "deleteVisit") {
      const visitId = body.visitId;
      doc.visits = doc.visits.filter((v) => String(v._id) !== String(visitId));
    } else if (action === "updateStatus") {
      const allowed = ["terdaftar", "aktif", "selesai", "rujuk", "meninggal"];
      if (!allowed.includes(body.status)) {
        return errorResponse("Status tidak valid", 400);
      }
      doc.status = body.status;
    } else if (action === "updateData") {
      const d = body.data || {};
      const fields = FIELD_DATA_PERSALINAN;

      const oldTanggal = doc.tanggalPersalinan ? new Date(doc.tanggalPersalinan).getTime() : null;

      for (const f of fields) {
        if (d[f] !== undefined) doc[f] = d[f];
      }

      const newTanggal = doc.tanggalPersalinan ? new Date(doc.tanggalPersalinan).getTime() : null;

      // Auto-update status berdasarkan tanggalPersalinan
      if (!oldTanggal && newTanggal && doc.status === "terdaftar") {
        doc.status = "aktif";
      } else if (oldTanggal && !newTanggal && doc.status === "aktif") {
        doc.status = "terdaftar";
      }

      // Recalculate hariPascaSalin & nomorKF jika tanggalPersalinan berubah
      if (newTanggal && newTanggal !== oldTanggal && doc.visits.length > 0) {
        doc.visits.forEach((v, i) => {
          const hari = calcHariPascaSalin(doc.tanggalPersalinan, v.date);
          doc.visits[i].hariPascaSalin = hari;
          doc.visits[i].nomorKF = getKFNumber(hari);
        });
      }
    } else if (action === "updateBayi") {
      const b = body.bayi || {};
      doc.bayi = { ...((doc.bayi || {}).toObject ? doc.bayi.toObject() : doc.bayi), ...b };
    } else {
      return errorResponse("Aksi tidak dikenali", 400);
    }

    await doc.save();
    return successResponse("Data persalinan berhasil diperbarui", doc);
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse("Data persalinan dengan NIK yang sama sudah terdaftar", 409);
    }
    return serverError(error, "Gagal memperbarui data persalinan");
  }
}

export async function DELETE(req, context) {
  const params = await context.params;
  try {
    await connectDB();
    const deleted = await Persalinan.findByIdAndDelete(params.id);
    if (!deleted) return errorResponse("Data persalinan tidak ditemukan", 404);
    return successResponse("Berhasil menghapus data persalinan", deleted);
  } catch (error) {
    return serverError(error, "Gagal menghapus data persalinan");
  }
}
