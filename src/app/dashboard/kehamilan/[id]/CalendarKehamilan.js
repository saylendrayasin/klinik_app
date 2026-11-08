"use client";

import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { AlertTriangle } from "lucide-react";

const LETAK_LABEL = {
  kepala: "Kepala",
  sungsang: "Sungsang",
  lintang: "Lintang",
  belum_diketahui: "Belum diketahui",
};

function fmtFull(d) {
  try { return format(new Date(d), "dd MMMM yyyy", { locale: localeId }); } catch { return "-"; }
}

function toDateStr(d) {
  try { return format(new Date(d), "yyyy-MM-dd"); } catch { return ""; }
}

export default function CalendarKehamilan({ kehamilan }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [visitMap, setVisitMap] = useState({});
  const [jadwalDate, setJadwalDate] = useState(null);
  const [hplDate, setHplDate] = useState(null);

  useEffect(() => {
    const map = {};
    const sorted = [...(kehamilan.visits || [])].sort((a, b) => new Date(a.date) - new Date(b.date));

    sorted.forEach((v, idx) => {
      const ds = toDateStr(v.date);
      if (!ds) return;
      if (!map[ds]) map[ds] = [];
      map[ds].push({ ...v, kNo: idx + 1 });
    });

    setVisitMap(map);

    const lastVisit = sorted[sorted.length - 1];
    setJadwalDate(lastVisit?.jadwalBerikutnya ? toDateStr(lastVisit.jadwalBerikutnya) : null);
    setHplDate(kehamilan.hpl ? toDateStr(kehamilan.hpl) : null);
  }, [kehamilan]);

  const tileContent = ({ date }) => {
    const ds = toDateStr(date);
    const hasVisit = !!visitMap[ds];
    const isJadwal = jadwalDate === ds;
    const isHPL = hplDate === ds;
    if (!hasVisit && !isJadwal && !isHPL) return null;

    return (
      <div className="mt-1 flex justify-center items-center gap-0.5 flex-wrap">
        {hasVisit && <span className="w-2 h-2 rounded-full bg-brand-500 ring-1 ring-brand-300" title="Kunjungan ANC" />}
        {isJadwal && !hasVisit && <span className="w-2.5 h-2.5 rounded-full border-2 border-brand-500 bg-white" title="Jadwal Berikutnya" />}
        {isHPL && <span className="w-2 h-2 rounded-full bg-amber-400 ring-1 ring-amber-200" title="HPL" />}
      </div>
    );
  };

  const selectedStr = toDateStr(selectedDate);
  const selectedVisits = visitMap[selectedStr] || [];
  const isSelectedJadwal = jadwalDate === selectedStr;
  const isSelectedHPL = hplDate === selectedStr;
  const hasDetail = selectedVisits.length > 0 || isSelectedJadwal || isSelectedHPL;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Calendar card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
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
        <span className="flex items-center gap-1.5 bg-brand-50 border border-brand-200 text-brand-700 px-3 py-1.5 rounded-full font-medium">
          <span className="w-2 h-2 rounded-full bg-brand-500 ring-1 ring-brand-300" />
          Kunjungan ANC
        </span>
        <span className="flex items-center gap-1.5 bg-brand-50 border border-brand-200 text-brand-700 px-3 py-1.5 rounded-full font-medium">
          <span className="w-2.5 h-2.5 rounded-full border-2 border-brand-500 bg-white" />
          Jadwal Berikutnya
        </span>
        <span className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full font-medium">
          <span className="w-2 h-2 rounded-full bg-amber-400 ring-1 ring-amber-200" />
          Hari Perkiraan Lahir (HPL)
        </span>
      </div>

      {/* Detail panel */}
      {hasDetail ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 sm:p-5">
            <h3 className="font-bold text-slate-800 text-sm mb-3">{fmtFull(selectedDate)}</h3>
            <div className="space-y-3">

              {isSelectedHPL && (
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-3.5 space-y-1">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Hari Perkiraan Lahir (HPL)</p>
                  <p className="text-xs text-slate-500">HPHT: <span className="font-semibold text-slate-700">{fmtFull(kehamilan.hpht)}</span></p>
                </div>
              )}

              {isSelectedJadwal && selectedVisits.length === 0 && (
                <div className="rounded-xl bg-brand-50 border border-brand-100 p-3.5 space-y-1">
                  <p className="text-xs font-bold text-brand-700 uppercase tracking-wide">Jadwal Kunjungan Berikutnya</p>
                  <p className="text-xs text-slate-500">Dijadwalkan dari kunjungan terakhir — belum terpenuhi</p>
                </div>
              )}

              {selectedVisits.map((visit) => {
                const isTD = visit.tekananDarahSistol >= 140 || visit.tekananDarahDiastol >= 90;
                return (
                  <div key={String(visit._id)} className="rounded-xl bg-brand-50 border border-brand-100 p-3.5 space-y-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-brand-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">K{visit.kNo}</span>
                      {visit.trimester && (
                        <span className="bg-white border border-brand-200 text-brand-700 text-xs px-2 py-0.5 rounded-full font-semibold">T{visit.trimester}</span>
                      )}
                      {visit.usiaKehamilan != null && (
                        <span className="text-xs text-slate-500">UK {visit.usiaKehamilan} minggu</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                      {visit.beratBadan != null && <Info label="BB" value={`${visit.beratBadan} kg`} />}
                      {visit.tekananDarahSistol != null && (
                        <Info label="TD" value={`${visit.tekananDarahSistol}/${visit.tekananDarahDiastol}`} highlight={isTD} />
                      )}
                      {visit.tfu != null && <Info label="TFU" value={`${visit.tfu} cm`} />}
                      {visit.djj != null && <Info label="DJJ" value={`${visit.djj} bpm`} />}
                      {visit.letakJanin && <Info label="Letak" value={LETAK_LABEL[visit.letakJanin] || visit.letakJanin} />}
                      {visit.jadwalBerikutnya && <Info label="Jadwal Balik" value={fmtFull(visit.jadwalBerikutnya)} />}
                    </div>
                    {visit.keluhan && <DetailRow label="Keluhan" value={visit.keluhan} />}
                    {visit.tindakan && <DetailRow label="Tindakan" value={visit.tindakan} />}
                    {visit.notes && <DetailRow label="Catatan" value={visit.notes} />}
                    {isTD && <p className="text-xs text-red-600 font-semibold"><AlertTriangle size={13} className="inline -mt-0.5 mr-1" aria-hidden="true" />TD tinggi — perhatikan risiko preeklampsia</p>}
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
      <span className="text-[11px] text-slate-400 uppercase tracking-wide block">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? "text-red-600" : "text-slate-800"}`}>{value}</span>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <p className="text-xs text-slate-600">
      <span className="text-[11px] uppercase tracking-wide text-slate-400 mr-1">{label}:</span>
      {value}
    </p>
  );
}
