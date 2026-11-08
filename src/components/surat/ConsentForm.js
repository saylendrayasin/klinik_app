"use client";

import { Check, Info, PenLine } from "lucide-react";
import { FokusContext, Kartu, Isian, Input, Pilih, Segmen, Saklar, keInputTanggal, hariIni, hitungUmur } from "@/components/surat/FormKit";
import PilihPasien from "@/components/surat/PilihPasien";
import PilihPetugas from "@/components/surat/PilihPetugas";

const HUBUNGAN = [
  ["diri_sendiri", "Diri sendiri"],
  ["anak", "Anak"],
  ["istri", "Isteri"],
  ["suami", "Suami"],
  ["ayah", "Ayah"],
  ["ibu", "Ibu"],
];
const JK = [["L", "Laki-laki"], ["P", "Perempuan"]];
const MODE = [["gambar", "Gores di layar"], ["basah", "TTD basah"]];

const orangKosong = () => ({ nama: "", umur: "", jenisKelamin: "", alamat: "" });

export function formConsentKosong(penandatangan = []) {
  const aktif = penandatangan.filter((p) => p.aktif);
  return {
    tanggalSurat: hariIni(),
    keputusan: "setuju",
    tindakan: "",
    pembuat: orangKosong(),
    hubungan: "diri_sendiri",
    pasien: orangKosong(),
    petugas: { penandatanganId: aktif[0]?._id || "" },
    ttdPembuat: { mode: "gambar" },
    saksiKlinik: { aktif: true, dariMaster: true, penandatanganId: "", nama: "", mode: "gambar" },
    saksiKeluarga: { aktif: true, nama: "", mode: "gambar" },
  };
}

export function consentKeForm(d) {
  const orang = (o = {}) => ({ nama: o.nama || "", umur: o.umur ?? "", jenisKelamin: o.jenisKelamin || "", alamat: o.alamat || "" });
  return {
    tanggalSurat: keInputTanggal(d.tanggalSurat),
    keputusan: d.keputusan,
    tindakan: d.tindakan || "",
    pembuat: orang(d.pembuat),
    hubungan: d.hubungan,
    pasien: orang(d.pasien),
    petugas: { penandatanganId: d.petugas?.penandatanganId || "" },
    ttdPembuat: { mode: d.ttdPembuat?.mode || "gambar" },
    saksiKlinik: {
      aktif: d.saksiKlinik?.aktif !== false,
      // Hanya untuk form: saksi dipilih dari master atau diketik manual.
      dariMaster: !!d.saksiKlinik?.penandatanganId || !d.saksiKlinik?.nama,
      penandatanganId: d.saksiKlinik?.penandatanganId || "",
      nama: d.saksiKlinik?.penandatanganId ? "" : d.saksiKlinik?.nama || "",
      mode: d.saksiKlinik?.mode || "gambar",
    },
    saksiKeluarga: {
      aktif: d.saksiKeluarga?.aktif !== false,
      nama: d.saksiKeluarga?.nama || "",
      mode: d.saksiKeluarga?.mode || "gambar",
    },
  };
}

/** Penanda tangan yang tidak dari master — merekalah yang menggores di layar atau TTD basah. */
export function penggores(form) {
  const daftar = [{ kunci: "pembuat", judul: "Yang Membuat Pernyataan", nama: form.pembuat.nama, mode: form.ttdPembuat.mode, kunciNama: true }];
  const sk = form.saksiKlinik;
  if (sk.aktif && !sk.dariMaster) daftar.push({ kunci: "saksiKlinik", judul: "Saksi dari Klinik", nama: sk.nama, mode: sk.mode });
  const sp = form.saksiKeluarga;
  if (sp.aktif) daftar.push({ kunci: "saksiKeluarga", judul: "Saksi dari Keluarga Pasien", nama: sp.nama, mode: sp.mode });
  return daftar;
}

/**
 * Form isi surat persetujuan tindakan.
 * - `goresan` { pembuat, saksiKlinik, saksiKeluarga } = dataUrl yang sudah digores (belum terkirim)
 * - `onGores(kunci)` membuka modal tanda tangan; tidak diisi di halaman buat baru
 *   (goresan dikirim saat terbit, jadi dibubuhkan setelah draf tersimpan).
 */
