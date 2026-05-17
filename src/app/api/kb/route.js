import { connectDB } from "@/lib/database";
import { Kb } from "@/models/kb";
import { successResponse, paginatedResponse, errorResponse } from "@/lib/response";

const ALLOWED_SORT_KB = ["name", "nik", "createdAt"];

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 5;
    const search = searchParams.get("search") || "";
    const rawSort = searchParams.get("sort");
    const sortField = ALLOWED_SORT_KB.includes(rawSort) ? rawSort : "name";

    const skip = (page - 1) * limit;

    const query = search ? { name: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } } : {};

    const data = await Kb.find(query)
      .sort({ [sortField]: 1 })
      .skip(skip)
      .limit(limit);

    const totalData = await Kb.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(totalData / limit));

    return paginatedResponse("Data KB berhasil diambil", data, page, totalPages);
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal mengambil data KB", 500);
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const created = await Kb.create(body);
    return successResponse("Data KB berhasil ditambahkan", created, 201);
  } catch (error) {
    console.error(error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return errorResponse(
        `${field} sudah terdaftar, silakan gunakan nilai lain`,
        409,
        error.message
      );
    }

    return errorResponse("Gagal menambahkan data KB", 400, error.message);
  }
}
