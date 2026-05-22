"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FaUsers, FaHeartbeat, FaBaby, FaChevronRight, FaHospital } from "react-icons/fa";
import { Settings2 } from "lucide-react";
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
    glow: "shadow-blue-100",
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
    glow: "shadow-violet-100",
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
    glow: "shadow-pink-100",
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
    glow: "shadow-emerald-100",
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
    glow: "shadow-slate-100",
  },
];

const statCards = [
  {
    key: "patients",
    icon: FaUsers,
    label: "Pasien",
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
    key: "kehamilan",
    icon: FaBaby,
    label: "Ibu Hamil",
    from: "from-pink-500",
    to: "to-rose-500",
    ring: "ring-pink-200",
    href: "/dashboard/kehamilan",
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

export default function DashboardHomePage() {
  const [now, setNow] = useState(null);
  const [stats, setStats] = useState({ patients: null, kb: null, kehamilan: null });

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    Promise.all([
      fetcher("/api/patients?limit=1&page=1"),
      fetcher("/api/kb?limit=1&page=1"),
      fetcher("/api/kehamilan?limit=1&page=1"),
    ])
      .then(([p, k, kh]) => {
        setStats({
          patients: p?.totalPages ?? 0,
          kb: k?.totalPages ?? 0,
          kehamilan: kh?.totalPages ?? 0,
        });
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

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f172a] via-[#1e2d4a] to-[#0f172a] shadow-xl">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-8 w-48 h-48 bg-indigo-600/15 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.03]"
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
        <div className="grid grid-cols-3 gap-3">
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
