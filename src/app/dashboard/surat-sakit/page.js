"use client";

import { FaFileMedical } from "react-icons/fa";
import { tanggalPendek, tanggalPanjang } from "@/lib/tanggal";
import DaftarSurat, { Nomor } from "@/components/surat/DaftarSurat";

const istirahat = (s) => `${s.lamaHari} hari · ${tanggalPendek(s.mulai)} – ${tanggalPendek(s.selesai)}`;

const CFG = {
  api: "/api/surat-sakit",
  dasar: "/dashboard/surat-sakit",
  judul: "Surat Keterangan Sakit",
  ket: "Surat istirahat untuk pasien",
  ikon: FaFileMedical,
  cari: "Cari nomor, nama, atau pekerjaan",
  kolom: [
    ["Nomor Surat", (s) => <Nomor nomor={s.nomorSurat} />],
    ["Nama", (s) => <span className="font-medium text-slate-800">{s.nama}</span>],
    ["Istirahat", istirahat],
    ["Tanggal", (s) => tanggalPendek(s.tanggalSurat)],
  ],
  judulKartu: (s) => s.nama,
  isiKartu: (s) => (
    <>
      <p className="flex flex-wrap gap-x-3 gap-y-1"><Nomor nomor={s.nomorSurat} /><span>{tanggalPendek(s.tanggalSurat)}</span></p>
      <p className="text-slate-600">Istirahat {istirahat(s)}</p>
    </>
  ),
  rincian: (s) => [["Nama", s.nama], ["Istirahat", istirahat(s)], ["Tanggal", tanggalPanjang(s.tanggalSurat)]],
};

export default function SuratSakitListPage() {
  return <DaftarSurat cfg={CFG} />;
}
