"use client";

import { useState, useEffect, useMemo } from "react";
import KbEditForm from "./kbEditForm";
import CalendarKb from "./CalendarKb";
import KbVisitsTab from "./KbVisitTab";
import { FaCalendarAlt, FaEdit, FaListUl } from "react-icons/fa";
import { useRouter, useParams } from "next/navigation";
import DetailHeader from "@/components/DetailHeader";
import TabBar from "@/components/TabBar";
import { fetcher } from "@/lib/fetcher";
import { SkeletonKartu } from "@/components/Skeleton";
import { TidakDitemukan } from "@/components/KeadaanKosong";
import ConfirmModal from "@/components/ConfirmModal";

function formDari(data) {
  return {
    name: data?.name || "",
    dateOfBirth: data?.dateOfBirth ? new Date(data.dateOfBirth).toISOString().slice(0, 10) : "",
    address: data?.address || "",
    nik: data?.nik || "",
    numberOfChildren: data?.numberOfChildren || 0,
  };
}

function umurDari(tgl) {
  if (!tgl) return null;
  const lahir = new Date(tgl);
  const kini = new Date();
  let umur = kini.getFullYear() - lahir.getFullYear();
  const belumUltah =
    kini.getMonth() < lahir.getMonth() ||
    (kini.getMonth() === lahir.getMonth() && kini.getDate() < lahir.getDate());
  if (belumUltah) umur--;
  return Number.isFinite(umur) ? umur : null;
}

export default function KbEditPage() {
  const router = useRouter();
  const params = useParams();
  const [activeTab, setActiveTab] = useState("calendar");
  const [loading, setLoading] = useState(true);

  const [kb, setKb] = useState(null);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [form, setForm] = useState(formDari(null));

  // Sama seperti Pasien & Kehamilan: jangan biarkan ketikan hilang tanpa peringatan.
  const savedForm = useMemo(() => formDari(kb), [kb]);
  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(savedForm), [form, savedForm]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const fetchKb = async () => {
    try {
      const { data } = await fetcher(`/api/kb/${params.id}`);
      setKb(data);
      setForm(formDari(data));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params?.id) fetchKb();
  }, [params.id]);

  return (
    <div className="max-w-4xl mx-auto">
      <DetailHeader
        onBack={() => isDirty ? setBackConfirmOpen(true) : router.push("/dashboard/kb")}
        loading={loading}
        title={kb?.name}
        badge={kb?.metodes?.length > 0 && (
          <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-100 text-brand-700">
            {kb.metodes[kb.metodes.length - 1]}
          </span>
        )}
        meta={kb ? [
          kb.nik && <>NIK: {kb.nik}</>,
          umurDari(kb.dateOfBirth) != null && <>Umur: <strong className="text-slate-700">{umurDari(kb.dateOfBirth)} tahun</strong></>,
          <>Anak: <strong className="text-slate-700">{kb.numberOfChildren || 0}</strong></>,
          <>Kunjungan: <strong className="text-slate-700">{kb.visits?.length || 0}x</strong></>,
        ] : []}
      />

      <TabBar
        tabs={[
          { key: "calendar", label: "Kalender", icon: <FaCalendarAlt /> },
          { key: "data", label: "Edit Data", icon: <FaEdit /> },
          { key: "visits", label: "Kunjungan", icon: <FaListUl /> },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      <div key={activeTab} className="anim-masuk">
        {loading ? (
          <SkeletonKartu />
        ) : !kb ? (
          <TidakDitemukan kembaliKe="/dashboard/kb" judul="Data KB tidak ditemukan" />
        ) : activeTab === "calendar" ? (
          <CalendarKb kb={kb} />
        ) : activeTab === "data" ? (
          <KbEditForm
            kb={kb}
            form={form}
            setForm={setForm}
            onRefresh={fetchKb}
            dirty={isDirty}
            onReset={() => setForm(savedForm)}
          />
        ) : (
          <KbVisitsTab kb={kb} onRefresh={fetchKb} />
        )}
      </div>

      <ConfirmModal
        open={backConfirmOpen}
        onClose={() => setBackConfirmOpen(false)}
        onConfirm={() => router.push("/dashboard/kb")}
        title="Perubahan Belum Disimpan"
        message="Ada perubahan yang belum disimpan. Keluar halaman ini akan membatalkan semua perubahan."
        confirmLabel="Keluar Tanpa Simpan"
      />
    </div>
  );
}
