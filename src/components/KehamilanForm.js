"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetcher } from "@/lib/fetcher";
import toast from "react-hot-toast";
import { FaSpinner, FaBaby } from "react-icons/fa";
import { AlertCircle, UserCheck } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function calcHPL(hphtStr) {
  if (!hphtStr) return "";
  const d = new Date(`${hphtStr}T00:00:00`);
  if (isNaN(d.getTime())) return "";
  const hpl = new Date(d.getTime() + 280 * MS_PER_DAY);
  return hpl.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

export default function KehamilanForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [ibuSebelumnya, setIbuSebelumnya] = useState(null);
  const [nikChecked, setNikChecked] = useState("");
  const [showForceConfirm, setShowForceConfirm] = useState(false);

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
    if (name === "nik") {
      setIbuSebelumnya(null);
      setNikChecked("");
      setShowForceConfirm(false);
    }
  };

  const handleNikBlur = async () => {
    const nik = form.nik.trim();
    if (!nik || nik === nikChecked) return;
    setNikChecked(nik);
    try {
      const res = await fetcher(`/api/kehamilan?nikExact=${encodeURIComponent(nik)}`);
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

  const doSubmit = async (force = false) => {
    setLoading(true);
    setShowForceConfirm(false);
    const toastId = toast.loading("Menyimpan data kehamilan...");
    try {
      const payload = force ? { ...form, force: true } : form;
      const res = await fetcher("/api/kehamilan", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("Data kehamilan berhasil ditambahkan", { id: toastId });
      setTimeout(() => router.push(`/dashboard/kehamilan/${res.data._id}`), 500);
    } catch (error) {
      if (!force && error?.message?.includes("kehamilan aktif")) {
        toast.dismiss(toastId);
        setShowForceConfirm(true);
        setLoading(false);
      } else {
        toast.error(error?.message || "Gagal menambahkan data kehamilan.", { id: toastId });
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await doSubmit(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-md shadow-pink-200 shrink-0">
          <FaBaby size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800 leading-tight">Tambah Data Kehamilan</h1>
          <p className="text-slate-500 text-xs mt-0.5">Isi data ibu hamil untuk memulai monitoring ANC</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-pink-500 to-rose-400" />
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">

          <Field label="Nama Ibu" required>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Nama lengkap"
              required
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-pink-300 transition placeholder:text-slate-400"
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
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-pink-300 transition placeholder:text-slate-400 font-mono"
            />
          </Field>

          {ibuSebelumnya && (
            <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <UserCheck size={16} className="text-blue-500 shrink-0" />
                <p className="text-sm text-blue-800 min-w-0">
                  <span className="font-semibold">{ibuSebelumnya.name}</span> pernah terdaftar
                  {ibuSebelumnya.hpht ? ` (HPHT ${new Date(ibuSebelumnya.hpht).toLocaleDateString("id-ID")})` : ""}
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
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-pink-300 transition"
            />
          </Field>

          <Field label="Alamat">
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Alamat lengkap"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-pink-300 transition placeholder:text-slate-400"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="No. HP">
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="08xx-xxxx-xxxx"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-pink-300 transition placeholder:text-slate-400"
              />
            </Field>
            <Field label="Golongan Darah">
              <select
                name="bloodType"
                value={form.bloodType}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-pink-300 transition text-slate-700"
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
                required
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-pink-300 transition"
              />
            </Field>
            <Field label="Para (P)">
              <input
                name="para"
                type="number"
                min="0"
                value={form.para}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-pink-300 transition"
              />
            </Field>
            <Field label="Abortus (A)">
              <input
                name="abortus"
                type="number"
                min="0"
                value={form.abortus}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-pink-300 transition"
              />
            </Field>
          </div>

          <Field label="HPHT (Hari Pertama Haid Terakhir)" required>
            <input
              name="hpht"
              type="date"
              value={form.hpht}
              onChange={handleChange}
              max={todayStr()}
              required
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-pink-300 transition"
            />
            {hplDisplay && (
              <p className="mt-1.5 text-sm text-rose-600 font-medium">
                HPL (Perkiraan Lahir): <span className="font-bold">{hplDisplay}</span>
              </p>
            )}
          </Field>

          <Field label="Status">
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-pink-300 transition text-slate-700"
            >
              <option value="aktif">Aktif</option>
              <option value="selesai">Selesai</option>
              <option value="keguguran">Keguguran</option>
              <option value="rujuk">Rujuk</option>
            </select>
          </Field>

          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => router.push("/dashboard/kehamilan")}
              disabled={loading}
              className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-6 rounded-xl text-sm transition disabled:opacity-50 active:scale-95"
            >
              Kembali
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition shadow-md shadow-pink-200 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? <><FaSpinner className="animate-spin" /> Menyimpan...</> : "Simpan"}
            </button>
          </div>
        </form>
      </div>

      {/* Force-save modal: active pregnancy conflict */}
      <ConfirmModal
        open={showForceConfirm}
        onClose={() => setShowForceConfirm(false)}
        onConfirm={() => doSubmit(true)}
        loading={loading}
        title="Kehamilan Aktif Ditemukan"
        message="Ibu ini masih memiliki kehamilan aktif. Lanjutkan untuk menyimpan sebagai data retrospektif, atau batalkan dan tutup dulu kehamilan yang aktif."
        confirmLabel="Lanjutkan Simpan"
      />
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
