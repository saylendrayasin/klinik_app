"use client";

import { useId, useState } from "react";
import ConfirmModal from "@/components/ConfirmModal";

/**
 * Pilihan status sebuah catatan (kehamilan, persalinan). Setiap perubahan
 * dikonfirmasi dulu — satu sentuhan tak sengaja pada "keguguran" atau
 * "meninggal" langsung mengubah daftar dan dasbor — dan tombol dikunci
 * selama permintaan berjalan agar tidak terkirim berulang.
 * `onUbah(status)` menangani toast & error-nya sendiri.
 */
export default function KartuStatus({ judul = "Status", nilai, pilihan, onUbah }) {
  const id = useId();
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const konfirmasi = async () => {
    setBusy(true);
    try {
      await onUbah(target);
    } finally {
      setBusy(false);
      setTarget(null);
    }
  };

  return (
    <section aria-labelledby={id} className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-900/[0.03] p-5 sm:p-6">
      <h2 id={id} className="font-bold text-slate-800">{judul}</h2>
      <p className="text-sm text-slate-500">Status menentukan di mana catatan ini muncul pada daftar dan dasbor</p>
      <div role="group" aria-labelledby={id} className="flex flex-wrap gap-2 mt-4">
        {pilihan.map((s) => {
          const aktif = nilai === s;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={aktif}
              disabled={busy}
              onClick={() => !aktif && setTarget(s)}
              className={`min-h-11 lg:min-h-9 px-4 rounded-xl text-sm font-semibold capitalize border transition active:scale-[0.98] disabled:opacity-60 ${
                aktif
                  ? "bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-600/20 cursor-default"
                  : "bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50"
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>

      <ConfirmModal
        open={!!target}
        onClose={() => !busy && setTarget(null)}
        onConfirm={konfirmasi}
        loading={busy}
        title="Ubah Status"
        message={`Ubah status dari "${nilai}" menjadi "${target}"? Status bisa diubah kembali kapan saja.`}
        confirmLabel="Ya, Ubah Status"
      />
    </section>
  );
}
