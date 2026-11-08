"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetcher } from "@/lib/fetcher";
import { toast } from "react-hot-toast";
import { Settings2 } from "lucide-react";
import Field from "@/components/Field";
import HalamanForm, { BagianForm } from "@/components/HalamanForm";

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

      toast.success("Diagnosis berhasil ditambahkan", { id: toastId });
      router.push("/dashboard/master?tab=diagnosis");
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Gagal menyimpan config.", { id: toastId });
      setSubmitting(false);
    }
  };

  return (
    <HalamanForm
      ikon={Settings2}
      judul="Tambah Diagnosis"
      sub="Master data yang dipakai sebagai pilihan di form kunjungan"
      onSubmit={handleSubmit}
      onBatal={() => router.push("/dashboard/master?tab=diagnosis")}
      busy={submitting}
      lebar="max-w-2xl"
    >
      <BagianForm judul="Data Diagnosis">
        <Field label="Tipe">
          <select id="config-baru-type" name="type" value={form.type} onChange={handleChange} className="field" disabled={submitting}>
            <option value="diagnosis">Diagnosis</option>
          </select>
        </Field>

        <Field label="Nama (Label)" required ket="Kode dibentuk otomatis dari label: huruf kecil, spasi menjadi tanda hubung.">
          <input
            id="config-baru-label"
            name="label"
            value={form.label}
            onChange={handleChange}
            placeholder="Contoh: Sakit Kepala"
            autoComplete="off"
            className="field"
            disabled={submitting}
            required
          />
        </Field>
      </BagianForm>
    </HalamanForm>
  );
}
