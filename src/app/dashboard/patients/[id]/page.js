"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetcher } from "@/lib/fetcher";
import VisitModal from "@/components/VisitModal";
import { toast } from "react-hot-toast";
import { FaPlus, FaArrowLeft, FaEdit, FaTrash } from "react-icons/fa";

export default function DashboardPatientDetailPage() {
  const params = useParams();
  const router = useRouter();
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
    if (params?.id) fetchPatient();
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
      toast.success("Perubahan pasien berhasil disimpan!", { id: toastId });
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

  const handleDeleteVisit = async (index) => {
    if (!confirm("Yakin ingin menghapus kunjungan ini?")) return;
    const toastId = toast.loading("Menghapus kunjungan...");
    try {
      const updatedVisits = [...patient.visits];
      updatedVisits.splice(index, 1);

      await fetcher(`/api/patients/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ visits: updatedVisits }),
      });

      await fetchPatient();
      toast.success("Kunjungan berhasil dihapus!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus kunjungan!", { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-60 text-gray-600">
        Loading...
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center text-gray-500">
        Data pasien tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Tombol kembali */}
      <div className="flex justify-start mb-2">
        <button
          onClick={() => router.push("/dashboard/patients")}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <FaArrowLeft /> Kembali
        </button>
      </div>

      {/* Form Edit Pasien */}
      <form
        onSubmit={handleUpdatePatient}
        className="space-y-6 bg-white rounded-md shadow-md"
      >
        <h1 className="text-2xl font-bold mb-6">Edit Data Pasien</h1>

        <div className="flex flex-col">
          <label htmlFor="name" className="text-gray-700 font-semibold mb-2">
            Nama Pasien
          </label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={handleInputChange}
            required
            className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="flex flex-col">
          <label
            htmlFor="dateOfBirth"
            className="text-gray-700 font-semibold mb-2"
          >
            Tanggal Lahir
          </label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            value={form.dateOfBirth}
            onChange={handleInputChange}
            required
            className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="address" className="text-gray-700 font-semibold mb-2">
            Alamat
          </label>
          <input
            id="address"
            name="address"
            value={form.address}
            onChange={handleInputChange}
            className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="gender" className="text-gray-700 font-semibold mb-2">
            Jenis Kelamin
          </label>
          <select
            id="gender"
            name="gender"
            value={form.gender}
            onChange={handleInputChange}
            className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="Male">Laki-laki</option>
            <option value="Female">Perempuan</option>
          </select>
        </div>

        {/* Display diagnosis */}
        <div className="flex flex-col">
          <label className="text-gray-700 font-semibold mb-2">
            Diagnosis Pasien
          </label>
          <div className="p-2 border rounded-md bg-gray-100 text-gray-600">
            {patient.diagnosis.length > 0
              ? patient.diagnosis.join(", ")
              : "Belum ada diagnosis"}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold transition"
        >
          Simpan Perubahan
        </button>
      </form>

      {/* Daftar Kunjungan */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Daftar Kunjungan</h2>
          <button
            onClick={handleOpenAddVisit}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
          >
            <FaPlus /> Tambah Kunjungan
          </button>
        </div>

        <div className="space-y-4">
          {patient.visits.length === 0 ? (
            <p className="text-gray-500">Belum ada kunjungan.</p>
          ) : (
            patient.visits.map((visit, index) => (
              <div
                key={index}
                className="bg-white p-4 rounded-md shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center"
              >
                <div className="space-y-1 text-gray-700">
                  <p className="font-semibold">
                    {new Date(visit.date).toLocaleDateString()}
                  </p>
                  <p>Keluhan: {visit.complaint}</p>
                  <p>Diagnosis: {visit.visitDiagnosis.join(", ")}</p>
                </div>

                <div className="flex gap-2 mt-4 sm:mt-0">
                  <button
                    onClick={() => handleOpenEditVisit(visit, index)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2"
                  >
                    <FaEdit /> Lihat
                  </button>
                  <button
                    onClick={() => handleDeleteVisit(index)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2"
                  >
                    <FaTrash /> Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <VisitModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitVisit}
        initialData={initialVisitData}
        mode={modalMode}
      />

      <div className="flex justify-center mt-8">
        <button
          onClick={() => router.push("/dashboard/patients")}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
        >
          <FaArrowLeft /> Kembali
        </button>
      </div>
    </div>
  );
}
