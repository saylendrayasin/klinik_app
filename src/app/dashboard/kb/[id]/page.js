"use client";

import { useState, useEffect } from "react";
import KbEditForm from "./kbEditForm";
import CalendarKb from "./CalendarKb";
import { FaArrowLeft, FaCalendarAlt, FaEdit } from "react-icons/fa";
import { useRouter, useParams } from "next/navigation";
import { fetcher } from "@/lib/fetcher";

export default function KbEditPage() {
  const router = useRouter();
  const params = useParams();
  const [activeTab, setActiveTab] = useState("calendar");
  const [loading, setLoading] = useState(true);

  const [kb, setKb] = useState(null);
  const [form, setForm] = useState({
    name: "",
    dateOfBirth: "",
    address: "",
    nik: "",
    numberOfChildren: 0,
  });

  const fetchKb = async () => {
    try {
      const { data } = await fetcher(`/api/kb/${params.id}`);
      setKb(data);
      setForm({
        name: data.name || "",
        dateOfBirth: data.dateOfBirth
          ? new Date(data.dateOfBirth).toISOString().slice(0, 10)
          : "",
        address: data.address || "",
        nik: data.nik || "",
        numberOfChildren: data.numberOfChildren || 0,
      });
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
      <div className="flex justify-start mb-4">
        <button
          onClick={() => router.push("/dashboard/kb")}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-800"
        >
          <FaArrowLeft /> Kembali
        </button>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("calendar")}
          className={`flex items-center gap-2 px-4 py-2 font-semibold text-sm rounded-t-md transition-all duration-150 ${
            activeTab === "calendar"
              ? "bg-purple-100 text-purple-700 border-b-2 border-purple-600"
              : "text-gray-600 hover:text-purple-600"
          }`}
        >
          <FaCalendarAlt /> Kalender
        </button>
        <button
          onClick={() => setActiveTab("data")}
          className={`flex items-center gap-2 px-4 py-2 font-semibold text-sm rounded-t-md transition-all duration-150 ${
            activeTab === "data"
              ? "bg-purple-100 text-purple-700 border-b-2 border-purple-600"
              : "text-gray-600 hover:text-purple-600"
          }`}
        >
          <FaEdit /> Edit Data
        </button>
      </div>

      <div>
        {loading ? (
          <div className="flex justify-center items-center h-60">
            <div className="w-8 h-8 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
          </div>
        ) : !kb ? (
          <div className="text-center text-red-500">
            Data KB tidak ditemukan.
          </div>
        ) : activeTab === "calendar" ? (
          <CalendarKb kb={kb} />
        ) : (
          <KbEditForm
            kb={kb}
            form={form}
            setForm={setForm}
            onRefresh={fetchKb}
          />
        )}
      </div>
    </div>
  );
}
