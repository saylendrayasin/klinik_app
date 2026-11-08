/**
 * Helper query bersama untuk semua route list.
 * Tujuannya supaya pagination & search konsisten dan tidak bisa dikirimi
 * nilai liar dari query string (page negatif, limit raksasa, regex injection).
 */

export function escapeRegex(value) {
  return String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parsePagination(searchParams, { defaultLimit = 10, maxLimit = 100 } = {}) {
  const rawPage = parseInt(searchParams.get("page"), 10);
  const rawLimit = parseInt(searchParams.get("limit"), 10);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, maxLimit)
      : defaultLimit;

  return { page, limit, skip: (page - 1) * limit };
}

/**
 * Ambil hanya field yang boleh diisi klien dari body request. Field turunan
 * (diagnosis, metodes, visits, hpl, status, ...) dihitung server — tanpa
 * whitelist, request rakitan bisa menyimpan nilai karangan di sana.
 */
export function pilihField(body, fields) {
  const src = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const out = {};
  for (const f of fields) if (src[f] !== undefined) out[f] = src[f];
  return out;
}
