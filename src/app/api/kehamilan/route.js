import { connectDB } from "@/lib/database";
import { Kehamilan } from "@/models/kehamilan";
import { successResponse, paginatedResponse, errorResponse } from "@/lib/response";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ALLOWED_SORT = ["name", "hpl", "createdAt"];

function calcHPL(hpht) {
  return new Date(new Date(hpht).getTime() + 280 * MS_PER_DAY);
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 5;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const nik = searchParams.get("nik") || "";
    const rawSort = searchParams.get("sort");
    const sortField = ALLOWED_SORT.includes(rawSort) ? rawSort : "name";

    const filter = searchParams.get("filter") || ""; // hplDekat | overdue | jadwalTerlewat
    const skip = (page - 1) * limit;

    const today = new Date();
    const twoWeeksLater = new Date(today.getTime() + 14 * MS_PER_DAY);

    const query = {};

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { nik: { $regex: escaped, $options: "i" } },
      ];
    }

    if (filter === "hplDekat") {
      query.status = "aktif";
      query.hpl = { $gte: today, $lte: twoWeeksLater };
    } else if (filter === "overdue") {
      query.status = "aktif";
      query.hpl = { $lt: today };
    } else if (filter === "jadwalTerlewat") {
      query.status = "aktif";
      query["visits.jadwalBerikutnya"] = { $exists: true, $lt: today };
    } else {
      if (status && ["aktif", "selesai", "keguguran", "rujuk"].includes(status)) {
        query.status = status;
      }
    }

    if (nik) {
      query.nik = nik;
    }

    const sortOrder = sortField === "createdAt" ? -1 : 1;
    const data = await Kehamilan.find(query)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalData = await Kehamilan.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(totalData / limit));

    return paginatedResponse("Data kehamilan berhasil diambil", data, page, totalPages);
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal mengambil data kehamilan", 500);
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { force, ...data } = body;

    if (!data.hpht) {
      return errorResponse("HPHT wajib diisi", 400);
    }

    if (!force) {
      const existing = await Kehamilan.findOne({ nik: data.nik, status: "aktif" });
      if (existing) {
        return errorResponse(
          "Ibu ini masih memiliki kehamilan aktif. Tutup dulu sebelum mendaftarkan yang baru, atau kirim force: true untuk override.",
          409
        );
      }
    }

    data.hpl = calcHPL(data.hpht);

    const created = await Kehamilan.create(data);
    return successResponse("Data kehamilan berhasil ditambahkan", created, 201);
  } catch (error) {
    console.error(error);

    if (error.code === 11000) {
      return errorResponse(
        "Data kehamilan dengan NIK dan HPHT yang sama sudah terdaftar",
        409,
        error.message
      );
    }

    return errorResponse("Gagal menambahkan data kehamilan", 400, error.message);
  }
}
