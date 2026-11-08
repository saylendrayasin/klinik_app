import { connectDB } from "@/lib/database";
import { Config } from "@/models/config";
import { successResponse, errorResponse, serverError } from "@/lib/response";

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
    if (!item) return errorResponse("Konfigurasi tidak ditemukan", 404);

    return successResponse("Data konfigurasi berhasil diambil", item);
  } catch (error) {
    return serverError(error, "Gagal mengambil data konfigurasi");
  }
}

export async function PATCH(req, context) {
  const params = await context.params;
  try {
    await connectDB();
    const body = await req.json();

    const item = await Config.findById(params.id);
    if (!item) return errorResponse("Konfigurasi tidak ditemukan", 404);

    if (body.isActive !== undefined) item.isActive = !!body.isActive;

    if (body.label !== undefined) {
      const newLabel = String(body.label || "").trim();
      if (!newLabel) return errorResponse("Label wajib diisi", 400);

      const newCode = slugifyLabel(newLabel);
      if (!newCode) {
        return errorResponse("Label harus mengandung huruf atau angka", 400);
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
    return successResponse("Konfigurasi berhasil diperbarui", item);
  } catch (error) {
    if (String(error?.code) === "11000") {
      return errorResponse("Konfigurasi dengan label yang sama sudah ada", 409);
    }
    return serverError(error, "Gagal memperbarui konfigurasi");
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
      return errorResponse("Konfigurasi tidak ditemukan", 404);
    }

    return successResponse("Konfigurasi berhasil dinonaktifkan", deletedItem);
  } catch (error) {
    return serverError(error, "Gagal menghapus konfigurasi");
  }
}
