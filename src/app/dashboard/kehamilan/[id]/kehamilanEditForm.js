"use client";

import { useState } from "react";
import { fetcher } from "@/lib/fetcher";
import toast from "react-hot-toast";
import { CalendarDays } from "lucide-react";
import Field from "@/components/Field";
import { FormEdit, BagianForm } from "@/components/HalamanForm";
import KartuStatus from "@/components/KartuStatus";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function calcHPLDisplay(hphtStr) {
  if (!hphtStr) return "";
  const d = new Date(`${hphtStr}T00:00:00`);
  if (isNaN(d.getTime())) return "";
  return new Date(d.getTime() + 280 * MS_PER_DAY).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function KehamilanEditForm({ kehamilan, form, setForm, onRefresh, dirty, onReset }) {
  const [loading, setLoading] = useState(false);

  const hplDisplay = calcHPLDisplay(form.hpht);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Menyimpan perubahan...");
    try {
      await fetcher(`/api/kehamilan/${kehamilan._id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "updateData", data: form }),
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
      await fetcher(`/api/kehamilan/${kehamilan._id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "updateStatus", status: newStatus }),
      });
      await onRefresh(true); // jangan timpa isian form yang belum disimpan
      toast.success("Status berhasil diperbarui", { id: toastId });
    } catch (e) {
      toast.error(e?.message || "Gagal mengubah status", { id: toastId });
    }
  };

  return (
    <div className="space-y-4">
      <KartuStatus
        judul="Status Kehamilan"
        nilai={kehamilan.status}
        pilihan={["aktif", "selesai", "keguguran", "rujuk"]}
        onUbah={handleStatusChange}
      />

      <FormEdit onSubmit={handleSubmit} busy={loading} dirty={dirty} onBatal={onReset}>
        <BagianForm no={1} judul="Identitas Ibu">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nama" required>
              <input name="name" value={form.name} onChange={handleChange} required className="field" />
            </Field>
            <Field label="NIK" required>
              <input
                name="nik"
                value={form.nik}
                onChange={handleChange}
                inputMode="numeric"
                autoComplete="off"
                required
                className="field tabular-nums tracking-wide"
              />
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
        </BagianForm>

        <BagianForm no={2} judul="Kehamilan" ket="HPL dihitung ulang otomatis bila HPHT diubah">
          <Field label="HPHT (Hari Pertama Haid Terakhir)" required>
            <input name="hpht" type="date" value={form.hpht} onChange={handleChange} required className="field" />
          </Field>

          {hplDisplay && (
            <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-brand-50 to-white border border-brand-100 px-4 py-3" role="status">
              <span className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0" aria-hidden="true">
                <CalendarDays size={17} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-brand-700">Perkiraan lahir (HPL)</p>
                <p className="text-base font-bold text-brand-900">{hplDisplay}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <Field label="Gravida (G)">
              <input name="gravida" type="number" inputMode="numeric" min="1" value={form.gravida} onChange={handleChange} className="field" />
            </Field>
            <Field label="Para (P)">
              <input name="para" type="number" inputMode="numeric" min="0" value={form.para} onChange={handleChange} className="field" />
            </Field>
            <Field label="Abortus (A)">
              <input name="abortus" type="number" inputMode="numeric" min="0" value={form.abortus} onChange={handleChange} className="field" />
            </Field>
          </div>
        </BagianForm>
      </FormEdit>
    </div>
  );
}
