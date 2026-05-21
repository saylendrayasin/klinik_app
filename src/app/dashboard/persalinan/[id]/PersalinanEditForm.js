"use client";

import { useState } from "react";
import { fetcher } from "@/lib/fetcher";
import toast from "react-hot-toast";
import { FaSpinner } from "react-icons/fa";

export default function PersalinanEditForm({ persalinan, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: persalinan.name || "",
    nik: persalinan.nik || "",
    dateOfBirth: persalinan.dateOfBirth ? new Date(persalinan.dateOfBirth).toISOString().slice(0, 10) : "",
    address: persalinan.address || "",
    phone: persalinan.phone || "",
    bloodType: persalinan.bloodType || "",
    gravida: persalinan.gravida ?? 1,
    para: persalinan.para ?? 0,
    abortus: persalinan.abortus ?? 0,
    tanggalPersalinan: persalinan.tanggalPersalinan ? new Date(persalinan.tanggalPersalinan).toISOString().slice(0, 10) : "",
    usiaKehamilanSaatPersalinan: persalinan.usiaKehamilanSaatPersalinan ?? "",
    lamaPersalinanKala1: persalinan.lamaPersalinanKala1 ?? "",
    lamaPersalinanKala2: persalinan.lamaPersalinanKala2 ?? "",
    lamaPersalinanKala3: persalinan.lamaPersalinanKala3 ?? "",
    lamaPersalinanKala4: persalinan.lamaPersalinanKala4 ?? "",
    kondisiKetuban: persalinan.kondisiKetuban || "",
    kondisiPerineumPersalinan: persalinan.kondisiPerineumPersalinan || "",
    plasentaLengkap: persalinan.plasentaLengkap || "",
    tekananDarahSistol: persalinan.tekananDarahSistol ?? "",
    tekananDarahDiastol: persalinan.tekananDarahDiastol ?? "",
    beratBadan: persalinan.beratBadan ?? "",
    pendarahan: persalinan.pendarahan ?? "",
    kondisiIbu: persalinan.kondisiIbu || "baik",
    komplikasiIbu: persalinan.komplikasiIbu || "",
    tindakanIbu: persalinan.tindakanIbu || "",
    notes: persalinan.notes || "",
  });

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
      toast.success("Status berhasil diubah", { id: toastId });
    } catch (e) {
      toast.error(e?.message || "Gagal mengubah status", { id: toastId });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Status quick-change */}
      <div className="bg-white rounded-md shadow-sm p-4 border">
        <p className="text-sm font-semibold text-gray-700 mb-2">Status</p>
        <div className="flex flex-wrap gap-2">
          {["terdaftar", "aktif", "selesai", "rujuk", "meninggal"].map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`px-3 py-1.5 rounded-md text-sm font-semibold capitalize border transition ${
                persalinan.status === s
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-emerald-400 hover:text-emerald-600"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-md shadow-sm p-4 border space-y-4">
        <h3 className="font-bold text-gray-800">Data Ibu</h3>

        <Field label="Nama" required>
          <input name="name" value={form.name} onChange={handleChange} required className="input-emerald" />
        </Field>

        <Field label="NIK" required>
          <input name="nik" value={form.nik} onChange={handleChange} required className="input-emerald" />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tanggal Lahir" required>
            <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} required className="input-emerald" />
          </Field>
          <Field label="Golongan Darah">
            <select name="bloodType" value={form.bloodType} onChange={handleChange} className="input-emerald">
              <option value="">Tidak diketahui</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="AB">AB</option>
              <option value="O">O</option>
            </select>
          </Field>
        </div>

        <Field label="Alamat">
          <input name="address" value={form.address} onChange={handleChange} className="input-emerald" />
        </Field>

        <Field label="No. HP">
          <input name="phone" value={form.phone} onChange={handleChange} placeholder="08xx-xxxx-xxxx" className="input-emerald" />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Gravida (G)">
            <input name="gravida" type="number" min="1" value={form.gravida} onChange={handleChange} className="input-emerald" />
          </Field>
          <Field label="Para (P)">
            <input name="para" type="number" min="0" value={form.para} onChange={handleChange} className="input-emerald" />
          </Field>
          <Field label="Abortus (A)">
            <input name="abortus" type="number" min="0" value={form.abortus} onChange={handleChange} className="input-emerald" />
          </Field>
        </div>

        <h3 className="font-bold text-gray-800 pt-2">Data Persalinan</h3>

        <p className="text-xs text-gray-500 -mt-2 mb-2">
          Lengkapi data ini setelah persalinan dilakukan. Kosongkan jika ibu belum bersalin.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tanggal Persalinan">
            <input name="tanggalPersalinan" type="date" value={form.tanggalPersalinan} onChange={handleChange} className="input-emerald" />
          </Field>
          <Field label="UK Saat Persalinan (mg)">
            <input name="usiaKehamilanSaatPersalinan" type="number" min="0" value={form.usiaKehamilanSaatPersalinan} onChange={handleChange} className="input-emerald" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Kala I (menit)"><input name="lamaPersalinanKala1" type="number" min="0" value={form.lamaPersalinanKala1} onChange={handleChange} className="input-emerald" /></Field>
          <Field label="Kala II (menit)"><input name="lamaPersalinanKala2" type="number" min="0" value={form.lamaPersalinanKala2} onChange={handleChange} className="input-emerald" /></Field>
          <Field label="Kala III (menit)"><input name="lamaPersalinanKala3" type="number" min="0" value={form.lamaPersalinanKala3} onChange={handleChange} className="input-emerald" /></Field>
          <Field label="Kala IV (menit)"><input name="lamaPersalinanKala4" type="number" min="0" value={form.lamaPersalinanKala4} onChange={handleChange} className="input-emerald" /></Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Kondisi Ketuban">
            <select name="kondisiKetuban" value={form.kondisiKetuban} onChange={handleChange} className="input-emerald">
              <option value="">-- Pilih --</option>
              <option value="jernih">Jernih</option>
              <option value="keruh">Keruh</option>
              <option value="mekonium">Mekonium</option>
              <option value="darah">Darah</option>
            </select>
          </Field>
          <Field label="Kondisi Perineum">
            <select name="kondisiPerineumPersalinan" value={form.kondisiPerineumPersalinan} onChange={handleChange} className="input-emerald">
              <option value="">-- Pilih --</option>
              <option value="utuh">Utuh</option>
              <option value="laserasi_grade1">Laserasi Derajat I</option>
              <option value="laserasi_grade2">Laserasi Derajat II</option>
              <option value="laserasi_grade3">Laserasi Derajat III</option>
              <option value="laserasi_grade4">Laserasi Derajat IV</option>
              <option value="episiotomi">Episiotomi</option>
            </select>
          </Field>
          <Field label="Plasenta">
            <select name="plasentaLengkap" value={form.plasentaLengkap} onChange={handleChange} className="input-emerald">
              <option value="">-- Pilih --</option>
              <option value="lengkap">Lengkap</option>
              <option value="tidak_lengkap">Tidak Lengkap</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="TD Sistolik"><input name="tekananDarahSistol" type="number" min="0" value={form.tekananDarahSistol} onChange={handleChange} className="input-emerald" /></Field>
          <Field label="TD Diastolik"><input name="tekananDarahDiastol" type="number" min="0" value={form.tekananDarahDiastol} onChange={handleChange} className="input-emerald" /></Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="BB Ibu (kg)"><input name="beratBadan" type="number" min="0" step="0.1" value={form.beratBadan} onChange={handleChange} className="input-emerald" /></Field>
          <Field label="Perdarahan (mL)"><input name="pendarahan" type="number" min="0" value={form.pendarahan} onChange={handleChange} className="input-emerald" /></Field>
        </div>

        <Field label="Kondisi Ibu">
          <select name="kondisiIbu" value={form.kondisiIbu} onChange={handleChange} className="input-emerald">
            <option value="baik">Baik</option>
            <option value="lemah">Lemah</option>
            <option value="buruk">Buruk</option>
          </select>
        </Field>

        <Field label="Komplikasi Ibu">
          <textarea name="komplikasiIbu" value={form.komplikasiIbu} onChange={handleChange} rows={2} className="input-emerald resize-none" />
        </Field>

        <Field label="Tindakan Ibu">
          <textarea name="tindakanIbu" value={form.tindakanIbu} onChange={handleChange} rows={2} className="input-emerald resize-none" />
        </Field>

        <Field label="Catatan">
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className="input-emerald resize-none" />
        </Field>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><FaSpinner className="animate-spin" /> Menyimpan...</> : "Simpan Perubahan"}
          </button>
        </div>
      </form>

      <style jsx>{`
        .input-emerald {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          outline: none;
        }
        .input-emerald:focus {
          border-color: #34d399;
          box-shadow: 0 0 0 2px rgba(52, 211, 153, 0.3);
        }
      `}</style>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-gray-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
