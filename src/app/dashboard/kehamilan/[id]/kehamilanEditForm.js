"use client";

import { useState } from "react";
import { fetcher } from "@/lib/fetcher";
import toast from "react-hot-toast";
import { FaSpinner } from "react-icons/fa";

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

export default function KehamilanEditForm({ kehamilan, form, setForm, onRefresh }) {
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
        <p className="text-sm font-semibold text-gray-700 mb-2">Status Kehamilan</p>
        <div className="flex flex-wrap gap-2">
          {["aktif", "selesai", "keguguran", "rujuk"].map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`px-3 py-1.5 rounded-md text-sm font-semibold capitalize border transition ${
                kehamilan.status === s
                  ? "bg-rose-600 text-white border-rose-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-rose-400 hover:text-rose-600"
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
          <input name="name" value={form.name} onChange={handleChange} required className="input-field" />
        </Field>

        <Field label="NIK" required>
          <input name="nik" value={form.nik} onChange={handleChange} required className="input-field" />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tanggal Lahir" required>
            <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} required className="input-field" />
          </Field>
          <Field label="Golongan Darah">
            <select name="bloodType" value={form.bloodType} onChange={handleChange} className="input-field">
              <option value="">Tidak diketahui</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="AB">AB</option>
              <option value="O">O</option>
            </select>
          </Field>
        </div>

        <Field label="Alamat">
          <input name="address" value={form.address} onChange={handleChange} className="input-field" />
        </Field>

        <Field label="No. HP">
          <input name="phone" value={form.phone} onChange={handleChange} placeholder="08xx-xxxx-xxxx" className="input-field" />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Gravida (G)">
            <input name="gravida" type="number" min="1" value={form.gravida} onChange={handleChange} className="input-field" />
          </Field>
          <Field label="Para (P)">
            <input name="para" type="number" min="0" value={form.para} onChange={handleChange} className="input-field" />
          </Field>
          <Field label="Abortus (A)">
            <input name="abortus" type="number" min="0" value={form.abortus} onChange={handleChange} className="input-field" />
          </Field>
        </div>

        <Field label="HPHT" required>
          <input name="hpht" type="date" value={form.hpht} onChange={handleChange} required className="input-field" />
          {hplDisplay && (
            <p className="text-sm text-rose-700 mt-1">
              HPL: <strong>{hplDisplay}</strong>
            </p>
          )}
        </Field>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><FaSpinner className="animate-spin" /> Menyimpan...</>
            ) : "Simpan Perubahan"}
          </button>
        </div>
      </form>

      <style jsx>{`
        .input-field {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          outline: none;
        }
        .input-field:focus {
          box-shadow: 0 0 0 2px rgba(251, 113, 133, 0.3);
          border-color: #fb7185;
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
