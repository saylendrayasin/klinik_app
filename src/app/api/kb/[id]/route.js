import { connectDB } from "@/lib/database";
import { Kb } from "@/models/kb";
import { successResponse, errorResponse } from "@/lib/response";

export async function GET(req, context) {
  const params = await context.params;

  try {
    await connectDB();
    const kb = await Kb.findById(params.id);
    if (!kb) return errorResponse("Data KB tidak ditemukan", 404);

    return successResponse("Berhasil mengambil data KB", kb);
  } catch (error) {
    return errorResponse("Gagal mengambil data KB", 400, error.message);
  }
}

export async function PATCH(req, context) {
  const params = await context.params;

  try {
    await connectDB();
    const body = await req.json();
    const kb = await Kb.findById(params.id);
    if (!kb) return errorResponse("Data KB tidak ditemukan", 404);

    if (body.name !== undefined) kb.name = body.name;
    if (body.dateOfBirth !== undefined) kb.dateOfBirth = body.dateOfBirth;
    if (body.address !== undefined) kb.address = body.address;
    if (body.gender !== undefined) kb.gender = body.gender;
    if (body.nik !== undefined) kb.nik = body.nik;
    if (body.numberOfChildren !== undefined)
      kb.numberOfChildren = body.numberOfChildren;
    if (body.visits !== undefined) kb.visits = body.visits;

    const allMethods = kb.visits
      .map((visit) => visit.metode)
      .filter((m) => typeof m === "string" && m.trim() !== "");

    kb.metodes = Array.from(new Set(allMethods));

    await kb.save();

    return successResponse("Berhasil update data KB", kb);
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal update data KB", 400, error.message);
  }
}

export async function DELETE(req, context) {
  const params = await context.params;

  try {
    await connectDB();
    const deletedKb = await Kb.findByIdAndDelete(params.id);
    if (!deletedKb) {
      return errorResponse("Data KB tidak ditemukan", 404);
    }

    return successResponse("Berhasil menghapus data KB", deletedKb);
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal menghapus data KB", 400, error.message);
  }
}
