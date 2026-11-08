"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { fetcher } from "@/lib/fetcher";
import Field from "@/components/Field";
import { FormEdit, BagianForm } from "@/components/HalamanForm";

function calculateAge(dob) {
  if (!dob) return "-";
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return "-";
  const today = new Date();
  if (birth > today) return 0;
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
}

export default function KbEditForm({ kb, form, setForm, onRefresh, dirty, onReset }) {
  const [saving, setSaving] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === "numberOfChildren" ? Number(value) : value,
    });
  };

  const handleUpdateKb = async (e) => {
    e.preventDefault();
    setSaving(true);
    const toastId = toast.loading("Menyimpan perubahan...");
    try {
      await fetcher(`/api/kb/${kb._id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...form, visits: kb.visits }),
      });

      toast.success("Perubahan berhasil disimpan", { id: toastId });
      await onRefresh();
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Gagal menyimpan perubahan", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <FormEdit onSubmit={handleUpdateKb} busy={saving} dirty={dirty} onBatal={onReset}>
        <BagianForm no={1} judul="Identitas Akseptor">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nama" required>
              <input id="name" name="name" value={form.name} onChange={handleInputChange} required className="field" />
            </Field>
            <Field label="NIK" required>
              <input
                id="nik"
                name="nik"
                value={form.nik}
                onChange={handleInputChange}
                inputMode="numeric"
                autoComplete="off"
                required
                className="field tabular-nums tracking-wide"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Tanggal Lahir"
              ket={form.dateOfBirth ? `Usia ${calculateAge(form.dateOfBirth)} tahun` : null}
            >
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={handleInputChange}
                className="field"
              />
            </Field>
            <Field label="Jumlah Anak">
              <input
                id="numberOfChildren"
                name="numberOfChildren"
                type="number"
                inputMode="numeric"
                min="0"
                value={form.numberOfChildren}
                onChange={handleInputChange}
                className="field"
              />
            </Field>
          </div>

          <Field label="Alamat">
            <input id="address" name="address" value={form.address} onChange={handleInputChange} className="field" />
          </Field>
        </BagianForm>

        <BagianForm no={2} judul="Metode KB" ket="Terisi otomatis dari data kunjungan">
          <div className="flex flex-wrap gap-1.5 p-3 border border-slate-200 rounded-xl bg-slate-50 min-h-11 items-center">
            {kb.metodes?.length > 0 ? (
              kb.metodes.map((m) => (
                <span key={m} className="bg-brand-100 text-brand-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {m}
                </span>
              ))
            ) : (
              <span className="text-slate-400 text-sm">Belum ada metode</span>
            )}
          </div>
        </BagianForm>
      </FormEdit>
    </div>
  );
}
