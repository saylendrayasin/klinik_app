import { connectDB } from "@/lib/database";
import { Kehamilan } from "@/models/kehamilan";
import { successResponse, paginatedResponse, errorResponse, serverError } from "@/lib/response";
import { escapeRegex, parsePagination, pilihField } from "@/lib/query";
import { MS_PER_DAY, jadwalTerlewatQuery } from "@/lib/kehamilan";

const ALLOWED_SORT = ["name", "hpl", "createdAt"];

function calcHPL(hpht) {
  return new Date(new Date(hpht).getTime() + 280 * MS_PER_DAY);
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    // Exact NIK lookup untuk pre-fill form (ambil record paling baru)
    const nikExact = searchParams.get("nikExact");
    if (nikExact) {
      const recent = await Kehamilan.findOne({ nik: nikExact })
        .sort({ createdAt: -1 })
        .lean();
      return successResponse("Pencarian NIK selesai", recent || null);
    }

    const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 5 });
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const nik = searchParams.get("nik") || "";
    const rawSort = searchParams.get("sort");
    const sortField = ALLOWED_SORT.includes(rawSort) ? rawSort : "name";

    const filter = searchParams.get("filter") || ""; // hplDekat | overdue | jadwalTerlewat

    const today = new Date();
    const twoWeeksLater = new Date(today.getTime() + 14 * MS_PER_DAY);

    const query = {};

    if (search) {
      const escaped = escapeRegex(search);
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
      Object.assign(query, jadwalTerlewatQuery(today));
    } else {
      if (status && ["aktif", "selesai", "keguguran", "rujuk"].includes(status)) {
        query.status = status;
      }
    }

    if (nik) {
      query.nik = nik;
    }

    const sortOrder = sortField === "createdAt" ? -1 : 1;
    const [data, totalData] = await Promise.all([
      Kehamilan.find(query)
        .select("name nik dateOfBirth gravida para abortus hpht hpl status visits.date visits.jadwalBerikutnya")
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Kehamilan.countDocuments(query),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalData / limit));

    return paginatedResponse("Data kehamilan berhasil diambil", data, page, totalPages);
  } catch (error) {
    return serverError(error, "Gagal mengambil data kehamilan");
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const force = body?.force === true;
    // hpl dihitung di bawah; usiaKehamilan/trimester per kunjungan lewat PATCH addVisit.
    const data = pilihField(body, [
      "name", "nik", "dateOfBirth", "address", "phone", "bloodType",
      "gravida", "para", "abortus", "hpht", "status",
    ]);

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
    if (error.code === 11000) {
      return errorResponse("Data kehamilan dengan NIK dan HPHT yang sama sudah terdaftar", 409);
    }

    return serverError(error, "Gagal menambahkan data kehamilan");
  }
}
