"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetcher } from "@/lib/fetcher";
import toast from "react-hot-toast";
import { FaHeartbeat } from "react-icons/fa";
import Field from "@/components/Field";
import HalamanForm, { BagianForm } from "@/components/HalamanForm";

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function KbForm() {
  const [form, setForm] = useState({
    name: "",
    nik: "",
    dateOfBirth: "",
    address: "",
    numberOfChildren: 0,
  });

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetcher("/api/kb", {
        method: "POST",
        body: JSON.stringify(form),
      });

      if (response?.data?._id) {
        toast.success("Data KB berhasil ditambahkan, membuka detail...");
        setTimeout(() => {
          router.push(`/dashboard/kb/${response.data._id}`);
        }, 500);
      } else {
        throw new Error("Gagal mendapatkan ID dari respons.");
      }
    } catch (error) {
      toast.error(error?.message || "Gagal menambahkan data KB.");
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (!loading) router.push("/dashboard/kb");
  };

  return (
    <HalamanForm
      ikon={FaHeartbeat}
      judul="Tambah Data KB"
      sub="Kunjungan dan metode KB bisa ditambahkan setelah data tersimpan"
      onSubmit={handleSubmit}
      onBatal={handleBack}
      busy={loading}
      labelSimpan="Simpan KB"
      lebar="max-w-2xl"
    >
      <BagianForm judul="Identitas Akseptor">
        <Field label="Nama Ibu" required>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Nama lengkap"
            autoComplete="off"
            className="field"
            required
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="NIK" required>
            <input
              name="nik"
              value={form.nik}
              onChange={handleChange}
              placeholder="16 digit NIK"
              inputMode="numeric"
              autoComplete="off"
              className="field tabular-nums tracking-wide"
              required
            />
          </Field>
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_10rem] gap-4">
          <Field label="Alamat">
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Alamat lengkap"
              className="field"
            />
          </Field>
          <Field label="Jumlah Anak">
            <input
              name="numberOfChildren"
              type="number"
              inputMode="numeric"
              min="0"
              value={form.numberOfChildren}
              onChange={handleChange}
              className="field"
            />
          </Field>
        </div>
      </BagianForm>
    </HalamanForm>
  );
}
