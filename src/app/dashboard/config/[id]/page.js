"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetcher } from "@/lib/fetcher";
import { toast } from "react-hot-toast";
import { FaArrowLeft } from "react-icons/fa";

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
        <div className="w-8 h-8 border-4 border-teal-500 border-dashed rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center text-gray-500">
        Data config tidak ditemukan.
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold mb-2">Edit Config</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-gray-700 font-semibold mb-2">Tipe</label>
            <input
              value={item.type}
              disabled
              className="p-2 border rounded-md bg-gray-100 text-gray-600"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-700 font-semibold mb-2">Status</label>
            <div
              className={`p-2 border rounded-md font-semibold ${
                item.isActive
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {item.isActive ? "Aktif" : "Nonaktif"}
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-gray-700 font-semibold mb-2">
            Nama Config (Label)
          </label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400"
            disabled={submitting}
            required
          />
          <span className="text-xs text-gray-500 mt-1">
            Code akan otomatis mengikuti label setelah disimpan.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-md font-semibold transition disabled:opacity-60"
          >
            {submitting ? "Menyimpan..." : "Simpan Perubahan"}
          </button>

          <button
            type="button"
            onClick={handleToggleActive}
            disabled={submitting}
            className={`w-full text-white py-2 rounded-md font-semibold transition disabled:opacity-60 ${
              item.isActive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {item.isActive ? "Nonaktifkan" : "Aktifkan"}
          </button>
        </div>
      </form>
    </div>
  );
}
