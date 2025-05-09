import { connectDB } from "@/lib/database";
import { Kb } from "@/models/kb";
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

    const data = await Kb.find(query)
      .sort({ [sortField]: 1 })
      .skip(skip)
      .limit(limit);

    const totalData = await Kb.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(totalData / limit));

    return Response.json({
      message: "Data pasien berhasil diambil",
      data,
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
    const created = await Kb.create(body);
    return successResponse("Data KB berhasil ditambahkan", created, 201);
  } catch (error) {
    return errorResponse("Gagal menambahkan data KB", 400, error.message);
  }
}
