"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetcher } from "@/lib/fetcher";
import { urlGambar, LOGO_BAWAAN } from "@/lib/suratView";
import { FormEdit, BagianForm } from "@/components/HalamanForm";
import Field from "@/components/Field";
import { SkeletonKartu } from "@/components/Skeleton";
import UnggahGambar from "@/components/master/UnggahGambar";

const KOP = [
  ["baris1", "Baris atas", "mis. BIDAN PRAKTIK MANDIRI"],
  ["baris2", "Nama klinik", "mis. KLINIK IYA"],
  ["alamat", "Alamat", "Alamat lengkap klinik"],
  ["telepon", "Telepon", "Nomor telepon"],
  ["kota", "Kota (baris tanggal)", "mis. Bitung"],
];

/**
 * Kop surat, logo, dan cap klinik — dipakai semua surat. Disalin ke surat
 * saat terbit; logo & cap baru menjadi versi gambar baru, jadi surat lama
 * tetap tercetak dengan kop dan cap yang dipakainya dulu.
 */
export default function TabKop() {
  const [data, setData] = useState(null);
  const [kop, setKop] = useState(null);
  const [gambar, setGambar] = useState({}); // { logo?, cap? } : undefined = tetap, null = hapus, string = baru
  const [busy, setBusy] = useState(false);

  const pakai = (d) => { setData(d); setKop({ ...d.kop }); setGambar({}); };

  useEffect(() => {
    fetcher("/api/master/surat").then((r) => pakai(r.data)).catch(() => toast.error("Gagal memuat kop surat"));
  }, []);

  if (!kop) return <SkeletonKartu baris={5} label="Memuat kop surat..." />;

  const dirty = JSON.stringify(kop) !== JSON.stringify(data.kop) || Object.keys(gambar).length > 0;
  const src = (f, bawaan = "") => (gambar[f] === undefined ? urlGambar(data[`${f}Id`]) || bawaan : gambar[f] || bawaan);

  const simpan = async (e) => {
    e.preventDefault();
    if (!kop.baris2.trim()) return toast.error("Nama klinik wajib diisi");
    setBusy(true);
    try {
      const res = await fetcher("/api/master/surat", { method: "PATCH", body: JSON.stringify({ kop, ...gambar }) });
      pakai(res.data);
      toast.success("Kop & cap tersimpan. Berlaku untuk surat yang terbit berikutnya.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormEdit onSubmit={simpan} busy={busy} dirty={dirty} onBatal={() => pakai(data)}>
      <BagianForm no={1} judul="Kop Surat" ket="Tercetak di bagian atas semua surat.">
        {KOP.map(([k, label, ph]) => (
          <Field key={k} label={label} required={k === "baris2"}>
            <input value={kop[k] || ""} onChange={(e) => setKop((p) => ({ ...p, [k]: e.target.value }))} placeholder={ph} maxLength={200} className="field" />
          </Field>
        ))}
      </BagianForm>
      <BagianForm no={2} judul="Logo & Cap" ket="Surat yang sudah terbit tetap memakai logo dan cap lamanya.">
        <div className="grid sm:grid-cols-2 gap-5">
          <UnggahGambar
            label="Logo kop"
            src={src("logo", LOGO_BAWAAN)}
            onPilih={(v) => setGambar((p) => ({ ...p, logo: v }))}
            onHapus={data.logoId || gambar.logo ? () => setGambar((p) => ({ ...p, logo: null })) : undefined}
            labelHapus="Pakai logo bawaan"
          />
          <UnggahGambar
            label="Cap klinik"
            ket="PNG berlatar transparan. Dibubuhkan hanya di samping TTD digital petugas."
            src={src("cap")}
            onPilih={(v) => setGambar((p) => ({ ...p, cap: v }))}
            onHapus={() => setGambar((p) => ({ ...p, cap: null }))}
            labelHapus="Tanpa cap"
          />
        </div>
      </BagianForm>
    </FormEdit>
  );
}
