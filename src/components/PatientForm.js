"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetcher } from "@/lib/fetcher";
import toast from "react-hot-toast";
import { FaSpinner } from "react-icons/fa";

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
      const response = await fetcher("/api/patients", {
        method: "POST",
        body: JSON.stringify(form),
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
      toast.error("Gagal menambahkan pasien baru.");
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (!loading) router.push("/dashboard/patients");
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
            required
            className="p-2 border w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
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
          <div className="relative">
            <select
              id="gender"
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="appearance-none p-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
            >
              <option value="Male">Laki-laki</option>
              <option value="Female">Perempuan</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg
                className="h-4 w-4 text-gray-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 20"
                stroke="currentColor"
              >
                <path
                  d="M7 7l3-3 3 3m0 6l-3 3-3-3"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
          <button
            type="button"
            onClick={handleBack}
            disabled={loading}
            className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-md transition disabled:opacity-50"
          >
            Kembali
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Pasien"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
