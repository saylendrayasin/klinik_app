import { connectDB } from "@/lib/database";
import { Persalinan } from "@/models/persalinan";
import { errorResponse, serverError } from "@/lib/response";
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

function idDate(d) {
  try {
    return d ? new Date(d).toLocaleDateString("id-ID") : "-";
  } catch {
    return "-";
  }
}

function gpa(doc) {
  return `G${doc.gravida || 0}P${doc.para || 0}A${doc.abortus || 0}`;
}

function label(map, val) {
  return map[val] || val || "-";
}

const STATUS_LABEL = {
  terdaftar: "Terdaftar",
  aktif: "Aktif",
  selesai: "Selesai",
  rujuk: "Rujuk",
  meninggal: "Meninggal",
};
const JENIS_KEL_LABEL = {
  "laki-laki": "Laki-laki",
  perempuan: "Perempuan",
  tidak_diketahui: "Tidak Diketahui",
};
const KONDISI_BAYI_LABEL = {
  hidup: "Hidup",
  meninggal: "Meninggal",
  iufd: "IUFD",
};
const LOKHIA_LABEL = {
  rubra: "Rubra",
  sanguinolenta: "Sanguinolenta",
  serosa: "Serosa",
  alba: "Alba",
};
const ASI_LABEL = {
  lancar: "Lancar",
  kurang: "Kurang",
  tidak_ada: "Tidak Ada",
};
const KB_LABEL = {
  belum: "Belum",
  kondom: "Kondom",
  pil: "Pil",
  suntik: "Suntik",
  iud: "IUD",
  implant: "Implant",
  mow: "MOW",
  mop: "MOP",
};
const KETUBAN_LABEL = {
  jernih: "Jernih",
  keruh: "Keruh",
  mekonium: "Mekonium",
  darah: "Darah",
};
const PERINEUM_LABEL = {
  utuh: "Utuh",
  laserasi_grade1: "Laserasi Derajat I",
  laserasi_grade2: "Laserasi Derajat II",
  laserasi_grade3: "Laserasi Derajat III",
  laserasi_grade4: "Laserasi Derajat IV",
  episiotomi: "Episiotomi",
};
const PLASENTA_LABEL = { lengkap: "Lengkap", tidak_lengkap: "Tidak Lengkap" };
const yn = (v) => (v ? "Ya" : "Tidak");

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const mode = (searchParams.get("mode") || "persalinan").toLowerCase();

    if (!["persalinan", "nifas"].includes(mode)) {
      return errorResponse(
        "mode tidak valid. Gunakan mode=persalinan atau mode=nifas",
        400
      );
    }

    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");

    if (!fromStr || !toStr) {
      return errorResponse(
        "Parameter from dan to wajib diisi. Contoh: ?mode=persalinan&from=2025-01-01&to=2025-01-31",
        400
      );
    }

    const from = new Date(`${fromStr}T00:00:00`);
    const to = new Date(`${toStr}T23:59:59`);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return errorResponse(
        "Format tanggal tidak valid. Gunakan YYYY-MM-DD",
        400
      );
    }

    if (from > to) {
      return errorResponse("Tanggal awal tidak boleh melebihi tanggal akhir", 400);
    }

    const workbook = new ExcelJS.Workbook();

    if (mode === "persalinan") {
      const data = await Persalinan.find({
        tanggalPersalinan: { $gte: from, $lte: to, $ne: null },
      })
        .sort({ tanggalPersalinan: 1 })
        .lean();

      const ws = workbook.addWorksheet(`Persalinan ${fromStr} sd ${toStr}`);
      ws.columns = [
        { header: "Tanggal Persalinan", key: "tgl", width: 18 },
        { header: "Nama Ibu", key: "name", width: 24 },
        { header: "NIK", key: "nik", width: 18 },
        { header: "Tanggal Lahir", key: "dob", width: 14 },
        { header: "Alamat", key: "address", width: 28 },
        { header: "G/P/A", key: "gpa", width: 10 },
        { header: "UK Saat Persalinan (mg)", key: "uk", width: 20 },
        { header: "Kondisi Ketuban", key: "ketuban", width: 15 },
        { header: "Kondisi Perineum", key: "perineum", width: 18 },
        { header: "Plasenta", key: "plasenta", width: 14 },
        { header: "TD Sistol", key: "sistol", width: 11 },
        { header: "TD Diastol", key: "diastol", width: 11 },
        { header: "Perdarahan (mL)", key: "pendarahan", width: 15 },
        { header: "Kondisi Ibu", key: "kondisiIbu", width: 13 },
        { header: "Komplikasi Ibu", key: "komplikasiIbu", width: 24 },
        { header: "Jenis Kelamin Bayi", key: "jenisKel", width: 18 },
        { header: "Berat Lahir (gram)", key: "beratLahir", width: 17 },
        { header: "Panjang Badan (cm)", key: "panjang", width: 17 },
        { header: "Apgar 1 Menit", key: "apgar1", width: 13 },
        { header: "Apgar 5 Menit", key: "apgar5", width: 13 },
        { header: "IMD", key: "imd", width: 8 },
        { header: "Vitamin K1", key: "vitK", width: 11 },
        { header: "Salep Mata", key: "salepMata", width: 11 },
        { header: "Imunisasi HB0", key: "hb0", width: 13 },
        { header: "Resusitasi", key: "resusitasi", width: 11 },
        { header: "Kondisi Bayi", key: "kondisiBayi", width: 14 },
        { header: "Komplikasi Bayi", key: "komplikasiBayi", width: 24 },
        { header: "Total Kunjungan Nifas", key: "totalNifas", width: 20 },
        { header: "Status", key: "status", width: 12 },
      ];

      for (const doc of data) {
        ws.addRow({
          tgl: idDate(doc.tanggalPersalinan),
          name: doc.name || "-",
          nik: doc.nik || "-",
          dob: idDate(doc.dateOfBirth),
          address: doc.address || "-",
          gpa: gpa(doc),
          uk:
            doc.usiaKehamilanSaatPersalinan != null
              ? doc.usiaKehamilanSaatPersalinan
              : "-",
          ketuban: doc.kondisiKetuban
            ? label(KETUBAN_LABEL, doc.kondisiKetuban)
            : "-",
          perineum: doc.kondisiPerineumPersalinan
            ? label(PERINEUM_LABEL, doc.kondisiPerineumPersalinan)
            : "-",
          plasenta: doc.plasentaLengkap
            ? label(PLASENTA_LABEL, doc.plasentaLengkap)
            : "-",
          sistol: doc.tekananDarahSistol != null ? doc.tekananDarahSistol : "-",
          diastol:
            doc.tekananDarahDiastol != null ? doc.tekananDarahDiastol : "-",
          pendarahan: doc.pendarahan != null ? doc.pendarahan : "-",
          kondisiIbu: doc.kondisiIbu || "-",
          komplikasiIbu: doc.komplikasiIbu || "-",
          jenisKel: label(JENIS_KEL_LABEL, doc.bayi?.jenisKelamin),
          beratLahir: doc.bayi?.beratLahir != null ? doc.bayi.beratLahir : "-",
          panjang: doc.bayi?.panjangBadan != null ? doc.bayi.panjangBadan : "-",
          apgar1: doc.bayi?.nilaiApgar1 != null ? doc.bayi.nilaiApgar1 : "-",
          apgar5: doc.bayi?.nilaiApgar5 != null ? doc.bayi.nilaiApgar5 : "-",
          imd: yn(doc.bayi?.imd),
          vitK: yn(doc.bayi?.injeksiVitaminK),
          salepMata: yn(doc.bayi?.salepMata),
          hb0: yn(doc.bayi?.imunisasiHB0),
          resusitasi: yn(doc.bayi?.resusitasi),
          kondisiBayi: label(KONDISI_BAYI_LABEL, doc.bayi?.kondisiBayi),
          komplikasiBayi: doc.bayi?.komplikasiBayi || "-",
          totalNifas: (doc.visits || []).length,
          status: label(STATUS_LABEL, doc.status),
        });
      }

      ws.getRow(1).font = { bold: true };
      ws.views = [{ state: "frozen", ySplit: 1 }];

      if (data.length === 0) {
        ws.addRow({
          name: `Tidak ada data persalinan antara ${fromStr} dan ${toStr}`,
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const filename = `data-persalinan-${fromStr}-sd-${toStr}.xlsx`;

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });
    }

    // mode === "nifas"
    const data = await Persalinan.find({
      "visits.date": { $gte: from, $lte: to },
    })
      .sort({ tanggalPersalinan: 1 })
      .lean();

    const ws = workbook.addWorksheet(`Kunjungan Nifas ${fromStr} sd ${toStr}`);
    ws.columns = [
      { header: "Tanggal Kunjungan", key: "tgl", width: 18 },
      { header: "Nomor KF", key: "kf", width: 10 },
      { header: "Hari Pasca Salin", key: "hari", width: 16 },
      { header: "TD Sistol", key: "sistol", width: 11 },
      { header: "TD Diastol", key: "diastol", width: 11 },
      { header: "Nadi (bpm)", key: "nadi", width: 11 },
      { header: "Suhu (°C)", key: "suhu", width: 11 },
      { header: "RR (x/mnt)", key: "rr", width: 11 },
      { header: "TFU", key: "tfu", width: 22 },
      { header: "Lokhia", key: "lokhia", width: 14 },
      { header: "Kondisi Perineum/Luka", key: "perineum", width: 22 },
      { header: "ASI", key: "asi", width: 12 },
      { header: "Kondisi Bayi", key: "kondisiBayi", width: 14 },
      { header: "BB Bayi (gram)", key: "bbBayi", width: 14 },
      { header: "Vitamin A", key: "vitA", width: 11 },
      { header: "Tablet Fe", key: "fe", width: 11 },
      { header: "Konseling", key: "konseling", width: 11 },
      { header: "Rencana KB", key: "kb", width: 13 },
      { header: "Keluhan", key: "keluhan", width: 28 },
      { header: "Tindakan", key: "tindakan", width: 28 },
      { header: "Catatan", key: "notes", width: 28 },
      { header: "Nama Ibu", key: "name", width: 24 },
      { header: "NIK", key: "nik", width: 18 },
      { header: "Tanggal Persalinan", key: "tglSalin", width: 18 },
    ];

    const rows = [];
    for (const doc of data) {
      for (const v of doc.visits || []) {
        const vDate = v.date ? new Date(v.date) : null;
        if (!vDate || isNaN(vDate.getTime())) continue;
        if (vDate < from || vDate > to) continue;

        rows.push({
          _raw: vDate.getTime(),
          tgl: idDate(v.date),
          kf: v.nomorKF ? `KF${v.nomorKF}` : "-",
          hari: v.hariPascaSalin != null ? v.hariPascaSalin : "-",
          sistol: v.tekananDarahSistol != null ? v.tekananDarahSistol : "-",
          diastol: v.tekananDarahDiastol != null ? v.tekananDarahDiastol : "-",
          nadi: v.nadi != null ? v.nadi : "-",
          suhu: v.suhu != null ? v.suhu : "-",
          rr: v.pernapasan != null ? v.pernapasan : "-",
          tfu: v.tfu || "-",
          lokhia: label(LOKHIA_LABEL, v.lokhia),
          perineum: v.kondisiPerineum || v.kondisiLukaOperasi || "-",
          asi: label(ASI_LABEL, v.asi),
          kondisiBayi: v.kondisiBayi || "-",
          bbBayi: v.beratBayiSekarang != null ? v.beratBayiSekarang : "-",
          vitA: yn(v.pemberianVitaminA),
          fe: yn(v.pemberianFe),
          konseling: yn(v.konselingDiberikan),
          kb: label(KB_LABEL, v.rencanKb),
          keluhan: v.keluhan || "-",
          tindakan: v.tindakan || "-",
          notes: v.notes || "-",
          name: doc.name || "-",
          nik: doc.nik || "-",
          tglSalin: idDate(doc.tanggalPersalinan),
        });
      }
    }

    rows.sort((a, b) => a._raw - b._raw);

    for (const r of rows) {
      ws.addRow(r);
    }

    ws.getRow(1).font = { bold: true };
    ws.views = [{ state: "frozen", ySplit: 1 }];
    ["keluhan", "tindakan", "notes"].forEach((k) => {
      ws.getColumn(k).alignment = { wrapText: true, vertical: "top" };
    });

    if (rows.length === 0) {
      ws.addRow({
        name: `Tidak ada kunjungan nifas antara ${fromStr} dan ${toStr}`,
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `data-kunjungan-nifas-${fromStr}-sd-${toStr}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    return serverError(error, "Gagal mengekspor data persalinan");
  }
}
