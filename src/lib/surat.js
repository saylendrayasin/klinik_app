/**
 * Logika server bersama untuk semua jenis surat (consent, surat sakit):
 * validasi gambar, penerbitan nomor, salinan petugas & kop, dan handler
 * route daftar/detail yang sama persis untuk tiap jenis.
 */

import mongoose from "mongoose";
import { connectDB } from "@/lib/database";
import { nextSeq } from "@/models/counter";
import { Penandatangan, JABATAN } from "@/models/penandatangan";
import { Gambar } from "@/models/gambar";
import { getPengaturanSurat } from "@/models/pengaturanSurat";
import { counterKey, formatNomor } from "@/lib/nomorSurat";
import { bulanTahunUTC, hariIniUTC, keTanggalUTC } from "@/lib/tanggal";
import { escapeRegex, parsePagination, pilihField } from "@/lib/query";
import {
  successResponse, paginatedResponse, errorResponse, serverError, ApiError,
} from "@/lib/response";

// ── Gambar ───────────────────────────────────────────────────────────────

// Tanda tangan hasil SignaturePad normalnya 15–40 KB; batas ini longgar tapi
// menjaga dokumen MongoDB tidak membengkak.
export const MAKS_GORESAN = 300_000;
// Logo/cap/TTD unggahan sudah diperkecil di browser (maks 600px) sebelum dikirim.
export const MAKS_UNGGAHAN = 700_000;

// SVG sengaja tidak diterima: bisa membawa skrip kalau dibuka langsung.
const TANDA_TANGAN_BERKAS = {
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
};

/** Data URL gambar → { mime, buffer }, atau null kalau bukan PNG/JPEG/WebP asli. */
export function bacaDataUrl(dataUrl, maks = MAKS_UNGGAHAN) {
  if (typeof dataUrl !== "string" || dataUrl.length > maks) return null;
  const m = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+=*)$/);
  if (!m) return null;
  const buffer = Buffer.from(m[2], "base64");
  // Isi berkas harus cocok dengan tipe yang diaku, bukan sekadar awalan teksnya.
  const tanda = TANDA_TANGAN_BERKAS[m[1]];
  if (buffer.length < 8 || !tanda.every((b, i) => buffer[i] === b)) return null;
  return { mime: m[1], buffer };
}

/** Goresan tanda tangan di layar: wajib PNG. */
export function goresanValid(dataUrl) {
  return bacaDataUrl(dataUrl, MAKS_GORESAN)?.mime === "image/png";
}

// ── Nilai isian ──────────────────────────────────────────────────────────

export const teks = (v, maks = 300) => String(v ?? "").trim().slice(0, maks);

export function umur(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > 150) throw new ApiError("Umur tidak valid", 400);
  return n;
}

export function idAtauNull(v) {
  if (!v) return null;
  if (!mongoose.isValidObjectId(v)) throw new ApiError("Pilihan petugas tidak valid", 400);
  return v;
}

export function tanggalWajib(v, label) {
  const d = keTanggalUTC(v);
  if (!d) throw new ApiError(`${label} wajib diisi`, 400);
  return d;
}

/** Jumlah hari inklusif: 3 Nov s/d 5 Nov = 3 hari. */
export function hitungLamaHari(mulai, selesai) {
  return Math.round((keTanggalUTC(selesai) - keTanggalUTC(mulai)) / 86_400_000) + 1;
}

// ── Master ───────────────────────────────────────────────────────────────

/** Gambar unggahan → id versi baru di koleksi Gambar (versi lama tidak pernah ditimpa). */
export async function simpanGambar(jenis, dataUrl, label) {
  if (!bacaDataUrl(dataUrl)) throw new ApiError(`${label} wajib PNG/JPEG/WebP dan maksimal ±500 KB`, 400);
  return (await Gambar.create({ jenis, dataUrl }))._id;
}

/** Isian umum POST & PATCH. Gambar TTD baru selalu jadi versi baru di koleksi Gambar. */
export async function terapkanPenandatangan(doc, body) {
  if (body.nama !== undefined) doc.nama = teks(body.nama, 100);
  if (body.jabatan !== undefined) {
    if (!JABATAN.includes(body.jabatan)) throw new ApiError("Jabatan tidak valid", 400);
    doc.jabatan = body.jabatan;
  }
  if (body.nip !== undefined) doc.nip = teks(body.nip, 40);
  if (body.aktif !== undefined) doc.aktif = body.aktif === true;
  if (!doc.nama) throw new ApiError("Nama wajib diisi", 400);
  if (!doc.jabatan) throw new ApiError("Jabatan wajib dipilih", 400);
  // Terakhir, supaya isian yang ditolak tidak meninggalkan gambar yatim.
  if (body.ttd === null) doc.ttdId = null;
  else if (body.ttd !== undefined) doc.ttdId = await simpanGambar("ttd", body.ttd, "Gambar tanda tangan");
}

