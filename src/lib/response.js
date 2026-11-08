export function successResponse(message, data = null, statusCode = 200) {
  return new Response(
    JSON.stringify({ message, data, status: "success" }),
    { status: statusCode, headers: { "Content-Type": "application/json" } }
  );
}

export function paginatedResponse(message, data, page, totalPages, statusCode = 200) {
  return new Response(
    JSON.stringify({ message, data, page, totalPages, status: "success" }),
    { status: statusCode, headers: { "Content-Type": "application/json" } }
  );
}

export function errorResponse(message, statusCode = 400, data = null) {
  return new Response(
    JSON.stringify({ message, data, status: "error" }),
    { status: statusCode, headers: { "Content-Type": "application/json" } }
  );
}

/** Error yang pesannya memang ditujukan ke pengguna (dikirim apa adanya). */
export class ApiError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Penutup blok catch di route handler. Detail error (pesan Mongo, nama
 * koleksi, stack) hanya masuk log server; klien menerima pesan aman.
 * Pakai pengecekan `error.code === 11000` sendiri sebelum memanggil ini
 * bila duplikat butuh pesan khusus.
 */
export function serverError(error, message) {
  if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);

  if (error?.name === "ValidationError") {
    const fields = Object.keys(error.errors || {});
    return errorResponse(
      fields.length ? `Data tidak valid: periksa ${fields.join(", ")}` : "Data tidak valid",
      400
    );
  }
  if (error?.name === "CastError") return errorResponse("Format data tidak valid", 400);
  if (error instanceof SyntaxError) return errorResponse("Format permintaan tidak valid", 400);
  if (error?.code === 11000) return errorResponse("Data yang sama sudah ada", 409);

  console.error(`[api] ${message}:`, error);
  return errorResponse(message, 500);
}
