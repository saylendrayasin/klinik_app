"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DetailHeader from "@/components/DetailHeader";
import TabBar from "@/components/TabBar";
import { fetcher } from "@/lib/fetcher";
import VisitModal from "@/components/VisitModal";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  FaPlus,
  FaUserEdit,
  FaClipboardList,
} from "react-icons/fa";
import ConfirmModal from "@/components/ConfirmModal";
import { SkeletonKartu } from "@/components/Skeleton";
import KartuKunjungan from "@/components/KartuKunjungan";
import KeadaanKosong, { TidakDitemukan } from "@/components/KeadaanKosong";
import Field from "@/components/Field";
import { FormEdit, BagianForm } from "@/components/HalamanForm";

function fmtDate(d) {
  if (!d) return "-";
  try {
    return format(new Date(d), "dd MMMM yyyy", { locale: localeId });
  } catch {
    return "-";
  }
}

function calculateAge(dob) {
  if (!dob) return "-";
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return "-";
  const today = new Date();
  if (birth > today) return 0;
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
}

function DataItem({ label, value, className = "" }) {
  return (
    <div className={className}>
      <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
      <p className="font-medium text-slate-800 line-clamp-2">{value || "-"}</p>
    </div>
  );
}

function fmtMedication(med) {
  if (!med) return "";
  return med.split(/\n+/).map((s) => s.trim()).filter(Boolean).join(", ");
}

