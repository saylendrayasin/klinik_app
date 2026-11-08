"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetcher } from "@/lib/fetcher";
import toast from "react-hot-toast";
import { FaHospital } from "react-icons/fa";
import { UserCheck } from "lucide-react";
import { tanggalSingkat } from "@/lib/tanggal";
import Field from "@/components/Field";
import HalamanForm, { BagianForm } from "@/components/HalamanForm";

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
    <HalamanForm
      ikon={FaHospital}
      judul="Registrasi Ibu Persalinan"
      sub="Data persalinan dan bayi dapat dilengkapi setelah persalinan"
      onSubmit={handleSubmit}
      onBatal={() => router.push("/dashboard/persalinan")}
      busy={loading}
      labelSimpan="Simpan & Lanjutkan"
      lebar="max-w-2xl"
    >
      <BagianForm no={1} judul="Identitas Ibu" ket="Isi NIK lebih dulu agar data ibu yang pernah bersalin bisa diisi otomatis">
        <Field label="NIK" required>
          <input
            name="nik"
            value={form.nik}
            onChange={handleChange}
            onBlur={handleNikBlur}
            placeholder="16 digit NIK"
            inputMode="numeric"
            autoComplete="off"
            required
            className="field tabular-nums tracking-wide"
          />
        </Field>

        {ibuSebelumnya && (
          <div className="anim-masuk rounded-xl bg-brand-50 border border-brand-200 px-4 py-3 flex flex-col min-[420px]:flex-row min-[420px]:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <UserCheck size={16} className="text-brand-600 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-brand-800 min-w-0">
                <span className="font-semibold">{ibuSebelumnya.name}</span> pernah bersalin di klinik ini
                {ibuSebelumnya.tanggalPersalinan
                  ? ` (${tanggalSingkat(ibuSebelumnya.tanggalPersalinan)})`
                  : ""}
                . Isi data otomatis?
              </p>
            </div>
            <button
              type="button"
              onClick={handlePrefill}
              className="shrink-0 min-h-11 text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 rounded-xl font-semibold transition active:scale-95"
            >
              Isi Otomatis
            </button>
          </div>
        )}

        <Field label="Nama Lengkap" required>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Nama lengkap ibu"
            autoComplete="off"
            required
            className="field"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tanggal Lahir" required>
            <input
              name="dateOfBirth"
              type="date"
              value={form.dateOfBirth}
              onChange={handleChange}
              max={todayStr()}
              required
              className="field"
            />
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

        <Field label="No. HP">
          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="08xx-xxxx-xxxx"
            className="field"
          />
        </Field>

        <Field label="Alamat">
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Alamat lengkap"
            rows={2}
            className="field resize-none"
          />
        </Field>
      </BagianForm>

      <BagianForm no={2} judul="Riwayat Kehamilan" ket="Gravida, para, dan abortus sebelum persalinan ini">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Field label="Gravida (G)" required>
            <input name="gravida" type="number" inputMode="numeric" min="1" value={form.gravida} onChange={handleChange} className="field" />
          </Field>
          <Field label="Para (P)">
            <input name="para" type="number" inputMode="numeric" min="0" value={form.para} onChange={handleChange} className="field" />
          </Field>
          <Field label="Abortus (A)">
            <input name="abortus" type="number" inputMode="numeric" min="0" value={form.abortus} onChange={handleChange} className="field" />
          </Field>
        </div>

        <Field label="Catatan">
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={2}
            placeholder="Catatan tambahan..."
            className="field resize-none"
          />
        </Field>
      </BagianForm>
    </HalamanForm>
  );
}
