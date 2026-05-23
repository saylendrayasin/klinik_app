"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DiagnosisSelect from "@/components/DiagnosisSelect";
import { FaSpinner } from "react-icons/fa";
import { X } from "lucide-react";

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function VisitModal({
  open,
  onClose,
  onSubmit,
  initialData = {},
  mode = "add",
}) {
  const [form, setForm] = useState({
    date: "",
    complaint: "",
    medication: "",
    visitDiagnosisIds: [],
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        date: initialData.date
          ? new Date(initialData.date).toISOString().slice(0, 10)
          : "",
        complaint: initialData.complaint || "",
        medication: initialData.medication || "",
        visitDiagnosisIds:
          initialData.visitDiagnosisIds || initialData.visitDiagnosis || [],
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape" && !submitting) onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, submitting, onClose]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDiagnosisChange = (selectedOptions) => {
    const selectedIds = (selectedOptions || []).map((opt) => opt.value);
    setForm({ ...form, visitDiagnosisIds: selectedIds });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
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
            <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-400" />
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">
                {mode === "add" ? "Tambah Kunjungan Baru" : "Edit Kunjungan"}
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
                <label htmlFor="visit-date" className="text-sm font-semibold text-slate-700">
                  Tanggal Kunjungan <span className="text-red-500">*</span>
                </label>
                <input
                  id="visit-date"
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  max={todayStr()}
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Diagnosis Kunjungan</label>
                <DiagnosisSelect
                  value={form.visitDiagnosisIds}
                  onChange={handleDiagnosisChange}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="visit-complaint" className="text-sm font-semibold text-slate-700">
                  Keluhan Pasien <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="visit-complaint"
                  name="complaint"
                  value={form.complaint}
                  onChange={handleChange}
                  placeholder="Masukkan keluhan pasien..."
                  required
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 transition resize-none placeholder:text-slate-400"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="visit-medication" className="text-sm font-semibold text-slate-700">
                  Obat yang Diberikan
                </label>
                <textarea
                  id="visit-medication"
                  name="medication"
                  value={form.medication}
                  onChange={handleChange}
                  placeholder="Masukkan nama obat..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 transition resize-none placeholder:text-slate-400"
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
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-60 shadow-md shadow-blue-200"
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
