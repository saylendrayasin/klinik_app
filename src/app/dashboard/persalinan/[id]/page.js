"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetcher } from "@/lib/fetcher";
import PersalinanEditForm from "./PersalinanEditForm";
import PersalinanBayiTab from "./PersalinanBayiTab";
import PersalinanVisitTab from "./PersalinanVisitTab";
import CalendarPersalinan from "./CalendarPersalinan";
import { FaArrowLeft, FaCalendarAlt, FaEdit, FaBaby, FaListUl, FaHistory } from "react-icons/fa";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const KF_SCHEDULE = [
  { kf: 1, windowStart: 0, windowEnd: 2, label: "KF1" },
  { kf: 2, windowStart: 3, windowEnd: 7, label: "KF2" },
  { kf: 3, windowStart: 8, windowEnd: 28, label: "KF3" },
  { kf: 4, windowStart: 29, windowEnd: 42, label: "KF4" },
];

function fmtDate(d) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("id-ID");
  } catch {
    return "-";
  }
}

function getAlerts(doc) {
  if (!doc) return [];
  const alerts = [];

  if (!doc.tanggalPersalinan && doc.status === "terdaftar") {
    alerts.push({ type: "yellow", msg: "ℹ️ Ibu terdaftar, data persalinan belum dilengkapi" });
  }

  if (doc.bayi?.beratLahir != null && doc.bayi.beratLahir < 2500) {
    alerts.push({ type: "red", msg: `⚠️ Bayi BBLR — berat lahir ${doc.bayi.beratLahir} gram, pantau kondisi bayi` });
  }

  if (doc.bayi?.nilaiApgar5 != null && doc.bayi.nilaiApgar5 < 7) {
    alerts.push({ type: "red", msg: `⚠️ Nilai Apgar 5 menit ${doc.bayi.nilaiApgar5} — evaluasi kondisi neonatus` });
  }

  if (doc.pendarahan != null && doc.pendarahan > 500) {
    alerts.push({ type: "red", msg: `⚠️ Perdarahan banyak ${doc.pendarahan} mL — pantau kondisi ibu` });
  }

  if (doc.komplikasiIbu) {
    alerts.push({ type: "red", msg: `⚠️ Tercatat komplikasi ibu: ${doc.komplikasiIbu}` });
  }

  if (doc.bayi?.kondisiBayi === "hidup") {
    const profilaksisKurang = [];
    if (!doc.bayi.injeksiVitaminK) profilaksisKurang.push("Injeksi Vitamin K1");
    if (!doc.bayi.imunisasiHB0) profilaksisKurang.push("Imunisasi HB0");
    if (!doc.bayi.salepMata) profilaksisKurang.push("Salep mata");
    if (profilaksisKurang.length > 0) {
      alerts.push({
        type: "yellow",
        msg: `⚠️ Asuhan BBL belum lengkap: ${profilaksisKurang.join(", ")} belum tercatat`,
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
        alerts.push({ type: "yellow", msg: `⚠️ Jadwal kunjungan nifas ${missedKF.label} belum terpenuhi` });
      }
    }

    if (hariToday > 42 && doc.status === "aktif") {
      alerts.push({ type: "yellow", msg: "⚠️ Masa nifas >42 hari — perbarui status persalinan" });
    }
  }

  return alerts;
}

const ALERT_STYLE = {
  red: "bg-red-50 border border-red-200 text-red-800",
  yellow: "bg-yellow-50 border border-yellow-200 text-yellow-800",
};

const STATUS_BADGE = {
  terdaftar: "bg-blue-100 text-blue-700",
  aktif: "bg-emerald-100 text-emerald-700",
  selesai: "bg-green-100 text-green-700",
  rujuk: "bg-amber-100 text-amber-700",
  meninggal: "bg-gray-100 text-gray-600",
};

function RiwayatPersalinan({ records }) {
  const router = useRouter();
  if (records.length === 0) return null;
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">Persalinan lain dengan NIK yang sama:</p>
      {records.map((r) => (
        <button
          key={r._id}
          onClick={() => router.push(`/dashboard/persalinan/${r._id}`)}
          className="w-full bg-white border rounded-lg p-4 text-left hover:shadow-md hover:border-emerald-300 transition"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 text-sm">
                {r.tanggalPersalinan
                  ? new Date(r.tanggalPersalinan).toLocaleDateString("id-ID")
                  : "Belum bersalin"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                G{r.gravida || 0}P{r.para || 0}A{r.abortus || 0}
                {" "}&bull;{" "}
                {r.visits?.length || 0} kunjungan nifas
                {r.bayi?.beratLahir ? ` · BB bayi ${r.bayi.beratLahir} g` : ""}
              </p>
            </div>
            <span
              className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[r.status] || "bg-gray-100 text-gray-600"}`}
            >
              {r.status}
            </span>
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

      if (res.data?.nik) {
        try {
          const others = await fetcher(`/api/persalinan?nik=${encodeURIComponent(res.data.nik)}`);
          setOtherRecords((others.data || []).filter((r) => r._id !== res.data._id));
        } catch {
          // tidak kritis
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
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
      {/* Back */}
      <div className="flex justify-start mb-4">
        <button
          onClick={() => router.push("/dashboard/persalinan")}
          className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800 font-medium text-sm"
        >
          <FaArrowLeft /> Kembali
        </button>
      </div>

      {/* Info header */}
      {doc && !loading && (
        <div className="bg-white border rounded-lg shadow-sm px-4 py-3 mb-4">
          <div className="flex items-center gap-2 mb-1 min-w-0">
            <h2 className="font-bold text-gray-800 text-base truncate flex-1 min-w-0">{doc.name}</h2>
            <span className={`shrink-0 capitalize text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[doc.status] || "bg-gray-100 text-gray-600"}`}>
              {doc.status}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
            <span>NIK: {doc.nik}</span>
            <span>G{doc.gravida || 0}P{doc.para || 0}A{doc.abortus || 0}</span>
            {doc.tanggalPersalinan ? (
              <span>Tgl Salin: <strong className="text-gray-700">{fmtDate(doc.tanggalPersalinan)}</strong></span>
            ) : (
              <span className="text-amber-600 font-medium">Belum bersalin</span>
            )}
            <span>{doc.visits?.length || 0} kunjungan nifas</span>
          </div>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2 mb-4">
          {alerts.map((a, i) => (
            <div key={i} className={`rounded-lg px-4 py-2.5 text-sm ${ALERT_STYLE[a.type]}`}>
              {a.msg}
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 font-semibold text-xs sm:text-sm whitespace-nowrap rounded-t-md transition-all ${
              activeTab === key
                ? "bg-emerald-100 text-emerald-700 border-b-2 border-emerald-600"
                : "text-gray-600 hover:text-emerald-600"
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {loading ? (
          <div className="flex justify-center items-center h-60">
            <div className="w-8 h-8 border-4 border-emerald-500 border-dashed rounded-full animate-spin" />
          </div>
        ) : !doc ? (
          <div className="text-center text-red-500">Data tidak ditemukan.</div>
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
