"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { fetcher } from "@/lib/fetcher";
import { FaPlus } from "react-icons/fa";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import KbVisitModal from "@/components/KbVisitModal";
import ConfirmModal from "@/components/ConfirmModal";
import KeadaanKosong from "@/components/KeadaanKosong";
import KartuKunjungan from "@/components/KartuKunjungan";

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
      <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
      <p className="font-medium text-slate-800">{value || "-"}</p>
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

      await fetcher(`/api/kb/${kb._id}`, {
        method: "PATCH",
        body: JSON.stringify({ visits: updatedVisits }),
      });

      await onRefresh();
      setModalOpen(false);
      toast.success("Kunjungan berhasil disimpan", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Gagal menyimpan kunjungan", { id: toastId });
    }
  };

  const handleDeleteVisitConfirm = async () => {
    if (deleteVisitTarget === null) return;
    setDeletingVisit(true);
    const toastId = toast.loading("Menghapus kunjungan...");
    try {
      const updatedVisits = [...(kb.visits || [])];
      updatedVisits.splice(deleteVisitTarget, 1);

      await fetcher(`/api/kb/${kb._id}`, {
        method: "PATCH",
        body: JSON.stringify({ visits: updatedVisits }),
      });

      setDeleteVisitTarget(null);
      await onRefresh();
      toast.success("Kunjungan berhasil dihapus", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Gagal menghapus kunjungan", { id: toastId });
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
        <h2 className="text-base sm:text-lg font-bold text-slate-800">Riwayat Kunjungan KB</h2>
        <button
          onClick={handleOpenAddVisit}
          className="flex items-center justify-center gap-2 min-h-11 px-5 bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl w-full sm:w-auto shadow-md shadow-brand-600/20 transition"
        >
          <FaPlus /> Tambah Kunjungan
        </button>
      </div>

      {/* Visit list */}
      <div className="space-y-3">
        {displayVisits.length === 0 ? (
          <KeadaanKosong judul="Belum ada kunjungan KB" ket="Tambahkan kunjungan untuk mencatat metode KB dan tanggal kembali." />
        ) : (
          displayVisits.map((visit) => (
            <KartuKunjungan
              key={visit.origIndex}
              kode={`#${visit.seqNo}`}
              tanggal={visit.date}
              meta={visit.metode ? <span className="font-semibold text-brand-700">{visit.metode}</span> : null}
              onEdit={() => handleOpenEditVisit(visit, visit.origIndex)}
              onHapus={() => setDeleteVisitTarget(visit.origIndex)}
            >

              {/* Card body */}
              <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                <DataItem label="Jadwal Kembali" value={visit.returnDate ? fmtDate(visit.returnDate) : "-"} />
                {visit.notes && (
                  <DataItem label="Catatan" value={visit.notes} className="col-span-2 sm:col-span-3" />
                )}
              </div>
            </KartuKunjungan>
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
