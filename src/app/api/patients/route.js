import { connectDB } from "@/lib/database";
import { Patient } from "@/models/patient";
import { successResponse, errorResponse } from "@/lib/response";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 5;
    const search = searchParams.get("search") || "";
    const sortField = searchParams.get("sort") || "name";

    const skip = (page - 1) * limit;

    const query = search ? { name: { $regex: search, $options: "i" } } : {};

    const patients = await Patient.find(query)
      .sort({ [sortField]: 1 })
      .skip(skip)
      .limit(limit);

    const totalPatients = await Patient.countDocuments(query);
    const totalPages = Math.ceil(totalPatients / limit);

    return Response.json({
      message: "Data pasien berhasil diambil",
      data: patients,
      page,
      totalPages,
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { message: "Gagal mengambil data pasien" },
      { status: 500 }
    );
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
