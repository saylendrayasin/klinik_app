"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { FaEdit, FaPlus, FaTrash, FaInfoCircle } from "react-icons/fa";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import PersalinanNifasModal from "@/components/PersalinanNifasModal";
import ConfirmModal from "@/components/ConfirmModal";
import { fetcher } from "@/lib/fetcher";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const KF_SCHEDULE = [
  { kf: 1, windowStart: 0, windowEnd: 2, label: "KF1", range: "0–2 hari" },
  { kf: 2, windowStart: 3, windowEnd: 7, label: "KF2", range: "3–7 hari" },
  { kf: 3, windowStart: 8, windowEnd: 28, label: "KF3", range: "8–28 hari" },
  { kf: 4, windowStart: 29, windowEnd: 42, label: "KF4", range: "29–42 hari" },
];

const LOKHIA_LABEL = {
  rubra: "Rubra",
  sanguinolenta: "Sanguinolenta",
  serosa: "Serosa",
  alba: "Alba",
};

const ASI_LABEL = {
  lancar: "Lancar",
  kurang: "Kurang",
  tidak_ada: "Tidak Ada",
};

const KONDISI_BAYI_NIFAS_LABEL = {
  baik: "Baik",
  ikterus: "Ikterus",
  infeksi: "Infeksi",
  rujuk: "Dirujuk",
};

const KONDISI_PERINEUM_LABEL = {
  baik: "Baik",
  edema: "Edema",
  infeksi: "Infeksi",
  tidak_ada_luka: "Tidak Ada Luka",
};

const KB_LABEL = {
  belum: "Belum ditentukan",
  kondom: "Kondom",
  pil: "Pil",
  suntik: "Suntik",
  iud: "IUD",
  implant: "Implant",
  mow: "MOW",
  mop: "MOP",
};

function fmtDate(d) {
  if (!d) return "-";
  try {
    return format(new Date(d), "dd MMMM yyyy", { locale: localeId });
  } catch {
    return "-";
  }
}

function getKFStatuses(persalinan) {
  const tanggal = new Date(persalinan.tanggalPersalinan);
  const today = new Date();
  const visits = persalinan.visits || [];

  return KF_SCHEDULE.map((s) => {
    const visited = visits.find((v) => {
      const vh = Math.floor((new Date(v.date) - tanggal) / MS_PER_DAY);
      return vh >= s.windowStart && vh <= s.windowEnd;
    });
    const windowEndDate = new Date(tanggal.getTime() + s.windowEnd * MS_PER_DAY);
    const expired = today > windowEndDate;
    return { ...s, fulfilled: !!visited, visitDate: visited?.date, expired };
  });
}

function getNextJadwal(persalinan) {
  const tanggal = new Date(persalinan.tanggalPersalinan);
  const today = new Date();
  const kfStatuses = getKFStatuses(persalinan);

  const next = kfStatuses.find((s) => !s.fulfilled && !s.expired);
  if (!next) return null;

  const jadwalDate = new Date(tanggal.getTime() + next.windowStart * MS_PER_DAY);
  const diffDays = Math.round((jadwalDate - today) / MS_PER_DAY);
  return { kf: next.kf, label: next.label, date: jadwalDate, diffDays };
}

