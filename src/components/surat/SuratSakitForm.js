"use client";

import { CalendarRange } from "lucide-react";
import { FokusContext, Kartu, Isian, Input, Saklar, keInputTanggal, hariIni, hitungUmur } from "@/components/surat/FormKit";
import PilihPasien from "@/components/surat/PilihPasien";
import PilihPetugas from "@/components/surat/PilihPetugas";
import { lamaHari, terbilang } from "@/lib/suratView";
import { tanggalPendek } from "@/lib/tanggal";

export function formSakitKosong(penandatangan = []) {
  const aktif = penandatangan.filter((p) => p.aktif);
  const dokter = aktif.find((p) => p.jabatan === "Dokter");
  return {
    tanggalSurat: hariIni(),
    nama: "",
    umur: "",
    pekerjaan: "",
    alamat: "",
    mulai: hariIni(),
    selesai: hariIni(),
    pemeriksa: { penandatanganId: (dokter || aktif[0])?._id || "" },
    ttdBasah: false,
  };
}

export function sakitKeForm(d) {
  return {
    tanggalSurat: keInputTanggal(d.tanggalSurat),
    nama: d.nama || "",
    umur: d.umur ?? "",
    pekerjaan: d.pekerjaan || "",
    alamat: d.alamat || "",
    mulai: keInputTanggal(d.mulai),
    selesai: keInputTanggal(d.selesai),
    pemeriksa: { penandatanganId: d.pemeriksa?.penandatanganId || "" },
    ttdBasah: !!d.ttdBasah,
  };
}

export default function SuratSakitForm({ form, setForm, disabled = false, onFokus, penandatangan }) {
  const ubah = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const lama = form.mulai && form.selesai ? lamaHari(form.mulai, form.selesai) : 0;

  return (
    <FokusContext.Provider value={onFokus || (() => {})}>
      <fieldset disabled={disabled} className="space-y-4 daftar-bagian min-w-0">
        <legend className="sr-only">Isi surat keterangan sakit</legend>

        <Kartu
          judul="Yang Diterangkan Sakit"
          aksi={
            <PilihPasien
              disabled={disabled}
              onPilih={(o) =>
                setForm((p) => ({ ...p, nama: o.nama, umur: hitungUmur(o.tanggalLahir, p.tanggalSurat), alamat: o.alamat }))
              }
            />
          }
        >
          <Isian label="Nama Lengkap" required fokus="nama">
            <Input value={form.nama} onChange={(v) => ubah("nama", v)} placeholder="Nama lengkap" maxLength={100} autoComplete="off" />
          </Isian>
          <div className="grid grid-cols-1 sm:grid-cols-[8rem_1fr] gap-4">
            <Isian label="Umur (tahun)" fokus="umur">
              <Input type="number" min="0" max="150" angka value={form.umur} onChange={(v) => ubah("umur", v)} />
            </Isian>
            <Isian label="Pekerjaan" fokus="pekerjaan">
              <Input value={form.pekerjaan} onChange={(v) => ubah("pekerjaan", v)} placeholder="mis. Pelajar, Wiraswasta" maxLength={100} />
            </Isian>
          </div>
          <Isian label="Alamat" fokus="alamat">
            <Input value={form.alamat} onChange={(v) => ubah("alamat", v)} placeholder="Alamat lengkap" maxLength={300} />
          </Isian>
        </Kartu>

        <Kartu judul="Masa Istirahat" ket="Jumlah hari dihitung otomatis, termasuk hari mulai dan selesai.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Isian label="Mulai Tanggal" required fokus="mulai">
              <Input type="date" value={form.mulai} onChange={(v) => setForm((p) => ({ ...p, mulai: v, selesai: p.selesai < v ? v : p.selesai }))} />
            </Isian>
            <Isian label="Sampai Tanggal" required fokus="selesai">
              <Input type="date" value={form.selesai} min={form.mulai} onChange={(v) => ubah("selesai", v)} />
            </Isian>
          </div>
          <p aria-live="polite" className={`flex items-center gap-2 text-sm rounded-xl px-3.5 py-2.5 border ${lama > 0 ? "bg-brand-50 border-brand-100 text-brand-800" : "bg-red-50 border-red-200 text-red-700"}`}>
            <CalendarRange size={16} aria-hidden="true" className="shrink-0" />
            {lama > 0
              ? <span>Istirahat <b>{lama} ({terbilang(lama)}) hari</b>, {tanggalPendek(form.mulai)} s/d {tanggalPendek(form.selesai)}</span>
              : "Tanggal selesai tidak boleh sebelum tanggal mulai."}
          </p>
        </Kartu>

        <Kartu judul="Surat & Pemeriksa">
          <Isian label="Tanggal Surat" required fokus="tanggalSurat">
            <Input type="date" value={form.tanggalSurat} onChange={(v) => ubah("tanggalSurat", v)} />
          </Isian>
          <PilihPetugas
            label="Pemeriksa"
            value={form.pemeriksa.penandatanganId}
            onChange={(v) => ubah("pemeriksa", { penandatanganId: v })}
            daftar={penandatangan}
            disabled={disabled}
            fokus="pemeriksa"
            tanpaTtdDigital={form.ttdBasah}
          />
          <Saklar
            checked={form.ttdBasah}
            onChange={(v) => ubah("ttdBasah", v)}
            label="Pemeriksa tanda tangan basah"
            ket="Kolom tanda tangan dikosongkan dan cap tidak dibubuhkan — ditandatangani setelah dicetak."
            disabled={disabled}
          />
        </Kartu>
      </fieldset>
    </FokusContext.Provider>
  );
}
