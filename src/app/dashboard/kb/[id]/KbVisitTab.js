"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { format } from "date-fns";
import KbVisitModal from "@/components/KbVisitModal";

const fmtDate = (dateStr) =>
  dateStr ? format(new Date(dateStr), "dd/MM/yyyy") : "-";

export default function KbVisitsTab({ kb, onRefresh }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editVisitIndex, setEditVisitIndex] = useState(null);
  const [initialVisitData, setInitialVisitData] = useState(null);
  const [modalMode, setModalMode] = useState("add");

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

      const res = await fetch(`/api/kb/${kb._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visits: updatedVisits }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Gagal menyimpan kunjungan!");
      }

      await onRefresh();
      setModalOpen(false);
      toast.success("Kunjungan berhasil disimpan!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Gagal menyimpan kunjungan!", {
        id: toastId,
      });
    }
  };

  const handleDeleteVisit = async (index) => {
    if (!confirm("Yakin ingin menghapus kunjungan ini?")) return;
    const toastId = toast.loading("Menghapus kunjungan...");
    try {
      const updatedVisits = [...(kb.visits || [])];
      updatedVisits.splice(index, 1);

      const res = await fetch(`/api/kb/${kb._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visits: updatedVisits }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Gagal menghapus kunjungan!");
      }

      await onRefresh();
      toast.success("Kunjungan berhasil dihapus!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Gagal menghapus kunjungan!", {
        id: toastId,
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Daftar Kunjungan
        </h2>
        <button
          onClick={handleOpenAddVisit}
          className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm sm:text-base px-4 py-2 rounded-md w-full sm:w-auto"
        >
          <FaPlus /> Tambah Kunjungan
        </button>
      </div>

      <div className="space-y-4">
        {(kb.visits || []).length === 0 ? (
          <p className="text-gray-500 text-sm sm:text-base">
            Belum ada kunjungan.
          </p>
        ) : (
          (kb.visits || []).map((visit, index) => (
            <div
              key={index}
              className="bg-white p-4 rounded-md shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center"
            >
              <div className="space-y-1 text-gray-700 text-sm sm:text-base">
                <p className="font-semibold">
                  Tanggal Datang: {fmtDate(visit.date)}
                </p>
                {visit.returnDate && (
                  <p>Tanggal Kembali: {fmtDate(visit.returnDate)}</p>
                )}
                <p>Metode: {visit.metode}</p>
                {visit.notes && <p>Catatan: {visit.notes}</p>}
              </div>

              <div className="flex gap-2 mt-4 sm:mt-0 flex-wrap justify-end">
                <button
                  onClick={() => handleOpenEditVisit(visit, index)}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-md text-sm flex items-center gap-2"
                >
                  <FaEdit /> Lihat
                </button>
                <button
                  onClick={() => handleDeleteVisit(index)}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-3 sm:px-4 py-2 rounded-md text-sm flex items-center gap-2"
                >
                  <FaTrash /> Hapus
                </button>
              </div>
            </div>
          ))
        )}
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
