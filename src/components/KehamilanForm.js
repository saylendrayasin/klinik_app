"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetcher } from "@/lib/fetcher";
import toast from "react-hot-toast";
import { FaSpinner } from "react-icons/fa";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function calcHPL(hphtStr) {
  if (!hphtStr) return "";
  const d = new Date(`${hphtStr}T00:00:00`);
  if (isNaN(d.getTime())) return "";
  const hpl = new Date(d.getTime() + 280 * MS_PER_DAY);
  return hpl.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function KehamilanForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    nik: "",
    dateOfBirth: "",
    address: "",
    phone: "",
    bloodType: "",
    gravida: 1,
    para: 0,
    abortus: 0,
    hpht: "",
    status: "aktif",
  });

  const hplDisplay = calcHPL(form.hpht);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetcher("/api/kehamilan", {
        method: "POST",
        body: JSON.stringify(form),
      });
      toast.success("Data kehamilan berhasil ditambahkan");
      setTimeout(() => router.push(`/dashboard/kehamilan/${res.data._id}`), 500);
    } catch (error) {
      if (error?.message?.includes("kehamilan aktif")) {
        const forceOk = window.confirm(
          error.message + "\n\nTekan OK untuk tetap mendaftarkan (data retrospektif)."
        );
        if (forceOk) {
          try {
            const res = await fetcher("/api/kehamilan", {
              method: "POST",
              body: JSON.stringify({ ...form, force: true }),
            });
            toast.success("Data kehamilan berhasil ditambahkan");
            setTimeout(
              () => router.push(`/dashboard/kehamilan/${res.data._id}`),
              500
            );
            return;
          } catch (err2) {
            toast.error(err2?.message || "Gagal menambahkan data.");
          }
        }
      } else {
        toast.error(error?.message || "Gagal menambahkan data kehamilan.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-md shadow-md p-6">
      <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
        Tambah Data Kehamilan
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nama */}
        <Field label="Nama Ibu" required>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Nama lengkap"
            required
            className="input-rose"
          />
        </Field>

        {/* NIK */}
        <Field label="NIK" required>
          <input
            name="nik"
            value={form.nik}
            onChange={handleChange}
            placeholder="Nomor Induk Kependudukan"
            required
            className="input-rose"
          />
        </Field>

        {/* Tanggal Lahir */}
        <Field label="Tanggal Lahir" required>
          <input
            name="dateOfBirth"
            type="date"
            value={form.dateOfBirth}
            onChange={handleChange}
            required
            className="input-rose"
          />
        </Field>

        {/* Alamat */}
        <Field label="Alamat">
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Alamat lengkap"
            className="input-rose"
          />
        </Field>

        {/* No HP + Golongan Darah */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="No. HP">
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="08xx-xxxx-xxxx"
              className="input-rose"
            />
          </Field>
          <Field label="Golongan Darah">
            <select name="bloodType" value={form.bloodType} onChange={handleChange} className="input-rose">
              <option value="">-- Tidak diketahui --</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="AB">AB</option>
              <option value="O">O</option>
            </select>
          </Field>
        </div>

        {/* G/P/A */}
        <div className="grid grid-cols-3 gap-4">
          <Field label="Gravida (G)" required>
            <input
              name="gravida"
              type="number"
              min="1"
              value={form.gravida}
              onChange={handleChange}
              required
              className="input-rose"
            />
          </Field>
          <Field label="Para (P)">
            <input
              name="para"
              type="number"
              min="0"
              value={form.para}
              onChange={handleChange}
              className="input-rose"
            />
          </Field>
          <Field label="Abortus (A)">
            <input
              name="abortus"
              type="number"
              min="0"
              value={form.abortus}
              onChange={handleChange}
              className="input-rose"
            />
          </Field>
        </div>

        {/* HPHT + HPL preview */}
        <Field label="HPHT (Hari Pertama Haid Terakhir)" required>
          <input
            name="hpht"
            type="date"
            value={form.hpht}
            onChange={handleChange}
            required
            className="input-rose"
          />
          {hplDisplay && (
            <p className="mt-1.5 text-sm text-rose-700 font-medium">
              HPL (Perkiraan Lahir): <span className="font-bold">{hplDisplay}</span>
            </p>
          )}
        </Field>

        {/* Status */}
        <Field label="Status">
          <select name="status" value={form.status} onChange={handleChange} className="input-rose">
            <option value="aktif">Aktif</option>
            <option value="selesai">Selesai</option>
            <option value="keguguran">Keguguran</option>
            <option value="rujuk">Rujuk</option>
          </select>
        </Field>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard/kehamilan")}
            disabled={loading}
            className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-md transition disabled:opacity-50"
          >
            Kembali
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-6 rounded-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" /> Menyimpan...
              </>
            ) : (
              "Simpan"
            )}
          </button>
        </div>
      </form>

      <style jsx>{`
        .input-rose {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          outline: none;
        }
        .input-rose:focus {
          ring: 2px;
          border-color: #fb7185;
          box-shadow: 0 0 0 2px rgba(251, 113, 133, 0.3);
        }
      `}</style>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-semibold text-gray-700 text-sm">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
