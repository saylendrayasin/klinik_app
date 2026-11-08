"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetcher } from "@/lib/fetcher";
import toast from "react-hot-toast";
import { FaBaby } from "react-icons/fa";
import { CalendarDays, UserCheck } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import { tanggalSingkat } from "@/lib/tanggal";
import Field from "@/components/Field";
import HalamanForm, { BagianForm } from "@/components/HalamanForm";

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
    <>
      <HalamanForm
        ikon={FaBaby}
        judul="Tambah Data Kehamilan"
        sub="Isi data ibu hamil untuk memulai monitoring ANC"
        onSubmit={handleSubmit}
        onBatal={() => router.push("/dashboard/kehamilan")}
        busy={loading}
      >
        <BagianForm no={1} judul="Identitas Ibu" ket="Isi NIK lebih dulu agar data ibu yang pernah terdaftar bisa diisi otomatis">
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
                  <span className="font-semibold">{ibuSebelumnya.name}</span> pernah terdaftar
                  {ibuSebelumnya.hpht ? ` (HPHT ${tanggalSingkat(ibuSebelumnya.hpht)})` : ""}
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

          <Field label="Nama Ibu" required>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Nama lengkap"
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
              <select
                name="bloodType"
                value={form.bloodType}
                onChange={handleChange}
                className="field"
              >
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
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Alamat lengkap"
                className="field"
              />
            </Field>
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
          </div>
        </BagianForm>

        <BagianForm no={2} judul="Kehamilan Saat Ini" ket="HPL dihitung otomatis dari HPHT">
          <Field label="HPHT (Hari Pertama Haid Terakhir)" required>
            <input
              name="hpht"
              type="date"
              value={form.hpht}
              onChange={handleChange}
              max={todayStr()}
              required
              className="field"
            />
          </Field>

          {hplDisplay && (
            <div className="anim-masuk flex items-center gap-3 rounded-xl bg-gradient-to-r from-brand-50 to-white border border-brand-100 px-4 py-3" role="status">
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
            <Field label="Gravida (G)" required>
              <input
                name="gravida"
                type="number"
                inputMode="numeric"
                min="1"
                value={form.gravida}
                onChange={handleChange}
                required
                className="field"
              />
            </Field>
            <Field label="Para (P)">
              <input
                name="para"
                type="number"
                inputMode="numeric"
                min="0"
                value={form.para}
                onChange={handleChange}
                className="field"
              />
            </Field>
            <Field label="Abortus (A)">
              <input
                name="abortus"
                type="number"
                inputMode="numeric"
                min="0"
                value={form.abortus}
                onChange={handleChange}
                className="field"
              />
            </Field>
          </div>

          <Field label="Status">
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="field"
            >
              <option value="aktif">Aktif</option>
              <option value="selesai">Selesai</option>
              <option value="keguguran">Keguguran</option>
              <option value="rujuk">Rujuk</option>
            </select>
          </Field>
        </BagianForm>
      </HalamanForm>

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
    </>
  );
}
