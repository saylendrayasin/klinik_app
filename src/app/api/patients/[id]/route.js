import { connectDB } from "@/lib/database";
import { Patient } from "@/models/patient";
import { successResponse, errorResponse } from "@/lib/response";

export async function GET(req, context) {
  const params = await context.params;
  try {
    await connectDB();
    const patient = await Patient.findById(params.id);
    if (!patient) return errorResponse("Pasien tidak ditemukan", 404);

    return successResponse("Berhasil mengambil data pasien", patient);
  } catch (error) {
    return errorResponse("Gagal mengambil data pasien", 400, error.message);
  }
}

export async function PATCH(req, context) {
  const params = await context.params;
  try {
    await connectDB();
    const body = await req.json();

    const patient = await Patient.findById(params.id);
    if (!patient) return errorResponse("Pasien tidak ditemukan", 404);

    if (body.name !== undefined) patient.name = body.name;
    if (body.dateOfBirth !== undefined) patient.dateOfBirth = body.dateOfBirth;
    if (body.address !== undefined) patient.address = body.address;
    if (body.gender !== undefined) patient.gender = body.gender;
    if (body.visits !== undefined) patient.visits = body.visits;

    const allVisitDiagnosis = patient.visits
      .flatMap((visit) => visit.visitDiagnosis || [])
      .filter((diag) => typeof diag === "string" && diag.trim() !== "");

    const uniqueDiagnosis = Array.from(new Set(allVisitDiagnosis));
    patient.diagnosis = uniqueDiagnosis;

    await patient.save();

    return successResponse("Berhasil update pasien", patient);
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal update pasien", 400, error.message);
  }
}

export async function DELETE(req, context) {
  const params = await context.params;
  try {
    await connectDB();

    const deletedPatient = await Patient.findByIdAndDelete(params.id);
    if (!deletedPatient) {
      return errorResponse("Pasien tidak ditemukan", 404);
    }

    return successResponse("Berhasil menghapus pasien", deletedPatient);
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal menghapus pasien", 400, error.message);
  }
}
