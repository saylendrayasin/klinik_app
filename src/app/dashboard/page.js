"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FaUsers, FaHeartbeat, FaBaby, FaChevronRight, FaHospital, FaFileSignature, FaFileMedical } from "react-icons/fa";
import { Database, AlertTriangle, Clock, CalendarX } from "lucide-react";
import { fetcher } from "@/lib/fetcher";

const modules = [
  { href: "/dashboard/patients", icon: FaUsers, label: "Pasien", description: "Kelola data pasien dan riwayat kunjungan pemeriksaan" },
  { href: "/dashboard/kb", icon: FaHeartbeat, label: "KB", description: "Data keluarga berencana dan kunjungan akseptor KB" },
  { href: "/dashboard/kehamilan", icon: FaBaby, label: "Kehamilan", description: "Monitoring ANC, jadwal kunjungan, dan HPL ibu hamil" },
  { href: "/dashboard/persalinan", icon: FaHospital, label: "Persalinan", description: "Pencatatan persalinan dan kunjungan nifas ibu" },
  { href: "/dashboard/consent", icon: FaFileSignature, label: "Persetujuan Tindakan", description: "Informed consent bernomor, tanda tangan, dan cetak" },
  { href: "/dashboard/surat-sakit", icon: FaFileMedical, label: "Surat Keterangan Sakit", description: "Surat istirahat bernomor siap cetak" },
  { href: "/dashboard/master", icon: Database, label: "Master Data", description: "Diagnosis, penanda tangan, kop & cap, penomoran" },
];

const statCards = [
  { key: "pasien", icon: FaUsers, label: "Total Pasien", href: "/dashboard/patients" },
  { key: "kb", icon: FaHeartbeat, label: "Akseptor KB", href: "/dashboard/kb" },
  { key: "kehamilanAktif", icon: FaBaby, label: "Ibu Hamil Aktif", href: "/dashboard/kehamilan" },
  { key: "persalinanAktif", icon: FaHospital, label: "Ibu Nifas", href: "/dashboard/persalinan" },
];

// Angka naik dari 0 saat data tiba; langsung tampil bila pengguna memilih gerak dikurangi.
function AngkaNaik({ nilai }) {
  const [tampil, setTampil] = useState(0);
  useEffect(() => {
    if (!(nilai > 0) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTampil(nilai);
      return;
    }
    let raf;
    const mulai = performance.now();
    const langkah = (t) => {
      const p = Math.min(1, (t - mulai) / 650);
      setTampil(Math.round(nilai * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(langkah);
    };
    raf = requestAnimationFrame(langkah);
    return () => cancelAnimationFrame(raf);
  }, [nilai]);
  return tampil;
}

function StatCard({ icon: Icon, label, value, href }) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-start gap-3 p-4 rounded-2xl bg-white border border-slate-200 transition hover:border-brand-200 hover:shadow-md hover:shadow-brand-900/5 hover:-translate-y-0.5 active:scale-[0.98]"
    >
      <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 group-hover:bg-brand-600 group-hover:text-white transition-colors">
        <Icon size={18} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        {value !== null ? (
          <p className="text-2xl font-bold leading-none text-slate-900 tabular-nums"><AngkaNaik nilai={value} /></p>
        ) : (
          <div className="h-6 w-10 rounded-lg skeleton" aria-hidden="true" />
        )}
        <p className="text-sm text-slate-500 mt-1 leading-tight">{label}</p>
      </div>
    </Link>
  );
}

const alertItems = [
  {
    key: "hplDekat",
    icon: Clock,
    label: (n) => `${n} ibu hamil dengan HPL dalam 14 hari`,
    href: "/dashboard/kehamilan",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
    iconColor: "text-amber-600",
  },
  {
    key: "hplOverdue",
    icon: CalendarX,
    label: (n) => `${n} ibu hamil dengan HPL telah lewat`,
    href: "/dashboard/kehamilan",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    iconColor: "text-red-500",
  },
  {
    key: "jadwalTerlewat",
    icon: AlertTriangle,
    label: (n) => `${n} jadwal kunjungan ANC belum terpenuhi`,
    href: "/dashboard/kehamilan",
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-800",
    iconColor: "text-orange-600",
  },
];

