import { connectDB } from "@/lib/database";
import { Persalinan } from "@/models/persalinan";
import { successResponse, paginatedResponse, errorResponse } from "@/lib/response";

const ALLOWED_SORT = ["name", "tanggalPersalinan", "createdAt"];

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    // Exact NIK lookup untuk pre-fill form (ambil record paling baru)
    const nikExact = searchParams.get("nikExact");
    if (nikExact) {
      const recent = await Persalinan.findOne({ nik: nikExact })
        .sort({ createdAt: -1 })
        .lean();
      return successResponse("Lookup NIK selesai", recent || null);
    }

    // NIK list filter untuk riwayat persalinan di detail page
    const nikFilter = searchParams.get("nik");
    if (nikFilter) {
      const records = await Persalinan.find({ nik: nikFilter })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
      return successResponse("Riwayat persalinan berhasil diambil", records);
    }

    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const filter = searchParams.get("filter") || "";
    const bulan = searchParams.get("bulan") || "";
    const tahun = searchParams.get("tahun") || "";
    const belumPersalinan = searchParams.get("belumPersalinan") === "true";
    const rawSort = searchParams.get("sort");
    const sortField = ALLOWED_SORT.includes(rawSort) ? rawSort : "createdAt";
    const skip = (page - 1) * limit;

    const query = {};

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { nik: { $regex: escaped, $options: "i" } },
      ];
    }

    if (filter === "perluPerhatian") {
      query.$or = [
        { komplikasiIbu: { $exists: true, $ne: "" } },
        { "bayi.komplikasiBayi": { $exists: true, $ne: "" } },
        { "bayi.beratLahir": { $lt: 2500 } },
        { "bayi.nilaiApgar5": { $lt: 7 } },
      ];
      query.tanggalPersalinan = { $ne: null };
    } else if (filter === "belumPersalinan") {
      query.tanggalPersalinan = null;
    } else {
      if (status && ["terdaftar", "aktif", "selesai", "rujuk", "meninggal"].includes(status)) {
        query.status = status;
      }
      if (belumPersalinan) {
        query.tanggalPersalinan = null;
      } else if (bulan && tahun) {
        const b = parseInt(bulan);
        const t = parseInt(tahun);
        if (!isNaN(b) && !isNaN(t)) {
          const from = new Date(t, b - 1, 1);
          const to = new Date(t, b, 0, 23, 59, 59);
          query.tanggalPersalinan = { $gte: from, $lte: to };
        }
      } else if (tahun) {
        const t = parseInt(tahun);
        if (!isNaN(t)) {
          query.tanggalPersalinan = {
            $gte: new Date(t, 0, 1),
            $lte: new Date(t, 11, 31, 23, 59, 59),
          };
        }
      }
    }

    const sortOrder = sortField === "name" ? 1 : -1;
    const data = await Persalinan.find(query)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalData = await Persalinan.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(totalData / limit));

    return paginatedResponse("Data persalinan berhasil diambil", data, page, totalPages);
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal mengambil data persalinan", 500);
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const created = await Persalinan.create(body);
    return successResponse("Data persalinan berhasil ditambahkan", created, 201);
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal menambahkan data persalinan", 400, error.message);
  }
}
