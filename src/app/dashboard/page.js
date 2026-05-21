"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FaUsers, FaHeartbeat, FaBaby, FaChevronRight } from "react-icons/fa";
import { Settings2 } from "lucide-react";
import { fetcher } from "@/lib/fetcher";

const modules = [
  {
    href: "/dashboard/patients",
    icon: FaUsers,
    label: "Pasien",
    description: "Kelola data pasien dan riwayat kunjungan pemeriksaan",
    color: "blue",
    iconBg: "bg-blue-600",
    cardBg: "bg-blue-50 hover:bg-blue-100/70",
    border: "border-blue-200",
    text: "text-blue-700",
    sub: "text-blue-500",
  },
  {
    href: "/dashboard/kb",
    icon: FaHeartbeat,
    label: "KB",
    description: "Data keluarga berencana dan kunjungan akseptor KB",
    color: "purple",
    iconBg: "bg-purple-600",
    cardBg: "bg-purple-50 hover:bg-purple-100/70",
    border: "border-purple-200",
    text: "text-purple-700",
    sub: "text-purple-500",
  },
  {
    href: "/dashboard/kehamilan",
    icon: FaBaby,
    label: "Kehamilan",
    description: "Monitoring ANC, jadwal kunjungan, dan HPL ibu hamil",
    color: "rose",
    iconBg: "bg-rose-600",
    cardBg: "bg-rose-50 hover:bg-rose-100/70",
    border: "border-rose-200",
    text: "text-rose-700",
    sub: "text-rose-500",
  },
  {
    href: "/dashboard/config",
    icon: Settings2,
    label: "Konfigurasi",
    description: "Master data diagnosis dan kode referensi sistem",
    color: "slate",
    iconBg: "bg-slate-600",
    cardBg: "bg-slate-50 hover:bg-slate-100/70",
    border: "border-slate-200",
    text: "text-slate-700",
    sub: "text-slate-500",
  },
];

const statCards = [
  {
    key: "patients",
    icon: FaUsers,
    label: "Pasien",
    colorClass: "bg-blue-50 border-blue-200 text-blue-700",
    href: "/dashboard/patients",
  },
  {
    key: "kb",
    icon: FaHeartbeat,
    label: "KB",
    colorClass: "bg-purple-50 border-purple-200 text-purple-700",
    href: "/dashboard/kb",
  },
  {
    key: "kehamilan",
    icon: FaBaby,
    label: "Kehamilan",
    colorClass: "bg-rose-50 border-rose-200 text-rose-700",
    href: "/dashboard/kehamilan",
  },
];

function StatCard({ icon: Icon, label, value, colorClass, href }) {
  return (
    <Link
      href={href}
      className={`group flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl border text-center transition-all duration-150 hover:shadow-md ${colorClass}`}
    >
      <Icon size={16} className="opacity-70" />
      {value !== null ? (
        <p className="text-2xl font-bold leading-none font-mono">{value}</p>
      ) : (
        <div className="h-6 w-8 rounded bg-current opacity-10 animate-pulse" />
      )}
      <p className="text-xs font-medium opacity-60 leading-tight">{label}</p>
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
    <div className="sm:p-8 max-w-7xl mx-auto space-y-5">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #3b82f6 0%, transparent 60%)" }}
        />
        <div className="relative px-5 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{dateText}</p>
            <h1 className="text-white text-xl font-bold">{greeting} 👋</h1>
            <p className="text-slate-400 text-sm mt-0.5">Sistem Manajemen Klinik Iya</p>
          </div>
          <div className="shrink-0 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-right backdrop-blur-sm">
            <p className="text-slate-400 text-xs">Waktu sekarang</p>
            <p className="text-white text-2xl font-bold tracking-tight font-mono">{timeText}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {statCards.map((s) => (
          <StatCard
            key={s.key}
            icon={s.icon}
            label={s.label}
            value={stats[s.key]}
            colorClass={s.colorClass}
            href={s.href}
          />
        ))}
      </div>

      {/* Module grid */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-0.5">Modul Aktif</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.href}
                href={m.href}
                className={`group flex items-center gap-4 p-4 rounded-xl border transition-all duration-150 ${m.cardBg} ${m.border} hover:shadow-md`}
              >
                <div className={`${m.iconBg} text-white w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm`}>
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`font-bold text-sm ${m.text}`}>{m.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-1">{m.description}</p>
                </div>
                <FaChevronRight className={`shrink-0 text-xs ${m.sub} transition-transform duration-150 group-hover:translate-x-0.5`} />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