export default function DashboardHomePage() {
  const [now, setNow] = useState(null);
  const [stats, setStats] = useState({
    pasien: null,
    kb: null,
    kehamilanAktif: null,
    persalinanAktif: null,
    alerts: { hplDekat: 0, hplOverdue: 0, jadwalTerlewat: 0 },
  });

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetcher("/api/dashboard")
      .then((res) => {
        if (res?.data) setStats((prev) => ({ ...prev, ...res.data }));
      })
      .catch(() => {});
  }, []);

  const greeting = useMemo(() => {
    if (!now) return "";
    const h = now.getHours();
    if (h >= 4 && h < 11) return "Selamat Pagi";
    if (h >= 11 && h < 15) return "Selamat Siang";
    if (h >= 15 && h < 19) return "Selamat Sore";
    return "Selamat Malam";
  }, [now]);

  const timeText = useMemo(
    () => now ? now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--:--:--",
    [now]
  );

  const dateText = useMemo(
    () => now ? now.toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }) : "",
    [now]
  );

  const activeAlerts = alertItems.filter((a) => (stats.alerts?.[a.key] ?? 0) > 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Banner sapaan */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 shadow-lg shadow-brand-900/15">
        <div aria-hidden="true" className="absolute -top-20 -right-16 w-64 h-64 rounded-full bg-white/[0.06]" />
        <div aria-hidden="true" className="absolute -bottom-24 right-32 w-48 h-48 rounded-full bg-white/[0.04]" />
        {/* Logo klinik sebagai tanda air: ciri khas tanpa mengganggu teks */}
        <img
          src="/kop/logo-klinik.png"
          alt=""
          aria-hidden="true"
          className="absolute -right-4 -bottom-6 w-36 sm:w-48 lg:right-48 object-contain opacity-[0.09] brightness-0 invert pointer-events-none select-none"
        />
        <div className="relative px-5 py-5 sm:py-6 sm:px-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-brand-100/80 uppercase tracking-wider min-h-4">{dateText}</p>
            <h1 className="text-white text-2xl font-bold mt-1.5">{greeting || "Selamat Datang"}</h1>
            <p className="text-brand-100/80 text-sm mt-1">Sistem Manajemen Klinik Iya</p>
          </div>
          <div className="shrink-0 self-start sm:self-auto inline-flex sm:block items-center gap-2 bg-white/10 ring-1 ring-white/15 rounded-full sm:rounded-2xl px-3.5 py-1.5 sm:px-5 sm:py-3 sm:text-right">
            <p className="hidden sm:block text-brand-100/80 text-xs font-medium">Waktu Sekarang</p>
            <Clock size={14} className="sm:hidden text-brand-100" aria-hidden="true" />
            <p className="text-white text-base sm:text-2xl font-bold tracking-tight tabular-nums">{timeText}</p>
          </div>
        </div>
      </div>

      {/* Ringkasan */}
      <section aria-labelledby="judul-ringkasan">
        <h2 id="judul-ringkasan" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Ringkasan Data</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 anim-stagger">
          {statCards.map((s) => (
            <StatCard key={s.key} icon={s.icon} label={s.label} value={stats[s.key]} href={s.href} />
          ))}
        </div>
      </section>

      {/* Peringatan */}
      {activeAlerts.length > 0 && (
        <section aria-labelledby="judul-perhatian">
          <h2 id="judul-perhatian" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Perlu Perhatian</h2>
          <div className="flex flex-col gap-2">
            {activeAlerts.map((a) => {
              const AlertIcon = a.icon;
              const count = stats.alerts?.[a.key] ?? 0;
              return (
                <Link
                  key={a.key}
                  href={a.href}
                  className={`flex items-center gap-3 px-4 min-h-12 py-3 rounded-2xl border ${a.bg} ${a.border} transition hover:shadow-sm`}
                >
                  <AlertIcon size={18} className={`shrink-0 ${a.iconColor}`} aria-hidden="true" />
                  <p className={`text-sm font-semibold flex-1 ${a.text}`}>{a.label(count)}</p>
                  <FaChevronRight size={11} className={`shrink-0 ${a.iconColor} opacity-70`} aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Modul */}
      <section aria-labelledby="judul-modul">
        <h2 id="judul-modul" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Modul</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 anim-stagger">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.href}
                href={m.href}
                className="group flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 transition hover:border-brand-200 hover:shadow-md hover:shadow-brand-900/5"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-brand-600/30">
                  <Icon size={20} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[15px] text-slate-900">{m.label}</p>
                  <p className="text-sm text-slate-500 mt-0.5 leading-snug">{m.description}</p>
                </div>
                <FaChevronRight size={12} className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
