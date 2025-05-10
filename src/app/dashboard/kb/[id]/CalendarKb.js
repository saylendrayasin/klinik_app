"use client";

import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format } from "date-fns";
import id from "date-fns/locale/id";

export default function CalendarKb({ kb }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (kb?.visits) {
      const transformed = kb.visits
        .flatMap((v) => [
          { type: "datang", date: v.date, metode: v.metode },
          v.returnDate
            ? { type: "kembali", date: v.returnDate, metode: v.metode }
            : null,
        ])
        .filter(Boolean);
      setEvents(transformed);
    }
  }, [kb?.visits]);

  const tileContent = ({ date }) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const isDatang = events.some(
      (e) => e.type === "datang" && format(e.date, "yyyy-MM-dd") === dateStr
    );
    const isKembali = events.some(
      (e) => e.type === "kembali" && format(e.date, "yyyy-MM-dd") === dateStr
    );

    return (
      <div className="mt-1 flex justify-center gap-1">
        {isDatang && (
          <div
            className="w-3 h-3 rounded-full bg-blue-600 ring-2 ring-blue-300 shadow"
            title="Tanggal Datang"
          />
        )}
        {isKembali && (
          <div
            className="w-3 h-3 rounded-full bg-pink-500 ring-2 ring-pink-300 shadow"
            title="Tanggal Kembali"
          />
        )}
      </div>
    );
  };

  const renderEventDetails = () => {
    const todayStr = format(selectedDate, "yyyy-MM-dd");
    const matched = events.filter(
      (e) => format(e.date, "yyyy-MM-dd") === todayStr
    );
    if (matched.length === 0) return null;

    return (
      <div className="mt-6 w-full rounded-lg bg-white p-5 shadow-md border border-gray-200">
        <h3 className="text-lg font-bold mb-4 text-purple-700">
          Detail Kunjungan -{" "}
          {format(selectedDate, "dd MMMM yyyy", { locale: id })}
        </h3>

        <div className="space-y-4">
          {matched.map((e, i) => (
            <div
              key={i}
              className="flex items-start gap-4 border-l-4 pl-4 rounded-md py-2"
              style={{
                borderColor: e.type === "datang" ? "#3b82f6" : "#ec4899",
                backgroundColor: e.type === "datang" ? "#eff6ff" : "#fdf2f8",
              }}
            >
              <div className="mt-0.5">
                <div className="font-semibold text-sm text-gray-800">
                  {e.type === "datang"
                    ? "🟦 Tanggal Datang"
                    : "🟣 Tanggal Kembali"}
                </div>
                <div className="text-sm text-gray-600 mt-0.5">
                  Metode: <span className="font-medium">{e.metode}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

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
      <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm sm:text-base">
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-full shadow-sm">
          <span className="w-3 h-3 rounded-full bg-blue-600 ring-2 ring-blue-300" />
          Tanggal Datang
        </div>
        <div className="flex items-center gap-3 bg-pink-50 border border-pink-200 text-pink-700 px-4 py-2 rounded-full shadow-sm">
          <span className="w-3 h-3 rounded-full bg-pink-500 ring-2 ring-pink-300" />
          Tanggal Kembali
        </div>
      </div>

      {renderEventDetails()}
    </div>
  );
}
