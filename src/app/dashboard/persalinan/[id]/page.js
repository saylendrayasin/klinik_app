"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DetailHeader from "@/components/DetailHeader";
import TabBar from "@/components/TabBar";
import { fetcher } from "@/lib/fetcher";
import PersalinanEditForm from "./PersalinanEditForm";
import PersalinanBayiTab from "./PersalinanBayiTab";
import PersalinanVisitTab from "./PersalinanVisitTab";
import CalendarPersalinan from "./CalendarPersalinan";
import { FaCalendarAlt, FaEdit, FaBaby, FaListUl, FaHistory } from "react-icons/fa";
import { tanggalSingkat as fmtDate } from "@/lib/tanggal";
import { SkeletonKartu } from "@/components/Skeleton";
import { TidakDitemukan } from "@/components/KeadaanKosong";
import { AlertTriangle, ChevronRight, Info } from "lucide-react";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const KF_SCHEDULE = [
  { kf: 1, windowStart: 0, windowEnd: 2, label: "KF1" },
  { kf: 2, windowStart: 3, windowEnd: 7, label: "KF2" },
  { kf: 3, windowStart: 8, windowEnd: 28, label: "KF3" },
  { kf: 4, windowStart: 29, windowEnd: 42, label: "KF4" },
];

function getAlerts(doc) {
  if (!doc) return [];
  const alerts = [];

  if (!doc.tanggalPersalinan && doc.status === "terdaftar") {
    alerts.push({ type: "yellow", msg: "Ibu terdaftar, data persalinan belum dilengkapi", info: true });
  }

  if (doc.bayi?.beratLahir != null && doc.bayi.beratLahir < 2500) {
    alerts.push({ type: "red", msg: `Bayi BBLR — berat lahir ${doc.bayi.beratLahir} gram, pantau kondisi bayi` });
  }

  if (doc.bayi?.nilaiApgar5 != null && doc.bayi.nilaiApgar5 < 7) {
    alerts.push({ type: "red", msg: `Nilai Apgar 5 menit ${doc.bayi.nilaiApgar5} — evaluasi kondisi neonatus` });
  }

  if (doc.pendarahan != null && doc.pendarahan > 500) {
    alerts.push({ type: "red", msg: `Perdarahan banyak ${doc.pendarahan} mL — pantau kondisi ibu` });
  }

  if (doc.komplikasiIbu) {
    alerts.push({ type: "red", msg: `Tercatat komplikasi ibu: ${doc.komplikasiIbu}` });
  }

  if (doc.bayi?.kondisiBayi === "hidup") {
    const profilaksisKurang = [];
    if (!doc.bayi.injeksiVitaminK) profilaksisKurang.push("Injeksi Vitamin K1");
    if (!doc.bayi.imunisasiHB0) profilaksisKurang.push("Imunisasi HB0");
    if (!doc.bayi.salepMata) profilaksisKurang.push("Salep mata");
    if (profilaksisKurang.length > 0) {
      alerts.push({
        type: "yellow",
        msg: `Asuhan BBL belum lengkap: ${profilaksisKurang.join(", ")} belum tercatat`,
      });
    }
  }

  if (doc.tanggalPersalinan) {
    const today = new Date();
    const hariToday = Math.floor((today - new Date(doc.tanggalPersalinan)) / MS_PER_DAY);

    if (doc.status === "aktif" && hariToday >= 0) {
      const missedKF = KF_SCHEDULE.find((s) => {
        if (hariToday <= s.windowEnd) return false;
        const hasVisit = (doc.visits || []).some((v) => {
          const vh = Math.floor((new Date(v.date) - new Date(doc.tanggalPersalinan)) / MS_PER_DAY);
          return vh >= s.windowStart && vh <= s.windowEnd;
        });
        return !hasVisit;
      });
      if (missedKF) {
        alerts.push({ type: "yellow", msg: `Jadwal kunjungan nifas ${missedKF.label} belum terpenuhi` });
      }
    }

    if (hariToday > 42 && doc.status === "aktif") {
      alerts.push({ type: "yellow", msg: "Masa nifas >42 hari — perbarui status persalinan" });
    }
  }

  return alerts;
}

const ALERT_STYLE = {
  red: "bg-red-50 border border-red-200 text-red-800",
  yellow: "bg-yellow-50 border border-yellow-200 text-yellow-800",
};

