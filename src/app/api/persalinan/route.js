import { connectDB } from "@/lib/database";
import { Persalinan, FIELD_DATA_PERSALINAN } from "@/models/persalinan";
import { successResponse, paginatedResponse, errorResponse, serverError } from "@/lib/response";
import { escapeRegex, parsePagination, pilihField } from "@/lib/query";

const ALLOWED_SORT = ["name", "tanggalPersalinan", "createdAt"];

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const KF_WINDOWS = [
  { windowStart: 0, windowEnd: 2 },
  { windowStart: 3, windowEnd: 7 },
  { windowStart: 8, windowEnd: 28 },
  { windowStart: 29, windowEnd: 42 },
];

function calcKfTerlewat(doc, today) {
  if (!doc.tanggalPersalinan || doc.status !== "aktif") return false;
  const tanggal = new Date(doc.tanggalPersalinan);
  const hari = Math.floor((today - tanggal) / MS_PER_DAY);
  if (hari < 0) return false;
  return KF_WINDOWS.some((s) => {
    if (hari <= s.windowEnd) return false;
    return !(doc.visits || []).some((v) => {
      const vh = Math.floor((new Date(v.date) - tanggal) / MS_PER_DAY);
      return vh >= s.windowStart && vh <= s.windowEnd;
    });
  });
}

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
      return successResponse("Pencarian NIK selesai", recent || null);
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

    const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 10 });
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const filter = searchParams.get("filter") || "";
    const bulan = searchParams.get("bulan") || "";
    const tahun = searchParams.get("tahun") || "";
    const belumPersalinan = searchParams.get("belumPersalinan") === "true";
    const rawSort = searchParams.get("sort");
    const sortField = ALLOWED_SORT.includes(rawSort) ? rawSort : "createdAt";

    const query = {};

    if (search) {
      const escaped = escapeRegex(search);
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
    const [rawData, totalData] = await Promise.all([
      Persalinan.find(query)
        .select("name nik dateOfBirth gravida para abortus tanggalPersalinan status komplikasiIbu bayi visits.date")
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Persalinan.countDocuments(query),
    ]);

    const today = new Date();
    const data = rawData.map(({ visits, ...rest }) => ({
      ...rest,
      kfTerlewat: calcKfTerlewat({ ...rest, visits }, today),
    }));

    const totalPages = Math.max(1, Math.ceil(totalData / limit));

    return paginatedResponse("Data persalinan berhasil diambil", data, page, totalPages);
  } catch (error) {
    return serverError(error, "Gagal mengambil data persalinan");
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const data = pilihField(await req.json(), FIELD_DATA_PERSALINAN);

    // Samakan dengan PATCH updateData: begitu tanggal persalinan terisi,
    // record bukan lagi sekadar "terdaftar".
    if (data.tanggalPersalinan) data.status = "aktif";

    const created = await Persalinan.create(data);
    return successResponse("Data persalinan berhasil ditambahkan", created, 201);
  } catch (error) {
    return serverError(error, "Gagal menambahkan data persalinan");
  }
}
