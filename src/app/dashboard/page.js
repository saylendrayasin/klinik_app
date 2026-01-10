"use client";

import { useEffect, useMemo, useState } from "react";

export default function DashboardHomePage() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const greeting = useMemo(() => {
    const h = now.getHours();
    if (h >= 4 && h < 11) return "Selamat Pagi";
    if (h >= 11 && h < 15) return "Selamat Siang";
    if (h >= 15 && h < 19) return "Selamat Sore";
    return "Selamat Malam";
  }, [now]);

  const timeText = useMemo(() => {
    return now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [now]);

  const dateText = useMemo(() => {
    return now.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, [now]);

  return (
    <div className="bg-white text-gray-800 p-4 sm:p-6 rounded-md shadow">
      {/* Top */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold leading-tight">
            {greeting} 👋
            <span className="block text-base sm:text-lg font-semibold text-gray-800 mt-1">
              Selamat datang di Dashboard Klinik Iya
            </span>
          </h1>

          <p className="text-gray-600 mt-2 text-sm sm:text-base leading-relaxed text-balance">
            Kelola data pasien, kunjungan, KB, dan master data dengan cepat dari
            menu sidebar.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 text-xs sm:text-sm font-semibold">
              💡 Tips: Gunakan kolom pencarian untuk menemukan data lebih cepat
            </span>
            <span className="inline-flex items-center rounded-full bg-green-50 text-green-700 border border-green-200 px-3 py-1 text-xs sm:text-sm font-semibold">
              ✅ Simpan perubahan setelah selesai mengedit data
            </span>
          </div>
        </div>

        {/* Clock */}
        <div className="w-full md:w-[280px]">
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 sm:px-5 sm:py-4">
            <div className="text-xs sm:text-sm text-gray-600">{dateText}</div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1 tracking-tight">
              {timeText}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Waktu lokal perangkat Anda
            </div>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="mt-6 border-t pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500">Fokus Hari Ini</div>
            <div className="font-semibold text-gray-800 mt-1">
              Pemeriksaan & Kunjungan
            </div>
            <div className="text-sm text-gray-600 mt-1 leading-relaxed">
              Pastikan kunjungan tercatat lengkap agar laporan rapi.
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500">Akses Cepat</div>
            <div className="font-semibold text-gray-800 mt-1">
              Pasien • KB • Config
            </div>
            <div className="text-sm text-gray-600 mt-1 leading-relaxed">
              Gunakan sidebar untuk pindah modul dengan cepat.
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500">Catatan</div>
            <div className="font-semibold text-gray-800 mt-1">
              Data & Export Bulanan
            </div>
            <div className="text-sm text-gray-600 mt-1 leading-relaxed">
              Export bisa dibuat per bulan untuk kebutuhan rekap.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
