"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetcher } from "@/lib/fetcher";

export default function PatientForm() {
  const [form, setForm] = useState({
    name: "",
    dateOfBirth: "",
    address: "",
    gender: "Male",
    diagnosis: [],
  });
  const router = useRouter();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetcher("/api/patients", {
        method: "POST",
        body: JSON.stringify(form),
      });
      router.push("/dashboard/patients"); // <-- pastikan balik ke dashboard ya
    } catch (error) {
      alert(error.message);
    }
  };

  const handleBack = () => {
    router.push("/dashboard/patients");
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-md shadow-md p-4">
      <h2 className="text-2xl font-bold text-center mb-8">
        Tambah Pasien Baru
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nama */}
        <div className="flex flex-col">
          <label htmlFor="name" className="font-semibold text-gray-700 mb-2">
            Nama Pasien
          </label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Masukkan nama pasien"
            className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>

        {/* Tanggal Lahir */}
        <div className="flex flex-col">
          <label
            htmlFor="dateOfBirth"
            className="font-semibold text-gray-700 mb-2"
          >
            Tanggal Lahir
          </label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            value={form.dateOfBirth}
            onChange={handleChange}
            className="p-2 border w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>

        {/* Alamat */}
        <div className="flex flex-col">
          <label htmlFor="address" className="font-semibold text-gray-700 mb-2">
            Alamat
          </label>
          <input
            id="address"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Masukkan alamat"
            className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Jenis Kelamin */}
        <div className="flex flex-col">
          <label htmlFor="gender" className="font-semibold text-gray-700 mb-2">
            Jenis Kelamin
          </label>
          <select
            id="gender"
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="Male">Laki-laki</option>
            <option value="Female">Perempuan</option>
          </select>
        </div>

        {/* Tombol Aksi */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
          <button
            type="button"
            onClick={handleBack}
            className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-md transition"
          >
            Kembali
          </button>

          <button
            type="submit"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition"
          >
            Simpan Pasien
          </button>
        </div>
      </form>
    </div>
  );
}
