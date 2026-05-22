"use client";

import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

function toDateStr(d) {
  try { return format(new Date(d), "yyyy-MM-dd"); } catch { return ""; }
}

function fmtFull(d) {
  try { return format(new Date(d), "dd MMMM yyyy", { locale: localeId }); } catch { return "-"; }
}

export default function CalendarKb({ kb }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [datangMap, setDatangMap] = useState({});
  const [kembaliMap, setKembaliMap] = useState({});

  useEffect(() => {
    const dm = {};
    const km = {};
    (kb?.visits || []).forEach((v, idx) => {
      if (v.date) {
        const ds = toDateStr(v.date);
        if (!dm[ds]) dm[ds] = [];
        dm[ds].push({ ...v, idx });
      }
      if (v.returnDate) {
        const ks = toDateStr(v.returnDate);
        if (!km[ks]) km[ks] = [];
        km[ks].push({ ...v, idx });
      }
    });
    setDatangMap(dm);
    setKembaliMap(km);
  }, [kb?.visits]);

  const tileContent = ({ date }) => {
    const ds = toDateStr(date);
    const hasDatang = !!datangMap[ds];
    const hasKembali = !!kembaliMap[ds];
    if (!hasDatang && !hasKembali) return null;
    return (
      <div className="mt-1 flex justify-center gap-0.5">
        {hasDatang && <span className="w-2 h-2 rounded-full bg-violet-600 ring-1 ring-violet-300" title="Tanggal Datang" />}
        {hasKembali && <span className="w-2 h-2 rounded-full bg-pink-500 ring-1 ring-pink-300" title="Tanggal Kembali" />}
      </div>
    );
  };

  const selectedStr = toDateStr(selectedDate);
  const datangVisits = datangMap[selectedStr] || [];
  const kembaliVisits = kembaliMap[selectedStr] || [];
  const hasDetail = datangVisits.length > 0 || kembaliVisits.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Calendar card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-violet-500 to-violet-400" />
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
        <span className="flex items-center gap-1.5 bg-violet-50 border border-violet-200 text-violet-700 px-3 py-1.5 rounded-full font-medium">
          <span className="w-2 h-2 rounded-full bg-violet-600 ring-1 ring-violet-300" />
          Tanggal Datang
        </span>
        <span className="flex items-center gap-1.5 bg-pink-50 border border-pink-200 text-pink-700 px-3 py-1.5 rounded-full font-medium">
          <span className="w-2 h-2 rounded-full bg-pink-500 ring-1 ring-pink-300" />
          Tanggal Kembali
        </span>
      </div>

      {/* Detail panel */}
      {hasDetail ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-violet-500 to-violet-400" />
          <div className="p-4 sm:p-5">
            <h3 className="font-bold text-slate-800 text-sm mb-3">
              {fmtFull(selectedDate)}
            </h3>
            <div className="space-y-3">
              {datangVisits.map((v, i) => (
                <div key={`datang-${i}`} className="rounded-xl bg-violet-50 border border-violet-100 p-3.5 space-y-1.5">
                  <p className="text-xs font-bold text-violet-700 uppercase tracking-wide">Tanggal Datang</p>
                  <p className="text-sm font-semibold text-slate-800">
                    Metode: <span className="text-violet-700">{v.metode || "-"}</span>
                  </p>
                  {v.notes && <p className="text-xs text-slate-500">Catatan: {v.notes}</p>}
                  {v.returnDate && (
                    <p className="text-xs text-slate-500">
                      Tanggal Kembali: <span className="font-semibold text-slate-700">{fmtFull(v.returnDate)}</span>
                    </p>
                  )}
                </div>
              ))}
              {kembaliVisits.map((v, i) => (
                <div key={`kembali-${i}`} className="rounded-xl bg-pink-50 border border-pink-100 p-3.5 space-y-1.5">
                  <p className="text-xs font-bold text-pink-700 uppercase tracking-wide">Tanggal Kembali</p>
                  <p className="text-sm font-semibold text-slate-800">
                    Metode: <span className="text-pink-700">{v.metode || "-"}</span>
                  </p>
                  {v.notes && <p className="text-xs text-slate-500">Catatan: {v.notes}</p>}
                  {v.date && (
                    <p className="text-xs text-slate-500">
                      Tanggal Datang: <span className="font-semibold text-slate-700">{fmtFull(v.date)}</span>
                    </p>
                  )}
                </div>
              ))}
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
