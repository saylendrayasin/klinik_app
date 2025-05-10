"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetcher } from "@/lib/fetcher";
import toast from "react-hot-toast";
import { FaSpinner } from "react-icons/fa";

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
      toast.error("Gagal menambahkan data KB.");
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (!loading) router.push("/dashboard/kb");
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-md shadow-md p-4">
      <h2 className="text-2xl font-bold text-center mb-8">Tambah Data KB</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nama */}
        <div className="flex flex-col">
          <label htmlFor="name" className="font-semibold text-gray-700 mb-2">
            Nama Ibu
          </label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Masukkan nama"
            className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
            required
          />
        </div>

        {/* NIK */}
        <div className="flex flex-col">
          <label htmlFor="nik" className="font-semibold text-gray-700 mb-2">
            NIK
          </label>
          <input
            id="nik"
            name="nik"
            value={form.nik}
            onChange={handleChange}
            placeholder="Nomor Induk Kependudukan"
            className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
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
            className="p-2 border w-full rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
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
            className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>

        {/* Jumlah Anak */}
        <div className="flex flex-col">
          <label
            htmlFor="numberOfChildren"
            className="font-semibold text-gray-700 mb-2"
          >
            Jumlah Anak
          </label>
          <input
            id="numberOfChildren"
            name="numberOfChildren"
            type="number"
            min="0"
            value={form.numberOfChildren}
            onChange={handleChange}
            className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
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
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan KB"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
