import { connectDB } from "@/lib/database";
import { Patient } from "@/models/patient";
import { successResponse, paginatedResponse, errorResponse, serverError } from "@/lib/response";
import { escapeRegex, parsePagination, pilihField } from "@/lib/query";

const ALLOWED_SORT_PATIENT = ["name", "gender", "dateOfBirth", "createdAt"];

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 5 });
    const search = searchParams.get("search") || "";
    const rawSort = searchParams.get("sort");
    const sortField = ALLOWED_SORT_PATIENT.includes(rawSort) ? rawSort : "name";

    const query = search
      ? { name: { $regex: escapeRegex(search), $options: "i" } }
      : {};

    // Halaman list hanya butuh 4 kolom — jangan tarik seluruh array visits[].
    const [patients, totalPatients] = await Promise.all([
      Patient.find(query)
        .select("name dateOfBirth gender")
        .sort({ [sortField]: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Patient.countDocuments(query),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalPatients / limit));

    return paginatedResponse("Data pasien berhasil diambil", patients, page, totalPages);
  } catch (error) {
    return serverError(error, "Gagal mengambil data pasien");
  }
}

export async function POST(req) {
  try {
    await connectDB();
    // diagnosis/diagnosisIds diturunkan dari kunjungan; kunjungan ditambah lewat PATCH.
    const data = pilihField(await req.json(), ["name", "dateOfBirth", "address", "gender"]);
    const newPatient = await Patient.create(data);
    return successResponse("Pasien berhasil ditambahkan", newPatient, 201);
  } catch (error) {
    return serverError(error, "Gagal menambahkan pasien");
  }
}
