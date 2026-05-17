"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetcher } from "@/lib/fetcher";
import KehamilanEditForm from "./kehamilanEditForm";
import CalendarKehamilan from "./CalendarKehamilan";
import KehamilanVisitTab from "./KehamilanVisitTab";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaEdit,
  FaListUl,
  FaBaby,
} from "react-icons/fa";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function fmtDate(d) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("id-ID");
  } catch {
    return "-";
  }
}

function getAlerts(kehamilan) {
  if (!kehamilan) return [];
  const today = new Date();
  const hpl = kehamilan.hpl ? new Date(kehamilan.hpl) : null;
  const alerts = [];

  if (hpl && today > hpl && kehamilan.status === "aktif") {
    alerts.push({ type: "red", msg: "⚠️ HPL sudah terlewat — pertimbangkan update status kehamilan" });
  }

  const sorted = [...(kehamilan.visits || [])].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  const lastVisit = sorted[0];

  if (lastVisit) {
    const uk = kehamilan.hpht
      ? Math.floor((today - new Date(kehamilan.hpht)) / (7 * MS_PER_DAY))
      : null;

    if (uk != null && uk > 40) {
      alerts.push({ type: "red", msg: `⚠️ Usia kehamilan sudah ${uk} minggu (>40 minggu)` });
    }

    const isTD =
      lastVisit.tekananDarahSistol >= 140 || lastVisit.tekananDarahDiastol >= 90;
    if (isTD) {
      alerts.push({
        type: "red",
        msg: `⚠️ TD terakhir ${lastVisit.tekananDarahSistol}/${lastVisit.tekananDarahDiastol} — perhatikan risiko preeklampsia`,
      });
    }

    if (lastVisit.jadwalBerikutnya && new Date(lastVisit.jadwalBerikutnya) < today) {
      const daysLate = Math.floor(
        (today - new Date(lastVisit.jadwalBerikutnya)) / MS_PER_DAY
      );
      alerts.push({
        type: "yellow",
        msg: `⚠️ Jadwal kunjungan ${fmtDate(lastVisit.jadwalBerikutnya)} belum terpenuhi (${daysLate} hari lalu)`,
      });
    }
  } else if (kehamilan.status === "aktif") {
    alerts.push({ type: "yellow", msg: "⚠️ Belum ada kunjungan ANC yang tercatat" });
  }

  return alerts;
}

const ALERT_STYLE = {
  red: "bg-red-50 border border-red-200 text-red-800",
  yellow: "bg-yellow-50 border border-yellow-200 text-yellow-800",
};

