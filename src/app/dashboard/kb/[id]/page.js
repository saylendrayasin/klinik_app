"use client";

import { useState } from "react";
import KbEditForm from "./kbEditForm";
import { FaArrowLeft, FaCalendarAlt, FaEdit } from "react-icons/fa";
import { useRouter } from "next/navigation";

export default function KbEditPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("calendar");

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
      {/* Tab Selector */}
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

      {/* Tab Content */}
      <div>
        {activeTab === "calendar" ? (
          <div className="text-center text-gray-500 text-sm">
            (Tampilan kalender kunjungan akan ditambahkan di sini)
          </div>
        ) : (
          <KbEditForm />
        )}
      </div>
    </div>
  );
}
