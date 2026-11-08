"use client";

import { FaFileSignature } from "react-icons/fa";
import { tanggalPendek, tanggalPanjang } from "@/lib/tanggal";
import DaftarSurat, { Nomor } from "@/components/surat/DaftarSurat";

const Penolakan = ({ s }) =>
  s.keputusan === "menolak" && (
    <span className="ml-1.5 text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">Penolakan</span>
  );

const CFG = {
  api: "/api/consent",
  dasar: "/dashboard/consent",
  judul: "Persetujuan Tindakan",
  ket: "Informed consent tindakan medik",
  ikon: FaFileSignature,
  cari: "Cari nomor, nama, atau tindakan",
  kolom: [
    ["Nomor Surat", (s) => <Nomor nomor={s.nomorSurat} />],
    ["Yang Menyatakan", (s) => <span className="font-medium text-slate-800">{s.pembuat?.nama}</span>],
    ["Tindakan", (s) => <>{s.tindakan}<Penolakan s={s} /></>],
    ["Tanggal", (s) => tanggalPendek(s.tanggalSurat)],
  ],
  judulKartu: (s) => s.pembuat?.nama,
  isiKartu: (s) => (
    <>
      <p className="flex flex-wrap gap-x-3 gap-y-1"><Nomor nomor={s.nomorSurat} /><span>{tanggalPendek(s.tanggalSurat)}</span></p>
      <p className="text-slate-600">{s.tindakan}<Penolakan s={s} /></p>
    </>
  ),
  rincian: (s) => [["Yang menyatakan", s.pembuat?.nama], ["Tindakan", s.tindakan], ["Tanggal", tanggalPanjang(s.tanggalSurat)]],
};

export default function ConsentListPage() {
  return <DaftarSurat cfg={CFG} />;
}
