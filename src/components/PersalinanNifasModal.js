"use client";

import { useState, useEffect } from "react";
import Modal, { btnBatal, btnUtama, Spinner } from "@/components/Modal";

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

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submitting}
      onSubmit={handleSubmit}
      title={mode === "add" ? "Tambah Kunjungan Nifas" : "Edit Kunjungan Nifas"}
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
      {/* Tanggal + auto-info */}
      <div className="flex flex-col gap-1">
        <label htmlFor="nifas-date" className="font-semibold text-slate-700 text-sm">
          Tanggal Kunjungan <span className="text-red-500">*</span>
        </label>
        <input id="nifas-date"
          name="date"
          type="date"
          value={form.date}
          onChange={handleChange}
          max={todayStr()}
          required
          className="field"
        />
        {hari != null && (
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-sm text-slate-600">
              Hari ke-<span className="font-semibold text-brand-700">{hari}</span> pasca salin
            </span>
            {kfNo ? (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
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
        <label htmlFor="nifas-tekananDarahSistol" className="font-semibold text-slate-700 text-sm">Tekanan Darah (mmHg)</label>
        <div className="flex items-center gap-2">
          <input id="nifas-tekananDarahSistol"
            name="tekananDarahSistol"
            type="number"
            min="0"
            value={form.tekananDarahSistol}
            onChange={handleChange}
            placeholder="Sistol"
            className="field flex-1"
          />
          <span className="text-slate-500 font-bold">/</span>
          <input
            aria-label="Tekanan darah diastol (mmHg)"
            name="tekananDarahDiastol"
            type="number"
            min="0"
            value={form.tekananDarahDiastol}
            onChange={handleChange}
            placeholder="Diastol"
            className="field flex-1"
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
          <label htmlFor="nifas-nadi" className="font-semibold text-slate-700 text-sm">Nadi (bpm)</label>
          <input id="nifas-nadi"
            name="nadi"
            type="number"
            min="0"
            value={form.nadi}
            onChange={handleChange}
            placeholder="80"
            className="field"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="nifas-suhu" className="font-semibold text-slate-700 text-sm">Suhu (°C)</label>
          <input id="nifas-suhu"
            name="suhu"
            type="number"
            step="0.1"
            min="0"
            value={form.suhu}
            onChange={handleChange}
            placeholder="36.5"
            className="field"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="nifas-pernapasan" className="font-semibold text-slate-700 text-sm">RR (x/mnt)</label>
          <input id="nifas-pernapasan"
            name="pernapasan"
            type="number"
            min="0"
            value={form.pernapasan}
            onChange={handleChange}
            placeholder="20"
            className="field"
          />
        </div>
      </div>

      {/* TFU */}
      <div className="flex flex-col gap-1">
        <label htmlFor="nifas-tfu" className="font-semibold text-slate-700 text-sm">TFU</label>
        <input id="nifas-tfu"
          name="tfu"
          type="text"
          value={form.tfu}
          onChange={handleChange}
          placeholder="Setinggi pusat / tidak teraba"
          className="field"
        />
      </div>

      {/* Lokhia */}
      <div className="flex flex-col gap-1">
        <label htmlFor="nifas-lokhia" className="font-semibold text-slate-700 text-sm">Lokhia</label>
        <select id="nifas-lokhia"
          name="lokhia"
          value={form.lokhia}
          onChange={handleChange}
          className="field"
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
        <label htmlFor="nifas-kondisiPerineum" className="font-semibold text-slate-700 text-sm">Kondisi Perineum</label>
        <select id="nifas-kondisiPerineum"
          name="kondisiPerineum"
          value={form.kondisiPerineum}
          onChange={handleChange}
          className="field"
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
        <label htmlFor="nifas-asi" className="font-semibold text-slate-700 text-sm">ASI</label>
        <select id="nifas-asi"
          name="asi"
          value={form.asi}
          onChange={handleChange}
          className="field"
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
          <label htmlFor="nifas-kondisiBayi" className="font-semibold text-slate-700 text-sm">Kondisi Bayi</label>
          <select id="nifas-kondisiBayi"
            name="kondisiBayi"
            value={form.kondisiBayi}
            onChange={handleChange}
            className="field"
          >
            <option value="">— Pilih —</option>
            <option value="baik">Baik</option>
            <option value="ikterus">Ikterus</option>
            <option value="infeksi">Infeksi</option>
            <option value="rujuk">Dirujuk</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="nifas-beratBayiSekarang" className="font-semibold text-slate-700 text-sm">BB Bayi Sekarang (g)</label>
          <input id="nifas-beratBayiSekarang"
            name="beratBayiSekarang"
            type="number"
            min="0"
            value={form.beratBayiSekarang}
            onChange={handleChange}
            placeholder="3200"
            className="field"
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
            className="w-4 h-4 rounded accent-brand-600"
          />
          <span className="font-medium text-slate-700">Vitamin A</span>
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            name="pemberianFe"
            checked={form.pemberianFe}
            onChange={handleChange}
            className="w-4 h-4 rounded accent-brand-600"
          />
          <span className="font-medium text-slate-700">Tablet Fe</span>
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            name="konselingDiberikan"
            checked={form.konselingDiberikan}
            onChange={handleChange}
            className="w-4 h-4 rounded accent-brand-600"
          />
          <span className="font-medium text-slate-700">Konseling diberikan</span>
        </label>
      </div>

      {/* Rencana KB */}
      <div className="flex flex-col gap-1">
        <label htmlFor="nifas-rencanKb" className="font-semibold text-slate-700 text-sm">Rencana KB</label>
        <select id="nifas-rencanKb"
          name="rencanKb"
          value={form.rencanKb}
          onChange={handleChange}
          className="field"
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
        <label htmlFor="nifas-keluhan" className="font-semibold text-slate-700 text-sm">Keluhan</label>
        <textarea id="nifas-keluhan"
          name="keluhan"
          rows={2}
          value={form.keluhan}
          onChange={handleChange}
          placeholder="Keluhan ibu saat kunjungan..."
          className="field resize-none"
        />
      </div>

      {/* Tindakan */}
      <div className="flex flex-col gap-1">
        <label htmlFor="nifas-tindakan" className="font-semibold text-slate-700 text-sm">Tindakan / Obat</label>
        <textarea id="nifas-tindakan"
          name="tindakan"
          rows={2}
          value={form.tindakan}
          onChange={handleChange}
          placeholder="Tindakan atau obat yang diberikan..."
          className="field resize-none"
        />
      </div>

      {/* Catatan */}
      <div className="flex flex-col gap-1">
        <label htmlFor="nifas-notes" className="font-semibold text-slate-700 text-sm">Catatan</label>
        <textarea id="nifas-notes"
          name="notes"
          rows={2}
          value={form.notes}
          onChange={handleChange}
          placeholder="Catatan tambahan..."
          className="field resize-none"
        />
      </div>
    </Modal>
  );
}
