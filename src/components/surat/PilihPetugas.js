"use client";

import Link from "next/link";
import { BadgeCheck, PenLine } from "lucide-react";
import { Isian, Pilih } from "@/components/surat/FormKit";

/**
 * Pilih petugas dari master Penanda Tangan. Yang nonaktif tidak ditawarkan,
 * kecuali sudah terpilih di surat ini (supaya pilihan lama tetap terlihat).
 * `tanpaTtdDigital` = kolomnya pasti tanda tangan basah (mis. dicentang basah).
 */
export default function PilihPetugas({ label, value, onChange, daftar, disabled, fokus, required = true, tanpaTtdDigital = false, ketCap = true }) {
  const pilihan = daftar.filter((p) => p.aktif || String(p._id) === String(value));
  const terpilih = daftar.find((p) => String(p._id) === String(value));
  const digital = terpilih?.ttdId && !tanpaTtdDigital;

  return (
    <Isian label={label} required={required} fokus={fokus}>
      <Pilih value={value} onChange={onChange} disabled={disabled} aria-label={label}>
        <option value="">— Pilih petugas —</option>
        {pilihan.map((p) => (
          <option key={p._id} value={p._id}>
            {p.nama} — {p.jabatan}{p.aktif ? "" : " (nonaktif)"}
          </option>
        ))}
      </Pilih>
      {!daftar.length ? (
        <p className="text-xs text-amber-700">
          Belum ada petugas.{" "}
          <Link href="/dashboard/master?tab=penandatangan" className="font-semibold underline">Tambahkan di Master Data</Link>
        </p>
      ) : terpilih ? (
        <p className={`text-xs flex items-center gap-1.5 ${digital ? "text-emerald-700" : "text-slate-500"}`}>
          {digital ? <BadgeCheck size={14} aria-hidden="true" /> : <PenLine size={14} aria-hidden="true" />}
          {digital
            ? `Tanda tangan digital dari Master Data${ketCap ? " + cap klinik" : ""} dipasang saat terbit.`
            : terpilih.ttdId
              ? "Kolom dikosongkan untuk tanda tangan basah, tanpa cap."
              : "Belum ada tanda tangan di Master Data — kolom dikosongkan untuk tanda tangan basah."}
        </p>
      ) : null}
    </Isian>
  );
}
