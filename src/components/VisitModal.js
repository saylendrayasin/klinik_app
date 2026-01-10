"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DiagnosisSelect from "@/components/DiagnosisSelect";
import { FaSpinner } from "react-icons/fa";

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-md shadow-md w-full max-w-lg p-6 relative"
          >
            <button
              onClick={onClose}
              disabled={submitting}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-800 text-3xl font-bold"
            >
              ×
            </button>

            <h2 className="text-xl font-bold mb-6 text-center">
              {mode === "add" ? "Tambah Kunjungan Baru" : "Edit Kunjungan"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col">
                <label className="font-semibold text-gray-700 mb-1">
                  Diagnosis Kunjungan
                </label>
                <DiagnosisSelect
                  value={form.visitDiagnosisIds}
                  onChange={handleDiagnosisChange}
                />
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="date"
                  className="font-semibold text-gray-700 mb-1"
                >
                  Tanggal Kunjungan
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                  className="p-2 border rounded-md w-full"
                />
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="complaint"
                  className="font-semibold text-gray-700 mb-1"
                >
                  Keluhan Pasien
                </label>
                <textarea
                  id="complaint"
                  name="complaint"
                  value={form.complaint}
                  onChange={handleChange}
                  placeholder="Masukkan keluhan pasien..."
                  required
                  rows="2"
                  className="p-2 border rounded-md resize-none"
                />
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="medication"
                  className="font-semibold text-gray-700 mb-1"
                >
                  Obat yang Diberikan
                </label>
                <textarea
                  id="medication"
                  name="medication"
                  value={form.medication}
                  onChange={handleChange}
                  placeholder="Masukkan nama obat..."
                  rows="3"
                  className="p-2 border rounded-md resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md font-semibold flex items-center justify-center gap-2 transition"
              >
                {submitting ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    {mode === "add" ? "Simpan Kunjungan" : "Simpan Perubahan"}
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
