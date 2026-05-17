import { connectDB } from "@/lib/database";
import { Kehamilan } from "@/models/kehamilan";
import { successResponse, errorResponse } from "@/lib/response";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function calcHPL(hpht) {
  return new Date(new Date(hpht).getTime() + 280 * MS_PER_DAY);
}

function calcUK(hpht, visitDate) {
  return Math.floor((new Date(visitDate) - new Date(hpht)) / (7 * MS_PER_DAY));
}

function calcTrimester(uk) {
  if (uk <= 12) return 1;
  if (uk <= 27) return 2;
  return 3;
}

export async function GET(req, context) {
  const params = await context.params;
  try {
    await connectDB();
    const doc = await Kehamilan.findById(params.id);
    if (!doc) return errorResponse("Data kehamilan tidak ditemukan", 404);
    return successResponse("Berhasil mengambil data kehamilan", doc);
  } catch (error) {
    return errorResponse("Gagal mengambil data kehamilan", 400, error.message);
  }
}

export async function PATCH(req, context) {
  const params = await context.params;
  try {
    await connectDB();
    const body = await req.json();
    const doc = await Kehamilan.findById(params.id);
    if (!doc) return errorResponse("Data kehamilan tidak ditemukan", 404);

    const { action } = body;

    if (action === "addVisit") {
      const visit = body.visit || {};
      if (!visit.date) return errorResponse("Tanggal kunjungan wajib diisi", 400);

      const uk = calcUK(doc.hpht, visit.date);
      visit.usiaKehamilan = uk;
      visit.trimester = calcTrimester(uk);

      doc.visits.push(visit);
    } else if (action === "editVisit") {
      const visitId = body.visitId;
      const idx = doc.visits.findIndex((v) => String(v._id) === String(visitId));
      if (idx === -1) return errorResponse("Kunjungan tidak ditemukan", 404);

      const visit = body.visit || {};
      if (visit.date) {
        const uk = calcUK(doc.hpht, visit.date);
        visit.usiaKehamilan = uk;
        visit.trimester = calcTrimester(uk);
      }

      doc.visits[idx] = { ...doc.visits[idx].toObject(), ...visit };
    } else if (action === "deleteVisit") {
      const visitId = body.visitId;
      doc.visits = doc.visits.filter((v) => String(v._id) !== String(visitId));
    } else if (action === "updateStatus") {
      const allowed = ["aktif", "selesai", "keguguran", "rujuk"];
      if (!allowed.includes(body.status)) {
        return errorResponse("Status tidak valid", 400);
      }
      doc.status = body.status;
    } else if (action === "updateData") {
      const d = body.data || {};
      if (d.name !== undefined) doc.name = d.name;
      if (d.nik !== undefined) doc.nik = d.nik;
      if (d.dateOfBirth !== undefined) doc.dateOfBirth = d.dateOfBirth;
      if (d.address !== undefined) doc.address = d.address;
      if (d.phone !== undefined) doc.phone = d.phone;
      if (d.bloodType !== undefined) doc.bloodType = d.bloodType;
      if (d.gravida !== undefined) doc.gravida = d.gravida;
      if (d.para !== undefined) doc.para = d.para;
      if (d.abortus !== undefined) doc.abortus = d.abortus;
      if (d.hpht !== undefined) {
        doc.hpht = d.hpht;
        doc.hpl = calcHPL(d.hpht);
      }
    } else {
      return errorResponse("Action tidak valid", 400);
    }

    await doc.save();
    return successResponse("Berhasil update data kehamilan", doc);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return errorResponse(
        "Data kehamilan dengan NIK dan HPHT yang sama sudah terdaftar",
        409,
        error.message
      );
    }
    return errorResponse("Gagal update data kehamilan", 400, error.message);
  }
}

export async function DELETE(req, context) {
  const params = await context.params;
  try {
    await connectDB();
    const deleted = await Kehamilan.findByIdAndDelete(params.id);
    if (!deleted) return errorResponse("Data kehamilan tidak ditemukan", 404);
    return successResponse("Berhasil menghapus data kehamilan", deleted);
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal menghapus data kehamilan", 400, error.message);
  }
}
