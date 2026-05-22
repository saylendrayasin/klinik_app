"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import KbVisitModal from "@/components/KbVisitModal";
import ConfirmModal from "@/components/ConfirmModal";

const fmtDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    return format(new Date(dateStr), "dd MMMM yyyy", { locale: localeId });
  } catch {
    return "-";
  }
};

function DataItem({ label, value, className = "" }) {
  return (
    <div className={className}>
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <p className="font-medium text-gray-800">{value || "-"}</p>
    </div>
  );
}

export default function KbVisitsTab({ kb, onRefresh }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editVisitIndex, setEditVisitIndex] = useState(null);
  const [initialVisitData, setInitialVisitData] = useState(null);
  const [modalMode, setModalMode] = useState("add");
  const [deleteVisitTarget, setDeleteVisitTarget] = useState(null);
  const [deletingVisit, setDeletingVisit] = useState(false);

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
      toast.error(error?.message || "Gagal menyimpan kunjungan!", { id: toastId });
    }
  };

  const handleDeleteVisitConfirm = async () => {
    if (deleteVisitTarget === null) return;
    setDeletingVisit(true);
    const toastId = toast.loading("Menghapus kunjungan...");
    try {
      const updatedVisits = [...(kb.visits || [])];
      updatedVisits.splice(deleteVisitTarget, 1);

      const res = await fetch(`/api/kb/${kb._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visits: updatedVisits }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Gagal menghapus kunjungan!");
      }

      setDeleteVisitTarget(null);
      await onRefresh();
      toast.success("Kunjungan berhasil dihapus!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Gagal menghapus kunjungan!", { id: toastId });
    } finally {
      setDeletingVisit(false);
    }
  };

  const rawVisits = kb.visits || [];
  const displayVisits = [...rawVisits]
    .map((v, origIndex) => ({ ...v, origIndex }))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((v, displayPos, arr) => ({ ...v, seqNo: arr.length - displayPos }));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800">Riwayat Kunjungan KB</h2>
        <button
          onClick={handleOpenAddVisit}
          className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-md w-full sm:w-auto"
        >
          <FaPlus /> Tambah Kunjungan
        </button>
      </div>

      {/* Visit list */}
      <div className="space-y-3">
        {displayVisits.length === 0 ? (
          <p className="text-gray-500 text-sm">Belum ada kunjungan.</p>
        ) : (
          displayVisits.map((visit) => (
            <div
              key={visit.origIndex}
              className="bg-white border rounded-lg shadow-sm overflow-hidden"
            >
              {/* Card header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-purple-50 border-b">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    #{visit.seqNo}
                  </span>
                  <span className="text-sm font-semibold text-gray-700">
                    {fmtDate(visit.date)}
                  </span>
                  {visit.metode && (
                    <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      {visit.metode}
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleOpenEditVisit(visit, visit.origIndex)}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-2.5 py-1.5 rounded text-xs flex items-center gap-1"
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
              <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                <DataItem label="Tanggal Datang" value={fmtDate(visit.date)} />
                <DataItem label="Metode" value={visit.metode} />
                {visit.returnDate && (
                  <DataItem label="Tanggal Kembali" value={fmtDate(visit.returnDate)} />
                )}
                {visit.notes && (
                  <DataItem label="Catatan" value={visit.notes} className="col-span-2 sm:col-span-3" />
                )}
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

      <ConfirmModal
        open={deleteVisitTarget !== null}
        onClose={() => !deletingVisit && setDeleteVisitTarget(null)}
        onConfirm={handleDeleteVisitConfirm}
        loading={deletingVisit}
        title="Hapus Kunjungan KB"
        message="Apakah Anda yakin ingin menghapus kunjungan ini? Tindakan ini tidak dapat dibatalkan."
      />
    </div>
  );
}
