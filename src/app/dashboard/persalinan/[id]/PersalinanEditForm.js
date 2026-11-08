"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetcher } from "@/lib/fetcher";
import toast from "react-hot-toast";
import Field from "@/components/Field";
import { FormEdit, BagianForm } from "@/components/HalamanForm";
import KartuStatus from "@/components/KartuStatus";

function formDari(p) {
  return {
    name: p.name || "",
    nik: p.nik || "",
    dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().slice(0, 10) : "",
    address: p.address || "",
    phone: p.phone || "",
    bloodType: p.bloodType || "",
    gravida: p.gravida ?? 1,
    para: p.para ?? 0,
    abortus: p.abortus ?? 0,
    tanggalPersalinan: p.tanggalPersalinan ? new Date(p.tanggalPersalinan).toISOString().slice(0, 10) : "",
    usiaKehamilanSaatPersalinan: p.usiaKehamilanSaatPersalinan ?? "",
    lamaPersalinanKala1: p.lamaPersalinanKala1 ?? "",
    lamaPersalinanKala2: p.lamaPersalinanKala2 ?? "",
    lamaPersalinanKala3: p.lamaPersalinanKala3 ?? "",
    lamaPersalinanKala4: p.lamaPersalinanKala4 ?? "",
    kondisiKetuban: p.kondisiKetuban || "",
    kondisiPerineumPersalinan: p.kondisiPerineumPersalinan || "",
    plasentaLengkap: p.plasentaLengkap || "",
    tekananDarahSistol: p.tekananDarahSistol ?? "",
    tekananDarahDiastol: p.tekananDarahDiastol ?? "",
    beratBadan: p.beratBadan ?? "",
    pendarahan: p.pendarahan ?? "",
    kondisiIbu: p.kondisiIbu || "baik",
    komplikasiIbu: p.komplikasiIbu || "",
    tindakanIbu: p.tindakanIbu || "",
    notes: p.notes || "",
  };
}

