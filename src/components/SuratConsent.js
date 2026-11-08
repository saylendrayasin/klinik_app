/**
 * Badan surat persetujuan / penolakan tindakan medik (informed consent).
 * Tanpa "use client" dan tanpa hook — lihat components/surat/Lembar.js.
 * Data masuk lewat consentKeSurat() di lib/suratView.js.
 */

import { Lembar, KopSurat, JudulSurat, TempatTanggal, Baris, Pilihan, KolomTtd, sorotan } from "@/components/surat/Lembar";

const KEPUTUSAN = [["setuju", "PERSETUJUAN"], ["menolak", "PENOLAKAN"]];
const JK = [["L", "Laki-laki"], ["P", "Perempuan"]];
const HUBUNGAN = [
  ["diri_sendiri", "diri saya sendiri"],
  ["anak", "Anak"],
  ["istri", "Isteri"],
  ["suami", "Suami"],
  ["ayah", "Ayah"],
  ["ibu", "Ibu"],
];

const titik = "…………………………………";

function DataOrang({ orang, awalan, sorot }) {
  const hl = (k) => sorotan(sorot, `${awalan}.${k}`);
  return (
    <table className="w-full">
      <tbody>
        <Baris label="Nama" kelas={hl("nama")}>{orang.nama || titik}</Baris>
        <Baris label="Umur / Jenis Kelamin">
          <span className={hl("umur")}>{orang.umur || orang.umur === 0 ? `${orang.umur} tahun` : "……… tahun"}</span>
          {" / "}
          <span className={hl("jenisKelamin")}>
            <Pilihan opsi={JK} nilai={orang.jenisKelamin} />
          </span>
        </Baris>
        <Baris label="Alamat" kelas={hl("alamat")}>{orang.alamat || titik}</Baris>
      </tbody>
    </table>
  );
}

export default function SuratConsent({ surat, sorot = null }) {
  const s = surat;
  const hl = (k) => sorotan(sorot, k);
  const pelaksana = (s.jabatanPetugas || "petugas").toLowerCase();
  const adaSaksi = s.saksiKlinik || s.saksiKeluarga;

  return (
    <Lembar draft={s.draft}>
      <KopSurat kop={s.kop} logo={s.logo} />
      <JudulSurat judul="INFORMED CONSENT TINDAKAN MEDIK" nomor={s.nomorSurat} />

      <div className="space-y-1.5 text-justify">
        <p>Saya yang bertanda tangan di bawah ini:</p>
        <DataOrang orang={s.pembuat} awalan="pembuat" sorot={sorot} />
        <p>Menyatakan dengan sesungguhnya telah memberikan</p>

        <p className={`text-center font-bold tracking-wide py-1.5 ${hl("keputusan")}`}>
          <Pilihan opsi={KEPUTUSAN} nilai={s.keputusan} />
        </p>

        <p>
          Untuk dilakukan tindakan medik berupa:{" "}
          <span className={`font-bold ${hl("tindakan")}`}>{s.tindakan || titik}</span>
        </p>
        <p className={hl("hubungan")}>
          Terhadap <Pilihan opsi={HUBUNGAN} nilai={s.hubungan} /> saya dengan:
        </p>
        <DataOrang orang={s.pasien} awalan="pasien" sorot={sorot} />

        <p className="pt-2 indent-[10mm]">
          Yang tujuan, sifat dan perlunya tindakan medik tersebut di atas, serta risiko yang dapat
          ditimbulkannya dan upaya mengatasinya telah cukup dijelaskan oleh{" "}
          <span className={hl("petugas")}>{pelaksana}</span> dan telah saya mengerti sepenuhnya.
        </p>
        <p className="indent-[10mm]">
          Demikian pernyataan ini saya buat dengan penuh kesadaran dan tanpa paksaan.
        </p>
      </div>

      <div className="hindari-potong mt-4">
        <TempatTanggal kota={s.kop.kota} tanggal={s.tanggalSurat} className={`text-center mb-1 ${hl("tanggalSurat")}`} />
        <div className="grid grid-cols-2 gap-x-10 gap-y-5">
          <KolomTtd kolom={s.petugas} kelas={hl("petugas")} />
          <KolomTtd kolom={s.pembuatTtd} kelas={hl("ttdPembuat")} />
          {adaSaksi && (
            <>
              <KolomTtd kolom={s.saksiKlinik} kelas={hl("saksiKlinik")} />
              <KolomTtd kolom={s.saksiKeluarga} kelas={hl("saksiKeluarga")} />
            </>
          )}
        </div>
      </div>
    </Lembar>
  );
}
