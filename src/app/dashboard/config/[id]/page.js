"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetcher } from "@/lib/fetcher";
import { toast } from "react-hot-toast";
import { FaArrowLeft } from "react-icons/fa";
import { Settings2 } from "lucide-react";

export default function DashboardConfigEditPage() {
  const params = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [item, setItem] = useState(null);
  const [label, setLabel] = useState("");

  const fetchItem = async () => {
    setLoading(true);
    try {
      const res = await fetcher(`/api/config/${params.id}`);
      setItem(res?.data);
      setLabel(res?.data?.label || "");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params?.id) fetchItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newLabel = label.trim();
    if (!newLabel) return toast.error("Label tidak boleh kosong");

    const toastId = toast.loading("Menyimpan perubahan...");
    setSubmitting(true);
    try {
      await fetcher(`/api/config/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ label: newLabel }),
      });
      toast.success("Berhasil update config!", { id: toastId });
      router.push("/dashboard/config");
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Gagal menyimpan perubahan!", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async () => {
    if (!item) return;
    const toastId = toast.loading("Memperbarui status...");
    setSubmitting(true);
    try {
      await fetcher(`/api/config/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      await fetchItem();
      toast.success("Status diperbarui!", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Gagal memperbarui status!", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-60">
        <div className="w-8 h-8 border-4 border-slate-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center text-gray-500 mt-16">
        Data config tidak ditemukan.
      </div>
    );
  }

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
          <h2 className="font-bold text-slate-700 text-sm">Edit Config</h2>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tipe</label>
              <input
                value={item.type}
                disabled
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</label>
              <div className={`px-3 py-2 border rounded-lg text-sm font-semibold ${
                item.isActive
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}>
                {item.isActive ? "Aktif" : "Nonaktif"}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Nama Config (Label)
            </label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition"
              disabled={submitting}
              required
            />
            <span className="text-xs text-gray-400 mt-0.5">
              Code akan otomatis mengikuti label setelah disimpan.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-slate-600 hover:bg-slate-700 active:bg-slate-800 text-white py-2.5 rounded-lg font-semibold text-sm transition disabled:opacity-60"
            >
              {submitting ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
            <button
              type="button"
              onClick={handleToggleActive}
              disabled={submitting}
              className={`w-full text-white py-2.5 rounded-lg font-semibold text-sm transition disabled:opacity-60 ${
                item.isActive ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {item.isActive ? "Nonaktifkan" : "Aktifkan"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