export default function PersalinanEditForm({ persalinan, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(() => formDari(persalinan));
  const tersimpan = useMemo(() => formDari(persalinan), [persalinan]);
  // Angka dibandingkan sebagai teks: input mengembalikan "32", server menyimpan 32.
  const sama = (a, b) => JSON.stringify(a, (_, v) => (typeof v === "number" ? String(v) : v)) === JSON.stringify(b, (_, v) => (typeof v === "number" ? String(v) : v));
  const dirty = !sama(form, tersimpan);

  // Setelah simpan, isi form diganti dengan nilai dari server. Setelah ubah
  // status tidak — isian yang belum disimpan harus tetap ada.
  const segarkanForm = useRef(false);
  useEffect(() => {
    if (!segarkanForm.current) return;
    segarkanForm.current = false;
    setForm(formDari(persalinan));
  }, [persalinan]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Menyimpan perubahan...");

    const num = (v) => (v !== "" && v != null ? Number(v) : undefined);
    const cleanData = {
      ...form,
      tanggalPersalinan: form.tanggalPersalinan || null,
      gravida: Number(form.gravida) || 1,
      para: Number(form.para) || 0,
      abortus: Number(form.abortus) || 0,
      usiaKehamilanSaatPersalinan: num(form.usiaKehamilanSaatPersalinan),
      lamaPersalinanKala1: num(form.lamaPersalinanKala1),
      lamaPersalinanKala2: num(form.lamaPersalinanKala2),
      lamaPersalinanKala3: num(form.lamaPersalinanKala3),
      lamaPersalinanKala4: num(form.lamaPersalinanKala4),
      tekananDarahSistol: num(form.tekananDarahSistol),
      tekananDarahDiastol: num(form.tekananDarahDiastol),
      beratBadan: num(form.beratBadan),
      pendarahan: num(form.pendarahan),
    };

    try {
      await fetcher(`/api/persalinan/${persalinan._id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "updateData", data: cleanData }),
      });
      segarkanForm.current = true;
      await onRefresh();
      toast.success("Data berhasil disimpan", { id: toastId });
    } catch (e) {
      toast.error(e?.message || "Gagal menyimpan", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    const toastId = toast.loading("Mengubah status...");
    try {
      await fetcher(`/api/persalinan/${persalinan._id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "updateStatus", status: newStatus }),
      });
      await onRefresh();
      toast.success("Status berhasil diperbarui", { id: toastId });
    } catch (e) {
      toast.error(e?.message || "Gagal mengubah status", { id: toastId });
    }
  };

  const angka = (name, props = {}) => (
    <input name={name} type="number" inputMode="decimal" min="0" value={form[name]} onChange={handleChange} className="field" {...props} />
  );

  return (
    <div className="space-y-4">
      <KartuStatus
        nilai={persalinan.status}
        pilihan={["terdaftar", "aktif", "selesai", "rujuk", "meninggal"]}
        onUbah={handleStatusChange}
      />

      <FormEdit onSubmit={handleSubmit} busy={loading} dirty={dirty} onBatal={() => setForm(tersimpan)}>
        <BagianForm no={1} judul="Identitas Ibu">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nama" required>
              <input name="name" value={form.name} onChange={handleChange} required className="field" />
            </Field>
            <Field label="NIK" required>
              <input name="nik" value={form.nik} onChange={handleChange} inputMode="numeric" autoComplete="off" required className="field tabular-nums tracking-wide" />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tanggal Lahir" required>
              <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} required className="field" />
            </Field>
            <Field label="Golongan Darah">
              <select name="bloodType" value={form.bloodType} onChange={handleChange} className="field">
                <option value="">Tidak diketahui</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Alamat">
              <input name="address" value={form.address} onChange={handleChange} className="field" />
            </Field>
            <Field label="No. HP">
              <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="08xx-xxxx-xxxx" className="field" />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <Field label="Gravida (G)">{angka("gravida", { min: "1", inputMode: "numeric" })}</Field>
            <Field label="Para (P)">{angka("para", { inputMode: "numeric" })}</Field>
            <Field label="Abortus (A)">{angka("abortus", { inputMode: "numeric" })}</Field>
          </div>
        </BagianForm>

        <BagianForm no={2} judul="Proses Persalinan" ket="Lengkapi setelah persalinan. Kosongkan bila ibu belum bersalin.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tanggal Persalinan">
              <input name="tanggalPersalinan" type="date" value={form.tanggalPersalinan} onChange={handleChange} className="field" />
            </Field>
            <Field label="UK Saat Persalinan (minggu)">{angka("usiaKehamilanSaatPersalinan", { inputMode: "numeric" })}</Field>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Kala I (menit)">{angka("lamaPersalinanKala1", { inputMode: "numeric" })}</Field>
            <Field label="Kala II (menit)">{angka("lamaPersalinanKala2", { inputMode: "numeric" })}</Field>
            <Field label="Kala III (menit)">{angka("lamaPersalinanKala3", { inputMode: "numeric" })}</Field>
            <Field label="Kala IV (menit)">{angka("lamaPersalinanKala4", { inputMode: "numeric" })}</Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Kondisi Ketuban">
              <select name="kondisiKetuban" value={form.kondisiKetuban} onChange={handleChange} className="field">
                <option value="">Pilih</option>
                <option value="jernih">Jernih</option>
                <option value="keruh">Keruh</option>
                <option value="mekonium">Mekonium</option>
                <option value="darah">Darah</option>
              </select>
            </Field>
            <Field label="Kondisi Perineum">
              <select name="kondisiPerineumPersalinan" value={form.kondisiPerineumPersalinan} onChange={handleChange} className="field">
                <option value="">Pilih</option>
                <option value="utuh">Utuh</option>
                <option value="laserasi_grade1">Laserasi Derajat I</option>
                <option value="laserasi_grade2">Laserasi Derajat II</option>
                <option value="laserasi_grade3">Laserasi Derajat III</option>
                <option value="laserasi_grade4">Laserasi Derajat IV</option>
                <option value="episiotomi">Episiotomi</option>
              </select>
            </Field>
            <Field label="Plasenta">
              <select name="plasentaLengkap" value={form.plasentaLengkap} onChange={handleChange} className="field">
                <option value="">Pilih</option>
                <option value="lengkap">Lengkap</option>
                <option value="tidak_lengkap">Tidak Lengkap</option>
              </select>
            </Field>
          </div>
        </BagianForm>

        <BagianForm no={3} judul="Kondisi Ibu Pasca Persalinan">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="TD Sistolik">{angka("tekananDarahSistol", { inputMode: "numeric" })}</Field>
            <Field label="TD Diastolik">{angka("tekananDarahDiastol", { inputMode: "numeric" })}</Field>
            <Field label="BB Ibu (kg)">{angka("beratBadan", { step: "0.1" })}</Field>
            <Field label="Perdarahan (mL)">{angka("pendarahan", { inputMode: "numeric" })}</Field>
          </div>

          <Field label="Kondisi Ibu">
            <select name="kondisiIbu" value={form.kondisiIbu} onChange={handleChange} className="field">
              <option value="baik">Baik</option>
              <option value="lemah">Lemah</option>
              <option value="buruk">Buruk</option>
            </select>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Komplikasi Ibu">
              <textarea name="komplikasiIbu" value={form.komplikasiIbu} onChange={handleChange} rows={2} className="field resize-none" />
            </Field>
            <Field label="Tindakan Ibu">
              <textarea name="tindakanIbu" value={form.tindakanIbu} onChange={handleChange} rows={2} className="field resize-none" />
            </Field>
          </div>

          <Field label="Catatan">
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className="field resize-none" />
          </Field>
        </BagianForm>
      </FormEdit>
    </div>
  );
}
