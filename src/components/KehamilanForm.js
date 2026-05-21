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
    <div className="max-w-3xl mx-auto bg-white rounded-md shadow-md p-6">
      <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
        Tambah Data Kehamilan
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
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

        <Field label="NIK" required>
          <input
            name="nik"
            value={form.nik}
            onChange={handleChange}
            onBlur={handleNikBlur}
            placeholder="Nomor Induk Kependudukan"
            required
            className="input-rose"
          />
        </Field>

        {ibuSebelumnya && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 flex items-center justify-between gap-3">
            <div className="text-sm text-blue-800 min-w-0">
              <span className="font-semibold">{ibuSebelumnya.name}</span> pernah terdaftar di klinik ini
              {ibuSebelumnya.hpht
                ? ` (HPHT ${new Date(ibuSebelumnya.hpht).toLocaleDateString("id-ID")})`
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
          <input
            name="dateOfBirth"
            type="date"
            value={form.dateOfBirth}
            onChange={handleChange}
            required
            className="input-rose"
          />
        </Field>

        <Field label="Alamat">
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Alamat lengkap"
            className="input-rose"
          />
        </Field>

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

        <Field label="Status">
          <select name="status" value={form.status} onChange={handleChange} className="input-rose">
            <option value="aktif">Aktif</option>
            <option value="selesai">Selesai</option>
            <option value="keguguran">Keguguran</option>
            <option value="rujuk">Rujuk</option>
          </select>
        </Field>

        {showForceConfirm && (
          <div className="rounded-lg bg-amber-50 border border-amber-300 px-4 py-3 space-y-2">
            <p className="text-sm text-amber-800 font-semibold">
              ⚠️ Ibu ini masih memiliki kehamilan aktif.
            </p>
            <p className="text-xs text-amber-700">
              Lanjutkan untuk menyimpan sebagai data retrospektif, atau batalkan dan tutup dulu kehamilan yang aktif.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => doSubmit(true)}
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-md font-semibold transition"
              >
                Lanjutkan
              </button>
              <button
                type="button"
                onClick={() => setShowForceConfirm(false)}
                className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-md font-semibold transition"
              >
                Batal
              </button>
            </div>
          </div>
        )}

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
