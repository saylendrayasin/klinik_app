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
        {hasDatang && <span className="w-2 h-2 rounded-full bg-brand-600 ring-1 ring-brand-300" title="Tanggal Datang" />}
        {hasKembali && <span className="w-2.5 h-2.5 rounded-full border-2 border-brand-500 bg-white" title="Tanggal Kembali" />}
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
          <span className="w-2 h-2 rounded-full bg-brand-600 ring-1 ring-brand-300" />
          Tanggal Datang
        </span>
        <span className="flex items-center gap-1.5 bg-brand-50 border border-brand-200 text-brand-700 px-3 py-1.5 rounded-full font-medium">
          <span className="w-2.5 h-2.5 rounded-full border-2 border-brand-500 bg-white" />
          Tanggal Kembali
        </span>
      </div>

      {/* Detail panel */}
      {hasDetail ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 sm:p-5">
            <h3 className="font-bold text-slate-800 text-sm mb-3">
              {fmtFull(selectedDate)}
            </h3>
            <div className="space-y-3">
              {datangVisits.map((v, i) => (
                <div key={`datang-${i}`} className="rounded-xl bg-brand-50 border border-brand-100 p-3.5 space-y-1.5">
                  <p className="text-xs font-bold text-brand-700 uppercase tracking-wide">Tanggal Datang</p>
                  <p className="text-sm font-semibold text-slate-800">
                    Metode: <span className="text-brand-700">{v.metode || "-"}</span>
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
                <div key={`kembali-${i}`} className="rounded-xl bg-white border border-brand-200 p-3.5 space-y-1.5">
                  <p className="text-xs font-bold text-brand-700 uppercase tracking-wide">Tanggal Kembali</p>
                  <p className="text-sm font-semibold text-slate-800">
                    Metode: <span className="text-brand-700">{v.metode || "-"}</span>
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
