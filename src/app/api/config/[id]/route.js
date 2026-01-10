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

export async function GET(req, context) {
  const params = await context.params;
  try {
    await connectDB();

    const item = await Config.findById(params.id);
    if (!item) return errorResponse("Config tidak ditemukan", 404);

    return successResponse("Berhasil mengambil data config", item);
  } catch (error) {
    return errorResponse("Gagal mengambil data config", 400, error.message);
  }
}

export async function PATCH(req, context) {
  const params = await context.params;
  try {
    await connectDB();
    const body = await req.json();

    const item = await Config.findById(params.id);
    if (!item) return errorResponse("Config tidak ditemukan", 404);

    if (body.isActive !== undefined) item.isActive = !!body.isActive;

    if (body.label !== undefined) {
      const newLabel = String(body.label || "").trim();
      if (!newLabel) return errorResponse("label tidak boleh kosong", 400);

      const newCode = slugifyLabel(newLabel);
      if (!newCode) {
        return errorResponse("Label tidak valid setelah dinormalisasi", 400);
      }

      const exists = await Config.findOne({
        type: item.type,
        code: newCode,
        _id: { $ne: item._id },
      })
        .select("_id")
        .lean();

      if (exists) {
        return errorResponse(
          `Tidak bisa update: label menghasilkan code '${newCode}' yang sudah digunakan.`,
          409
        );
      }

      item.label = newLabel;
      item.code = newCode;
    }

    await item.save();
    return successResponse("Berhasil update config", item);
  } catch (error) {
    if (String(error?.code) === "11000") {
      return errorResponse("Duplikat: kombinasi type+code sudah ada", 409);
    }
    console.error(error);
    return errorResponse("Gagal update config", 400, error.message);
  }
}

export async function DELETE(req, context) {
  const params = await context.params;
  try {
    await connectDB();

    // soft delete: isActive=false
    const deletedItem = await Config.findByIdAndUpdate(
      params.id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!deletedItem) {
      return errorResponse("Config tidak ditemukan", 404);
    }

    return successResponse("Berhasil menonaktifkan config", deletedItem);
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal menghapus config", 400, error.message);
  }
}