export default function KehamilanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [kehamilan, setKehamilan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("calendar");
  const [otherRecords, setOtherRecords] = useState([]);

  const [form, setForm] = useState({
    name: "",
    nik: "",
    dateOfBirth: "",
    address: "",
    phone: "",
    bloodType: "",
    gravida: 1,
    para: 0,
    abortus: 0,
    hpht: "",
  });

  const fetchData = async () => {
    try {
      const { data } = await fetcher(`/api/kehamilan/${params.id}`);
      setKehamilan(data);
      setForm({
        name: data.name || "",
        nik: data.nik || "",
        dateOfBirth: data.dateOfBirth
          ? new Date(data.dateOfBirth).toISOString().slice(0, 10)
          : "",
        address: data.address || "",
        phone: data.phone || "",
        bloodType: data.bloodType || "",
        gravida: data.gravida ?? 1,
        para: data.para ?? 0,
        abortus: data.abortus ?? 0,
        hpht: data.hpht
          ? new Date(data.hpht).toISOString().slice(0, 10)
          : "",
      });

      // Cek kehamilan lain dengan NIK yang sama
      if (data.nik) {
        try {
          const others = await fetcher(`/api/kehamilan?nik=${encodeURIComponent(data.nik)}&limit=50`);
          setOtherRecords(
            (others.data || []).filter((r) => r._id !== data._id)
          );
        } catch {
          // Tidak kritis
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

  const alerts = getAlerts(kehamilan);
  const today = new Date();
  const ukNow =
    kehamilan?.hpht
      ? Math.floor((today - new Date(kehamilan.hpht)) / (7 * MS_PER_DAY))
      : null;

  const tabs = [
    { key: "calendar", label: "Kalender", icon: <FaCalendarAlt /> },
    { key: "data", label: "Edit Data", icon: <FaEdit /> },
    { key: "visits", label: "Kunjungan", icon: <FaListUl /> },
    ...(otherRecords.length > 0
      ? [{ key: "others", label: `Kehamilan Lain (${otherRecords.length})`, icon: <FaBaby /> }]
      : []),
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back */}
      <div className="flex justify-start mb-4">
        <button
          onClick={() => router.push("/dashboard/kehamilan")}
          className="flex items-center gap-2 text-rose-600 hover:text-rose-800 font-medium text-sm"
        >
          <FaArrowLeft /> Kembali
        </button>
      </div>

      {/* Info header */}
      {kehamilan && !loading && (
        <div className="bg-white border rounded-lg shadow-sm px-4 py-3 mb-4">
          <div className="flex items-center gap-2 mb-1 min-w-0">
            <h2 className="font-bold text-gray-800 text-base truncate flex-1 min-w-0">
              {kehamilan.name}
            </h2>
            <span className={`shrink-0 capitalize text-xs font-semibold px-2 py-0.5 rounded-full ${
              kehamilan.status === "aktif" ? "bg-rose-100 text-rose-700" :
              kehamilan.status === "selesai" ? "bg-green-100 text-green-700" :
              kehamilan.status === "keguguran" ? "bg-gray-100 text-gray-600" :
              "bg-amber-100 text-amber-700"
            }`}>
              {kehamilan.status}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
            <span>NIK: {kehamilan.nik}</span>
            <span>G{kehamilan.gravida || 0}P{kehamilan.para || 0}A{kehamilan.abortus || 0}</span>
            <span>HPL: <strong className="text-gray-700">{fmtDate(kehamilan.hpl)}</strong></span>
            {ukNow != null && (
              <span className="text-rose-700 font-semibold">UK: {ukNow} minggu</span>
            )}
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
                ? "bg-rose-100 text-rose-700 border-b-2 border-rose-600"
                : "text-gray-600 hover:text-rose-600"
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
            <div className="w-8 h-8 border-4 border-rose-500 border-dashed rounded-full animate-spin" />
          </div>
        ) : !kehamilan ? (
          <div className="text-center text-red-500">Data tidak ditemukan.</div>
        ) : activeTab === "calendar" ? (
          <CalendarKehamilan kehamilan={kehamilan} />
        ) : activeTab === "data" ? (
          <KehamilanEditForm
            kehamilan={kehamilan}
            form={form}
            setForm={setForm}
            onRefresh={fetchData}
          />
        ) : activeTab === "visits" ? (
          <KehamilanVisitTab kehamilan={kehamilan} onRefresh={fetchData} />
        ) : activeTab === "others" ? (
          <OtherRecords records={otherRecords} />
        ) : null}
      </div>
    </div>
  );
}

function OtherRecords({ records }) {
  const router = useRouter();
  if (records.length === 0) return null;
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">Kehamilan lain dengan NIK yang sama:</p>
      {records.map((r) => (
        <button
          key={r._id}
          onClick={() => router.push(`/dashboard/kehamilan/${r._id}`)}
          className="w-full bg-white border rounded-lg p-4 text-left hover:shadow-md hover:border-rose-300 transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800 text-sm">
                HPHT: {r.hpht ? new Date(r.hpht).toLocaleDateString("id-ID") : "-"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                HPL: {r.hpl ? new Date(r.hpl).toLocaleDateString("id-ID") : "-"} &bull;{" "}
                {r.visits?.length || 0} kunjungan
              </p>
            </div>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                r.status === "aktif" ? "bg-rose-100 text-rose-700" :
                r.status === "selesai" ? "bg-green-100 text-green-700" :
                r.status === "keguguran" ? "bg-gray-100 text-gray-600" :
                "bg-amber-100 text-amber-700"
              }`}
            >
              {r.status}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
