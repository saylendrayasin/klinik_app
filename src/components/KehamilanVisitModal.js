"use client";

import { useState, useEffect } from "react";
import Modal, { btnBatal, btnUtama, Spinner } from "@/components/Modal";

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
  1: "bg-brand-100 text-brand-700",
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submitting}
      onSubmit={handleSubmit}
      title={mode === "add" ? "Tambah Kunjungan ANC" : "Edit Kunjungan ANC"}
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
      {/* Tanggal + UK + Trimester */}
      <div className="flex flex-col gap-1">
        <label htmlFor="anc-date" className="font-semibold text-slate-700 text-sm">
          Tanggal Kunjungan <span className="text-red-500">*</span>
        </label>
        <input id="anc-date"
          name="date"
          type="date"
          value={form.date}
          onChange={handleChange}
          max={todayStr()}
          required
          className="field"
        />
        {uk != null && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-slate-600">
              Usia Kehamilan:{" "}
              <span className="font-semibold text-brand-700">{uk} minggu</span>
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
        <label htmlFor="anc-jadwalBerikutnya" className="font-semibold text-slate-700 text-sm">
          Jadwal Kunjungan Berikutnya
          <span className="text-xs text-slate-400 font-normal ml-1">(auto-suggest, bisa diubah)</span>
        </label>
        <input id="anc-jadwalBerikutnya"
          name="jadwalBerikutnya"
          type="date"
          value={form.jadwalBerikutnya}
          onChange={handleChange}
          className="field"
        />
      </div>

      {/* BB */}
      <div className="flex flex-col gap-1">
        <label htmlFor="anc-beratBadan" className="font-semibold text-slate-700 text-sm">Berat Badan (kg)</label>
        <input id="anc-beratBadan"
          name="beratBadan"
          type="number"
          step="0.1"
          min="0"
          value={form.beratBadan}
          onChange={handleChange}
          placeholder="52.5"
          className="field"
        />
      </div>

      {/* TD */}
      <div className="flex flex-col gap-1">
        <label htmlFor="anc-tekananDarahSistol" className="font-semibold text-slate-700 text-sm">
          Tekanan Darah (mmHg)
        </label>
        <div className="flex items-center gap-2">
          <input id="anc-tekananDarahSistol"
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
          <label htmlFor="anc-tfu" className="font-semibold text-slate-700 text-sm">TFU (cm)</label>
          <input id="anc-tfu"
            name="tfu"
            type="number"
            step="0.1"
            min="0"
            value={form.tfu}
            onChange={handleChange}
            placeholder="20"
            className="field"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="anc-djj" className="font-semibold text-slate-700 text-sm">DJJ (bpm)</label>
          <input id="anc-djj"
            name="djj"
            type="number"
            min="0"
            value={form.djj}
            onChange={handleChange}
            placeholder="140"
            className="field"
          />
        </div>
      </div>

      {/* Letak Janin */}
      <div className="flex flex-col gap-1">
        <label htmlFor="anc-letakJanin" className="font-semibold text-slate-700 text-sm">Letak Janin</label>
        <select id="anc-letakJanin"
          name="letakJanin"
          value={form.letakJanin}
          onChange={handleChange}
          className="field"
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
        <label htmlFor="anc-keluhan" className="font-semibold text-slate-700 text-sm">Keluhan</label>
        <textarea id="anc-keluhan"
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
        <label htmlFor="anc-tindakan" className="font-semibold text-slate-700 text-sm">Tindakan / Obat</label>
        <textarea id="anc-tindakan"
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
        <label htmlFor="anc-notes" className="font-semibold text-slate-700 text-sm">Catatan</label>
        <textarea id="anc-notes"
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
