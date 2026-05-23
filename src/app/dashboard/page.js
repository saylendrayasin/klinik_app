"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FaUsers, FaHeartbeat, FaBaby, FaChevronRight, FaHospital } from "react-icons/fa";
import { Settings2, AlertTriangle, Clock, CalendarX } from "lucide-react";
import { fetcher } from "@/lib/fetcher";

const modules = [
  {
    href: "/dashboard/patients",
    icon: FaUsers,
    label: "Pasien",
    description: "Kelola data pasien dan riwayat kunjungan pemeriksaan",
    iconBg: "bg-gradient-to-br from-blue-500 to-blue-700",
    cardBg: "bg-white hover:bg-blue-50/60",
    border: "border-slate-200 hover:border-blue-200",
    text: "text-blue-700",
    chevron: "text-blue-300 group-hover:text-blue-500",
  },
  {
    href: "/dashboard/kb",
    icon: FaHeartbeat,
    label: "KB",
    description: "Data keluarga berencana dan kunjungan akseptor KB",
    iconBg: "bg-gradient-to-br from-violet-500 to-violet-700",
    cardBg: "bg-white hover:bg-violet-50/60",
    border: "border-slate-200 hover:border-violet-200",
    text: "text-violet-700",
    chevron: "text-violet-300 group-hover:text-violet-500",
  },
  {
    href: "/dashboard/kehamilan",
    icon: FaBaby,
    label: "Kehamilan",
    description: "Monitoring ANC, jadwal kunjungan, dan HPL ibu hamil",
    iconBg: "bg-gradient-to-br from-pink-500 to-rose-600",
    cardBg: "bg-white hover:bg-pink-50/60",
    border: "border-slate-200 hover:border-pink-200",
    text: "text-pink-700",
    chevron: "text-pink-300 group-hover:text-pink-500",
  },
  {
    href: "/dashboard/persalinan",
    icon: FaHospital,
    label: "Persalinan",
    description: "Pencatatan persalinan dan kunjungan nifas ibu",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
    cardBg: "bg-white hover:bg-emerald-50/60",
    border: "border-slate-200 hover:border-emerald-200",
    text: "text-emerald-700",
    chevron: "text-emerald-300 group-hover:text-emerald-500",
  },
  {
    href: "/dashboard/config",
    icon: Settings2,
    label: "Konfigurasi",
    description: "Master data diagnosis dan kode referensi sistem",
    iconBg: "bg-gradient-to-br from-slate-500 to-slate-700",
    cardBg: "bg-white hover:bg-slate-50/60",
    border: "border-slate-200 hover:border-slate-300",
    text: "text-slate-700",
    chevron: "text-slate-300 group-hover:text-slate-500",
  },
];

const statCards = [
  {
    key: "pasien",
    icon: FaUsers,
    label: "Total Pasien",
    from: "from-blue-500",
    to: "to-blue-600",
    ring: "ring-blue-200",
    href: "/dashboard/patients",
  },
  {
    key: "kb",
    icon: FaHeartbeat,
    label: "Akseptor KB",
    from: "from-violet-500",
    to: "to-violet-600",
    ring: "ring-violet-200",
    href: "/dashboard/kb",
  },
  {
    key: "kehamilanAktif",
    icon: FaBaby,
    label: "Ibu Hamil Aktif",
    from: "from-pink-500",
    to: "to-rose-500",
    ring: "ring-pink-200",
    href: "/dashboard/kehamilan",
  },
  {
    key: "persalinanAktif",
    icon: FaHospital,
    label: "Ibu Nifas",
    from: "from-emerald-500",
    to: "to-teal-500",
    ring: "ring-emerald-200",
    href: "/dashboard/persalinan",
  },
];

function StatCard({ icon: Icon, label, value, from, to, ring, href }) {
  return (
    <Link
      href={href}
      className={`group relative flex flex-col items-center justify-center gap-1.5 py-4 px-2 rounded-2xl bg-white border border-slate-200 text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:ring-2 ${ring} overflow-hidden`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${from} ${to} opacity-0 group-hover:opacity-5 transition-opacity`} />
      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${from} ${to} flex items-center justify-center shadow-md mb-0.5`}>
        <Icon size={14} className="text-white" />
      </div>
      {value !== null ? (
        <p className="text-2xl font-bold leading-none text-slate-800 font-mono">{value}</p>
      ) : (
        <div className="h-7 w-10 rounded-lg bg-slate-100 animate-pulse" />
      )}
      <p className="text-xs font-medium text-slate-500 leading-tight">{label}</p>
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
    iconColor: "text-amber-500",
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
    iconColor: "text-orange-500",
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
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f172a] via-[#1e2d4a] to-[#0f172a] shadow-xl">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-8 w-48 h-48 bg-indigo-600/15 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }}
          />
        </div>
        <div className="relative px-5 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-blue-400/80 uppercase tracking-widest bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                {dateText}
              </span>
            </div>
            <h1 className="text-white text-xl font-bold mt-2">
              {greeting} 👋
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">Sistem Manajemen Klinik Iya</p>
          </div>
          <div className="shrink-0 bg-white/[0.06] border border-white/[0.1] rounded-2xl px-5 py-3.5 text-right backdrop-blur-sm">
            <p className="text-slate-500 text-xs font-medium mb-0.5">Waktu Sekarang</p>
            <p className="text-white text-2xl font-bold tracking-tight font-mono">{timeText}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 px-0.5">Ringkasan Data</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <StatCard
              key={s.key}
              icon={s.icon}
              label={s.label}
              value={stats[s.key]}
              from={s.from}
              to={s.to}
              ring={s.ring}
              href={s.href}
            />
          ))}
        </div>
      </div>

      {/* Alerts */}
      {activeAlerts.length > 0 && (
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 px-0.5">Perlu Perhatian</p>
          <div className="flex flex-col gap-2">
            {activeAlerts.map((a) => {
              const AlertIcon = a.icon;
              const count = stats.alerts?.[a.key] ?? 0;
              return (
                <Link
                  key={a.key}
                  href={a.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${a.bg} ${a.border} transition-all duration-150 hover:shadow-sm hover:-translate-y-px`}
                >
                  <AlertIcon size={15} className={`shrink-0 ${a.iconColor}`} />
                  <p className={`text-xs font-semibold flex-1 ${a.text}`}>{a.label(count)}</p>
                  <FaChevronRight size={9} className={`shrink-0 ${a.iconColor} opacity-60`} />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Module grid */}
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 px-0.5">Modul Aktif</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.href}
                href={m.href}
                className={`group flex items-center gap-3.5 p-4 rounded-2xl border transition-all duration-200 ${m.cardBg} ${m.border} hover:shadow-md hover:-translate-y-px`}
              >
                <div className={`${m.iconBg} text-white w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md`}>
                  <Icon size={19} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`font-bold text-sm ${m.text}`}>{m.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-1">{m.description}</p>
                </div>
                <FaChevronRight className={`shrink-0 text-[10px] transition-all duration-150 group-hover:translate-x-0.5 ${m.chevron}`} />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
