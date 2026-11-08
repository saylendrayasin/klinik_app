"use client";

import { useState, useSyncExternalStore } from "react";
import { FileText, PenLine } from "lucide-react";
import PreviewSurat from "@/components/PreviewSurat";

const XL = "(min-width: 1280px)";
const langganXl = (cb) => {
  const mq = window.matchMedia(XL);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/**
 * Susunan form + pratinjau yang menyesuaikan layar.
 *
 *  ≥ xl (laptop/desktop): dua kolom; pratinjau menempel di kanan setinggi
 *                         layar dan menampilkan satu lembar utuh selama
 *                         form di kiri digulir
 *  < xl (tablet & HP)   : tab "Isi Data" / "Pratinjau"
 *
 * Form tidak di-unmount saat tab berpindah (hanya disembunyikan), sehingga
 * isian dan posisi kursor tidak hilang saat pengguna bolak-balik melihat hasil.
 */
export default function LayoutFormPratinjau({ pratinjau, children }) {
  const [tab, setTab] = useState("form");
  const lebar = useSyncExternalStore(langganXl, () => window.matchMedia(XL).matches, () => false);

  return (
    <div className="space-y-3">
      {/* Pemilih tab — hanya di bawah xl */}
      <div className="xl:hidden sticky top-0 z-20 py-2 bg-slate-50/95 backdrop-blur-sm">
        <div className="flex gap-1 bg-slate-200/70 p-1 rounded-xl">
          <TabBtn aktif={tab === "form"} onClick={() => setTab("form")} ikon={<PenLine size={14} />}>
            Isi Data
          </TabBtn>
          <TabBtn aktif={tab === "pratinjau"} onClick={() => setTab("pratinjau")} ikon={<FileText size={14} />}>
            Pratinjau Surat
          </TabBtn>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-4 xl:gap-6">
        <div className={`min-w-0 ${tab === "form" ? "space-y-4" : "hidden xl:block xl:space-y-4"}`}>
          {children}
        </div>

        {/* sticky di item grid itu sendiri (self-start): tingginya = baris
            grid setinggi form, jadi pratinjau bisa ikut sepanjang form */}
        <div className={`min-w-0 xl:sticky xl:top-0 xl:self-start ${tab === "pratinjau" ? "" : "hidden xl:block"}`}>
          <PreviewSurat pasHalaman={lebar} className="xl:h-[calc(100dvh-4rem)]">
            {pratinjau}
          </PreviewSurat>
        </div>
      </div>
    </div>
  );
}

function TabBtn({ aktif, onClick, ikon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition ${
        aktif ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {ikon}
      {children}
    </button>
  );
}
