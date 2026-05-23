"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetcher } from "@/lib/fetcher";
import VisitModal from "@/components/VisitModal";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  FaPlus,
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaUserEdit,
  FaClipboardList,
} from "react-icons/fa";
import ConfirmModal from "@/components/ConfirmModal";

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
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <p className="font-medium text-gray-800 line-clamp-2">{value || "-"}</p>
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

  const fetchPatient = async () => {
    try {
      const { data } = await fetcher(`/api/patients/${params.id}`);
      setPatient(data);
      setForm({
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
    const toastId = toast.loading("Menyimpan perubahan...");
    try {
      await fetcher(`/api/patients/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...form, visits: patient.visits }),
      });
      toast.success("Perubahan berhasil disimpan!", { id: toastId });
      await fetchPatient();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan perubahan!", { id: toastId });
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
      await fetchPatient();
      setModalOpen(false);
      toast.success("Kunjungan berhasil disimpan!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan kunjungan!", { id: toastId });
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
      await fetchPatient();
      toast.success("Kunjungan berhasil dihapus!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus kunjungan!", { id: toastId });
    } finally {
      setDeletingVisit(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back */}
      <div className="flex justify-start mb-4">
        <button
          onClick={() => isDirty ? setBackConfirmOpen(true) : router.push("/dashboard/patients")}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          <FaArrowLeft /> Kembali
        </button>
      </div>

      {/* Info header */}
      {patient && !loading && (
        <div className="bg-white border rounded-lg shadow-sm px-4 py-3 mb-4">
          <div className="flex items-center gap-2 mb-1 min-w-0">
            <h2 className="font-bold text-gray-800 text-base truncate flex-1 min-w-0">
              {patient.name}
            </h2>
            <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
              patient.gender === "Male"
                ? "bg-blue-100 text-blue-700"
                : "bg-pink-100 text-pink-700"
            }`}>
              {patient.gender === "Male" ? "Laki-laki" : "Perempuan"}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
            <span>Umur: <strong className="text-gray-700">{calculateAge(patient.dateOfBirth)} tahun</strong></span>
            <span>Kunjungan: <strong className="text-gray-700">{patient.visits?.length || 0}x</strong></span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {[
          { key: "data", label: "Edit Data", icon: <FaUserEdit /> },
          { key: "visits", label: "Kunjungan", icon: <FaClipboardList /> },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 font-semibold text-xs sm:text-sm whitespace-nowrap rounded-t-md transition-all ${
              activeTab === key
                ? "bg-blue-100 text-blue-700 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-blue-600"
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {loading ? (
          <div className="flex justify-center items-center h-60">
            <div className="w-8 h-8 border-4 border-blue-500 border-dashed rounded-full animate-spin" />
          </div>
        ) : !patient ? (
          <div className="text-center text-red-500">Data pasien tidak ditemukan.</div>
        ) : activeTab === "data" ? (
          /* ── Edit Form ── */
          <form onSubmit={handleUpdatePatient} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="bg-blue-50 border-b border-blue-100 px-5 py-4">
              <h2 className="text-base font-bold text-blue-800">Edit Data Pasien</h2>
            </div>

            <div className="p-5 space-y-4">
              {/* Nama + Jenis Kelamin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="name" className="text-sm font-semibold text-gray-700">
                    Nama Pasien <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    required
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="gender" className="text-sm font-semibold text-gray-700">
                    Jenis Kelamin
                  </label>
                  <div className="relative">
                    <select
                      id="gender"
                      name="gender"
                      value={form.gender}
                      onChange={handleInputChange}
                      className="appearance-none p-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
                    >
                      <option value="Male">Laki-laki</option>
                      <option value="Female">Perempuan</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg className="h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                        <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tanggal Lahir + Alamat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="dateOfBirth" className="text-sm font-semibold text-gray-700">
                    Tanggal Lahir <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={handleInputChange}
                    max={new Date().toLocaleDateString("en-CA")}
                    required
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  {form.dateOfBirth && (
                    <span className="text-xs text-gray-500 mt-0.5">
                      Usia: <strong className="text-gray-700">{calculateAge(form.dateOfBirth)}</strong> tahun
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="address" className="text-sm font-semibold text-gray-700">
                    Alamat
                  </label>
                  <input
                    id="address"
                    name="address"
                    value={form.address}
                    onChange={handleInputChange}
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              {/* Diagnosis (readonly) */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700">Diagnosis Pasien</label>
                <div className="flex flex-wrap gap-1.5 p-2.5 border border-gray-200 rounded-md bg-gray-50 min-h-[42px] items-center">
                  {getPatientDiagnosisLabels().length > 0 ? (
                    getPatientDiagnosisLabels().map((d, i) => (
                      <span key={i} className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        {d}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">Belum ada diagnosis</span>
                  )}
                </div>
              </div>
            </div>

            <div className="px-5 pb-5">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-md font-semibold transition"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        ) : (
          /* ── Visit Tab ── */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-800">Riwayat Kunjungan</h2>
              <button
                onClick={handleOpenAddVisit}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md w-full sm:w-auto"
              >
                <FaPlus /> Tambah Kunjungan
              </button>
            </div>

            <div className="space-y-3">
              {(patient.visits || []).length === 0 ? (
                <p className="text-gray-500 text-sm">Belum ada kunjungan.</p>
              ) : (
                [...(patient.visits || [])]
                  .map((v, origIndex) => ({ ...v, origIndex }))
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((visit, displayPos, arr) => {
                  const seqNo = arr.length - displayPos;
                  const diagLabels = getDiagnosisLabels(visit);
                  return (
                    <div
                      key={visit.origIndex}
                      className="bg-white border rounded-lg shadow-sm overflow-hidden"
                    >
                      {/* Card header */}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 border-b">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            #{seqNo}
                          </span>
                          <span className="text-sm font-semibold text-gray-700">
                            {fmtDate(visit.date)}
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleOpenEditVisit(visit, visit.origIndex)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-2.5 py-1.5 rounded text-xs flex items-center gap-1"
                          >
                            <FaEdit /> Edit
                          </button>
                          <button
                            onClick={() => setDeleteVisitTarget(visit.origIndex)}
                            className="bg-red-500 hover:bg-red-600 text-white px-2.5 py-1.5 rounded text-xs flex items-center gap-1"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>

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
                            <span className="text-xs text-gray-400 uppercase tracking-wide">Obat</span>
                            <p className="font-medium text-gray-800 mt-0.5 line-clamp-2 break-words">
                              {fmtMedication(visit.medication)}
                            </p>
                          </div>
                        )}
                        {diagLabels.length > 0 && (
                          <div>
                            <span className="text-xs text-gray-400 uppercase tracking-wide">Diagnosis</span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {diagLabels.map((d, i) => (
                                <span key={i} className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                                  {d}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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
