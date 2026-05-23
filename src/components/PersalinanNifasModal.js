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

const KF_SCHEDULE = [
  { kf: 1, windowStart: 0, windowEnd: 2 },
  { kf: 2, windowStart: 3, windowEnd: 7 },
  { kf: 3, windowStart: 8, windowEnd: 28 },
  { kf: 4, windowStart: 29, windowEnd: 42 },
];

function calcHari(tanggalPersalinan, dateStr) {
  if (!tanggalPersalinan || !dateStr) return null;
  const diff = new Date(`${dateStr}T00:00:00`) - new Date(tanggalPersalinan);
  if (diff < 0) return null;
  return Math.floor(diff / MS_PER_DAY);
}

function calcKF(hari) {
  if (hari == null) return null;
  const kf = KF_SCHEDULE.find((s) => hari >= s.windowStart && hari <= s.windowEnd);
  return kf ? kf.kf : null;
}

const EMPTY = {
  date: "",
  tekananDarahSistol: "",
  tekananDarahDiastol: "",
  nadi: "",
  suhu: "",
  pernapasan: "",
  tfu: "",
  lokhia: "",
  kondisiPerineum: "",
  asi: "",
  kondisiBayi: "",
  beratBayiSekarang: "",
  pemberianVitaminA: false,
  pemberianFe: false,
  konselingDiberikan: false,
  rencanKb: "belum",
  keluhan: "",
  tindakan: "",
  notes: "",
};

