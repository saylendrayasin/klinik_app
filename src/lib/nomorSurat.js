/**
 * Pembentukan nomor surat dari pola bertoken.
 * Fungsi di sini murni (tanpa database) supaya gampang diuji.
 */

const ROMAWI = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export const TOKEN_TERSEDIA = [
  "{urut}",
  "{urut2}",
  "{urut3}",
  "{bulan}",
  "{romawi}",
  "{tahun}",
  "{tahun2}",
];

export const RESET_TERSEDIA = ["tahunan", "bulanan", "tidak_pernah"];

export function bulanRomawi(bulan) {
  return ROMAWI[Number(bulan)] || "";
}

/**
 * Ganti token dalam pola dengan nilai sebenarnya.
 * Token bertingkat ({urut} vs {urut2}) aman karena regex-nya
 * mensyaratkan kurung tutup tepat setelah nama token.
 */
export function formatNomor(pola, { urut, bulan, tahun }) {
  const u = Number(urut) || 0;
  const b = Number(bulan) || 0;
  const t = Number(tahun) || 0;

  return String(pola || "")
    .replace(/\{urut3\}/g, String(u).padStart(3, "0"))
    .replace(/\{urut2\}/g, String(u).padStart(2, "0"))
    .replace(/\{urut\}/g, String(u))
    .replace(/\{bulan\}/g, String(b).padStart(2, "0"))
    .replace(/\{romawi\}/g, bulanRomawi(b))
    .replace(/\{tahun2\}/g, String(t).slice(-2))
    .replace(/\{tahun\}/g, String(t));
}

/** Jenis surat → prefiks kunci penghitung. Tiap jenis punya urutan sendiri. */
export const JENIS_SURAT = ["consent", "sakit"];

/** Pola bawaan tiap jenis surat — dipakai model dan tombol "Pola bawaan". */
export const POLA_BAWAAN = {
  consent: "{urut3}/IC/KLN-IYA/{romawi}/{tahun}",
  sakit: "{urut3}/SKS/KLN-IYA/{romawi}/{tahun}",
};

/** Kunci penghitung sesuai jenis surat dan periode reset yang dipilih. */
export function counterKey(jenis, reset, { bulan, tahun }) {
  if (reset === "bulanan") return `${jenis}-${tahun}-${String(bulan).padStart(2, "0")}`;
  if (reset === "tidak_pernah") return jenis;
  return `${jenis}-${tahun}`;
}

/**
 * Validasi pola terhadap periode reset.
 * Mengembalikan array pesan kesalahan — kosong berarti valid.
 *
 * Aturan terpenting: kalau nomor di-reset per bulan tapi polanya tidak
 * memuat bulan, Februari dan Maret akan menghasilkan nomor yang sama persis.
 */
export function validatePola(pola, reset) {
  const errors = [];
  const p = String(pola || "").trim();

  if (!p) {
    errors.push("Pola nomor wajib diisi.");
    return errors;
  }

  const tokenDipakai = p.match(/\{[^}]*\}/g) || [];
  const tidakDikenal = tokenDipakai.filter((t) => !TOKEN_TERSEDIA.includes(t));
  if (tidakDikenal.length) {
    errors.push(`Token tidak dikenal: ${[...new Set(tidakDikenal)].join(", ")}`);
  }

  if (!/(\{urut\}|\{urut2\}|\{urut3\})/.test(p)) {
    errors.push(
      "Pola wajib memuat {urut}, {urut2}, atau {urut3} — tanpa itu semua surat akan bernomor sama."
    );
  }

  if (reset === "bulanan" && !/(\{bulan\}|\{romawi\})/.test(p)) {
    errors.push(
      "Reset bulanan wajib memuat {bulan} atau {romawi}, agar nomor tidak kembar antar bulan."
    );
  }

  if (reset === "tahunan" && !/(\{tahun\}|\{tahun2\})/.test(p)) {
    errors.push(
      "Reset tahunan wajib memuat {tahun} atau {tahun2}, agar nomor tidak kembar antar tahun."
    );
  }

  return errors;
}

/** Contoh hasil untuk pratinjau di halaman pengaturan. */
export function contohNomor(pola, urut = 1, date = new Date()) {
  return formatNomor(pola, {
    urut,
    bulan: date.getMonth() + 1,
    tahun: date.getFullYear(),
  });
}
