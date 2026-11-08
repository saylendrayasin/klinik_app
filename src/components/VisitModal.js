"use client";

import { useState, useEffect } from "react";
import Modal, { btnBatal, btnUtama, Spinner } from "@/components/Modal";
import DiagnosisSelect from "@/components/DiagnosisSelect";

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

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submitting}
      onSubmit={handleSubmit}
      title={mode === "add" ? "Tambah Kunjungan Baru" : "Edit Kunjungan"}
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
          className="field"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="visit-diagnosis" className="text-sm font-semibold text-slate-700">Diagnosis Kunjungan</label>
        <DiagnosisSelect
        inputId="visit-diagnosis"
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
          rows={4}
          className="field resize-y"
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
          rows={3}
          className="field resize-y"
        />
      </div>
    </Modal>
  );
}
