"use client";

import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const KF_SCHEDULE = [
  { kf: 1, windowStart: 0, windowEnd: 2, label: "KF1" },
  { kf: 2, windowStart: 3, windowEnd: 7, label: "KF2" },
  { kf: 3, windowStart: 8, windowEnd: 28, label: "KF3" },
  { kf: 4, windowStart: 29, windowEnd: 42, label: "KF4" },
];

const LOKHIA_LABEL = { rubra: "Rubra", sanguinolenta: "Sanguinolenta", serosa: "Serosa", alba: "Alba" };
const ASI_LABEL = { lancar: "Lancar", kurang: "Kurang", tidak_ada: "Tidak Ada" };
const KONDISI_BAYI_LABEL = { baik: "Baik", ikterus: "Ikterus", infeksi: "Infeksi", rujuk: "Dirujuk" };
const KONDISI_PERINEUM_LABEL = { baik: "Baik", edema: "Edema", infeksi: "Infeksi", tidak_ada_luka: "Tidak Ada Luka" };

function fmtFull(d) {
  try { return format(new Date(d), "dd MMMM yyyy", { locale: localeId }); } catch { return "-"; }
}

function toDateStr(d) {
  try { return format(new Date(d), "yyyy-MM-dd"); } catch { return ""; }
}

