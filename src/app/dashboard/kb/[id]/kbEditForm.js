"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import KbVisitModal from "@/components/KbVisitModal";

export default function KbEditForm({ kb, form, setForm, onRefresh }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editVisitIndex, setEditVisitIndex] = useState(null);
  const [initialVisitData, setInitialVisitData] = useState(null);
  const [modalMode, setModalMode] = useState("add");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === "numberOfChildren" ? Number(value) : value,
    });
  };

  const handleUpdateKb = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Menyimpan perubahan...");
    try {
      await fetch(`/api/kb/${kb._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, visits: kb.visits }),
      });
      toast.success("Perubahan berhasil disimpan!", { id: toastId });
      await onRefresh();
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
      const updatedVisits = [...(kb.visits || [])];
      if (modalMode === "edit" && editVisitIndex !== null) {
        updatedVisits[editVisitIndex] = formData;
      } else {
        updatedVisits.push(formData);
      }
      await fetch(`/api/kb/${kb._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visits: updatedVisits }),
      });
      await onRefresh();
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
      const updatedVisits = [...kb.visits];
      updatedVisits.splice(index, 1);
      await fetch(`/api/kb/${kb._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visits: updatedVisits }),
      });
      await onRefresh();
      toast.success("Kunjungan berhasil dihapus!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus kunjungan!", { id: toastId });
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return "-";
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <form
        onSubmit={handleUpdateKb}
        className="space-y-6 bg-white rounded-md shadow-md p-4"
      >
        <h1 className="text-2xl font-bold mb-6">Edit Data KB</h1>

        <div className="flex flex-col">
          <label htmlFor="name" className="text-gray-700 font-semibold mb-2">
            Nama
          </label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={handleInputChange}
            required
            className="p-2 border rounded-md"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="nik" className="text-gray-700 font-semibold mb-2">
            NIK
          </label>
          <input
            id="nik"
            name="nik"
            value={form.nik}
            onChange={handleInputChange}
            required
            className="p-2 border rounded-md"
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
            className="p-2 border rounded-md"
          />
          <span className="text-sm text-gray-600 mt-1">
            Usia: <strong>{calculateAge(form.dateOfBirth)}</strong> tahun
          </span>
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
            className="p-2 border rounded-md"
          />
        </div>

        <div className="flex flex-col">
          <label
            htmlFor="numberOfChildren"
            className="text-gray-700 font-semibold mb-2"
          >
            Jumlah Anak
          </label>
          <input
            id="numberOfChildren"
            name="numberOfChildren"
            type="number"
            min="0"
            value={form.numberOfChildren}
            onChange={handleInputChange}
            className="p-2 border rounded-md"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-gray-700 font-semibold mb-2">Metode KB</label>
          <div className="p-2 border rounded-md bg-gray-100 text-gray-600">
            {kb.metodes.length > 0 ? kb.metodes.join(", ") : "Belum ada metode"}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md font-semibold"
        >
          Simpan Perubahan
        </button>
      </form>

      {/* Daftar Kunjungan */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Daftar Kunjungan
          </h2>
          <button
            onClick={handleOpenAddVisit}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base px-4 py-2 rounded-md w-full sm:w-auto"
          >
            <FaPlus /> Tambah Kunjungan
          </button>
        </div>

        <div className="space-y-4">
          {kb.visits.length === 0 ? (
            <p className="text-gray-500 text-sm sm:text-base">
              Belum ada kunjungan.
            </p>
          ) : (
            kb.visits.map((visit, index) => (
              <div
                key={index}
                className="bg-white p-4 rounded-md shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center"
              >
                <div className="space-y-1 text-gray-700 text-sm sm:text-base">
                  <p className="font-semibold">
                    Tanggal Datang:{" "}
                    {new Date(visit.date).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                  {visit.returnDate && (
                    <p>
                      Tanggal Kembali:{" "}
                      {new Date(visit.returnDate).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  <p>Metode: {visit.metode}</p>
                  {visit.notes && <p>Catatan: {visit.notes}</p>}
                </div>
                <div className="flex gap-2 mt-4 sm:mt-0 flex-wrap justify-end">
                  <button
                    onClick={() => handleOpenEditVisit(visit, index)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 sm:px-4 py-2 rounded-md text-sm flex items-center gap-2"
                  >
                    <FaEdit /> Lihat
                  </button>
                  <button
                    onClick={() => handleDeleteVisit(index)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-md text-sm flex items-center gap-2"
                  >
                    <FaTrash /> Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <KbVisitModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitVisit}
        initialData={initialVisitData}
        mode={modalMode}
      />
    </div>
  );
}
