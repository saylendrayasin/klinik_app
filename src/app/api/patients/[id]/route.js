import { connectDB } from "@/lib/database";
import { Patient } from "@/models/patient";
import { successResponse, errorResponse, serverError } from "@/lib/response";

export async function GET(req, context) {
  const params = await context.params;
  try {
    await connectDB();
    const patient = await Patient.findById(params.id);
    if (!patient) return errorResponse("Pasien tidak ditemukan", 404);

    return successResponse("Berhasil mengambil data pasien", patient);
  } catch (error) {
    return serverError(error, "Gagal mengambil data pasien");
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

    patient.name = patient.name.trim();

    const allVisitDiagnosis = patient.visits
      .flatMap((visit) => visit.visitDiagnosis || [])
      .filter((diag) => typeof diag === "string" && diag.trim() !== "");

    const uniqueDiagnosis = Array.from(new Set(allVisitDiagnosis));
    patient.diagnosis = uniqueDiagnosis;

    const allVisitDiagnosisIds = patient.visits
      .flatMap((visit) => visit.visitDiagnosisIds || [])
      .filter(Boolean)
      .map((x) => String(x));

    const uniqueIds = Array.from(new Set(allVisitDiagnosisIds));
    patient.diagnosisIds = uniqueIds;

    await patient.save();

    return successResponse("Data pasien berhasil diperbarui", patient);
  } catch (error) {
    return serverError(error, "Gagal memperbarui data pasien");
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
    return serverError(error, "Gagal menghapus pasien");
  }
}
