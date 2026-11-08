"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import PersalinanNifasModal from "@/components/PersalinanNifasModal";
import ConfirmModal from "@/components/ConfirmModal";
import KeadaanKosong from "@/components/KeadaanKosong";
import { fetcher } from "@/lib/fetcher";
import { AlertTriangle, CalendarClock } from "lucide-react";
import ProgresKunjungan from "@/components/ProgresKunjungan";
import KartuKunjungan from "@/components/KartuKunjungan";
import { tanggalSingkat } from "@/lib/tanggal";

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

  // `next` tidak pernah kedaluwarsa: bila jendelanya sudah dibuka, hitung mundur
  // ke hari terakhir jendela — bukan "terlewat" dari hari pertamanya.
  const mulai = new Date(tanggal.getTime() + next.windowStart * MS_PER_DAY);
  const akhir = new Date(tanggal.getTime() + next.windowEnd * MS_PER_DAY);
  const berjalan = today >= mulai;
  const diffDays = Math.ceil(((berjalan ? akhir : mulai) - today) / MS_PER_DAY);
  return { kf: next.kf, label: next.label, mulai, akhir, berjalan, diffDays };
}

export default function PersalinanVisitTab({ persalinan, onRefresh }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editVisitId, setEditVisitId] = useState(null);
  const [initialData, setInitialData] = useState(null);
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
      await fetcher(`/api/persalinan/${persalinan._id}`, {
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-base sm:text-lg font-bold text-slate-800">Kunjungan Nifas (KF1–KF4)</h2>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 min-h-11 px-5 bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl w-full sm:w-auto shadow-md shadow-brand-600/20 transition"
        >
          <FaPlus /> Tambah Kunjungan
        </button>
      </div>

      {/* KF Progress */}
      {!hasTanggal ? (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
          Lengkapi tanggal persalinan terlebih dahulu untuk melihat progress kunjungan nifas.
        </div>
      ) : (
        <ProgresKunjungan
          judul="Progress Kunjungan Nifas"
          langkah={kfStatuses.map((st, i) => ({
            kode: st.label,
            ket: `Hari ke ${st.range.replace(" hari", "")}`,
            info: st.fulfilled ? `Dikunjungi ${tanggalSingkat(st.visitDate)}` : null,
            status: st.fulfilled
              ? "sudah"
              : st.expired
              ? "terlewat"
              : kfStatuses.findIndex((x) => !x.fulfilled && !x.expired) === i
              ? "berikutnya"
              : "belum",
          }))}
        />
      )}

      {/* Jadwal berikutnya banner */}
      {nextJadwal && (
        <div className="rounded-xl border-l-4 border-brand-600 bg-brand-50 px-4 py-3 flex items-center gap-3">
          <CalendarClock size={20} className="shrink-0 text-brand-600" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">
              {nextJadwal.berjalan ? `Waktunya ${nextJadwal.label}` : `Jadwal ${nextJadwal.label}`}
            </p>
            <p className="font-bold text-sm text-brand-800">
              {nextJadwal.berjalan
                ? `Paling lambat ${tanggalSingkat(nextJadwal.akhir)}`
                : `Mulai ${tanggalSingkat(nextJadwal.mulai)}`}
            </p>
          </div>
          <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-100 text-brand-700">
            {nextJadwal.berjalan
              ? nextJadwal.diffDays <= 0 ? "Hari terakhir" : `Sisa ${nextJadwal.diffDays} hari`
              : `${nextJadwal.diffDays} hari lagi`}
          </span>
        </div>
      )}

      {/* Visit list (newest first) */}
      <div className="space-y-3">
        {sortedVisits.length === 0 ? (
          <KeadaanKosong judul="Belum ada kunjungan nifas" ket="Tambahkan kunjungan KF1–KF4 setelah ibu bersalin." />
        ) : (
          [...sortedVisits].reverse().map((visit) => {
            const isTD =
              visit.tekananDarahSistol >= 140 || visit.tekananDarahDiastol >= 90;
            return (
              <KartuKunjungan
                key={String(visit._id)}
                kode={visit.nomorKF ? `KF${visit.nomorKF}` : "–"}
                tanggal={visit.date}
                meta={visit.hariPascaSalin != null ? <span>Hari ke-{visit.hariPascaSalin} pascasalin</span> : null}
                onEdit={() => handleOpenEdit(visit)}
                onHapus={() => setDeleteVisitTarget(String(visit._id))}
              >
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
                      <AlertTriangle size={13} className="inline -mt-0.5 mr-1" aria-hidden="true" />TD tinggi — perhatikan risiko hipertensi post-partum
                    </p>
                  )}
                </div>
              </KartuKunjungan>
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
      <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
      <p className={`font-medium text-slate-800 ${highlight}`}>{value}</p>
    </div>
  );
}