export default function CalendarPersalinan({ persalinan }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [visitMap, setVisitMap] = useState({});
  const [jadwalDate, setJadwalDate] = useState(null);
  const [persalinanDate, setPersalinanDate] = useState(null);

  useEffect(() => {
    const map = {};
    const sorted = [...(persalinan.visits || [])].sort((a, b) => new Date(a.date) - new Date(b.date));

    sorted.forEach((v) => {
      const ds = toDateStr(v.date);
      if (!ds) return;
      if (!map[ds]) map[ds] = [];
      map[ds].push(v);
    });

    setVisitMap(map);

    if (!persalinan.tanggalPersalinan) {
      setJadwalDate(null);
      setPersalinanDate(null);
      return;
    }

    const tanggal = new Date(persalinan.tanggalPersalinan);
    const today = new Date();

    const nextKF = KF_SCHEDULE.find((s) => {
      const windowEndDate = new Date(tanggal.getTime() + s.windowEnd * MS_PER_DAY);
      if (today > windowEndDate) return false;
      const fulfilled = (persalinan.visits || []).some((v) => {
        const vh = Math.floor((new Date(v.date) - tanggal) / MS_PER_DAY);
        return vh >= s.windowStart && vh <= s.windowEnd;
      });
      return !fulfilled;
    });

    setJadwalDate(nextKF ? toDateStr(new Date(tanggal.getTime() + nextKF.windowStart * MS_PER_DAY)) : null);
    setPersalinanDate(toDateStr(persalinan.tanggalPersalinan));
  }, [persalinan]);

  const tileContent = ({ date }) => {
    const ds = toDateStr(date);
    const hasVisit = !!visitMap[ds];
    const isJadwal = jadwalDate === ds;
    const isPersalinan = persalinanDate === ds;
    if (!hasVisit && !isJadwal && !isPersalinan) return null;

    return (
      <div className="mt-1 flex justify-center items-center gap-0.5 flex-wrap">
        {hasVisit && <span className="w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-emerald-300" title="Kunjungan Nifas" />}
        {isJadwal && !hasVisit && <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-500 bg-white" title="Jadwal KF Berikutnya" />}
        {isPersalinan && <span className="w-2 h-2 rounded-full bg-amber-400 ring-1 ring-amber-200" title="Tanggal Persalinan" />}
      </div>
    );
  };

  const selectedStr = toDateStr(selectedDate);
  const selectedVisits = visitMap[selectedStr] || [];
  const isSelectedJadwal = jadwalDate === selectedStr;
  const isSelectedPersalinan = persalinanDate === selectedStr;
  const hasDetail = selectedVisits.length > 0 || isSelectedJadwal || isSelectedPersalinan;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Calendar card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
        <div className="p-4">
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            locale="id-ID"
            tileContent={tileContent}
            className="calendar-custom w-full"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-2 text-xs">
        <span className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-full font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-emerald-300" />
          Kunjungan Nifas
        </span>
        <span className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-full font-medium">
          <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-500 bg-white" />
          Jadwal KF Berikutnya
        </span>
        <span className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full font-medium">
          <span className="w-2 h-2 rounded-full bg-amber-400 ring-1 ring-amber-200" />
          Tanggal Persalinan
        </span>
      </div>

      {/* Detail panel */}
      {hasDetail ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
          <div className="p-4 sm:p-5">
            <h3 className="font-bold text-slate-800 text-sm mb-3">{fmtFull(selectedDate)}</h3>
            <div className="space-y-3">

              {isSelectedPersalinan && (
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-3.5 space-y-1">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Tanggal Persalinan</p>
                  <p className="text-sm font-semibold text-slate-800">{persalinan.name}</p>
                </div>
              )}

              {isSelectedJadwal && selectedVisits.length === 0 && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3.5 space-y-1">
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Jadwal Kunjungan Nifas Berikutnya</p>
                  <p className="text-xs text-slate-500">Belum terpenuhi — segera lakukan kunjungan</p>
                </div>
              )}

              {selectedVisits.map((visit) => {
                const isTD = visit.tekananDarahSistol >= 140 || visit.tekananDarahDiastol >= 90;
                return (
                  <div key={String(visit._id)} className="rounded-xl bg-emerald-50 border border-emerald-100 p-3.5 space-y-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {visit.nomorKF && (
                        <span className="bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">KF{visit.nomorKF}</span>
                      )}
                      {visit.hariPascaSalin != null && (
                        <span className="text-xs text-slate-500">Hari ke-{visit.hariPascaSalin}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                      {visit.tekananDarahSistol != null && (
                        <Info label="TD" value={`${visit.tekananDarahSistol}/${visit.tekananDarahDiastol}`} highlight={isTD} />
                      )}
                      {visit.nadi != null && <Info label="Nadi" value={`${visit.nadi} bpm`} />}
                      {visit.suhu != null && <Info label="Suhu" value={`${visit.suhu} °C`} />}
                      {visit.pernapasan != null && <Info label="RR" value={`${visit.pernapasan} x/mnt`} />}
                      {visit.tfu && <Info label="TFU" value={visit.tfu} />}
                      {visit.lokhia && <Info label="Lokhia" value={LOKHIA_LABEL[visit.lokhia] || visit.lokhia} />}
                      {visit.kondisiPerineum && <Info label="Perineum" value={KONDISI_PERINEUM_LABEL[visit.kondisiPerineum] || visit.kondisiPerineum} />}
                      {visit.asi && <Info label="ASI" value={ASI_LABEL[visit.asi] || visit.asi} />}
                      {visit.kondisiBayi && <Info label="Kondisi Bayi" value={KONDISI_BAYI_LABEL[visit.kondisiBayi] || visit.kondisiBayi} />}
                      {visit.beratBayiSekarang != null && <Info label="BB Bayi" value={`${visit.beratBayiSekarang} g`} />}
                    </div>
                    {visit.keluhan && <DetailRow label="Keluhan" value={visit.keluhan} />}
                    {visit.tindakan && <DetailRow label="Tindakan" value={visit.tindakan} />}
                    {visit.notes && <DetailRow label="Catatan" value={visit.notes} />}
                    {isTD && <p className="text-xs text-red-600 font-semibold">⚠️ TD tinggi — perhatikan risiko hipertensi post-partum</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center text-xs text-slate-400 py-2">
          Klik tanggal bertanda untuk melihat detail kunjungan
        </p>
      )}
    </div>
  );
}

function Info({ label, value, highlight }) {
  return (
    <div>
      <span className="text-[10px] text-slate-400 uppercase tracking-wide block">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? "text-red-600" : "text-slate-800"}`}>{value}</span>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <p className="text-xs text-slate-600">
      <span className="text-[10px] uppercase tracking-wide text-slate-400 mr-1">{label}:</span>
      {value}
    </p>
  );
}
