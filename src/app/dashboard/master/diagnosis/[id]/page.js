"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetcher } from "@/lib/fetcher";
import { toast } from "react-hot-toast";
import { FaArrowLeft } from "react-icons/fa";
import { Settings2 } from "lucide-react";
import { SkeletonHalaman } from "@/components/Skeleton";
import { TidakDitemukan } from "@/components/KeadaanKosong";
import Field from "@/components/Field";
import { FormEdit, BagianForm } from "@/components/HalamanForm";
import ConfirmModal from "@/components/ConfirmModal";

export default function DashboardConfigEditPage() {
  const params = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toggleOpen, setToggleOpen] = useState(false);

  const [item, setItem] = useState(null);
  const [label, setLabel] = useState("");

  // Muat ulang diam-diam (tanpa skeleton) dan tanpa menimpa label yang sedang diketik.
  const fetchItem = async ({ awal = false } = {}) => {
    try {
      const res = await fetcher(`/api/config/${params.id}`);
      setItem(res?.data);
      if (awal) setLabel(res?.data?.label || "");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params?.id) fetchItem({ awal: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newLabel = label.trim();
    if (!newLabel) return toast.error("Label wajib diisi");

    const toastId = toast.loading("Menyimpan perubahan...");
    setSubmitting(true);
    try {
      await fetcher(`/api/config/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ label: newLabel }),
      });
      toast.success("Diagnosis berhasil diperbarui", { id: toastId });
      router.push("/dashboard/master?tab=diagnosis");
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Gagal menyimpan perubahan", { id: toastId });
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
      toast.success("Status berhasil diperbarui", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Gagal memperbarui status", { id: toastId });
    } finally {
      setSubmitting(false);
      setToggleOpen(false);
    }
  };

  if (loading) {
    return <SkeletonHalaman label="Memuat diagnosis..." baris={3} lebar="max-w-2xl" />;
  }

  if (!item) {
    return (
      <div className="max-w-2xl mx-auto">
        <TidakDitemukan kembaliKe="/dashboard/master?tab=diagnosis" judul="Diagnosis tidak ditemukan" />
      </div>
    );
  }

  const dirty = label.trim() !== (item.label || "");

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button
        type="button"
        onClick={() => router.push("/dashboard/master?tab=diagnosis")}
        className="inline-flex items-center gap-2 min-h-11 -ml-2 px-2 rounded-xl text-sm font-semibold text-brand-700 hover:bg-brand-50 transition"
        disabled={submitting}
      >
        <FaArrowLeft size={12} aria-hidden="true" /> Kembali
      </button>

      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center shadow-md shadow-brand-600/25 shrink-0">
          <Settings2 size={17} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-slate-800 leading-tight break-words">{item.label}</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Kode <span className="font-mono text-slate-700">{item.code}</span>
          </p>
        </div>
      </div>

      <FormEdit onSubmit={handleSubmit} busy={submitting} dirty={dirty} onBatal={() => setLabel(item.label || "")}>
        <BagianForm judul="Data Diagnosis">
          <Field label="Tipe">
            <input id="config-edit-tipe" value={item.type} disabled className="field capitalize" />
          </Field>
          <Field label="Nama (Label)" required ket="Kode ikut berubah mengikuti label setelah disimpan.">
            <input
              id="config-edit-nama-config-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              autoComplete="off"
              className="field"
              disabled={submitting}
              required
            />
          </Field>
        </BagianForm>
      </FormEdit>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-900/[0.03] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-800">Status</h2>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${item.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {item.isActive ? "Aktif" : "Nonaktif"}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {item.isActive
              ? "Muncul sebagai pilihan di form kunjungan."
              : "Tidak muncul di form kunjungan. Data lama yang memakainya tetap aman."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setToggleOpen(true)}
          disabled={submitting}
          className={`shrink-0 min-h-11 px-5 rounded-xl text-sm font-semibold border transition active:scale-[0.98] disabled:opacity-60 ${
            item.isActive
              ? "bg-white text-red-600 border-slate-200 hover:bg-red-50 hover:border-red-200"
              : "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
          }`}
        >
          {item.isActive ? "Nonaktifkan" : "Aktifkan"}
        </button>
      </section>

      <ConfirmModal
        open={toggleOpen}
        onClose={() => !submitting && setToggleOpen(false)}
        onConfirm={handleToggleActive}
        loading={submitting}
        title={item.isActive ? "Nonaktifkan Diagnosis" : "Aktifkan Diagnosis"}
        message={
          item.isActive
            ? `"${item.label}" tidak akan muncul lagi sebagai pilihan di form kunjungan. Data lama yang memakainya tetap aman.`
            : `"${item.label}" akan muncul kembali sebagai pilihan di form kunjungan.`
        }
        confirmLabel={item.isActive ? "Ya, Nonaktifkan" : "Ya, Aktifkan"}
      />
    </div>
  );
}
