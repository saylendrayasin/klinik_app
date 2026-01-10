import { connectDB } from "@/lib/database";
import { Config } from "@/models/config";
import { successResponse, errorResponse } from "@/lib/response";

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

    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const sortField = searchParams.get("sort") || "label";
    const includeInactive = (searchParams.get("includeInactive") || "") === "1";

    const skip = (page - 1) * limit;

    const query = { type: type.trim() };

    if (!includeInactive) query.isActive = true;

    if (search) {
      query.$or = [
        { label: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    const items = await Config.find(query)
      .sort({ [sortField]: 1 })
      .skip(skip)
      .limit(limit);

    const totalItems = await Config.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return Response.json({
      message: "Data config berhasil diambil",
      data: items,
      page,
      totalPages,
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { message: "Gagal mengambil data config" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const type = String(body.type || "").trim();
    const label = String(body.label || "").trim();

    if (!type || !label) {
      return errorResponse("type dan label wajib diisi", 400);
    }

    const code = slugifyLabel(label);
    if (!code) {
      return errorResponse("Label tidak valid setelah dinormalisasi", 400);
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

    return successResponse("Config created successfully", newItem, 201);
  } catch (error) {
    if (String(error?.code) === "11000") {
      return errorResponse("Duplikat: kombinasi type+code sudah ada", 409);
    }
    return errorResponse("Failed to create config", 400, error.message);
  }
}
