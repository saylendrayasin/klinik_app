"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { FaEdit, FaPlus, FaTrash, FaInfoCircle } from "react-icons/fa";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import KehamilanVisitModal from "@/components/KehamilanVisitModal";
import { fetcher } from "@/lib/fetcher";

const KEMENKES_SCHEDULE = [
  { k: 1, targetUK: 8, range: "< 12 minggu" },
  { k: 2, targetUK: 14, range: "12–16 minggu" },
  { k: 3, targetUK: 26, range: "24–28 minggu" },
  { k: 4, targetUK: 30, range: "28–32 minggu" },
  { k: 5, targetUK: 35, range: "34–36 minggu" },
  { k: 6, targetUK: 37, range: "36–38 minggu" },
];

const TRIMESTER_COLOR = {
  1: "bg-blue-100 text-blue-700",
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
  const [showSchedule, setShowSchedule] = useState(false);

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
      toast.success("Kunjungan berhasil disimpan!", { id: toastId });
    } catch (error) {
      toast.error(error?.message || "Gagal menyimpan!", { id: toastId });
    }
  };

  const handleDelete = async (visitId) => {
    if (!confirm("Yakin ingin menghapus kunjungan ini?")) return;
    const toastId = toast.loading("Menghapus...");
    try {
      await fetcher(`/api/kehamilan/${kehamilan._id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "deleteVisit", visitId }),
      });
      await onRefresh();
      toast.success("Kunjungan dihapus!", { id: toastId });
    } catch (error) {
      toast.error(error?.message || "Gagal menghapus!", { id: toastId });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header + Add */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800">Riwayat Kunjungan ANC</h2>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-sm px-4 py-2 rounded-md w-full sm:w-auto"
        >
          <FaPlus /> Tambah Kunjungan
        </button>
      </div>

      {/* Progress K1-K6 */}
      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-700">
            Progress Kunjungan: {totalDone}/6
          </p>
          <button
            onClick={() => setShowSchedule((v) => !v)}
            className="text-xs text-rose-600 hover:underline flex items-center gap-1"
          >
            <FaInfoCircle /> Lihat jadwal anjuran
          </button>
        </div>

        <div className="flex gap-2">
          {KEMENKES_SCHEDULE.map(({ k }) => {
            const done = k <= totalDone;
            return (
              <div key={k} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition ${
                    done
                      ? "bg-rose-600 border-rose-600 text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {k}
                </div>
                <span className={`text-xs ${done ? "text-rose-600 font-semibold" : "text-gray-400"}`}>
                  K{k}
                </span>
              </div>
            );
          })}
        </div>

        {showSchedule && (
          <div className="mt-3 pt-3 border-t text-xs text-gray-600 space-y-1">
            <p className="font-semibold text-gray-700 mb-1">Jadwal Anjuran Kemenkes:</p>
            {KEMENKES_SCHEDULE.map(({ k, range }) => (
              <div key={k} className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${k <= totalDone ? "bg-rose-100 text-rose-700" : "bg-gray-100 text-gray-500"}`}>
                  {k}
                </span>
                <span>K{k}: {range}</span>
                {k <= totalDone && <span className="text-rose-600">✓</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Jadwal berikutnya banner */}
      {jadwalBerikutnya && (() => {
        const diffDays = Math.round((new Date(jadwalBerikutnya) - today) / (24 * 60 * 60 * 1000));
        const countdownLabel = jadwalLewat
          ? `${Math.abs(diffDays)} hari lalu`
          : diffDays === 0
          ? "Hari ini"
          : `${diffDays} hari lagi`;
        return (
          <div className={`rounded-lg border-l-4 px-4 py-3 flex items-center gap-3 ${
            jadwalLewat
              ? "border-yellow-500 bg-yellow-50"
              : "border-rose-600 bg-rose-50"
          }`}>
            <span className="text-xl shrink-0">{jadwalLewat ? "⚠️" : "📅"}</span>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-semibold uppercase tracking-wide ${jadwalLewat ? "text-yellow-600" : "text-rose-500"}`}>
                {jadwalLewat ? "Jadwal Terlewat" : "Jadwal Berikutnya"}
              </p>
              <p className={`font-bold text-sm ${jadwalLewat ? "text-yellow-900" : "text-rose-800"}`}>
                {fmtDate(jadwalBerikutnya)}
              </p>
            </div>
            <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
              jadwalLewat ? "bg-yellow-100 text-yellow-800" : "bg-rose-100 text-rose-700"
            }`}>
              {countdownLabel}
            </span>
          </div>
        );
      })()}

      {/* Visit list (newest first for display) */}
      <div className="space-y-3">
        {sortedVisits.length === 0 ? (
          <p className="text-gray-500 text-sm">Belum ada kunjungan.</p>
        ) : (
          [...sortedVisits].reverse().map((visit, displayIdx) => {
            const kNo = sortedVisits.findIndex((v) => String(v._id) === String(visit._id)) + 1;
            const isTD = visit.tekananDarahSistol >= 140 || visit.tekananDarahDiastol >= 90;
            return (
              <div
                key={String(visit._id)}
                className="bg-white border rounded-lg shadow-sm overflow-hidden"
              >
                {/* Visit header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-rose-50 border-b">
                  <div className="flex items-center gap-2">
                    <span className="bg-rose-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      K{kNo}
                    </span>
                    <span className="text-sm font-semibold text-gray-700">
                      {fmtDate(visit.date)}
                    </span>
                    {visit.trimester && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TRIMESTER_COLOR[visit.trimester]}`}>
                        T{visit.trimester}
                      </span>
                    )}
                    {visit.usiaKehamilan != null && (
                      <span className="text-xs text-gray-500">UK {visit.usiaKehamilan} mg</span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(visit)}
                      className="bg-rose-500 hover:bg-rose-600 text-white px-2.5 py-1.5 rounded text-xs flex items-center gap-1"
                    >
                      <FaEdit /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(String(visit._id))}
                      className="bg-red-500 hover:bg-red-600 text-white px-2.5 py-1.5 rounded text-xs flex items-center gap-1"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

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
                      ⚠️ TD tinggi — perhatikan risiko preeklampsia
                    </p>
                  )}
                </div>
              </div>
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
    </div>
  );
}

function DataItem({ label, value, highlight = "", className = "" }) {
  return (
    <div className={className}>
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <p className={`font-medium text-gray-800 ${highlight}`}>{value}</p>
    </div>
  );
}