const STATUS_BADGE = {
  terdaftar: "bg-slate-100 text-slate-600",
  aktif: "bg-brand-100 text-brand-700",
  selesai: "bg-green-100 text-green-700",
  rujuk: "bg-amber-100 text-amber-700",
  meninggal: "bg-slate-100 text-slate-600",
};

function RiwayatPersalinan({ records }) {
  const router = useRouter();
  if (records.length === 0) return null;
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">Persalinan lain dengan NIK yang sama</p>
      {records.map((r) => (
        <button
          key={r._id}
          onClick={() => router.push(`/dashboard/persalinan/${r._id}`)}
          className="group w-full bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm shadow-slate-900/[0.03] hover:shadow-md hover:shadow-brand-900/5 hover:border-brand-200 transition active:scale-[0.99]"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-800 text-sm">
                {r.tanggalPersalinan
                  ? fmtDate(r.tanggalPersalinan)
                  : "Belum bersalin"}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                G{r.gravida || 0}P{r.para || 0}A{r.abortus || 0}
                {" "}&bull;{" "}
                {r.visits?.length || 0} kunjungan nifas
                {r.bayi?.beratLahir ? ` · BB bayi ${r.bayi.beratLahir} g` : ""}
              </p>
            </div>
            <span
              className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[r.status] || "bg-slate-100 text-slate-600"}`}
            >
              {r.status}
            </span>
            <ChevronRight size={16} className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" aria-hidden="true" />
          </div>
        </button>
      ))}
    </div>
  );
}

export default function PersalinanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("calendar");
  const [otherRecords, setOtherRecords] = useState([]);

  const fetchData = async () => {
    try {
      const res = await fetcher(`/api/persalinan/${params.id}`);
      setDoc(res.data);
      setLoading(false);

      if (res.data?.nik) {
        fetcher(`/api/persalinan?nik=${encodeURIComponent(res.data.nik)}`)
          .then((others) => setOtherRecords((others.data || []).filter((r) => r._id !== res.data._id)))
          .catch(() => {});
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params?.id) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const alerts = getAlerts(doc);

  const tabs = [
    { key: "calendar", label: "Kalender", icon: <FaCalendarAlt /> },
    { key: "data", label: "Edit Data", icon: <FaEdit /> },
    { key: "bayi", label: "Data Bayi", icon: <FaBaby /> },
    { key: "visits", label: "Kunjungan Nifas", icon: <FaListUl /> },
    ...(otherRecords.length > 0
      ? [{ key: "riwayat", label: `Persalinan Lain (${otherRecords.length})`, icon: <FaHistory /> }]
      : []),
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <DetailHeader
        onBack={() => router.push("/dashboard/persalinan")}
        loading={loading}
        title={doc?.name}
        badge={doc && (
          <span className={`shrink-0 capitalize text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[doc.status] || "bg-slate-100 text-slate-600"}`}>
            {doc.status}
          </span>
        )}
        meta={doc ? [
          <>NIK: {doc.nik}</>,
          <>G{doc.gravida || 0}P{doc.para || 0}A{doc.abortus || 0}</>,
          doc.tanggalPersalinan
            ? <>Tgl Salin: <strong className="text-slate-700">{fmtDate(doc.tanggalPersalinan)}</strong></>
            : <span className="text-amber-700 font-medium">Belum bersalin</span>,
          <>{doc.visits?.length || 0} kunjungan nifas</>,
        ] : []}
      />

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2 mb-4" role="status">
          {alerts.map((a, i) => (
            <div key={i} className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-medium ${ALERT_STYLE[a.type]}`}>
              {a.info
                ? <Info size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
                : <AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />}
              <span>{a.msg}</span>
            </div>
          ))}
        </div>
      )}

      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      <div key={activeTab} className="anim-masuk">
        {loading ? (
          <SkeletonKartu />
        ) : !doc ? (
          <TidakDitemukan kembaliKe="/dashboard/persalinan" judul="Data persalinan tidak ditemukan" />
        ) : activeTab === "calendar" ? (
          <CalendarPersalinan persalinan={doc} />
        ) : activeTab === "data" ? (
          <PersalinanEditForm persalinan={doc} onRefresh={fetchData} />
        ) : activeTab === "bayi" ? (
          <PersalinanBayiTab persalinan={doc} onRefresh={fetchData} />
        ) : activeTab === "visits" ? (
          <PersalinanVisitTab persalinan={doc} onRefresh={fetchData} />
        ) : activeTab === "riwayat" ? (
          <RiwayatPersalinan records={otherRecords} />
        ) : null}
      </div>
    </div>
  );
}