// ── Penerbitan ───────────────────────────────────────────────────────────

/** Salinan petugas dari master; wajib ada dan aktif saat surat terbit. */
export async function salinPetugas(id, label) {
  if (!id) throw new ApiError(`${label} wajib dipilih`, 400);
  const p = await Penandatangan.findById(id).lean();
  if (!p) throw new ApiError(`${label} tidak ditemukan di master. Pilih ulang.`, 400);
  if (!p.aktif) throw new ApiError(`${label} (${p.nama}) sudah nonaktif. Pilih petugas lain.`, 400);
  return { penandatanganId: p._id, nama: p.nama, jabatan: p.jabatan, nip: p.nip || "", ttdId: p.ttdId || null };
}

/**
 * Nomor diterbitkan saat surat terbit, bukan saat draf dibuat. Surat yang
 * pernah terbit lalu dibatalkan memakai nomor lamanya lagi — nomor tidak
 * pernah dipakai ulang atau dilompati.
 */
async function terbitkanNomor(Model, jenis, doc, pengaturan) {
  if (doc.nomorSurat) return;

  // Bulan & tahun dibaca sebagai UTC: nomor tidak bergeser di server Vercel (UTC).
  const { bulan, tahun } = bulanTahunUTC(doc.tanggalSurat);
  const { pola, reset } = pengaturan.penomoran[jenis];
  const key = counterKey(jenis, reset, { bulan, tahun });

  // Pola yang pernah diubah bisa menghasilkan nomor yang sudah ada; lompati.
  for (let i = 0; i < 5; i++) {
    const seq = await nextSeq(key);
    const nomor = formatNomor(pola, { urut: seq, bulan, tahun });
    if (await Model.exists({ nomorSurat: nomor })) continue;
    Object.assign(doc, { nomorSurat: nomor, nomorUrut: seq, bulan, tahun });
    return;
  }
  throw new ApiError("Nomor hasil pola selalu bentrok dengan surat lain. Periksa pola nomor di Master Data.", 409);
}

/** Kop, logo, dan cap disalin ke surat saat terbit. Cap hanya menyertai TTD digital. */
function salinKop(doc, pengaturan, pakaiCap) {
  const k = pengaturan.kop;
  doc.kop = { baris1: k.baris1, baris2: k.baris2, alamat: k.alamat, telepon: k.telepon, kota: k.kota };
  doc.logoId = pengaturan.logoId || null;
  doc.capId = pakaiCap ? pengaturan.capId || null : null;
}

// ── Handler route ────────────────────────────────────────────────────────

/**
 * Handler GET (daftar) + POST (draf baru) untuk satu jenis surat.
 * cfg: { Model, label, fields, terapkan(doc, data), cari: [field], sort: {kunci: field}, listFields }
 */
