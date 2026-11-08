import { connectDB } from "@/lib/database";
import { getPengaturanSurat } from "@/models/pengaturanSurat";
import { peekSeq, setSeq } from "@/models/counter";
import { counterKey, formatNomor, validatePola, JENIS_SURAT, RESET_TERSEDIA } from "@/lib/nomorSurat";
import { bulanTahunUTC } from "@/lib/tanggal";
import { simpanGambar, teks } from "@/lib/surat";
import { successResponse, errorResponse, serverError } from "@/lib/response";

const KOP = ["baris1", "baris2", "alamat", "telepon", "kota"];

/** Nomor yang akan dipakai surat berikutnya bila terbit hari ini, per jenis. */
async function berikutnya(pengaturan) {
  const periode = bulanTahunUTC(new Date());
  const hasil = {};
  for (const jenis of JENIS_SURAT) {
    const { pola, reset } = pengaturan.penomoran[jenis];
    const urut = (await peekSeq(counterKey(jenis, reset, periode))) + 1;
    hasil[jenis] = { urut, nomor: formatNomor(pola, { urut, ...periode }) };
  }
  return hasil;
}

const balas = async (pesan, p) =>
  successResponse(pesan, { ...p.toObject(), berikutnya: await berikutnya(p) });

export async function GET() {
  try {
    await connectDB();
    return balas("Pengaturan surat berhasil diambil", await getPengaturanSurat());
  } catch (error) {
    return serverError(error, "Gagal mengambil pengaturan surat");
  }
}

export async function PATCH(req) {
  try {
    await connectDB();
    const body = await req.json();
    const p = await getPengaturanSurat();

    if (body.kop) {
      for (const f of KOP) if (body.kop[f] !== undefined) p.kop[f] = teks(body.kop[f], 200);
      if (!p.kop.baris2) return errorResponse("Nama klinik wajib diisi", 400);
    }

    for (const jenis of JENIS_SURAT) {
      const n = body.penomoran?.[jenis];
      if (!n) continue;
      if (n.reset !== undefined && !RESET_TERSEDIA.includes(n.reset)) {
        return errorResponse("Pilihan reset penomoran tidak valid", 400);
      }
      const pola = n.pola !== undefined ? teks(n.pola, 80) : p.penomoran[jenis].pola;
      const reset = n.reset ?? p.penomoran[jenis].reset;
      // Pola dicek terhadap reset yang AKAN berlaku: reset bulanan tanpa {bulan} membuat nomor kembar.
      const errors = validatePola(pola, reset);
      if (errors.length) return errorResponse(errors.join(" "), 400, { errors });
      p.penomoran[jenis] = { pola, reset };
    }

    // Urutan hanya boleh maju (mis. melanjutkan nomor dari buku manual) —
    // memundurkannya bisa membuat nomor surat yang sudah dihapus terpakai lagi.
    const periode = bulanTahunUTC(new Date());
    const ubahUrut = [];
    for (const jenis of JENIS_SURAT) {
      const v = body.urutBerikutnya?.[jenis];
      if (v === undefined || v === null || v === "") continue;
      const n = Number(v);
      const key = counterKey(jenis, p.penomoran[jenis].reset, periode);
      const sekarang = await peekSeq(key);
      if (!Number.isInteger(n) || n < 1) return errorResponse("Nomor urut berikutnya harus bilangan bulat minimal 1", 400);
      if (n <= sekarang) {
        return errorResponse(`Nomor urut berikutnya minimal ${sekarang + 1} — nomor yang sudah terbit tidak boleh dipakai ulang.`, 400);
      }
      ubahUrut.push([key, n - 1]);
    }

    // Gambar terakhir: isian yang ditolak di atas tidak meninggalkan gambar yatim.
    for (const [field, jenis, label] of [["logo", "logo", "Logo"], ["cap", "cap", "Cap klinik"]]) {
      if (body[field] === null) p[`${field}Id`] = null;
      else if (body[field] !== undefined) p[`${field}Id`] = await simpanGambar(jenis, body[field], label);
    }

    await p.save();
    for (const [key, seq] of ubahUrut) await setSeq(key, seq);
    return balas("Pengaturan surat berhasil disimpan", p);
  } catch (error) {
    return serverError(error, "Gagal menyimpan pengaturan surat");
  }
}
