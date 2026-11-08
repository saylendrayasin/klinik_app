"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetcher } from "@/lib/fetcher";
import toast from "react-hot-toast";
import { FaUserPlus } from "react-icons/fa";
import Field from "@/components/Field";
import HalamanForm, { BagianForm } from "@/components/HalamanForm";

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function PatientForm() {
  const [form, setForm] = useState({
    name: "",
    dateOfBirth: "",
    address: "",
    gender: "Male",
    diagnosis: [],
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
      const payload = {
        ...form,
        name: form.name.trim(),
        address: form.address?.trim(),
      };

      const response = await fetcher("/api/patients", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response?.data?._id) {
        toast.success("Pasien berhasil ditambahkan, membuka halaman detail...");
        setTimeout(() => {
          router.push(`/dashboard/patients/${response.data._id}`);
        }, 500);
      } else {
        throw new Error("Gagal mendapatkan ID pasien baru.");
      }
    } catch (error) {
      toast.error("Gagal menambahkan pasien");
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (!loading) router.push("/dashboard/patients");
  };

  return (
    <HalamanForm
      ikon={FaUserPlus}
      judul="Tambah Pasien Baru"
      sub="Kunjungan dan diagnosis bisa ditambahkan setelah pasien tersimpan"
      onSubmit={handleSubmit}
      onBatal={handleBack}
      busy={loading}
      labelSimpan="Simpan Pasien"
      lebar="max-w-2xl"
    >
      <BagianForm judul="Data Pasien">
        <Field label="Nama Pasien" required>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Nama lengkap pasien"
            autoComplete="off"
            className="field"
            required
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
          <Field label="Jenis Kelamin">
            <select name="gender" value={form.gender} onChange={handleChange} className="field">
              <option value="Male">Laki-laki</option>
              <option value="Female">Perempuan</option>
            </select>
          </Field>
        </div>

        <Field label="Alamat">
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Alamat lengkap"
            className="field"
          />
        </Field>
      </BagianForm>
    </HalamanForm>
  );
}