export function ruteDaftar(cfg) {
  async function GET(req) {
    try {
      await connectDB();
      const sp = new URL(req.url).searchParams;
      const { page, limit, skip } = parsePagination(sp, { defaultLimit: 10 });
      const sortField = cfg.sort[sp.get("sort")] || "tanggalSurat";
      const query = {};

      const search = sp.get("search");
      if (search) {
        const rx = { $regex: escapeRegex(search), $options: "i" };
        query.$or = ["nomorSurat", ...cfg.cari].map((f) => ({ [f]: rx }));
      }
      const status = sp.get("status");
      if (status === "draft" || status === "issued") query.status = status;

      const [data, total] = await Promise.all([
        cfg.Model.find(query)
          .select(cfg.listFields)
          .sort({ [sortField]: sortField.endsWith("nama") ? 1 : -1, _id: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        cfg.Model.countDocuments(query),
      ]);
      return paginatedResponse(`Data ${cfg.label} berhasil diambil`, data, page, Math.max(1, Math.ceil(total / limit)));
    } catch (error) {
      return serverError(error, `Gagal mengambil data ${cfg.label}`);
    }
  }

  async function POST(req) {
    try {
      await connectDB();
      const body = await req.json();
      const doc = new cfg.Model({ tanggalSurat: hariIniUTC() });
      cfg.terapkan(doc, pilihField(body, cfg.fields));
      await doc.save();
      return successResponse(`Draf ${cfg.label} berhasil dibuat`, doc, 201);
    } catch (error) {
      return serverError(error, `Gagal membuat ${cfg.label}`);
    }
  }

  return { GET, POST };
}

/**
 * Handler GET/PATCH/DELETE satu surat.
 * PATCH action: updateData | issue (body.ttd = goresan yang baru dibuat) | unissue
 * cfg: { Model, jenis, label, fields, terapkan, terbitkan(doc, body) → pakaiCap, batalkan(doc) }
 */
export function ruteDetail(cfg) {
  const ambil = async (context) => {
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) return null;
    return cfg.Model.findById(id);
  };
  const tidakAda = () => errorResponse(`${cfg.Label} tidak ditemukan`, 404);

  async function GET(req, context) {
    try {
      await connectDB();
      const doc = await ambil(context);
      return doc ? successResponse(`Berhasil mengambil ${cfg.label}`, doc) : tidakAda();
    } catch (error) {
      return serverError(error, `Gagal mengambil ${cfg.label}`);
    }
  }

  async function PATCH(req, context) {
    try {
      await connectDB();
      const body = await req.json();
      const doc = await ambil(context);
      if (!doc) return tidakAda();

      const terbit = doc.status === "issued";
      let pesan = "Perubahan berhasil disimpan";

      if (body.action === "updateData") {
        if (terbit) {
          return errorResponse("Surat sudah terbit dan terkunci. Batalkan terbit dulu untuk mengubah isinya.", 409);
        }
        cfg.terapkan(doc, pilihField(body.data, cfg.fields));
      } else if (body.action === "issue") {
        if (terbit) return errorResponse("Surat ini sudah terbit", 409);
        const pengaturan = await getPengaturanSurat();
        const pakaiCap = await cfg.terbitkan(doc, body);
        salinKop(doc, pengaturan, pakaiCap);
        await terbitkanNomor(cfg.Model, cfg.jenis, doc, pengaturan);
        doc.status = "issued";
        doc.terbitAt = new Date();
        pesan = `Surat terbit dengan nomor ${doc.nomorSurat}`;
      } else if (body.action === "unissue") {
        if (!terbit) return errorResponse("Surat ini belum terbit", 400);
        cfg.batalkan?.(doc);
        // nomorSurat sengaja dipertahankan: terbit ulang memakai nomor yang sama.
        doc.status = "draft";
        doc.terbitAt = null;
        doc.dibatalkanAt = new Date();
        pesan = "Terbit dibatalkan. Surat bisa diedit lagi.";
      } else {
        return errorResponse("Aksi tidak dikenali", 400);
      }

      await doc.save();
      return successResponse(pesan, doc);
    } catch (error) {
      if (error.code === 11000) {
        return errorResponse("Nomor surat sudah dipakai. Periksa pola nomor di Master Data.", 409);
      }
      return serverError(error, `Gagal memperbarui ${cfg.label}`);
    }
  }

  async function DELETE(req, context) {
    try {
      await connectDB();
      const doc = await ambil(context);
      if (!doc) return tidakAda();
      // Surat terbit adalah dokumen resmi: hapus harus disengaja (ketik ulang nomornya).
      if (doc.status === "issued") {
        const konfirmasi = new URL(req.url).searchParams.get("konfirmasi") || "";
        if (konfirmasi !== doc.nomorSurat) {
          return errorResponse("Surat sudah terbit. Ketik ulang nomor suratnya untuk mengonfirmasi penghapusan.", 400);
        }
      }
      await doc.deleteOne();
      return successResponse(`${cfg.Label} berhasil dihapus`, { _id: doc._id });
    } catch (error) {
      return serverError(error, `Gagal menghapus ${cfg.label}`);
    }
  }

  return { GET, PATCH, DELETE };
}

/** Ringkasan untuk kartu di halaman daftar. Bulan dibaca UTC seperti tanggalSurat. */
export function ruteRingkasan(Model, label) {
  return async function GET() {
    try {
      await connectDB();
      const h = hariIniUTC();
      const awal = new Date(Date.UTC(h.getUTCFullYear(), h.getUTCMonth(), 1));
      const akhir = new Date(Date.UTC(h.getUTCFullYear(), h.getUTCMonth() + 1, 1));
      const [total, draft, issued, bulanIni] = await Promise.all([
        Model.countDocuments({}),
        Model.countDocuments({ status: "draft" }),
        Model.countDocuments({ status: "issued" }),
        Model.countDocuments({ status: "issued", tanggalSurat: { $gte: awal, $lt: akhir } }),
      ]);
      return successResponse(`Ringkasan ${label} berhasil diambil`, { total, draft, issued, bulanIni });
    } catch (error) {
      return serverError(error, `Gagal mengambil ringkasan ${label}`);
    }
  };
}