export default function PersalinanNifasModal({
  open,
  onClose,
  onSubmit,
  initialData = null,
  mode = "add",
  tanggalPersalinan,
}) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape" && !submitting) onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, submitting]);

  const hari = calcHari(tanggalPersalinan, form.date);
  const kfNo = calcKF(hari);
  const isTD =
    Number(form.tekananDarahSistol) >= 140 || Number(form.tekananDarahDiastol) >= 90;

  useEffect(() => {
    if (!open) return;
    if (mode === "add") {
      setForm(EMPTY);
    } else if (initialData) {
      setForm({
        date: initialData.date ? new Date(initialData.date).toISOString().slice(0, 10) : "",
        tekananDarahSistol: initialData.tekananDarahSistol ?? "",
        tekananDarahDiastol: initialData.tekananDarahDiastol ?? "",
        nadi: initialData.nadi ?? "",
        suhu: initialData.suhu ?? "",
        pernapasan: initialData.pernapasan ?? "",
        tfu: initialData.tfu ?? "",
        lokhia: initialData.lokhia || "",
        kondisiPerineum: initialData.kondisiPerineum || "",
        asi: initialData.asi || "",
        kondisiBayi: initialData.kondisiBayi || "",
        beratBayiSekarang: initialData.beratBayiSekarang ?? "",
        pemberianVitaminA: initialData.pemberianVitaminA ?? false,
        pemberianFe: initialData.pemberianFe ?? false,
        konselingDiberikan: initialData.konselingDiberikan ?? false,
        rencanKb: initialData.rencanKb || "belum",
        keluhan: initialData.keluhan || "",
        tindakan: initialData.tindakan || "",
        notes: initialData.notes || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      ...form,
      tekananDarahSistol: form.tekananDarahSistol !== "" ? Number(form.tekananDarahSistol) : undefined,
      tekananDarahDiastol: form.tekananDarahDiastol !== "" ? Number(form.tekananDarahDiastol) : undefined,
      nadi: form.nadi !== "" ? Number(form.nadi) : undefined,
      suhu: form.suhu !== "" ? Number(form.suhu) : undefined,
      pernapasan: form.pernapasan !== "" ? Number(form.pernapasan) : undefined,
      tfu: form.tfu || undefined,
      lokhia: form.lokhia || undefined,
      kondisiPerineum: form.kondisiPerineum || undefined,
      asi: form.asi || undefined,
      kondisiBayi: form.kondisiBayi || undefined,
      beratBayiSekarang: form.beratBayiSekarang !== "" ? Number(form.beratBayiSekarang) : undefined,
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
            <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-800">
                {mode === "add" ? "Tambah Kunjungan Nifas" : "Edit Kunjungan Nifas"}
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
              {/* Tanggal + auto-info */}
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
                  className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                {hari != null && (
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-sm text-gray-600">
                      Hari ke-<span className="font-semibold text-emerald-700">{hari}</span> pasca salin
                    </span>
                    {kfNo ? (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        KF{kfNo}
                      </span>
                    ) : hari > 42 ? (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        &gt;42 hari
                      </span>
                    ) : null}
                  </div>
                )}
              </div>

              {/* TD */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700 text-sm">Tekanan Darah (mmHg)</label>
                <div className="flex items-center gap-2">
                  <input
                    name="tekananDarahSistol"
                    type="number"
                    min="0"
                    value={form.tekananDarahSistol}
                    onChange={handleChange}
                    placeholder="Sistol"
                    className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <span className="text-gray-500 font-bold">/</span>
                  <input
                    name="tekananDarahDiastol"
                    type="number"
                    min="0"
                    value={form.tekananDarahDiastol}
                    onChange={handleChange}
                    placeholder="Diastol"
                    className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                {isTD && form.tekananDarahSistol !== "" && (
                  <p className="text-xs text-red-600 font-medium mt-0.5">
                    ⚠️ TD tinggi — perhatikan risiko hipertensi post-partum
                  </p>
                )}
              </div>

              {/* Nadi + Suhu + Pernapasan */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-gray-700 text-sm">Nadi (bpm)</label>
                  <input
                    name="nadi"
                    type="number"
                    min="0"
                    value={form.nadi}
                    onChange={handleChange}
                    placeholder="80"
                    className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-gray-700 text-sm">Suhu (°C)</label>
                  <input
                    name="suhu"
                    type="number"
                    step="0.1"
                    min="0"
                    value={form.suhu}
                    onChange={handleChange}
                    placeholder="36.5"
                    className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-gray-700 text-sm">RR (x/mnt)</label>
                  <input
                    name="pernapasan"
                    type="number"
                    min="0"
                    value={form.pernapasan}
                    onChange={handleChange}
                    placeholder="20"
                    className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              {/* TFU */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700 text-sm">TFU</label>
                <input
                  name="tfu"
                  type="text"
                  value={form.tfu}
                  onChange={handleChange}
                  placeholder="Setinggi pusat / tidak teraba"
                  className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              {/* Lokhia */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700 text-sm">Lokhia</label>
                <select
                  name="lokhia"
                  value={form.lokhia}
                  onChange={handleChange}
                  className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="">— Pilih —</option>
                  <option value="rubra">Rubra (merah)</option>
                  <option value="sanguinolenta">Sanguinolenta (kecokelatan)</option>
                  <option value="serosa">Serosa (kekuningan)</option>
                  <option value="alba">Alba (putih/pucat)</option>
                </select>
              </div>

              {/* Kondisi Perineum */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700 text-sm">Kondisi Perineum</label>
                <select
                  name="kondisiPerineum"
                  value={form.kondisiPerineum}
                  onChange={handleChange}
                  className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="">— Pilih —</option>
                  <option value="baik">Baik</option>
                  <option value="edema">Edema</option>
                  <option value="infeksi">Infeksi</option>
                  <option value="tidak_ada_luka">Tidak Ada Luka</option>
                </select>
              </div>

              {/* ASI */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700 text-sm">ASI</label>
                <select
                  name="asi"
                  value={form.asi}
                  onChange={handleChange}
                  className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="">— Pilih —</option>
                  <option value="lancar">Lancar</option>
                  <option value="kurang">Kurang</option>
                  <option value="tidak_ada">Tidak Ada</option>
                </select>
              </div>

              {/* Kondisi Bayi + BB Bayi */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-gray-700 text-sm">Kondisi Bayi</label>
                  <select
                    name="kondisiBayi"
                    value={form.kondisiBayi}
                    onChange={handleChange}
                    className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="">— Pilih —</option>
                    <option value="baik">Baik</option>
                    <option value="ikterus">Ikterus</option>
                    <option value="infeksi">Infeksi</option>
                    <option value="rujuk">Dirujuk</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-gray-700 text-sm">BB Bayi Sekarang (g)</label>
                  <input
                    name="beratBayiSekarang"
                    type="number"
                    min="0"
                    value={form.beratBayiSekarang}
                    onChange={handleChange}
                    placeholder="3200"
                    className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              {/* Vitamin A, Fe & Konseling */}
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="pemberianVitaminA"
                    checked={form.pemberianVitaminA}
                    onChange={handleChange}
                    className="w-4 h-4 rounded accent-emerald-600"
                  />
                  <span className="font-medium text-gray-700">Vitamin A</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="pemberianFe"
                    checked={form.pemberianFe}
                    onChange={handleChange}
                    className="w-4 h-4 rounded accent-emerald-600"
                  />
                  <span className="font-medium text-gray-700">Tablet Fe</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="konselingDiberikan"
                    checked={form.konselingDiberikan}
                    onChange={handleChange}
                    className="w-4 h-4 rounded accent-emerald-600"
                  />
                  <span className="font-medium text-gray-700">Konseling diberikan</span>
                </label>
              </div>

              {/* Rencana KB */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700 text-sm">Rencana KB</label>
                <select
                  name="rencanKb"
                  value={form.rencanKb}
                  onChange={handleChange}
                  className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="belum">Belum ditentukan</option>
                  <option value="kondom">Kondom</option>
                  <option value="pil">Pil</option>
                  <option value="suntik">Suntik</option>
                  <option value="iud">IUD</option>
                  <option value="implant">Implant</option>
                  <option value="mow">MOW (Tubektomi)</option>
                  <option value="mop">MOP (Vasektomi)</option>
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
                  className="p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
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
                  className="p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
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
                  className="p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-md transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {submitting ? (
                  <><FaSpinner className="animate-spin" /> Menyimpan...</>
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
