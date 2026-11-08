"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import KehamilanVisitModal from "@/components/KehamilanVisitModal";
import ConfirmModal from "@/components/ConfirmModal";
import KeadaanKosong from "@/components/KeadaanKosong";
import { fetcher } from "@/lib/fetcher";
import { AlertTriangle, CalendarClock } from "lucide-react";
import ProgresKunjungan from "@/components/ProgresKunjungan";
import KartuKunjungan from "@/components/KartuKunjungan";

const KEMENKES_SCHEDULE = [
  { k: 1, targetUK: 8, range: "< 12 minggu" },
  { k: 2, targetUK: 14, range: "12–16 minggu" },
  { k: 3, targetUK: 26, range: "24–28 minggu" },
  { k: 4, targetUK: 30, range: "28–32 minggu" },
  { k: 5, targetUK: 35, range: "34–36 minggu" },
  { k: 6, targetUK: 37, range: "36–38 minggu" },
];

const TRIMESTER_COLOR = {
  1: "bg-brand-100 text-brand-700",
  2: "bg-green-100 text-green-700",
  3: "bg-orange-100 text-orange-700",
};

const LETAK_LABEL = {
  kepala: "Kepala",
  sungsang: "Sungsang",
  lintang: "Lintang",
  belum_diketahui: "Belum diketahui",
};

function fmtDate(d) {
  if (!d) return "-";
  try {
    return format(new Date(d), "dd MMMM yyyy", { locale: localeId });
  } catch {
    return "-";
  }
}

