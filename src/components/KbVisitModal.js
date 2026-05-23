"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSpinner } from "react-icons/fa";
import { X } from "lucide-react";

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

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape" && !submitting) onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, submitting, onClose]);

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

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden"
          >
            <div className="h-1 bg-gradient-to-r from-violet-500 to-violet-400" />
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">
                {mode === "add" ? "Tambah Kunjungan KB" : "Edit Kunjungan KB"}
              </h2>
              <button
                onClick={onClose}
                disabled={submitting}
                aria-label="Tutup"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
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
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-300 transition"
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
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-300 transition disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">-- Pilih Metode --</option>
                  {metodeList.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Tanggal Kembali</label>
                <div className="w-full px-3.5 py-2.5 border border-slate-100 bg-slate-50 rounded-xl text-sm text-slate-600 font-medium">
                  {form.returnDate ? formatDate(form.returnDate) : <span className="text-slate-400">— otomatis setelah pilih metode —</span>}
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
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-300 transition resize-none placeholder:text-slate-400"
                />
              </div>

              <div className="flex gap-2.5 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-sm transition disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 text-white font-semibold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-60 shadow-md shadow-violet-200"
                >
                  {submitting ? (
                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Menyimpan...</>
                  ) : (
                    mode === "add" ? "Simpan Kunjungan" : "Simpan Perubahan"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
