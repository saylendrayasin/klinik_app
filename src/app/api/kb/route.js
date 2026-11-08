import { connectDB } from "@/lib/database";
import { Kb } from "@/models/kb";
import { successResponse, paginatedResponse, errorResponse, serverError } from "@/lib/response";
import { escapeRegex, parsePagination, pilihField } from "@/lib/query";

const ALLOWED_SORT_KB = ["name", "nik", "dateOfBirth", "createdAt"];

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 5 });
    const search = searchParams.get("search") || "";
    const rawSort = searchParams.get("sort");
    const sortField = ALLOWED_SORT_KB.includes(rawSort) ? rawSort : "name";

    const query = {};
    if (search) {
      const escaped = escapeRegex(search);
      query.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { nik: { $regex: escaped, $options: "i" } },
      ];
    }

    // Halaman list hanya butuh 5 kolom — jangan tarik seluruh array visits[].
    const [data, totalData] = await Promise.all([
      Kb.find(query)
        .select("name nik dateOfBirth numberOfChildren")
        .sort({ [sortField]: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Kb.countDocuments(query),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalData / limit));

    return paginatedResponse("Data KB berhasil diambil", data, page, totalPages);
  } catch (error) {
    return serverError(error, "Gagal mengambil data KB");
  }
}

export async function POST(req) {
  try {
    await connectDB();
    // metodes diturunkan dari kunjungan; kunjungan ditambah lewat PATCH.
    const data = pilihField(await req.json(), ["name", "nik", "dateOfBirth", "address", "numberOfChildren"]);
    const created = await Kb.create(data);
    return successResponse("Data KB berhasil ditambahkan", created, 201);
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return errorResponse(
        `${field} sudah terdaftar, silakan gunakan nilai lain`,
        409
      );
    }

    return serverError(error, "Gagal menambahkan data KB");
  }
}