export default function KehamilanVisitTab({ kehamilan, onRefresh }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editVisitId, setEditVisitId] = useState(null);
  const [initialData, setInitialData] = useState(null);
  const [deleteVisitTarget, setDeleteVisitTarget] = useState(null);
  const [deletingVisit, setDeletingVisit] = useState(false);

  const sortedVisits = [...(kehamilan.visits || [])].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  const totalDone = sortedVisits.length;

  const lastVisit = sortedVisits[sortedVisits.length - 1];
  const jadwalBerikutnya = lastVisit?.jadwalBerikutnya;
  const today = new Date();
  const jadwalLewat = jadwalBerikutnya && new Date(jadwalBerikutnya) < today;

  const handleOpenAdd = () => {
    setInitialData(null);
    setEditVisitId(null);
    setModalMode("add");
    setModalOpen(true);
  };

  const handleOpenEdit = (visit) => {
    setInitialData(visit);
    setEditVisitId(String(visit._id));
    setModalMode("edit");
    setModalOpen(true);
  };

  const handleSubmit = async (formData) => {
    const toastId = toast.loading("Menyimpan kunjungan...");
    try {
      if (modalMode === "add") {
        await fetcher(`/api/kehamilan/${kehamilan._id}`, {
          method: "PATCH",
          body: JSON.stringify({ action: "addVisit", visit: formData }),
        });
      } else {
        await fetcher(`/api/kehamilan/${kehamilan._id}`, {
          method: "PATCH",
          body: JSON.stringify({ action: "editVisit", visitId: editVisitId, visit: formData }),
        });
      }
      await onRefresh();
      setModalOpen(false);
      toast.success("Kunjungan berhasil disimpan", { id: toastId });
    } catch (error) {
      toast.error(error?.message || "Gagal menyimpan", { id: toastId });
    }
  };

  const handleDeleteVisitConfirm = async () => {
    if (!deleteVisitTarget) return;
    setDeletingVisit(true);
    const toastId = toast.loading("Menghapus...");
    try {
      await fetcher(`/api/kehamilan/${kehamilan._id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "deleteVisit", visitId: deleteVisitTarget }),
      });
      setDeleteVisitTarget(null);
      await onRefresh();
      toast.success("Kunjungan berhasil dihapus", { id: toastId });
    } catch (error) {
      toast.error(error?.message || "Gagal menghapus", { id: toastId });
    } finally {
      setDeletingVisit(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header + Add */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-base sm:text-lg font-bold text-slate-800">Riwayat Kunjungan ANC</h2>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 min-h-11 px-5 bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl w-full sm:w-auto shadow-md shadow-brand-600/20 transition"
        >
          <FaPlus /> Tambah Kunjungan
        </button>
      </div>

      <ProgresKunjungan
        judul="Progress Kunjungan ANC"
        langkah={KEMENKES_SCHEDULE.map(({ k, range }) => ({
          kode: `K${k}`,
          ket: `UK ${range}`,
          status: k <= totalDone ? "sudah" : k === totalDone + 1 ? "berikutnya" : "belum",
        }))}
      />

      {/* Jadwal berikutnya banner */}
      {jadwalBerikutnya && (() => {
        const diffDays = Math.round((new Date(jadwalBerikutnya) - today) / (24 * 60 * 60 * 1000));
        const countdownLabel = jadwalLewat
          ? `${Math.abs(diffDays)} hari lalu`
          : diffDays === 0
          ? "Hari ini"
          : `${diffDays} hari lagi`;
        return (
          <div className={`rounded-xl border-l-4 px-4 py-3 flex items-center gap-3 ${
            jadwalLewat
              ? "border-yellow-500 bg-yellow-50"
              : "border-brand-600 bg-brand-50"
          }`}>
            {jadwalLewat
              ? <AlertTriangle size={20} className="shrink-0 text-yellow-600" aria-hidden="true" />
              : <CalendarClock size={20} className="shrink-0 text-brand-600" aria-hidden="true" />}
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-semibold uppercase tracking-wide ${jadwalLewat ? "text-yellow-600" : "text-brand-500"}`}>
                {jadwalLewat ? "Jadwal Terlewat" : "Jadwal Berikutnya"}
              </p>
              <p className={`font-bold text-sm ${jadwalLewat ? "text-yellow-900" : "text-brand-800"}`}>
                {fmtDate(jadwalBerikutnya)}
              </p>
            </div>
            <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
              jadwalLewat ? "bg-yellow-100 text-yellow-800" : "bg-brand-100 text-brand-700"
            }`}>
              {countdownLabel}
            </span>
          </div>
        );
      })()}

      {/* Visit list (newest first for display) */}
      <div className="space-y-3">
        {sortedVisits.length === 0 ? (
          <KeadaanKosong judul="Belum ada kunjungan ANC" ket="Tambahkan kunjungan pertama untuk mulai memantau K1–K6." />
        ) : (
          [...sortedVisits].reverse().map((visit, displayIdx) => {
            const kNo = sortedVisits.findIndex((v) => String(v._id) === String(visit._id)) + 1;
            const isTD = visit.tekananDarahSistol >= 140 || visit.tekananDarahDiastol >= 90;
            return (
              <KartuKunjungan
                key={String(visit._id)}
                kode={`K${kNo}`}
                tanggal={visit.date}
                meta={
                  <>
                    {visit.trimester && (
                      <span className={`font-bold px-1.5 py-px rounded-md ${TRIMESTER_COLOR[visit.trimester]}`}>
                        Trimester {visit.trimester}
                      </span>
                    )}
                    {visit.usiaKehamilan != null && <span>UK {visit.usiaKehamilan} minggu</span>}
                  </>
                }
                onEdit={() => handleOpenEdit(visit)}
                onHapus={() => setDeleteVisitTarget(String(visit._id))}
              >
                {/* Visit body */}
                <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                  <DataItem label="BB" value={visit.beratBadan != null ? `${visit.beratBadan} kg` : "-"} />
                  <DataItem
                    label="TD"
                    value={
                      visit.tekananDarahSistol != null
                        ? `${visit.tekananDarahSistol}/${visit.tekananDarahDiastol}`
                        : "-"
                    }
                    highlight={isTD ? "text-red-600 font-bold" : ""}
                  />
                  <DataItem label="TFU" value={visit.tfu != null ? `${visit.tfu} cm` : "-"} />
                  <DataItem label="DJJ" value={visit.djj != null ? `${visit.djj} bpm` : "-"} />
                  <DataItem label="Letak" value={LETAK_LABEL[visit.letakJanin] || "-"} />
                  <DataItem
                    label="Jadwal Berikutnya"
                    value={visit.jadwalBerikutnya ? fmtDate(visit.jadwalBerikutnya) : "-"}
                    className="col-span-1 sm:col-span-1"
                  />
                  {visit.keluhan && (
                    <DataItem label="Keluhan" value={visit.keluhan} className="col-span-2 sm:col-span-4" />
                  )}
                  {visit.tindakan && (
                    <DataItem label="Tindakan" value={visit.tindakan} className="col-span-2 sm:col-span-4" />
                  )}
                  {visit.notes && (
                    <DataItem label="Catatan" value={visit.notes} className="col-span-2 sm:col-span-4" />
                  )}
                  {isTD && (
                    <p className="col-span-2 sm:col-span-4 text-xs text-red-600 font-medium">
                      <AlertTriangle size={13} className="inline -mt-0.5 mr-1" aria-hidden="true" />TD tinggi — perhatikan risiko preeklampsia
                    </p>
                  )}
                </div>
              </KartuKunjungan>
            );
          })
        )}
      </div>

      <KehamilanVisitModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={initialData}
        mode={modalMode}
        hpht={kehamilan.hpht}
      />

      <ConfirmModal
        open={!!deleteVisitTarget}
        onClose={() => !deletingVisit && setDeleteVisitTarget(null)}
        onConfirm={handleDeleteVisitConfirm}
        loading={deletingVisit}
        title="Hapus Kunjungan ANC"
        message="Apakah Anda yakin ingin menghapus kunjungan ini? Tindakan ini tidak dapat dibatalkan."
      />
    </div>
  );
}

function DataItem({ label, value, highlight = "", className = "" }) {
  return (
    <div className={className}>
      <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
      <p className={`font-medium text-slate-800 ${highlight}`}>{value}</p>
    </div>
  );
}
