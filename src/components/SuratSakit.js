/**
 * Badan surat keterangan sakit.
 * Tanpa "use client" dan tanpa hook — lihat components/surat/Lembar.js.
 * Data masuk lewat sakitKeSurat() di lib/suratView.js.
 */

import { Lembar, KopSurat, JudulSurat, TempatTanggal, Baris, KolomTtd, sorotan } from "@/components/surat/Lembar";
import { tanggalPanjang } from "@/lib/tanggal";
import { terbilang } from "@/lib/suratView";

const titik = "…………………………………";

export default function SuratSakit({ surat, sorot = null }) {
  const s = surat;
  const hl = (k) => sorotan(sorot, k);
  const periode = hl("mulai") || hl("selesai");

  return (
    <Lembar draft={s.draft}>
      <KopSurat kop={s.kop} logo={s.logo} />
      <JudulSurat judul="SURAT KETERANGAN SAKIT" nomor={s.nomorSurat} />

      <div className="space-y-3 text-justify">
        <p>Yang bertanda tangan di bawah ini menerangkan bahwa:</p>
        <div className="pl-[10mm]">
          <table className="w-full">
            <tbody>
              <Baris label="Nama" kelas={hl("nama")}>{s.nama || titik}</Baris>
              <Baris label="Umur" kelas={hl("umur")}>{s.umur !== "" ? `${s.umur} tahun` : titik}</Baris>
              <Baris label="Pekerjaan" kelas={hl("pekerjaan")}>{s.pekerjaan || titik}</Baris>
              <Baris label="Alamat" kelas={hl("alamat")}>{s.alamat || titik}</Baris>
            </tbody>
          </table>
        </div>

        <p className={`leading-relaxed ${periode}`}>
          Berdasarkan hasil pemeriksaan saat ini perlu mendapat istirahat selama{" "}
          <b className="whitespace-nowrap">{s.lamaHari > 0 ? `${s.lamaHari} (${terbilang(s.lamaHari)})` : "…… (……)"} hari</b>, mulai
          tanggal <b className="whitespace-nowrap">{tanggalPanjang(s.mulai)}</b> s/d tanggal{" "}
          <b className="whitespace-nowrap">{tanggalPanjang(s.selesai)}</b>.
        </p>
        <p>Demikian surat keterangan ini dibuat dan dipergunakan seperlunya.</p>
      </div>

      <div className="hindari-potong mt-10 grid grid-cols-2">
        <div />
        <div>
          <TempatTanggal kota={s.kop.kota} tanggal={s.tanggalSurat} className={`text-center ${hl("tanggalSurat")}`} />
          <KolomTtd kolom={s.pemeriksa} kelas={hl("pemeriksa")} />
        </div>
      </div>
    </Lembar>
  );
}