export default function ConsentForm({ form, setForm, disabled = false, onFokus, penandatangan, saranTindakan = [], goresan = {}, onGores }) {
  const ubah = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const ubahDi = (grup, k, v) => setForm((p) => ({ ...p, [grup]: { ...p[grup], [k]: v } }));
  const salinPasien = (grup) => (o) =>
    setForm((p) => ({
      ...p,
      [grup]: { nama: o.nama, umur: hitungUmur(o.tanggalLahir, p.tanggalSurat), jenisKelamin: o.jenisKelamin, alamat: o.alamat },
    }));

  const untukDiri = form.hubungan === "diri_sendiri";
  const sk = form.saksiKlinik;
  const sp = form.saksiKeluarga;

  return (
    <FokusContext.Provider value={onFokus || (() => {})}>
      <fieldset disabled={disabled} className="space-y-4 daftar-bagian min-w-0">
        <legend className="sr-only">Isi surat persetujuan tindakan</legend>

        <Kartu judul="Surat & Tindakan">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Isian label="Tanggal Surat" required fokus="tanggalSurat">
              <Input type="date" value={form.tanggalSurat} onChange={(v) => ubah("tanggalSurat", v)} />
            </Isian>
            <Isian label="Pernyataan" required fokus="keputusan">
              <Segmen name="keputusan" value={form.keputusan} onChange={(v) => ubah("keputusan", v)} opsi={[["setuju", "Persetujuan"], ["menolak", "Penolakan"]]} disabled={disabled} />
            </Isian>
          </div>
          <Isian label="Tindakan Medik" required fokus="tindakan" ket="Pilih dari saran atau ketik bebas.">
            <Input value={form.tindakan} onChange={(v) => ubah("tindakan", v)} placeholder="mis. Pemasangan IUD" list="saran-tindakan" maxLength={200} />
          </Isian>
          <datalist id="saran-tindakan">
            {saranTindakan.map((t) => <option key={t} value={t} />)}
          </datalist>
        </Kartu>

        <Kartu
          judul="Yang Membuat Pernyataan"
          ket="Orang yang menandatangani surat ini."
          aksi={<PilihPasien onPilih={salinPasien("pembuat")} disabled={disabled} />}
        >
          <DataOrang grup="pembuat" orang={form.pembuat} ubahDi={ubahDi} disabled={disabled} />
        </Kartu>

        <Kartu
          judul="Pasien"
          ket="Yang akan menjalani tindakan."
          aksi={!untukDiri && <PilihPasien onPilih={salinPasien("pasien")} disabled={disabled} />}
        >
          <Isian label="Tindakan dilakukan terhadap" required fokus="hubungan">
            <Pilih value={form.hubungan} onChange={(v) => ubah("hubungan", v)}>
              {HUBUNGAN.map(([v, l]) => <option key={v} value={v}>{l}{v === "diri_sendiri" ? "" : " yang membuat pernyataan"}</option>)}
            </Pilih>
          </Isian>
          {untukDiri ? (
            <p className="flex gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
              <Info size={16} className="text-brand-600 shrink-0 mt-0.5" aria-hidden="true" />
              Data pasien sama dengan yang membuat pernyataan.
            </p>
          ) : (
            <DataOrang grup="pasien" orang={form.pasien} ubahDi={ubahDi} disabled={disabled} />
          )}
        </Kartu>

        <Kartu judul="Petugas & Saksi">
          <PilihPetugas
            label="Petugas yang menjelaskan"
            value={form.petugas.penandatanganId}
            onChange={(v) => ubah("petugas", { penandatanganId: v })}
            daftar={penandatangan}
            disabled={disabled}
            fokus="petugas"
          />

          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <Saklar checked={sk.aktif} onChange={(v) => ubahDi("saksiKlinik", "aktif", v)} label="Saksi dari klinik" disabled={disabled} />
            {sk.aktif && (
              <>
                <Isian label="Sumber saksi" fokus="saksiKlinik">
                  <Segmen
                    name="sumber-saksi"
                    value={sk.dariMaster ? "master" : "manual"}
                    onChange={(v) =>
                      setForm((p) => ({
                        ...p,
                        saksiKlinik: { ...p.saksiKlinik, dariMaster: v === "master", penandatanganId: v === "master" ? p.saksiKlinik.penandatanganId : "" },
                      }))
                    }
                    opsi={[["master", "Dari Master Data"], ["manual", "Ketik manual"]]}
                    disabled={disabled}
                  />
                </Isian>
                {sk.dariMaster ? (
                  <PilihPetugas
                    label="Saksi dari klinik"
                    value={sk.penandatanganId}
                    onChange={(v) => ubahDi("saksiKlinik", "penandatanganId", v)}
                    daftar={penandatangan}
                    disabled={disabled}
                    fokus="saksiKlinik"
                    ketCap={false}
                  />
                ) : (
                  <Isian label="Nama saksi dari klinik" required fokus="saksiKlinik">
                    <Input value={sk.nama} onChange={(v) => ubahDi("saksiKlinik", "nama", v)} placeholder="Nama lengkap" maxLength={100} />
                  </Isian>
                )}
              </>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <Saklar checked={sp.aktif} onChange={(v) => ubahDi("saksiKeluarga", "aktif", v)} label="Saksi dari keluarga pasien" disabled={disabled} />
            {sp.aktif && (
              <Isian label="Nama saksi dari keluarga" fokus="saksiKeluarga" ket="Boleh dikosongkan bila ditandatangani basah — namanya ditulis tangan.">
                <Input value={sp.nama} onChange={(v) => ubahDi("saksiKeluarga", "nama", v)} placeholder="Nama lengkap" maxLength={100} />
              </Isian>
            )}
          </div>
        </Kartu>

        <Kartu judul="Cara Tanda Tangan" ket="Petugas dari Master Data ditandatangani otomatis. Yang lain menggores di layar atau tanda tangan basah setelah dicetak.">
          {penggores(form).map((g) => (
            <BarisGoresan
              key={g.kunci}
              g={g}
              dataUrl={goresan[g.kunci]}
              onMode={(m) => (g.kunci === "pembuat" ? ubah("ttdPembuat", { mode: m }) : ubahDi(g.kunci, "mode", m))}
              onGores={onGores && (() => onGores(g.kunci))}
              disabled={disabled}
            />
          ))}
          {!onGores && (
            <p className="text-xs text-slate-500">Goresan tanda tangan dibubuhkan setelah draf disimpan, tepat sebelum surat diterbitkan.</p>
          )}
        </Kartu>
      </fieldset>
    </FokusContext.Provider>
  );
}

function DataOrang({ grup, orang, ubahDi, disabled }) {
  return (
    <>
      <Isian label="Nama Lengkap" required fokus={`${grup}.nama`}>
        <Input value={orang.nama} onChange={(v) => ubahDi(grup, "nama", v)} placeholder="Nama lengkap" maxLength={100} autoComplete="off" />
      </Isian>
      <div className="grid grid-cols-1 sm:grid-cols-[8rem_1fr] gap-4">
        <Isian label="Umur (tahun)" fokus={`${grup}.umur`}>
          <Input type="number" min="0" max="150" angka value={orang.umur} onChange={(v) => ubahDi(grup, "umur", v)} />
        </Isian>
        <Isian label="Jenis Kelamin" fokus={`${grup}.jenisKelamin`}>
          <Segmen name={`${grup}-jk`} value={orang.jenisKelamin} onChange={(v) => ubahDi(grup, "jenisKelamin", v)} opsi={JK} disabled={disabled} />
        </Isian>
      </div>
      <Isian label="Alamat" fokus={`${grup}.alamat`}>
        <Input value={orang.alamat} onChange={(v) => ubahDi(grup, "alamat", v)} placeholder="Alamat lengkap" maxLength={300} />
      </Isian>
    </>
  );
}

function BarisGoresan({ g, dataUrl, onMode, onGores, disabled }) {
  const ada = !!dataUrl;
  return (
    <div className="rounded-xl border border-slate-200 p-3.5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800">{g.judul}</p>
          <p className="text-xs text-slate-500 truncate">{g.nama || "nama belum diisi"}</p>
        </div>
        <Isian label={`Cara tanda tangan ${g.judul}`} className="[&>span]:sr-only">
          <Segmen name={`mode-${g.kunci}`} value={g.mode} onChange={onMode} opsi={MODE} disabled={disabled} />
        </Isian>
      </div>
      {g.mode === "gambar" && onGores && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-16 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden">
            {ada ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dataUrl} alt={`Tanda tangan ${g.judul}`} className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-xs text-slate-400">belum digores</span>
            )}
          </div>
          <button
            type="button"
            onClick={onGores}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 min-h-11 px-3.5 rounded-xl text-sm font-semibold bg-brand-50 hover:bg-brand-600 text-brand-700 hover:text-white border border-brand-200 hover:border-brand-600 transition shrink-0"
          >
            {ada ? <Check size={15} aria-hidden="true" /> : <PenLine size={15} aria-hidden="true" />}
            {ada ? "Ulangi" : "Gores TTD"}
          </button>
        </div>
      )}
    </div>
  );
}
