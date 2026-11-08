import { connectDB } from "@/lib/database";
import { Kb } from "@/models/kb";
import { errorResponse, serverError } from "@/lib/response";
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

function startOfMonth(year, month) {
  // month: 1-12
  return new Date(year, month - 1, 1, 0, 0, 0, 0);
}
function startOfNextMonth(year, month) {
  return new Date(year, month, 1, 0, 0, 0, 0);
}

function idDate(d) {
  try {
    return d ? new Date(d).toLocaleDateString("id-ID") : "-";
  } catch {
    return "-";
  }
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const month = parseInt(searchParams.get("month"), 10);
    const year = parseInt(searchParams.get("year"), 10);
    const mode = (searchParams.get("mode") || "visits").toLowerCase(); // visits | people

    if (!month || !year || month < 1 || month > 12 || year < 1900) {
      return errorResponse(
        "Parameter month & year wajib dan valid. Contoh: ?month=1&year=2026",
        400,
        "Invalid month/year"
      );
    }

    const from = startOfMonth(year, month);
    const to = startOfNextMonth(year, month);

    /**
     * Filter: ambil KB yang punya visits.date dalam range bulan itu
     * Note: query ini mengembalikan dokumen KB yang match,
     * tapi array visits-nya tetap lengkap, jadi nanti kita filter lagi di JS.
     */
    const data = await Kb.find({
      "visits.date": { $gte: from, $lt: to },
    })
      .sort({ name: 1 })
      .lean();

    const workbook = new ExcelJS.Workbook();

    // ===== MODE A: satu baris per kunjungan (Laporan Bulanan) =====
    if (mode === "visits") {
      const ws = workbook.addWorksheet(`KB ${month}-${year}`);

      ws.columns = [
        { header: "Tanggal Kunjungan", key: "visitDate", width: 16 },
        { header: "Tanggal Kembali", key: "returnDate", width: 16 },
        { header: "Metode", key: "metode", width: 18 },
        { header: "Catatan", key: "notes", width: 30 },

        { header: "Nama", key: "name", width: 22 },
        { header: "NIK", key: "nik", width: 18 },
        { header: "Tanggal Lahir", key: "dateOfBirth", width: 15 },
        { header: "Alamat", key: "address", width: 28 },
        { header: "Jumlah Anak", key: "numberOfChildren", width: 12 },
        { header: "Metode Pernah Dipakai", key: "metodes", width: 30 },
      ];

      // 1) flatten semua kunjungan bulan ini -> rows
      const rows = [];

      for (const kb of data) {
        const visits = Array.isArray(kb?.visits) ? kb.visits : [];

        for (const v of visits) {
          // pastikan date valid agar tidak silently skip
          const visitDateObj = v?.date ? new Date(v.date) : null;
          const isValidVisitDate =
            visitDateObj instanceof Date &&
            !Number.isNaN(visitDateObj.getTime());

          if (!isValidVisitDate) continue;

          // filter range bulan
          if (visitDateObj < from || visitDateObj >= to) continue;

          rows.push({
            // raw untuk sorting
            _visitDateRaw: visitDateObj.getTime(),
            _nameRaw: kb?.name || "",

            visitDate: idDate(v.date),
            returnDate: idDate(v.returnDate),
            metode: v?.metode || "-",
            notes: v?.notes || "-",

            name: kb?.name || "-",
            nik: kb?.nik || "-",
            dateOfBirth: idDate(kb?.dateOfBirth),
            address: kb?.address || "-",
            numberOfChildren: kb?.numberOfChildren || 0,
            metodes:
              Array.isArray(kb?.metodes) && kb.metodes.length > 0
                ? kb.metodes.join(", ")
                : "-",
          });
        }
      }

      // 2) sort by tanggal kunjungan, lalu nama (biar stabil)
      rows.sort((a, b) => {
        const t = a._visitDateRaw - b._visitDateRaw;
        if (t !== 0) return t;

        return String(a._nameRaw).localeCompare(String(b._nameRaw), "id", {
          sensitivity: "base",
        });
      });

      // 3) tulis ke worksheet
      for (const r of rows) {
        ws.addRow({
          visitDate: r.visitDate,
          returnDate: r.returnDate,
          metode: r.metode,
          notes: r.notes,

          name: r.name,
          nik: r.nik,
          dateOfBirth: r.dateOfBirth,
          address: r.address,
          numberOfChildren: r.numberOfChildren,
          metodes: r.metodes,
        });
      }

      // style header sederhana
      ws.getRow(1).font = { bold: true };
      ws.views = [{ state: "frozen", ySplit: 1 }];

      // wrap catatan biar tidak kepotong
      ws.getColumn("notes").alignment = { wrapText: true, vertical: "top" };

      if (rows.length === 0) {
        ws.addRow({
          visitDate: "-",
          returnDate: "-",
          metode: "-",
          notes: `Tidak ada kunjungan pada ${month}-${year}`,
          name: "-",
          nik: "-",
          dateOfBirth: "-",
          address: "-",
          numberOfChildren: 0,
          metodes: "-",
        });
      }
    }

    // ===== MODE B: satu baris per orang (unik), visits hanya bulan itu =====
    else if (mode === "people") {
      const ws = workbook.addWorksheet(`KB-ORANG ${month}-${year}`);

      ws.columns = [
        { header: "Nama", key: "name", width: 22 },
        { header: "NIK", key: "nik", width: 18 },
        { header: "Tanggal Lahir", key: "dateOfBirth", width: 15 },
        { header: "Alamat", key: "address", width: 28 },
        { header: "Jumlah Anak", key: "numberOfChildren", width: 12 },
        { header: "Metode Pernah Dipakai", key: "metodes", width: 30 },

        { header: "Kunjungan Bulan Ini", key: "visits", width: 60 },
      ];

      for (const kb of data) {
        const monthlyVisits = (kb.visits || []).filter((v) => {
          const d = new Date(v.date);
          return d >= from && d < to;
        });

        const formattedVisits = monthlyVisits
          .map((v, idx) => {
            const tanggalKunjungan = idDate(v.date);
            const tanggalKembali = idDate(v.returnDate);
            const metode = v.metode || "-";
            const catatan = v.notes || "-";

            return `Kunjungan ${
              idx + 1
            }: Tanggal: ${tanggalKunjungan}, Kembali: ${tanggalKembali}, Metode: ${metode}, Catatan: ${catatan}`;
          })
          .join("\n");

        ws.addRow({
          name: kb.name,
          nik: kb.nik,
          dateOfBirth: idDate(kb.dateOfBirth),
          address: kb.address || "-",
          numberOfChildren: kb.numberOfChildren || 0,
          metodes:
            Array.isArray(kb.metodes) && kb.metodes.length > 0
              ? kb.metodes.join(", ")
              : "-",
          visits: formattedVisits || "-",
        });
      }

      ws.getRow(1).font = { bold: true };
      ws.views = [{ state: "frozen", ySplit: 1 }];
      ws.getColumn("visits").alignment = { wrapText: true, vertical: "top" };
    } else {
      return errorResponse(
        "mode tidak valid. Gunakan mode=visits atau mode=people",
        400,
        "Invalid mode"
      );
    }

    const buffer = await workbook.xlsx.writeBuffer();

    const filename =
      mode === "people"
        ? `data-kb-orang-${year}-${String(month).padStart(2, "0")}.xlsx`
        : `data-kb-kunjungan-${year}-${String(month).padStart(2, "0")}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    return serverError(error, "Gagal mengekspor data KB");
  }
}
