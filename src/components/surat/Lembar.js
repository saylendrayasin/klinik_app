/**
 * Bagian-bagian surat resmi A4 yang dipakai semua jenis surat.
 *
 * SENGAJA tanpa "use client" dan tanpa hook: halaman cetak (server) dan
 * pratinjau (klien) memakai komponen yang sama, jadi pratinjau mustahil
 * melenceng dari hasil cetak. Ukuran tetap 210mm — yang diskalakan untuk
 * layar kecil adalah pembungkusnya (PreviewSurat / LembarSkala).
 */

import { tanggalPanjang } from "@/lib/tanggal";

/** Penanda kolom yang sedang diisi di form, supaya terlihat mendarat di mana. */
export const sorotan = (sorot, kunci) =>
  sorot === kunci ? "bg-amber-200/80 ring-1 ring-amber-400 rounded-[2px]" : "";

export function Lembar({ draft, children }) {
  return (
    <div className="lembar relative mx-auto bg-white shadow-lg w-[210mm] min-h-[297mm] p-[15mm] text-black font-['Times_New_Roman',Times,serif] text-[12pt] leading-[1.35]">
      {draft && (
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <p className="text-[60pt] font-black text-slate-200/70 -rotate-[30deg] tracking-widest text-center leading-tight select-none font-sans">
            DRAF
            <br />
            <span className="text-[18pt]">BELUM TERBIT</span>
          </p>
        </div>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

export function KopSurat({ kop = {}, logo }) {
  return (
    <header>
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="Logo klinik" className="w-[25mm] h-[25mm] object-contain shrink-0" />
        <div className="flex-1 text-center leading-tight">
          {kop.baris1 && <p className="text-[13pt] font-bold uppercase tracking-wide">{kop.baris1}</p>}
          <p className="text-[21pt] font-bold uppercase tracking-wider">{kop.baris2}</p>
          {kop.alamat && <p className="text-[10.5pt] mt-1">{kop.alamat}</p>}
          {kop.telepon && <p className="text-[10.5pt]">Telp. {kop.telepon}</p>}
        </div>
        {/* Penyeimbang selebar logo: teks kop tepat di tengah kertas */}
        <div className="w-[25mm] shrink-0" />
      </div>
      <div className="mt-2 border-t-[3px] border-black" />
      <div className="mt-[2px] border-t border-black" />
    </header>
  );
}

export function JudulSurat({ judul, nomor }) {
  return (
    <div className="text-center mt-5 mb-4">
      <h2 className="text-[13pt] font-bold underline underline-offset-4 tracking-wide">{judul}</h2>
      <p className="mt-0.5">Nomor : {nomor || "…………………………"}</p>
    </div>
  );
}

/** "Bitung, 8 November 2026" */
export function TempatTanggal({ kota, tanggal, className = "" }) {
  return (
    <p className={className}>
      {kota || "…………"}, {tanggalPanjang(tanggal)}
    </p>
  );
}

/** Baris "Label : nilai" rata titik dua. */
export function Baris({ label, children, kelas = "" }) {
  return (
    <tr>
      <td className="align-top w-[42mm] py-[1px]">{label}</td>
      <td className="align-top w-[5mm] py-[1px]">:</td>
      <td className="align-top py-[1px]">
        <span className={kelas}>{children}</span>
      </td>
    </tr>
  );
}

/**
 * Pilihan yang tidak dipilih dicoret, seperti formulir kertas:
 * "PERSETUJUAN / ~~PENOLAKAN~~". Belum ada yang dipilih → tidak ada coretan.
 */
export function Pilihan({ opsi, nilai, pemisah = " / " }) {
  return opsi.map(([v, label], i) => (
    <span key={v}>
      {i > 0 && pemisah}
      {nilai && v !== nilai ? <s className="decoration-[1.5px]">{label}</s> : label}
    </span>
  ));
}

/**
 * Satu kolom tanda tangan. Tanpa gambar = kolom kosong untuk tanda tangan
 * basah; nama tetap tercetak di bawah garis (atau titik-titik bila belum ada).
 */
export function KolomTtd({ kolom, kelas = "" }) {
  if (!kolom) return <div />;
  const { judul, nama, nip, ttd, cap } = kolom;
  return (
    <div className={`text-center ${kelas}`}>
      <p>{judul}</p>
      <div className="relative h-[21mm] flex items-end justify-center">
        {/* Cap di belakang tanda tangan, sedikit bergeser dan miring seperti cap basah */}
        {cap && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cap}
            alt=""
            aria-hidden="true"
            className="absolute left-1/2 bottom-[1mm] h-[20mm] w-auto object-contain opacity-85 pointer-events-none"
            style={{ transform: "translateX(-78%) rotate(-10deg)" }}
          />
        )}
        {ttd && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ttd} alt={`Tanda tangan ${judul}`} className="relative max-h-[20mm] max-w-[80%] object-contain" />
        )}
      </div>
      <p className="font-bold underline underline-offset-2 break-words px-1">
        {nama || "(………………………………)"}
      </p>
      {nip && <p className="text-[11pt]">NIP. {nip}</p>}
    </div>
  );
}
