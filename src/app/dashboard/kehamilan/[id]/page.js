"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import DetailHeader from "@/components/DetailHeader";
import TabBar from "@/components/TabBar";
import { fetcher } from "@/lib/fetcher";
import KehamilanEditForm from "./kehamilanEditForm";
import ConfirmModal from "@/components/ConfirmModal";
import CalendarKehamilan from "./CalendarKehamilan";
import KehamilanVisitTab from "./KehamilanVisitTab";
import {
  FaCalendarAlt,
  FaEdit,
  FaListUl,
  FaBaby,
} from "react-icons/fa";
import { tanggalSingkat as fmtDate } from "@/lib/tanggal";
import { SkeletonKartu } from "@/components/Skeleton";
import { TidakDitemukan } from "@/components/KeadaanKosong";
import { AlertTriangle, ChevronRight } from "lucide-react";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getAlerts(kehamilan) {
  // Selesai/keguguran/rujuk tidak lagi dipantau di sini — sama dengan ringkasan di daftar.
  if (!kehamilan || kehamilan.status !== "aktif") return [];
  const today = new Date();
  const hpl = kehamilan.hpl ? new Date(kehamilan.hpl) : null;
  const alerts = [];

  if (hpl && today > hpl && kehamilan.status === "aktif") {
    alerts.push({ type: "red", msg: "HPL sudah terlewat — pertimbangkan update status kehamilan" });
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
      alerts.push({ type: "red", msg: `Usia kehamilan sudah ${uk} minggu (>40 minggu)` });
    }

    const isTD =
      lastVisit.tekananDarahSistol >= 140 || lastVisit.tekananDarahDiastol >= 90;
    if (isTD) {
      alerts.push({
        type: "red",
        msg: `TD terakhir ${lastVisit.tekananDarahSistol}/${lastVisit.tekananDarahDiastol} — perhatikan risiko preeklampsia`,
      });
    }

    if (lastVisit.jadwalBerikutnya && new Date(lastVisit.jadwalBerikutnya) < today) {
      const daysLate = Math.floor(
        (today - new Date(lastVisit.jadwalBerikutnya)) / MS_PER_DAY
      );
      alerts.push({
        type: "yellow",
        msg: `Jadwal kunjungan ${fmtDate(lastVisit.jadwalBerikutnya)} belum terpenuhi (${daysLate} hari lalu)`,
      });
    }
  } else if (kehamilan.status === "aktif") {
    alerts.push({ type: "yellow", msg: "Belum ada kunjungan ANC yang tercatat" });
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
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
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

  const savedForm = useMemo(() => ({
    name: kehamilan?.name || "",
    nik: kehamilan?.nik || "",
    dateOfBirth: kehamilan?.dateOfBirth ? new Date(kehamilan.dateOfBirth).toISOString().slice(0, 10) : "",
    address: kehamilan?.address || "",
    phone: kehamilan?.phone || "",
    bloodType: kehamilan?.bloodType || "",
    gravida: kehamilan?.gravida ?? 1,
    para: kehamilan?.para ?? 0,
    abortus: kehamilan?.abortus ?? 0,
    hpht: kehamilan?.hpht ? new Date(kehamilan.hpht).toISOString().slice(0, 10) : "",
  }), [kehamilan]);

  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(savedForm), [form, savedForm]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // `pertahankanForm`: dipakai saat status diubah — memuat ulang data tidak boleh
  // menimpa isian form Edit Data yang belum disimpan.
  const fetchData = async (pertahankanForm = false) => {
    try {
      const { data } = await fetcher(`/api/kehamilan/${params.id}`);
      setKehamilan(data);
      if (!pertahankanForm) setForm({
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

      setLoading(false);

      if (data.nik) {
        fetcher(`/api/kehamilan?nik=${encodeURIComponent(data.nik)}&limit=50`)
          .then((others) => setOtherRecords((others.data || []).filter((r) => r._id !== data._id)))
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

  const alerts = getAlerts(kehamilan);
  const today = new Date();
  const ukNow =
    kehamilan?.status === "aktif" && kehamilan.hpht
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
      <DetailHeader
        onBack={() => isDirty ? setBackConfirmOpen(true) : router.push("/dashboard/kehamilan")}
        loading={loading}
        title={kehamilan?.name}
        badge={kehamilan && (
          <span className={`shrink-0 capitalize text-xs font-semibold px-2.5 py-1 rounded-full ${
            kehamilan.status === "aktif" ? "bg-brand-100 text-brand-700" :
            kehamilan.status === "selesai" ? "bg-green-100 text-green-700" :
            kehamilan.status === "keguguran" ? "bg-slate-100 text-slate-600" :
            "bg-amber-100 text-amber-700"
          }`}>
            {kehamilan.status}
          </span>
        )}
        meta={kehamilan ? [
          <>NIK: {kehamilan.nik}</>,
          <>G{kehamilan.gravida || 0}P{kehamilan.para || 0}A{kehamilan.abortus || 0}</>,
          <>HPL: <strong className="text-slate-700">{fmtDate(kehamilan.hpl)}</strong></>,
          ukNow != null && <span className="text-brand-700 font-semibold">UK: {ukNow} minggu</span>,
        ] : []}
      />

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2 mb-4" role="status">
          {alerts.map((a, i) => (
            <div key={i} className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-medium ${ALERT_STYLE[a.type]}`}>
              <AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
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
        ) : !kehamilan ? (
          <TidakDitemukan kembaliKe="/dashboard/kehamilan" judul="Data kehamilan tidak ditemukan" />
        ) : activeTab === "calendar" ? (
          <CalendarKehamilan kehamilan={kehamilan} />
        ) : activeTab === "data" ? (
          <KehamilanEditForm
            kehamilan={kehamilan}
            form={form}
            setForm={setForm}
            onRefresh={fetchData}
            dirty={isDirty}
            onReset={() => setForm(savedForm)}
          />
        ) : activeTab === "visits" ? (
          <KehamilanVisitTab kehamilan={kehamilan} onRefresh={() => fetchData(true)} />
        ) : activeTab === "others" ? (
          <OtherRecords records={otherRecords} />
        ) : null}
      </div>

      <ConfirmModal
        open={backConfirmOpen}
        onClose={() => setBackConfirmOpen(false)}
        onConfirm={() => router.push("/dashboard/kehamilan")}
        title="Perubahan Belum Disimpan"
        message="Ada perubahan yang belum disimpan. Keluar halaman ini akan membatalkan semua perubahan."
        confirmLabel="Keluar Tanpa Simpan"
      />
    </div>
  );
}

function OtherRecords({ records }) {
  const router = useRouter();
  if (records.length === 0) return null;
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">Kehamilan lain dengan NIK yang sama</p>
      {records.map((r) => (
        <button
          key={r._id}
          onClick={() => router.push(`/dashboard/kehamilan/${r._id}`)}
          className="group w-full bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm shadow-slate-900/[0.03] hover:shadow-md hover:shadow-brand-900/5 hover:border-brand-200 transition active:scale-[0.99]"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-800 text-sm">
                HPHT: {r.hpht ? fmtDate(r.hpht) : "-"}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                HPL: {r.hpl ? fmtDate(r.hpl) : "-"} &bull;{" "}
                {r.visits?.length || 0} kunjungan
              </p>
            </div>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                r.status === "aktif" ? "bg-brand-100 text-brand-700" :
                r.status === "selesai" ? "bg-green-100 text-green-700" :
                r.status === "keguguran" ? "bg-slate-100 text-slate-600" :
                "bg-amber-100 text-amber-700"
              }`}
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
