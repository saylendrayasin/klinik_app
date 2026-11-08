import { connectDB } from "@/lib/database";
import { Config } from "@/models/config";
import { successResponse, paginatedResponse, errorResponse, serverError } from "@/lib/response";
import { escapeRegex, parsePagination } from "@/lib/query";

const ALLOWED_SORT_CONFIG = ["label", "code", "type", "createdAt"];

function slugifyLabel(label) {
  return String(label || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/\-+/g, "-")
    .replace(/^\-|\-$/g, "");
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const type = searchParams.get("type") || "";
    if (!type.trim()) {
      return errorResponse(
        "Query param 'type' wajib. Contoh: /api/config?type=diagnosis",
        400
      );
    }

    const { page, limit, skip } = parsePagination(searchParams, {
      defaultLimit: 10,
      maxLimit: 500,
    });
    const search = searchParams.get("search") || "";
    const rawSort = searchParams.get("sort");
    const sortField = ALLOWED_SORT_CONFIG.includes(rawSort) ? rawSort : "label";
    const includeInactive = (searchParams.get("includeInactive") || "") === "1";

    const query = { type: type.trim() };

    if (!includeInactive) query.isActive = true;

    if (search) {
      const escaped = escapeRegex(search);
      query.$or = [
        { label: { $regex: escaped, $options: "i" } },
        { code: { $regex: escaped, $options: "i" } },
      ];
    }

    const [items, totalItems] = await Promise.all([
      Config.find(query)
        .sort({ [sortField]: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Config.countDocuments(query),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return paginatedResponse("Data konfigurasi berhasil diambil", items, page, totalPages);
  } catch (error) {
    return serverError(error, "Gagal mengambil data konfigurasi");
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const type = String(body.type || "").trim();
    const label = String(body.label || "").trim();

    if (!type || !label) {
      return errorResponse("Tipe dan label wajib diisi", 400);
    }

    const code = slugifyLabel(label);
    if (!code) {
      return errorResponse("Label harus mengandung huruf atau angka", 400);
    }

    const exists = await Config.findOne({ type, code }).select("_id").lean();
    if (exists) {
      return errorResponse(
        `Config sudah ada: label menghasilkan code '${code}'. Silakan ganti label.`,
        409
      );
    }

    const newItem = await Config.create({
      type,
      code,
      label,
      isActive: body.isActive ?? true,
    });

    return successResponse("Konfigurasi berhasil ditambahkan", newItem, 201);
  } catch (error) {
    if (String(error?.code) === "11000") {
      return errorResponse("Konfigurasi dengan label yang sama sudah ada", 409);
    }
    return serverError(error, "Gagal menambahkan konfigurasi");
  }
}
