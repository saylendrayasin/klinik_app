"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSpinner } from "react-icons/fa";
import { X } from "lucide-react";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function calcUK(hpht, dateStr) {
  if (!hpht || !dateStr) return null;
  const diff = new Date(`${dateStr}T00:00:00`) - new Date(hpht);
  if (diff < 0) return null;
  return Math.floor(diff / (7 * MS_PER_DAY));
}

function calcTrimester(uk) {
  if (uk == null) return null;
  if (uk <= 12) return 1;
  if (uk <= 27) return 2;
  return 3;
}

function calcJadwal(dateStr, uk) {
  if (!dateStr || uk == null) return "";
  let days = 28;
  if (uk >= 36) days = 7;
  else if (uk >= 28) days = 14;
  const d = new Date(new Date(`${dateStr}T00:00:00`).getTime() + days * MS_PER_DAY);
  return d.toISOString().slice(0, 10);
}

const LETAK_OPTIONS = [
  { value: "belum_diketahui", label: "Belum Diketahui" },
  { value: "kepala", label: "Kepala" },
  { value: "sungsang", label: "Sungsang" },
  { value: "lintang", label: "Lintang" },
];

const TRIMESTER_LABEL = { 1: "T1", 2: "T2", 3: "T3" };
const TRIMESTER_COLOR = {
  1: "bg-blue-100 text-blue-700",
  2: "bg-green-100 text-green-700",
  3: "bg-orange-100 text-orange-700",
};

export default function KehamilanVisitModal({
  open,
  onClose,
  onSubmit,
  initialData = null,
  mode = "add",
  hpht,
}) {
  const empty = {
    date: "",
    jadwalBerikutnya: "",
    beratBadan: "",
    tekananDarahSistol: "",
    tekananDarahDiastol: "",
    tfu: "",
    djj: "",
    letakJanin: "belum_diketahui",
    keluhan: "",
    tindakan: "",
    notes: "",
  };

  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape" && !submitting) onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, submitting]);

  const uk = calcUK(hpht, form.date);
  const trimester = calcTrimester(uk);

  useEffect(() => {
    if (!open) return;
    if (mode === "add") {
      setForm(empty);
    } else if (initialData) {
      setForm({
        date: initialData.date
          ? new Date(initialData.date).toISOString().slice(0, 10)
          : "",
        jadwalBerikutnya: initialData.jadwalBerikutnya
          ? new Date(initialData.jadwalBerikutnya).toISOString().slice(0, 10)
          : "",
        beratBadan: initialData.beratBadan ?? "",
        tekananDarahSistol: initialData.tekananDarahSistol ?? "",
        tekananDarahDiastol: initialData.tekananDarahDiastol ?? "",
        tfu: initialData.tfu ?? "",
        djj: initialData.djj ?? "",
        letakJanin: initialData.letakJanin || "belum_diketahui",
        keluhan: initialData.keluhan || "",
        tindakan: initialData.tindakan || "",
        notes: initialData.notes || "",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "date") {
        const newUk = calcUK(hpht, value);
        const suggested = calcJadwal(value, newUk);
        updated.jadwalBerikutnya = suggested;
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      ...form,
      beratBadan: form.beratBadan !== "" ? Number(form.beratBadan) : undefined,
      tekananDarahSistol: form.tekananDarahSistol !== "" ? Number(form.tekananDarahSistol) : undefined,
      tekananDarahDiastol: form.tekananDarahDiastol !== "" ? Number(form.tekananDarahDiastol) : undefined,
      tfu: form.tfu !== "" ? Number(form.tfu) : undefined,
      djj: form.djj !== "" ? Number(form.djj) : undefined,
      jadwalBerikutnya: form.jadwalBerikutnya || undefined,
    };
    await onSubmit(payload);
    setSubmitting(false);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.18 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-800">
                {mode === "add" ? "Tambah Kunjungan ANC" : "Edit Kunjungan ANC"}
              </h2>
              <button
                onClick={onClose}
                disabled={submitting}
                aria-label="Tutup"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Tanggal + UK + Trimester */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700 text-sm">
                  Tanggal Kunjungan <span className="text-red-500">*</span>
                </label>
                <input
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  max={todayStr()}
                  required
                  className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
                {uk != null && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-600">
                      Usia Kehamilan:{" "}
                      <span className="font-semibold text-rose-700">{uk} minggu</span>
                    </span>
                    {trimester && (
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${TRIMESTER_COLOR[trimester]}`}
                      >
                        {TRIMESTER_LABEL[trimester]}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Jadwal Berikutnya */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700 text-sm">
                  Jadwal Kunjungan Berikutnya
                  <span className="text-xs text-gray-400 font-normal ml-1">(auto-suggest, bisa diubah)</span>
                </label>
                <input
                  name="jadwalBerikutnya"
                  type="date"
                  value={form.jadwalBerikutnya}
                  onChange={handleChange}
                  className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              {/* BB */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700 text-sm">Berat Badan (kg)</label>
                <input
                  name="beratBadan"
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.beratBadan}
                  onChange={handleChange}
                  placeholder="52.5"
                  className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              {/* TD */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700 text-sm">
                  Tekanan Darah (mmHg)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    name="tekananDarahSistol"
                    type="number"
                    min="0"
                    value={form.tekananDarahSistol}
                    onChange={handleChange}
                    placeholder="Sistol"
                    className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                  <span className="text-gray-500 font-bold">/</span>
                  <input
                    name="tekananDarahDiastol"
                    type="number"
                    min="0"
                    value={form.tekananDarahDiastol}
                    onChange={handleChange}
                    placeholder="Diastol"
                    className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
                {(Number(form.tekananDarahSistol) >= 140 ||
                  Number(form.tekananDarahDiastol) >= 90) &&
                  form.tekananDarahSistol !== "" && (
                    <p className="text-xs text-red-600 font-medium mt-0.5">
                      ⚠️ TD tinggi — perhatikan risiko preeklampsia
                    </p>
                  )}
              </div>

              {/* TFU + DJJ */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-gray-700 text-sm">TFU (cm)</label>
                  <input
                    name="tfu"
                    type="number"
                    step="0.1"
                    min="0"
                    value={form.tfu}
                    onChange={handleChange}
                    placeholder="20"
                    className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-gray-700 text-sm">DJJ (bpm)</label>
                  <input
                    name="djj"
                    type="number"
                    min="0"
                    value={form.djj}
                    onChange={handleChange}
                    placeholder="140"
                    className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              </div>

              {/* Letak Janin */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700 text-sm">Letak Janin</label>
                <select
                  name="letakJanin"
                  value={form.letakJanin}
                  onChange={handleChange}
                  className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-rose-400"
                >
                  {LETAK_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Keluhan */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700 text-sm">Keluhan</label>
                <textarea
                  name="keluhan"
                  rows={2}
                  value={form.keluhan}
                  onChange={handleChange}
                  placeholder="Keluhan ibu saat kunjungan..."
                  className="p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              {/* Tindakan */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700 text-sm">Tindakan / Obat</label>
                <textarea
                  name="tindakan"
                  rows={2}
                  value={form.tindakan}
                  onChange={handleChange}
                  placeholder="Tindakan atau obat yang diberikan..."
                  className="p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              {/* Catatan */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700 text-sm">Catatan</label>
                <textarea
                  name="notes"
                  rows={2}
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Catatan tambahan..."
                  className="p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 rounded-md transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {submitting ? (
                  <>
                    <FaSpinner className="animate-spin" /> Menyimpan...
                  </>
                ) : mode === "add" ? (
                  "Simpan Kunjungan"
                ) : (
                  "Simpan Perubahan"
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
