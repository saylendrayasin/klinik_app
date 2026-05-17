import { connectDB } from "@/lib/database";
import { Kehamilan } from "@/models/kehamilan";
import { errorResponse } from "@/lib/response";
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function calcUK(hpht, date) {
  return Math.floor((new Date(date) - new Date(hpht)) / (7 * MS_PER_DAY));
}

function calcTrimester(uk) {
  if (uk <= 12) return 1;
  if (uk <= 27) return 2;
  return 3;
}

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

function letakLabel(val) {
  const map = {
    kepala: "Kepala",
    sungsang: "Sungsang",
    lintang: "Lintang",
    belum_diketahui: "Belum Diketahui",
  };
  return map[val] || val || "-";
}

function statusLabel(val) {
  const map = {
    aktif: "Aktif",
    selesai: "Selesai",
    keguguran: "Keguguran",
    rujuk: "Rujuk",
  };
  return map[val] || val || "-";
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const mode = (searchParams.get("mode") || "visits").toLowerCase();

    if (!["aktif", "visits"].includes(mode)) {
      return errorResponse("mode tidak valid. Gunakan mode=aktif atau mode=visits", 400);
    }

    const workbook = new ExcelJS.Workbook();

    // ===== MODE aktif: snapshot semua ibu hamil aktif =====
    if (mode === "aktif") {
      const today = new Date();
      const data = await Kehamilan.find({ status: "aktif" })
        .sort({ name: 1 })
        .lean();

      const ws = workbook.addWorksheet("Ibu Hamil Aktif");
      ws.columns = [
        { header: "Nama", key: "name", width: 24 },
        { header: "NIK", key: "nik", width: 18 },
        { header: "Tanggal Lahir", key: "dateOfBirth", width: 15 },
        { header: "Alamat", key: "address", width: 30 },
        { header: "G/P/A", key: "gpa", width: 10 },
        { header: "HPHT", key: "hpht", width: 14 },
        { header: "HPL", key: "hpl", width: 14 },
        { header: "UK Saat Ini (mg)", key: "ukSekarang", width: 16 },
        { header: "Trimester", key: "trimesterSekarang", width: 12 },
        { header: "Total Kunjungan", key: "totalKunjungan", width: 15 },
        { header: "Kunjungan Terakhir", key: "kunjunganTerakhir", width: 18 },
        { header: "Jadwal Berikutnya", key: "jadwalBerikutnya", width: 18 },
        { header: "Status", key: "status", width: 12 },
      ];

      for (const doc of data) {
        const ukSekarang = doc.hpht ? calcUK(doc.hpht, today) : "-";
        const trimesterSekarang =
          typeof ukSekarang === "number" ? calcTrimester(ukSekarang) : "-";

        const sortedVisits = (doc.visits || []).sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        const lastVisit = sortedVisits[0];

        ws.addRow({
          name: doc.name || "-",
          nik: doc.nik || "-",
          dateOfBirth: idDate(doc.dateOfBirth),
          address: doc.address || "-",
          gpa: gpa(doc),
          hpht: idDate(doc.hpht),
          hpl: idDate(doc.hpl),
          ukSekarang: typeof ukSekarang === "number" ? ukSekarang : "-",
          trimesterSekarang:
            typeof trimesterSekarang === "number"
              ? `T${trimesterSekarang}`
              : "-",
          totalKunjungan: (doc.visits || []).length,
          kunjunganTerakhir: lastVisit ? idDate(lastVisit.date) : "-",
          jadwalBerikutnya: lastVisit?.jadwalBerikutnya
            ? idDate(lastVisit.jadwalBerikutnya)
            : "-",
          status: statusLabel(doc.status),
        });
      }

      ws.getRow(1).font = { bold: true };
      ws.views = [{ state: "frozen", ySplit: 1 }];

      if (data.length === 0) {
        ws.addRow({ name: "Tidak ada ibu hamil aktif saat ini" });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const now = new Date();
      const filename = `data-ibu-hamil-aktif-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}.xlsx`;

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });
    }

    // ===== MODE visits: kunjungan dalam rentang tanggal =====
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");

    if (!fromStr || !toStr) {
      return errorResponse(
        "Parameter from dan to wajib untuk mode visits. Contoh: ?mode=visits&from=2025-01-01&to=2025-03-31",
        400
      );
    }

    const from = new Date(`${fromStr}T00:00:00`);
    const to = new Date(`${toStr}T23:59:59`);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return errorResponse("Format tanggal tidak valid. Gunakan YYYY-MM-DD", 400);
    }

    if (from > to) {
      return errorResponse("Tanggal from tidak boleh lebih besar dari to", 400);
    }

    const data = await Kehamilan.find({
      "visits.date": { $gte: from, $lte: to },
    })
      .sort({ name: 1 })
      .lean();

    const ws = workbook.addWorksheet(
      `Kunjungan ${fromStr} sd ${toStr}`
    );

    ws.columns = [
      { header: "Tanggal Kunjungan", key: "visitDate", width: 18 },
      { header: "No. Kunjungan", key: "noKunjungan", width: 14 },
      { header: "Usia Kehamilan (mg)", key: "uk", width: 18 },
      { header: "Trimester", key: "trimester", width: 12 },
      { header: "Jadwal Berikutnya", key: "jadwalBerikutnya", width: 18 },
      { header: "BB (kg)", key: "bb", width: 10 },
      { header: "TD Sistol", key: "sistol", width: 11 },
      { header: "TD Diastol", key: "diastol", width: 11 },
      { header: "TFU (cm)", key: "tfu", width: 10 },
      { header: "DJJ (bpm)", key: "djj", width: 10 },
      { header: "Letak Janin", key: "letakJanin", width: 14 },
      { header: "Keluhan", key: "keluhan", width: 28 },
      { header: "Tindakan", key: "tindakan", width: 28 },
      { header: "Catatan", key: "notes", width: 28 },
      { header: "Nama Ibu", key: "name", width: 24 },
      { header: "NIK", key: "nik", width: 18 },
      { header: "Alamat", key: "address", width: 30 },
      { header: "HPHT", key: "hpht", width: 14 },
      { header: "HPL", key: "hpl", width: 14 },
      { header: "G/P/A", key: "gpa", width: 10 },
      { header: "Status", key: "status", width: 12 },
    ];

    const rows = [];

    for (const doc of data) {
      const allVisitsSorted = [...(doc.visits || [])].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      for (const v of doc.visits || []) {
        const vDate = v.date ? new Date(v.date) : null;
        if (!vDate || isNaN(vDate.getTime())) continue;
        if (vDate < from || vDate > to) continue;

        const kNo =
          allVisitsSorted.findIndex(
            (sv) => String(sv._id) === String(v._id)
          ) + 1;

        rows.push({
          _raw: vDate.getTime(),
          visitDate: idDate(v.date),
          noKunjungan: `K${kNo}`,
          uk: v.usiaKehamilan != null ? v.usiaKehamilan : "-",
          trimester: v.trimester ? `T${v.trimester}` : "-",
          jadwalBerikutnya: v.jadwalBerikutnya ? idDate(v.jadwalBerikutnya) : "-",
          bb: v.beratBadan != null ? v.beratBadan : "-",
          sistol: v.tekananDarahSistol != null ? v.tekananDarahSistol : "-",
          diastol: v.tekananDarahDiastol != null ? v.tekananDarahDiastol : "-",
          tfu: v.tfu != null ? v.tfu : "-",
          djj: v.djj != null ? v.djj : "-",
          letakJanin: letakLabel(v.letakJanin),
          keluhan: v.keluhan || "-",
          tindakan: v.tindakan || "-",
          notes: v.notes || "-",
          name: doc.name || "-",
          nik: doc.nik || "-",
          address: doc.address || "-",
          hpht: idDate(doc.hpht),
          hpl: idDate(doc.hpl),
          gpa: gpa(doc),
          status: statusLabel(doc.status),
        });
      }
    }

    rows.sort((a, b) => a._raw - b._raw);

    for (const r of rows) {
      ws.addRow({
        visitDate: r.visitDate,
        noKunjungan: r.noKunjungan,
        uk: r.uk,
        trimester: r.trimester,
        jadwalBerikutnya: r.jadwalBerikutnya,
        bb: r.bb,
        sistol: r.sistol,
        diastol: r.diastol,
        tfu: r.tfu,
        djj: r.djj,
        letakJanin: r.letakJanin,
        keluhan: r.keluhan,
        tindakan: r.tindakan,
        notes: r.notes,
        name: r.name,
        nik: r.nik,
        address: r.address,
        hpht: r.hpht,
        hpl: r.hpl,
        gpa: r.gpa,
        status: r.status,
      });
    }

    ws.getRow(1).font = { bold: true };
    ws.views = [{ state: "frozen", ySplit: 1 }];
    ["keluhan", "tindakan", "notes"].forEach((k) => {
      ws.getColumn(k).alignment = { wrapText: true, vertical: "top" };
    });

    if (rows.length === 0) {
      ws.addRow({
        visitDate: "-",
        noKunjungan: "-",
        keluhan: `Tidak ada kunjungan antara ${fromStr} dan ${toStr}`,
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `data-kunjungan-anc-${fromStr}-sd-${toStr}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("❌ Gagal ekspor data kehamilan:", error);
    return errorResponse("Gagal mengekspor data kehamilan", 500, error.message);
  }
}
