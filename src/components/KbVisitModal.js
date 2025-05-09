"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSpinner } from "react-icons/fa";

const metodeList = [
  { label: "Suntik 1 Bulan", value: "Suntik 1 Bulan", days: 28 },
  { label: "Suntik 2 Bulan", value: "Suntik 2 Bulan", days: 56 },
  { label: "Suntik 3 Bulan", value: "Suntik 3 Bulan", days: 84 },
  { label: "Implant", value: "Implant", days: 365 * 3 },
  { label: "IUD TCU", value: "IUD TCU", days: 365 * 3 },
  { label: "IUD TCU 380A", value: "IUD TCU 380A", days: 365 * 5 },
  { label: "Pil", value: "Pil", days: 28 },
];

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
      setForm({
        date: "",
        metode: "",
        notes: "",
        returnDate: "",
      });
    } else if (initialData) {
      const dateFormatted = initialData.date
        ? new Date(initialData.date).toISOString().slice(0, 10)
        : "";
      const returnDateFormatted = initialData.returnDate
        ? new Date(initialData.returnDate).toISOString().slice(0, 10)
        : "";

      setForm({
        date: dateFormatted,
        metode: initialData.metode || "",
        notes: initialData.notes || "",
        returnDate: returnDateFormatted,
      });
    }
  }, [open, mode, initialData]);

  const handleChange = (e) => {
    const updatedForm = { ...form, [e.target.name]: e.target.value };

    if (updatedForm.date && updatedForm.metode) {
      const selected = metodeList.find((m) => m.value === updatedForm.metode);
      if (selected) {
        const kunjunganDate = new Date(updatedForm.date);
        kunjunganDate.setDate(kunjunganDate.getDate() + selected.days);
        updatedForm.returnDate = kunjunganDate.toISOString().slice(0, 10);
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

  if (!open) return null;

  const formatDate = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "-";

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
              {mode === "add" ? "Tambah Kunjungan KB" : "Edit Kunjungan KB"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tanggal Kunjungan */}
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
                {form.date && (
                  <span className="text-sm text-gray-500 mt-1">
                    Format:
                    {new Date(form.date).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>

              {/* Metode */}
              <div className="flex flex-col">
                <label
                  htmlFor="metode"
                  className="font-semibold text-gray-700 mb-1"
                >
                  Metode KB
                </label>
                <select
                  id="metode"
                  name="metode"
                  value={form.metode}
                  onChange={handleChange}
                  disabled={!form.date}
                  required
                  className={`p-2 border rounded-md w-full ${
                    !form.date ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                >
                  <option value="">-- Pilih Metode --</option>
                  {metodeList.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal Kembali (otomatis) */}
              <div className="flex flex-col">
                <label className="font-semibold text-gray-700 mb-1">
                  Tanggal Kembali (Otomatis)
                </label>
                <input
                  type="text"
                  readOnly
                  value={formatDate(form.returnDate)}
                  className="p-2 border rounded-md w-full bg-gray-100 text-gray-700"
                />
              </div>

              {/* Notes */}
              <div className="flex flex-col">
                <label
                  htmlFor="notes"
                  className="font-semibold text-gray-700 mb-1"
                >
                  Catatan
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows="3"
                  value={form.notes}
                  onChange={handleChange}
                  className="p-2 border rounded-md resize-none"
                />
              </div>

              {/* Tombol Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md font-semibold flex items-center justify-center gap-2 transition"
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