export default function DashboardPatientDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("data");
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    dateOfBirth: "",
    address: "",
    gender: "Male",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editVisitIndex, setEditVisitIndex] = useState(null);
  const [initialVisitData, setInitialVisitData] = useState(null);
  const [modalMode, setModalMode] = useState("add");
  const [diagnosisMap, setDiagnosisMap] = useState({});
  const [deleteVisitTarget, setDeleteVisitTarget] = useState(null);
  const [deletingVisit, setDeletingVisit] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const savedForm = useMemo(() => ({
    name: patient?.name || "",
    dateOfBirth: patient?.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().slice(0, 10) : "",
    address: patient?.address || "",
    gender: patient?.gender || "Male",
  }), [patient]);

  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(savedForm), [form, savedForm]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const fetchDiagnosisMap = async () => {
    try {
      const res = await fetcher("/api/config?type=diagnosis&limit=200");
      const items = res?.data || [];
      const map = {};
      for (const it of items) map[it._id] = it.label;
      setDiagnosisMap(map);
    } catch (e) {
      console.error(e);
    }
  };

  const getDiagnosisLabels = (visit) => {
    if (Array.isArray(visit?.visitDiagnosisIds) && visit.visitDiagnosisIds.length > 0) {
      return visit.visitDiagnosisIds.map((id) => diagnosisMap[id] || id).filter(Boolean);
    }
    if (Array.isArray(visit?.visitDiagnosis) && visit.visitDiagnosis.length > 0) {
      return visit.visitDiagnosis;
    }
    return [];
  };

  const getPatientDiagnosisLabels = () => {
    if (Array.isArray(patient?.diagnosisIds) && patient.diagnosisIds.length > 0) {
      return patient.diagnosisIds.map((id) => diagnosisMap[id] || id).filter(Boolean);
    }
    if (Array.isArray(patient?.diagnosis) && patient.diagnosis.length > 0) {
      return patient.diagnosis;
    }
    return [];
  };

  // `pertahankanForm`: setelah kunjungan berubah, isian Edit Data yang belum disimpan tidak boleh tertimpa.
  const fetchPatient = async (pertahankanForm = false) => {
    try {
      const { data } = await fetcher(`/api/patients/${params.id}`);
      setPatient(data);
      if (!pertahankanForm) setForm({
        name: data.name || "",
        dateOfBirth: data.dateOfBirth
          ? new Date(data.dateOfBirth).toISOString().slice(0, 10)
          : "",
        address: data.address || "",
        gender: data.gender || "Male",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params?.id) {
      fetchDiagnosisMap();
      fetchPatient();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdatePatient = async (e) => {
    e.preventDefault();
    setSaving(true);
    const toastId = toast.loading("Menyimpan perubahan...");
    try {
      await fetcher(`/api/patients/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...form, visits: patient.visits }),
      });
      toast.success("Perubahan berhasil disimpan", { id: toastId });
      await fetchPatient();
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Gagal menyimpan perubahan", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAddVisit = () => {
    setInitialVisitData(null);
    setEditVisitIndex(null);
    setModalMode("add");
    setModalOpen(true);
  };

  const handleOpenEditVisit = (visit, index) => {
    setInitialVisitData(visit);
    setEditVisitIndex(index);
    setModalMode("edit");
    setModalOpen(true);
  };

  const handleSubmitVisit = async (formData) => {
    const toastId = toast.loading("Menyimpan kunjungan...");
    try {
      const updatedVisits = [...(patient.visits || [])];
      if (modalMode === "edit" && editVisitIndex !== null) {
        updatedVisits[editVisitIndex] = formData;
      } else {
        updatedVisits.push(formData);
      }
      await fetcher(`/api/patients/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ visits: updatedVisits }),
      });
      await fetchPatient(true);
      setModalOpen(false);
      toast.success("Kunjungan berhasil disimpan", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan kunjungan", { id: toastId });
    }
  };

  const handleDeleteVisitConfirm = async () => {
    if (deleteVisitTarget === null) return;
    setDeletingVisit(true);
    const toastId = toast.loading("Menghapus kunjungan...");
    try {
      const updatedVisits = [...patient.visits];
      updatedVisits.splice(deleteVisitTarget, 1);
      await fetcher(`/api/patients/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ visits: updatedVisits }),
      });
      setDeleteVisitTarget(null);
      await fetchPatient(true);
      toast.success("Kunjungan berhasil dihapus", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus kunjungan", { id: toastId });
    } finally {
      setDeletingVisit(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <DetailHeader
        onBack={() => isDirty ? setBackConfirmOpen(true) : router.push("/dashboard/patients")}
        loading={loading}
        title={patient?.name}
        badge={patient && (
          <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
            patient.gender === "Male" ? "bg-brand-100 text-brand-700" : "bg-pink-100 text-pink-700"
          }`}>
            {patient.gender === "Male" ? "Laki-laki" : "Perempuan"}
          </span>
        )}
        meta={patient ? [
          <>Umur: <strong className="text-slate-700">{calculateAge(patient.dateOfBirth)} tahun</strong></>,
          <>Kunjungan: <strong className="text-slate-700">{patient.visits?.length || 0}x</strong></>,
        ] : []}
      />

      <TabBar
        tabs={[
          { key: "data", label: "Edit Data", icon: <FaUserEdit /> },
          { key: "visits", label: "Kunjungan", icon: <FaClipboardList /> },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab content */}
      <div key={activeTab} className="anim-masuk">
        {loading ? (
          <SkeletonKartu />
        ) : !patient ? (
          <TidakDitemukan kembaliKe="/dashboard/patients" judul="Data pasien tidak ditemukan" />
        ) : activeTab === "data" ? (
          <div>
            <FormEdit onSubmit={handleUpdatePatient} busy={saving} dirty={isDirty} onBatal={() => setForm(savedForm)}>
              <BagianForm no={1} judul="Data Pasien">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Nama Pasien" required>
                    <input id="name" name="name" value={form.name} onChange={handleInputChange} required className="field" />
                  </Field>
                  <Field label="Jenis Kelamin">
                    <select id="gender" name="gender" value={form.gender} onChange={handleInputChange} className="field">
                      <option value="Male">Laki-laki</option>
                      <option value="Female">Perempuan</option>
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Tanggal Lahir"
                    required
                    ket={form.dateOfBirth ? `Usia ${calculateAge(form.dateOfBirth)} tahun` : null}
                  >
                    <input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={form.dateOfBirth}
                      onChange={handleInputChange}
                      max={new Date().toLocaleDateString("en-CA")}
                      required
                      className="field"
                    />
                  </Field>
                  <Field label="Alamat">
                    <input id="address" name="address" value={form.address} onChange={handleInputChange} className="field" />
                  </Field>
                </div>
              </BagianForm>

              <BagianForm no={2} judul="Diagnosis" ket="Terisi otomatis dari diagnosis setiap kunjungan">
                <div className="flex flex-wrap gap-1.5 p-3 border border-slate-200 rounded-xl bg-slate-50 min-h-11 items-center">
                  {getPatientDiagnosisLabels().length > 0 ? (
                    getPatientDiagnosisLabels().map((d, i) => (
                      <span key={i} className="bg-brand-100 text-brand-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                        {d}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-sm">Belum ada diagnosis</span>
                  )}
                </div>
              </BagianForm>
            </FormEdit>
          </div>
        ) : (
          /* ── Visit Tab ── */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-800">Riwayat Kunjungan</h2>
              <button
                onClick={handleOpenAddVisit}
                className="flex items-center justify-center gap-2 min-h-11 px-5 bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl w-full sm:w-auto shadow-md shadow-brand-600/20 transition"
              >
                <FaPlus /> Tambah Kunjungan
              </button>
            </div>

            <div className="space-y-3">
              {(patient.visits || []).length === 0 ? (
                <KeadaanKosong
                  judul="Belum ada kunjungan"
                  ket="Tambahkan kunjungan pertama untuk mencatat keluhan, diagnosis, dan obat pasien."
                />
              ) : (
                [...(patient.visits || [])]
                  .map((v, origIndex) => ({ ...v, origIndex }))
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((visit, displayPos, arr) => {
                  const seqNo = arr.length - displayPos;
                  const diagLabels = getDiagnosisLabels(visit);
                  return (
                    <KartuKunjungan
                      key={visit.origIndex}
                      kode={`#${seqNo}`}
                      tanggal={visit.date}
                      onEdit={() => handleOpenEditVisit(visit, visit.origIndex)}
                      onHapus={() => setDeleteVisitTarget(visit.origIndex)}
                    >

                      {/* Card body */}
                      <div className="px-4 py-3 space-y-2 text-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                          {visit.complaint && (
                            <DataItem label="Keluhan" value={visit.complaint} />
                          )}
                          {visit.notes && (
                            <DataItem label="Catatan" value={visit.notes} />
                          )}
                        </div>
                        {visit.medication && (
                          <div>
                            <span className="text-xs text-slate-400 uppercase tracking-wide">Obat</span>
                            <p className="font-medium text-slate-800 mt-0.5 line-clamp-2 break-words">
                              {fmtMedication(visit.medication)}
                            </p>
                          </div>
                        )}
                        {diagLabels.length > 0 && (
                          <div>
                            <span className="text-xs text-slate-400 uppercase tracking-wide">Diagnosis</span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {diagLabels.map((d, i) => (
                                <span key={i} className="bg-brand-100 text-brand-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                                  {d}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </KartuKunjungan>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      <VisitModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitVisit}
        initialData={initialVisitData}
        mode={modalMode}
      />

      <ConfirmModal
        open={deleteVisitTarget !== null}
        onClose={() => !deletingVisit && setDeleteVisitTarget(null)}
        onConfirm={handleDeleteVisitConfirm}
        loading={deletingVisit}
        title="Hapus Kunjungan"
        message="Apakah Anda yakin ingin menghapus kunjungan ini? Tindakan ini tidak dapat dibatalkan."
      />

      <ConfirmModal
        open={backConfirmOpen}
        onClose={() => setBackConfirmOpen(false)}
        onConfirm={() => router.push("/dashboard/patients")}
        title="Perubahan Belum Disimpan"
        message="Ada perubahan yang belum disimpan. Keluar halaman ini akan membatalkan semua perubahan."
        confirmLabel="Keluar Tanpa Simpan"
      />
    </div>
  );
}