export default function PersalinanVisitTab({ persalinan, onRefresh }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editVisitId, setEditVisitId] = useState(null);
  const [initialData, setInitialData] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [deleteVisitTarget, setDeleteVisitTarget] = useState(null);
  const [deletingVisit, setDeletingVisit] = useState(false);

  const sortedVisits = [...(persalinan.visits || [])].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  const hasTanggal = !!persalinan.tanggalPersalinan;
  const kfStatuses = hasTanggal ? getKFStatuses(persalinan) : [];
  const nextJadwal = hasTanggal ? getNextJadwal(persalinan) : null;

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
        await fetcher(`/api/persalinan/${persalinan._id}`, {
          method: "PATCH",
          body: JSON.stringify({ action: "addVisit", visit: formData }),
        });
      } else {
        await fetcher(`/api/persalinan/${persalinan._id}`, {
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

  const handleDeleteVisitConfirm = async () => {
    if (!deleteVisitTarget) return;
    setDeletingVisit(true);
    const toastId = toast.loading("Menghapus...");
    try {
      await fetcher(`/api/persalinan/${persalinan._id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "deleteVisit", visitId: deleteVisitTarget }),
      });
      setDeleteVisitTarget(null);
      await onRefresh();
      toast.success("Kunjungan dihapus!", { id: toastId });
    } catch (error) {
      toast.error(error?.message || "Gagal menghapus!", { id: toastId });
    } finally {
      setDeletingVisit(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800">Kunjungan Nifas (KF1–KF4)</h2>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-md w-full sm:w-auto"
        >
          <FaPlus /> Tambah Kunjungan
        </button>
      </div>

      {/* KF Progress */}
      {!hasTanggal ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          ⚠️ Lengkapi tanggal persalinan terlebih dahulu untuk melihat progress kunjungan nifas.
        </div>
      ) : (
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">
              Progress KF: {kfStatuses.filter((s) => s.fulfilled).length}/4
            </p>
            <button
              onClick={() => setShowSchedule((v) => !v)}
              className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
            >
              <FaInfoCircle /> Lihat jadwal anjuran
            </button>
          </div>

          <div className="flex gap-2">
            {kfStatuses.map(({ kf, label, fulfilled, expired }) => (
              <div key={kf} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition ${
                    fulfilled
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : expired
                      ? "bg-red-100 border-red-300 text-red-400"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {kf}
                </div>
                <span
                  className={`text-xs ${
                    fulfilled
                      ? "text-emerald-600 font-semibold"
                      : expired
                      ? "text-red-400"
                      : "text-gray-400"
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          {showSchedule && (
            <div className="mt-3 pt-3 border-t text-xs text-gray-600 space-y-1">
              <p className="font-semibold text-gray-700 mb-1">Jadwal Anjuran Kemenkes:</p>
              {KF_SCHEDULE.map(({ kf, label, range }) => {
                const s = kfStatuses.find((x) => x.kf === kf);
                return (
                  <div key={kf} className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        s?.fulfilled ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {kf}
                    </span>
                    <span>
                      {label}: {range}
                    </span>
                    {s?.fulfilled && (
                      <span className="text-emerald-600">✓ {fmtDate(s.visitDate)}</span>
                    )}
                    {s?.expired && !s?.fulfilled && (
                      <span className="text-red-500">✗ Terlewat</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Jadwal berikutnya banner */}
      {nextJadwal &&
        (() => {
          const { label, date, diffDays } = nextJadwal;
          const lewat = diffDays < 0;
          const countdownLabel =
            lewat
              ? `${Math.abs(diffDays)} hari lalu`
              : diffDays === 0
              ? "Hari ini"
              : `${diffDays} hari lagi`;
          return (
            <div
              className={`rounded-lg border-l-4 px-4 py-3 flex items-center gap-3 ${
                lewat ? "border-yellow-500 bg-yellow-50" : "border-emerald-600 bg-emerald-50"
              }`}
            >
              <span className="text-xl shrink-0">{lewat ? "⚠️" : "📅"}</span>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-xs font-semibold uppercase tracking-wide ${
                    lewat ? "text-yellow-600" : "text-emerald-500"
                  }`}
                >
                  {lewat ? "Jadwal Terlewat" : `Jadwal ${label}`}
                </p>
                <p className={`font-bold text-sm ${lewat ? "text-yellow-900" : "text-emerald-800"}`}>
                  {fmtDate(date)}
                </p>
              </div>
              <span
                className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  lewat ? "bg-yellow-100 text-yellow-800" : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {countdownLabel}
              </span>
            </div>
          );
        })()}

      {/* Visit list (newest first) */}
      <div className="space-y-3">
        {sortedVisits.length === 0 ? (
          <p className="text-gray-500 text-sm">Belum ada kunjungan nifas.</p>
        ) : (
          [...sortedVisits].reverse().map((visit) => {
            const isTD =
              visit.tekananDarahSistol >= 140 || visit.tekananDarahDiastol >= 90;
            return (
              <div
                key={String(visit._id)}
                className="bg-white border rounded-lg shadow-sm overflow-hidden"
              >
                {/* Visit header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-50 border-b">
                  <div className="flex items-center gap-2 flex-wrap">
                    {visit.nomorKF && (
                      <span className="bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        KF{visit.nomorKF}
                      </span>
                    )}
                    <span className="text-sm font-semibold text-gray-700">
                      {fmtDate(visit.date)}
                    </span>
                    {visit.hariPascaSalin != null && (
                      <span className="text-xs text-gray-500">
                        Hari ke-{visit.hariPascaSalin}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(visit)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1.5 rounded text-xs flex items-center gap-1"
                    >
                      <FaEdit /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteVisitTarget(String(visit._id))}
                      className="bg-red-500 hover:bg-red-600 text-white px-2.5 py-1.5 rounded text-xs flex items-center gap-1"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                {/* Visit body */}
                <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                  <DataItem
                    label="TD"
                    value={
                      visit.tekananDarahSistol != null
                        ? `${visit.tekananDarahSistol}/${visit.tekananDarahDiastol}`
                        : "-"
                    }
                    highlight={isTD ? "text-red-600 font-bold" : ""}
                  />
                  <DataItem
                    label="Nadi"
                    value={visit.nadi != null ? `${visit.nadi} bpm` : "-"}
                  />
                  <DataItem
                    label="Suhu"
                    value={visit.suhu != null ? `${visit.suhu} °C` : "-"}
                  />
                  <DataItem
                    label="RR"
                    value={visit.pernapasan != null ? `${visit.pernapasan} x/mnt` : "-"}
                  />
                  <DataItem label="TFU" value={visit.tfu || "-"} />
                  <DataItem label="Lokhia" value={LOKHIA_LABEL[visit.lokhia] || "-"} />
                  <DataItem label="Kondisi Perineum" value={KONDISI_PERINEUM_LABEL[visit.kondisiPerineum] || "-"} />
                  <DataItem label="ASI" value={ASI_LABEL[visit.asi] || "-"} />
                  <DataItem label="Kondisi Bayi" value={KONDISI_BAYI_NIFAS_LABEL[visit.kondisiBayi] || "-"} />
                  {visit.beratBayiSekarang != null && (
                    <DataItem label="BB Bayi" value={`${visit.beratBayiSekarang} g`} />
                  )}
                  <DataItem
                    label="Suplemen"
                    value={
                      [
                        visit.pemberianVitaminA && "Vit A",
                        visit.pemberianFe && "Fe",
                      ]
                        .filter(Boolean)
                        .join(", ") || "-"
                    }
                  />
                  <DataItem
                    label="Konseling"
                    value={visit.konselingDiberikan ? "Diberikan" : "-"}
                  />
                  <DataItem
                    label="Rencana KB"
                    value={KB_LABEL[visit.rencanKb] || "-"}
                  />
                  {visit.keluhan && (
                    <DataItem
                      label="Keluhan"
                      value={visit.keluhan}
                      className="col-span-2 sm:col-span-4"
                    />
                  )}
                  {visit.tindakan && (
                    <DataItem
                      label="Tindakan"
                      value={visit.tindakan}
                      className="col-span-2 sm:col-span-4"
                    />
                  )}
                  {visit.notes && (
                    <DataItem
                      label="Catatan"
                      value={visit.notes}
                      className="col-span-2 sm:col-span-4"
                    />
                  )}
                  {isTD && (
                    <p className="col-span-2 sm:col-span-4 text-xs text-red-600 font-medium">
                      ⚠️ TD tinggi — perhatikan risiko hipertensi post-partum
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <PersalinanNifasModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={initialData}
        mode={modalMode}
        tanggalPersalinan={persalinan.tanggalPersalinan}
      />

      <ConfirmModal
        open={!!deleteVisitTarget}
        onClose={() => !deletingVisit && setDeleteVisitTarget(null)}
        onConfirm={handleDeleteVisitConfirm}
        loading={deletingVisit}
        title="Hapus Kunjungan Nifas"
        message="Apakah Anda yakin ingin menghapus kunjungan ini? Tindakan ini tidak dapat dibatalkan."
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
