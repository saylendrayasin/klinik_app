"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetcher } from "@/lib/fetcher";
import { toast } from "react-hot-toast";
import { FaArrowLeft } from "react-icons/fa";

export default function DashboardConfigNewPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    type: "diagnosis",
    label: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const label = form.label.trim();
    if (!label) return toast.error("Nama (label) wajib diisi");

    const toastId = toast.loading("Menyimpan config...");
    setSubmitting(true);
    try {
      await fetcher("/api/config", {
        method: "POST",
        body: JSON.stringify({
          type: form.type,
          label,
          isActive: true,
        }),
      });

      toast.success("Config berhasil dibuat!", { id: toastId });
      router.push("/dashboard/config");
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Gagal menyimpan config.", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-start">
        <button
          onClick={() => router.push("/dashboard/config")}
          className="flex items-center gap-2 text-teal-600 hover:text-teal-800"
          disabled={submitting}
        >
          <FaArrowLeft /> Kembali
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white rounded-md shadow-md p-4"
      >
        <h1 className="text-2xl font-bold mb-2">Tambah Config</h1>
        <p className="text-sm text-gray-600">
          Anda hanya mengisi <b>label</b>. Code akan otomatis dibentuk dari
          label oleh sistem.
        </p>

        <div className="flex flex-col">
          <label className="text-gray-700 font-semibold mb-2">Tipe</label>
          <div className="relative">
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="appearance-none p-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-teal-400 pr-10"
              disabled={submitting}
            >
              <option value="diagnosis">Diagnosis</option>
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

        <div className="flex flex-col">
          <label className="text-gray-700 font-semibold mb-2">
            Nama Config (Label)
          </label>
          <input
            name="label"
            value={form.label}
            onChange={handleChange}
            placeholder="Contoh: Sakit Kepala"
            className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400"
            disabled={submitting}
            required
          />
          <span className="text-xs text-gray-500 mt-1">
            Code akan menjadi format slug (lowercase, spasi jadi "-").
          </span>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-md font-semibold transition disabled:opacity-60"
        >
          {submitting ? "Menyimpan..." : "Simpan"}
        </button>
      </form>
    </div>
  );
}
