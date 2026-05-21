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

function fmtFull(d) {
  try {
    return format(new Date(d), "dd MMMM yyyy", { locale: localeId });
  } catch {
    return "-";
  }
}

function toDateStr(d) {
  try {
    return format(new Date(d), "yyyy-MM-dd");
  } catch {
    return "";
  }
}

export default function CalendarPersalinan({ persalinan }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [visitMap, setVisitMap] = useState({});
  const [jadwalDate, setJadwalDate] = useState(null);
  const [persalinanDate, setPersalinanDate] = useState(null);

  useEffect(() => {
    const map = {};
    const sorted = [...(persalinan.visits || [])].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

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

    // Compute next unfulfilled KF jadwal
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

    if (nextKF) {
      const d = new Date(tanggal.getTime() + nextKF.windowStart * MS_PER_DAY);
      setJadwalDate(toDateStr(d));
    } else {
      setJadwalDate(null);
    }

    setPersalinanDate(toDateStr(persalinan.tanggalPersalinan));
  }, [persalinan]);

  const tileContent = ({ date }) => {
    const ds = format(date, "yyyy-MM-dd");
    const hasVisit = !!visitMap[ds];
    const isJadwal = jadwalDate === ds;
    const isPersalinan = persalinanDate === ds;

    if (!hasVisit && !isJadwal && !isPersalinan) return null;

    return (
      <div className="mt-1 flex justify-center items-center gap-0.5 flex-wrap">
        {hasVisit && (
          <div
            className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-300 shadow-sm"
            title="Kunjungan Nifas"
          />
        )}
        {isJadwal && !hasVisit && (
          <div
            className="w-3 h-3 rounded-full border-2 border-emerald-500 bg-white shadow-sm"
            title="Jadwal KF Berikutnya"
          />
        )}
        {isPersalinan && (
          <div
            className="w-3 h-3 rounded-full bg-amber-400 ring-2 ring-amber-200 shadow-sm"
            title="Tanggal Persalinan"
          />
        )}
      </div>
    );
  };

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const selectedVisits = visitMap[selectedDateStr] || [];
  const isSelectedJadwal = jadwalDate === selectedDateStr;
  const isSelectedPersalinan = persalinanDate === selectedDateStr;

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="flex justify-center">
        <div className="w-full max-w-7xl">
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            locale="id-ID"
            tileContent={tileContent}
            className="calendar-custom bg-white rounded-md shadow-lg p-4 w-full text-base"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-full shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-300" />
          Kunjungan Nifas
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-full shadow-sm">
          <span className="w-3 h-3 rounded-full border-2 border-emerald-500 bg-white" />
          Jadwal KF Berikutnya
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full shadow-sm">
          <span className="w-3 h-3 rounded-full bg-amber-400 ring-2 ring-amber-200" />
          Tanggal Persalinan
        </div>
      </div>

      {/* Detail panel */}
      {(selectedVisits.length > 0 || isSelectedJadwal || isSelectedPersalinan) && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
          <h3 className="text-base font-bold text-emerald-700 mb-4">
            {fmtFull(selectedDate)}
          </h3>

          <div className="space-y-4">
            {isSelectedPersalinan && (
              <div className="flex items-start gap-3 border-l-4 border-amber-400 bg-amber-50 pl-4 py-2 rounded-r-md">
                <div>
                  <p className="font-semibold text-amber-800 text-sm">🌟 Tanggal Persalinan</p>
                  <p className="text-xs text-amber-700 mt-0.5">{persalinan.name}</p>
                </div>
              </div>
            )}

            {isSelectedJadwal && selectedVisits.length === 0 && (
              <div className="flex items-start gap-3 border-l-4 border-emerald-300 bg-emerald-50 pl-4 py-2 rounded-r-md">
                <div>
                  <p className="font-semibold text-emerald-700 text-sm">
                    📅 Jadwal Kunjungan Nifas Berikutnya
                  </p>
                  <p className="text-xs text-emerald-600 mt-0.5">Belum terpenuhi</p>
                </div>
              </div>
            )}

            {selectedVisits.map((visit) => {
              const isTD =
                visit.tekananDarahSistol >= 140 || visit.tekananDarahDiastol >= 90;
              return (
                <div
                  key={String(visit._id)}
                  className="border-l-4 border-emerald-500 bg-emerald-50 pl-4 py-2 rounded-r-md space-y-2"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    {visit.nomorKF && (
                      <span className="bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        KF{visit.nomorKF}
                      </span>
                    )}
                    {visit.hariPascaSalin != null && (
                      <span className="text-xs text-gray-600">
                        Hari ke-{visit.hariPascaSalin}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-sm">
                    {visit.tekananDarahSistol != null && (
                      <Info
                        label="TD"
                        value={`${visit.tekananDarahSistol}/${visit.tekananDarahDiastol}`}
                        highlight={isTD}
                      />
                    )}
                    {visit.nadi != null && (
                      <Info label="Nadi" value={`${visit.nadi} bpm`} />
                    )}
                    {visit.suhu != null && (
                      <Info label="Suhu" value={`${visit.suhu} °C`} />
                    )}
                    {visit.pernapasan != null && (
                      <Info label="RR" value={`${visit.pernapasan} x/mnt`} />
                    )}
                    {visit.tfu && <Info label="TFU" value={visit.tfu} />}
                    {visit.lokhia && (
                      <Info label="Lokhia" value={LOKHIA_LABEL[visit.lokhia] || visit.lokhia} />
                    )}
                    {visit.kondisiPerineum && (
                      <Info label="Kondisi Perineum" value={KONDISI_PERINEUM_LABEL[visit.kondisiPerineum] || visit.kondisiPerineum} />
                    )}
                    {visit.asi && <Info label="ASI" value={ASI_LABEL[visit.asi] || visit.asi} />}
                    {visit.kondisiBayi && (
                      <Info label="Kondisi Bayi" value={KONDISI_BAYI_NIFAS_LABEL[visit.kondisiBayi] || visit.kondisiBayi} />
                    )}
                    {visit.beratBayiSekarang != null && (
                      <Info label="BB Bayi" value={`${visit.beratBayiSekarang} g`} />
                    )}
                  </div>

                  {visit.keluhan && (
                    <p className="text-sm text-gray-700">
                      <span className="text-xs text-gray-400 uppercase">Keluhan:</span>{" "}
                      {visit.keluhan}
                    </p>
                  )}
                  {visit.tindakan && (
                    <p className="text-sm text-gray-700">
                      <span className="text-xs text-gray-400 uppercase">Tindakan:</span>{" "}
                      {visit.tindakan}
                    </p>
                  )}
                  {visit.notes && (
                    <p className="text-sm text-gray-700">
                      <span className="text-xs text-gray-400 uppercase">Catatan:</span>{" "}
                      {visit.notes}
                    </p>
                  )}
                  {isTD && (
                    <p className="text-xs text-red-600 font-semibold">
                      ⚠️ TD tinggi — perhatikan risiko hipertensi post-partum
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value, highlight }) {
  return (
    <div>
      <span className="text-xs text-gray-400 uppercase block">{label}</span>
      <span
        className={`font-medium text-gray-800 ${highlight ? "text-red-600 font-bold" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
