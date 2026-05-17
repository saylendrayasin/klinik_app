import { connectDB } from "@/lib/database";
import { Patient } from "@/models/patient";
import { successResponse, paginatedResponse, errorResponse } from "@/lib/response";

const ALLOWED_SORT_PATIENT = ["name", "gender", "createdAt"];

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 5;
    const search = searchParams.get("search") || "";
    const rawSort = searchParams.get("sort");
    const sortField = ALLOWED_SORT_PATIENT.includes(rawSort) ? rawSort : "name";

    const skip = (page - 1) * limit;

    const query = search ? { name: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } } : {};

    const patients = await Patient.find(query)
      .sort({ [sortField]: 1 })
      .skip(skip)
      .limit(limit);

    const totalPatients = await Patient.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(totalPatients / limit));

    return paginatedResponse("Data pasien berhasil diambil", patients, page, totalPages);
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal mengambil data pasien", 500);
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const newPatient = await Patient.create(body);
    return successResponse("Patient created successfully", newPatient, 201);
  } catch (error) {
    return errorResponse("Failed to create patient", 400, error.message);
  }
}
