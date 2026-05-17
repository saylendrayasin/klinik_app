"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetcher } from "@/lib/fetcher";
import { toast } from "react-hot-toast";
import { FaArrowLeft } from "react-icons/fa";
import { Settings2 } from "lucide-react";

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
    <div className="max-w-3xl mx-auto space-y-4">
      <button
        onClick={() => router.push("/dashboard/config")}
        className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 transition"
        disabled={submitting}
      >
        <FaArrowLeft size={12} /> Kembali
      </button>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
        {/* Form header */}
        <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
          <Settings2 size={16} className="text-slate-600 shrink-0" />
          <h2 className="font-bold text-slate-700 text-sm">Tambah Config</h2>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-xs text-gray-500">
            Isi <b>label</b>. Code akan otomatis dibentuk dari label oleh sistem.
          </p>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tipe</label>
            <div className="relative">
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="appearance-none w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition pr-8"
                disabled={submitting}
              >
                <option value="diagnosis">Diagnosis</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                  <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Nama Config (Label)
            </label>
            <input
              name="label"
              value={form.label}
              onChange={handleChange}
              placeholder="Contoh: Sakit Kepala"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition"
              disabled={submitting}
              required
            />
            <span className="text-xs text-gray-400 mt-0.5">
              Code: format slug (lowercase, spasi jadi &quot;-&quot;).
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-slate-600 hover:bg-slate-700 active:bg-slate-800 text-white py-2.5 rounded-lg font-semibold text-sm transition disabled:opacity-60 shadow-sm"
          >
            {submitting ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
