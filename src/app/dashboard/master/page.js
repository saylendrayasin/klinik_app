"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Database, Hash, Stamp, Stethoscope, UserRoundPen } from "lucide-react";
import TabBar from "@/components/TabBar";
import TabDiagnosis from "@/components/master/TabDiagnosis";
import TabPenandatangan from "@/components/master/TabPenandatangan";
import TabKop from "@/components/master/TabKop";
import TabPenomoran from "@/components/master/TabPenomoran";

const TABS = [
  { key: "diagnosis", label: "Diagnosis", icon: <Stethoscope size={15} />, Isi: TabDiagnosis },
  { key: "penandatangan", label: "Penanda Tangan", icon: <UserRoundPen size={15} />, Isi: TabPenandatangan },
  { key: "kop", label: "Kop & Cap", icon: <Stamp size={15} />, Isi: TabKop },
  { key: "penomoran", label: "Penomoran", icon: <Hash size={15} />, Isi: TabPenomoran },
];

function MasterData() {
  const router = useRouter();
  const pathname = usePathname();
  const kunci = useSearchParams().get("tab"); // hook di luar find(): jumlah panggilan harus tetap
  const tab = TABS.find((t) => t.key === kunci) || TABS[0];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center shadow-md shadow-brand-600/25 shrink-0">
          <Database size={17} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800 leading-tight">Master Data</h1>
          <p className="text-slate-500 text-sm mt-0.5">Diagnosis, penanda tangan, kop & cap, dan penomoran surat</p>
        </div>
      </div>
      {/* Tab tersimpan di URL: bisa ditautkan langsung dan tombol kembali bekerja wajar. */}
      <TabBar
        tabs={TABS}
        active={tab.key}
        onChange={(k) => router.replace(`${pathname}?tab=${k}`, { scroll: false })}
        label="Bagian master data"
      />
      <div role="tabpanel" aria-label={tab.label}>
        <tab.Isi />
      </div>
    </div>
  );
}

export default function MasterDataPage() {
  return (
    <Suspense>
      <MasterData />
    </Suspense>
  );
}
