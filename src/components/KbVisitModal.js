"use client";

import { useState, useEffect } from "react";
import { tanggalSingkat } from "@/lib/tanggal";
import Modal, { btnBatal, btnUtama, Spinner } from "@/components/Modal";

const metodeList = [
  { label: "Suntik 1 Bulan", value: "Suntik 1 Bulan", days: 29 },
  { label: "Suntik 2 Bulan", value: "Suntik 2 Bulan", days: 58 },
  { label: "Suntik 3 Bulan", value: "Suntik 3 Bulan", days: 84 },
  { label: "Implant", value: "Implant", days: 365 * 3 },
  { label: "IUD TCU", value: "IUD TCU", days: 365 * 3 },
  { label: "IUD TCU 380A", value: "IUD TCU 380A", days: 365 * 5 },
  { label: "Pil", value: "Pil", days: 28 },
];

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function KbVisitModal({
  open,
  onClose,
  onSubmit,
  initialData = {},
  mode = "add",
}) {
  const [form, setForm] = useState({
    date: "",
    metode: "",
    notes: "",
    returnDate: "",
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "add") {
      setForm({ date: "", metode: "", notes: "", returnDate: "" });
    } else if (initialData) {
      setForm({
        date: initialData.date ? new Date(initialData.date).toISOString().slice(0, 10) : "",
        metode: initialData.metode || "",
        notes: initialData.notes || "",
        returnDate: initialData.returnDate ? new Date(initialData.returnDate).toISOString().slice(0, 10) : "",
      });
    }
  }, [open, mode, initialData]);


  const handleChange = (e) => {
    const updatedForm = { ...form, [e.target.name]: e.target.value };
    if (updatedForm.date && updatedForm.metode) {
      const selected = metodeList.find((m) => m.value === updatedForm.metode);
      if (selected) {
        const d = new Date(`${updatedForm.date}T00:00:00`);
        d.setDate(d.getDate() + selected.days);
        updatedForm.returnDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      }
    } else {
      updatedForm.returnDate = "";
    }
    setForm(updatedForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
  };


  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submitting}
      onSubmit={handleSubmit}
      title={mode === "add" ? "Tambah Kunjungan KB" : "Edit Kunjungan KB"}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={submitting} className={btnBatal}>
            Batal
          </button>
          <button type="submit" disabled={submitting} className={btnUtama}>
            {submitting ? <><Spinner /> Menyimpan...</> : mode === "add" ? "Simpan Kunjungan" : "Simpan Perubahan"}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="kb-date" className="text-sm font-semibold text-slate-700">
          Tanggal Kunjungan <span className="text-red-500">*</span>
        </label>
        <input
          id="kb-date"
          name="date"
          type="date"
          value={form.date}
          onChange={handleChange}
          max={todayStr()}
          required
          className="field"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="kb-metode" className="text-sm font-semibold text-slate-700">
          Metode KB <span className="text-red-500">*</span>
        </label>
        <select
          id="kb-metode"
          name="metode"
          value={form.metode}
          onChange={handleChange}
          disabled={!form.date}
          required
          className="field"
        >
          <option value="">-- Pilih Metode --</option>
          {metodeList.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-slate-700">Tanggal Kembali</span>
        <div className="w-full px-3.5 py-2.5 border border-slate-100 bg-slate-50 rounded-xl text-sm text-slate-600 font-medium">
          {form.returnDate ? tanggalSingkat(form.returnDate) : <span className="text-slate-400">— otomatis setelah pilih metode —</span>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="kb-notes" className="text-sm font-semibold text-slate-700">Catatan</label>
        <textarea
          id="kb-notes"
          name="notes"
          rows={3}
          value={form.notes}
          onChange={handleChange}
          placeholder="Catatan tambahan..."
          className="field resize-none"
        />
      </div>
    </Modal>
  );
}
