"use client";

import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const LETAK_LABEL = {
  kepala: "Kepala",
  sungsang: "Sungsang",
  lintang: "Lintang",
  belum_diketahui: "Belum diketahui",
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

export default function CalendarKehamilan({ kehamilan }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [visitMap, setVisitMap] = useState({});
  const [jadwalDate, setJadwalDate] = useState(null);
  const [hplDate, setHplDate] = useState(null);

  useEffect(() => {
    const map = {};
    const sorted = [...(kehamilan.visits || [])].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    sorted.forEach((v, idx) => {
      const ds = toDateStr(v.date);
      if (!ds) return;
      if (!map[ds]) map[ds] = [];
      map[ds].push({ ...v, kNo: idx + 1, type: "aktual" });
    });

    setVisitMap(map);

    // jadwalBerikutnya hanya dari visit terakhir
    const lastVisit = sorted[sorted.length - 1];
    if (lastVisit?.jadwalBerikutnya) {
      setJadwalDate(toDateStr(lastVisit.jadwalBerikutnya));
    } else {
      setJadwalDate(null);
    }

    setHplDate(kehamilan.hpl ? toDateStr(kehamilan.hpl) : null);
  }, [kehamilan]);

  const tileContent = ({ date }) => {
    const ds = format(date, "yyyy-MM-dd");
    const hasVisit = !!visitMap[ds];
    const isJadwal = jadwalDate === ds;
    const isHPL = hplDate === ds;

    if (!hasVisit && !isJadwal && !isHPL) return null;

    return (
      <div className="mt-1 flex justify-center items-center gap-0.5 flex-wrap">
        {hasVisit && (
          <div
            className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-300 shadow-sm"
            title="Kunjungan ANC"
          />
        )}
        {isJadwal && !hasVisit && (
          <div
            className="w-3 h-3 rounded-full border-2 border-rose-500 bg-white shadow-sm"
            title="Jadwal Kunjungan Berikutnya"
          />
        )}
        {isHPL && (
          <div
            className="w-3 h-3 rounded-full bg-amber-400 ring-2 ring-amber-200 shadow-sm"
            title="Hari Perkiraan Lahir"
          />
        )}
      </div>
    );
  };

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const selectedVisits = visitMap[selectedDateStr] || [];
  const isSelectedJadwal = jadwalDate === selectedDateStr;
  const isSelectedHPL = hplDate === selectedDateStr;

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
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1.5 rounded-full shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-300" />
          Kunjungan Aktual
        </div>
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1.5 rounded-full shadow-sm">
          <span className="w-3 h-3 rounded-full border-2 border-rose-500 bg-white" />
          Jadwal Berikutnya
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full shadow-sm">
          <span className="w-3 h-3 rounded-full bg-amber-400 ring-2 ring-amber-200" />
          HPL
        </div>
      </div>

      {/* Detail panel */}
      {(selectedVisits.length > 0 || isSelectedJadwal || isSelectedHPL) && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
          <h3 className="text-base font-bold text-rose-700 mb-4">
            {fmtFull(selectedDate)}
          </h3>

          <div className="space-y-4">
            {isSelectedHPL && (
              <div className="flex items-start gap-3 border-l-4 border-amber-400 bg-amber-50 pl-4 py-2 rounded-r-md">
                <div>
                  <p className="font-semibold text-amber-800 text-sm">🌟 Hari Perkiraan Lahir (HPL)</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    HPHT: {fmtFull(kehamilan.hpht)}
                  </p>
                </div>
              </div>
            )}

            {isSelectedJadwal && selectedVisits.length === 0 && (
              <div className="flex items-start gap-3 border-l-4 border-rose-300 bg-rose-50 pl-4 py-2 rounded-r-md">
                <div>
                  <p className="font-semibold text-rose-700 text-sm">📅 Jadwal Kunjungan Berikutnya</p>
                  <p className="text-xs text-rose-600 mt-0.5">
                    Dari kunjungan terakhir — belum terpenuhi
                  </p>
                </div>
              </div>
            )}

            {selectedVisits.map((visit) => {
              const isTD =
                visit.tekananDarahSistol >= 140 || visit.tekananDarahDiastol >= 90;
              return (
                <div
                  key={String(visit._id)}
                  className="border-l-4 border-rose-500 bg-rose-50 pl-4 py-2 rounded-r-md space-y-2"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-rose-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      K{visit.kNo}
                    </span>
                    {visit.trimester && (
                      <span className="bg-white border border-rose-200 text-rose-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                        T{visit.trimester}
                      </span>
                    )}
                    {visit.usiaKehamilan != null && (
                      <span className="text-xs text-gray-600">UK {visit.usiaKehamilan} minggu</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-sm">
                    {visit.beratBadan != null && <Info label="BB" value={`${visit.beratBadan} kg`} />}
                    {visit.tekananDarahSistol != null && (
                      <Info
                        label="TD"
                        value={`${visit.tekananDarahSistol}/${visit.tekananDarahDiastol}`}
                        highlight={isTD}
                      />
                    )}
                    {visit.tfu != null && <Info label="TFU" value={`${visit.tfu} cm`} />}
                    {visit.djj != null && <Info label="DJJ" value={`${visit.djj} bpm`} />}
                    {visit.letakJanin && <Info label="Letak" value={LETAK_LABEL[visit.letakJanin] || visit.letakJanin} />}
                    {visit.jadwalBerikutnya && (
                      <Info label="Jadwal Balik" value={fmtFull(visit.jadwalBerikutnya)} />
                    )}
                  </div>

                  {visit.keluhan && (
                    <p className="text-sm text-gray-700">
                      <span className="text-xs text-gray-400 uppercase">Keluhan:</span> {visit.keluhan}
                    </p>
                  )}
                  {visit.tindakan && (
                    <p className="text-sm text-gray-700">
                      <span className="text-xs text-gray-400 uppercase">Tindakan:</span> {visit.tindakan}
                    </p>
                  )}
                  {visit.notes && (
                    <p className="text-sm text-gray-700">
                      <span className="text-xs text-gray-400 uppercase">Catatan:</span> {visit.notes}
                    </p>
                  )}
                  {isTD && (
                    <p className="text-xs text-red-600 font-semibold">⚠️ TD tinggi — perhatikan risiko preeklampsia</p>
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
      <span className={`font-medium text-gray-800 ${highlight ? "text-red-600 font-bold" : ""}`}>
        {value}
      </span>
    </div>
  );
}
