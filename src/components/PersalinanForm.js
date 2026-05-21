"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetcher } from "@/lib/fetcher";
import toast from "react-hot-toast";
import { FaSpinner } from "react-icons/fa";

export default function PersalinanForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [ibuSebelumnya, setIbuSebelumnya] = useState(null);
  const [nikChecked, setNikChecked] = useState("");

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
    notes: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "nik") {
      setIbuSebelumnya(null);
      setNikChecked("");
    }
  };

  const handleNikBlur = async () => {
    const nik = form.nik.trim();
    if (!nik || nik === nikChecked) return;
    setNikChecked(nik);
    try {
      const res = await fetcher(`/api/persalinan?nikExact=${encodeURIComponent(nik)}`);
      setIbuSebelumnya(res.data || null);
    } catch {
      setIbuSebelumnya(null);
    }
  };

  const handlePrefill = () => {
    if (!ibuSebelumnya) return;
    setForm((prev) => ({
      ...prev,
      name: ibuSebelumnya.name || prev.name,
      dateOfBirth: ibuSebelumnya.dateOfBirth
        ? new Date(ibuSebelumnya.dateOfBirth).toISOString().slice(0, 10)
        : prev.dateOfBirth,
      address: ibuSebelumnya.address || prev.address,
      phone: ibuSebelumnya.phone || prev.phone,
      bloodType: ibuSebelumnya.bloodType || prev.bloodType,
      gravida: (ibuSebelumnya.gravida || 1) + 1,
      para: ibuSebelumnya.para ?? 0,
      abortus: ibuSebelumnya.abortus ?? 0,
    }));
    setIbuSebelumnya(null);
    toast.success("Data diisi otomatis. Periksa G/P/A sebelum menyimpan.");
  };

  const validate = () => {
    if (!form.name.trim()) { toast.error("Nama wajib diisi"); return false; }
    if (!form.nik.trim()) { toast.error("NIK wajib diisi"); return false; }
    if (!form.dateOfBirth) { toast.error("Tanggal lahir wajib diisi"); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const toastId = toast.loading("Menyimpan data ibu...");

    const payload = {
      ...form,
      gravida: Number(form.gravida) || 1,
      para: Number(form.para) || 0,
      abortus: Number(form.abortus) || 0,
    };

    try {
      const res = await fetcher("/api/persalinan", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("Data ibu berhasil ditambahkan", { id: toastId });
      setTimeout(() => router.push(`/dashboard/persalinan/${res.data._id}`), 500);
    } catch (error) {
      toast.error(error?.message || "Gagal menambahkan data", { id: toastId });
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-md shadow-md p-6">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Registrasi Ibu Persalinan</h2>
      <p className="text-sm text-gray-500 text-center mb-6">
        Daftarkan data ibu terlebih dahulu. Data persalinan dan bayi dapat dilengkapi setelah persalinan dilakukan.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Nama Lengkap" required>
          <input name="name" value={form.name} onChange={handleChange} placeholder="Nama lengkap ibu" required className="input-emerald" />
        </Field>

        <Field label="NIK" required>
          <input
            name="nik"
            value={form.nik}
            onChange={handleChange}
            onBlur={handleNikBlur}
            placeholder="Nomor Induk Kependudukan"
            required
            className="input-emerald"
          />
        </Field>

        {ibuSebelumnya && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 flex items-center justify-between gap-3">
            <div className="text-sm text-blue-800 min-w-0">
              <span className="font-semibold">{ibuSebelumnya.name}</span> pernah bersalin di klinik ini
              {ibuSebelumnya.tanggalPersalinan
                ? ` (${new Date(ibuSebelumnya.tanggalPersalinan).toLocaleDateString("id-ID")})`
                : ""}
              . Isi data otomatis?
            </div>
            <button
              type="button"
              onClick={handlePrefill}
              className="shrink-0 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-semibold transition"
            >
              Isi Otomatis
            </button>
          </div>
        )}

        <Field label="Tanggal Lahir" required>
          <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} required className="input-emerald" />
        </Field>

        <Field label="Alamat">
          <textarea name="address" value={form.address} onChange={handleChange} placeholder="Alamat lengkap" rows={2} className="input-emerald resize-none" />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="No. HP">
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="08xx-xxxx-xxxx" className="input-emerald" />
          </Field>
          <Field label="Golongan Darah">
            <select name="bloodType" value={form.bloodType} onChange={handleChange} className="input-emerald">
              <option value="">-- Tidak diketahui --</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="AB">AB</option>
              <option value="O">O</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Gravida (G)" required>
            <input name="gravida" type="number" min="1" value={form.gravida} onChange={handleChange} className="input-emerald" />
          </Field>
          <Field label="Para (P)">
            <input name="para" type="number" min="0" value={form.para} onChange={handleChange} className="input-emerald" />
          </Field>
          <Field label="Abortus (A)">
            <input name="abortus" type="number" min="0" value={form.abortus} onChange={handleChange} className="input-emerald" />
          </Field>
        </div>

        <Field label="Catatan">
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} placeholder="Catatan tambahan..." className="input-emerald resize-none" />
        </Field>

        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard/persalinan")}
            className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-md transition"
          >
            Kembali
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><FaSpinner className="animate-spin" /> Menyimpan...</> : "Simpan & Lanjutkan"}
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
      <label className="font-semibold text-gray-700 text-sm">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
