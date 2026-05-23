"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetcher } from "@/lib/fetcher";
import toast from "react-hot-toast";
import { FaSpinner, FaHospital } from "react-icons/fa";
import { UserCheck } from "lucide-react";

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

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
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-200 shrink-0">
          <FaHospital size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800 leading-tight">Registrasi Ibu Persalinan</h1>
          <p className="text-slate-500 text-xs mt-0.5">Data persalinan dan bayi dapat dilengkapi setelah persalinan</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">

          <Field label="Nama Lengkap" required>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Nama lengkap ibu"
              required
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-300 transition placeholder:text-slate-400"
            />
          </Field>

          <Field label="NIK" required>
            <input
              name="nik"
              value={form.nik}
              onChange={handleChange}
              onBlur={handleNikBlur}
              placeholder="Nomor Induk Kependudukan"
              required
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-300 transition placeholder:text-slate-400 font-mono"
            />
          </Field>

          {ibuSebelumnya && (
            <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <UserCheck size={16} className="text-blue-500 shrink-0" />
                <p className="text-sm text-blue-800 min-w-0">
                  <span className="font-semibold">{ibuSebelumnya.name}</span> pernah bersalin di klinik ini
                  {ibuSebelumnya.tanggalPersalinan
                    ? ` (${new Date(ibuSebelumnya.tanggalPersalinan).toLocaleDateString("id-ID")})`
                    : ""}
                  . Isi data otomatis?
                </p>
              </div>
              <button
                type="button"
                onClick={handlePrefill}
                className="shrink-0 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-semibold transition active:scale-95"
              >
                Isi Otomatis
              </button>
            </div>
          )}

          <Field label="Tanggal Lahir" required>
            <input
              name="dateOfBirth"
              type="date"
              value={form.dateOfBirth}
              onChange={handleChange}
              max={todayStr()}
              required
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-300 transition"
            />
          </Field>

          <Field label="Alamat">
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Alamat lengkap"
              rows={2}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-300 transition placeholder:text-slate-400 resize-none"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="No. HP">
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="08xx-xxxx-xxxx"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-300 transition placeholder:text-slate-400"
              />
            </Field>
            <Field label="Golongan Darah">
              <select
                name="bloodType"
                value={form.bloodType}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-300 transition text-slate-700"
              >
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
              <input
                name="gravida"
                type="number"
                min="1"
                value={form.gravida}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-300 transition"
              />
            </Field>
            <Field label="Para (P)">
              <input
                name="para"
                type="number"
                min="0"
                value={form.para}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-300 transition"
              />
            </Field>
            <Field label="Abortus (A)">
              <input
                name="abortus"
                type="number"
                min="0"
                value={form.abortus}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-300 transition"
              />
            </Field>
          </div>

          <Field label="Catatan">
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Catatan tambahan..."
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-300 transition placeholder:text-slate-400 resize-none"
            />
          </Field>

          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => router.push("/dashboard/persalinan")}
              className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-6 rounded-xl text-sm transition active:scale-95"
            >
              Kembali
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition shadow-md shadow-emerald-200 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? <><FaSpinner className="animate-spin" /> Menyimpan...</> : "Simpan & Lanjutkan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-semibold text-slate-700 text-sm">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
