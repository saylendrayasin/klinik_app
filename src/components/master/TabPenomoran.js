"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { contohNomor, validatePola, POLA_BAWAAN } from "@/lib/nomorSurat";
import { FormEdit, BagianForm } from "@/components/HalamanForm";
import Field from "@/components/Field";
import { SkeletonKartu } from "@/components/Skeleton";
import PolaNomor from "@/components/master/PolaNomor";

const JENIS = [
  ["consent", "Persetujuan Tindakan"],
  ["sakit", "Surat Keterangan Sakit"],
];
const RESET = [
  ["tahunan", "Setiap tahun"],
  ["bulanan", "Setiap bulan"],
  ["tidak_pernah", "Tidak pernah"],
];

/**
 * Pola nomor tiap jenis surat. Nomor diberikan saat surat terbit, tidak
 * pernah dipakai ulang, dan urutannya hanya bisa dimajukan.
 */
export default function TabPenomoran() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  const pakai = (d) => {
    setData(d);
    setForm(Object.fromEntries(JENIS.map(([j]) => [j, { ...d.penomoran[j], urut: "" }])));
  };

  useEffect(() => {
    fetcher("/api/master/surat").then((r) => pakai(r.data)).catch(() => toast.error("Gagal memuat penomoran"));
  }, []);

  if (!form) return <SkeletonKartu baris={4} label="Memuat penomoran..." />;

  const galat = Object.fromEntries(JENIS.map(([j]) => [j, validatePola(form[j].pola, form[j].reset)]));
  const dirty = JENIS.some(([j]) => form[j].pola !== data.penomoran[j].pola || form[j].reset !== data.penomoran[j].reset || form[j].urut !== "");
  const ubah = (j, k, v) => setForm((p) => ({ ...p, [j]: { ...p[j], [k]: v } }));

  const simpan = async (e) => {
    e.preventDefault();
    if (JENIS.some(([j]) => galat[j].length)) return toast.error("Perbaiki pola nomor yang belum valid");
    setBusy(true);
    try {
      const body = {
        penomoran: Object.fromEntries(JENIS.map(([j]) => [j, { pola: form[j].pola, reset: form[j].reset }])),
        urutBerikutnya: Object.fromEntries(JENIS.map(([j]) => [j, form[j].urut])),
      };
      const res = await fetcher("/api/master/surat", { method: "PATCH", body: JSON.stringify(body) });
      pakai(res.data);
      toast.success("Penomoran tersimpan");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormEdit onSubmit={simpan} busy={busy} dirty={dirty} onBatal={() => pakai(data)}>
      {JENIS.map(([j, nama], i) => {
        const b = data.berikutnya[j];
        return (
          <BagianForm key={j} no={i + 1} judul={nama} ket={`Berikutnya: ${b.nomor}`}>
            <div className="grid sm:grid-cols-[1fr_12rem] gap-4 items-start">
              <Field label="Pola nomor" required>
                <PolaNomor
                  value={form[j].pola}
                  onChange={(v) => ubah(j, "pola", v)}
                  polaBawaan={POLA_BAWAAN[j]}
                  invalid={galat[j].length > 0}
                  hasil={
                    galat[j].length ? (
                      <p role="alert" className="flex gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden="true" /> {galat[j].join(" ")}
                      </p>
                    ) : (
                      <p aria-live="polite" className="text-sm text-slate-600 bg-brand-50/60 border border-brand-100 rounded-xl px-3.5 py-2.5">
                        Hasil: <b className="tabular-nums text-slate-800">{[1, 2].map((n) => contohNomor(form[j].pola, n)).join(", ")} …</b>
                      </p>
                    )
                  }
                />
              </Field>
              <Field label="Nomor urut diulang">
                <select value={form[j].reset} onChange={(e) => ubah(j, "reset", e.target.value)} className="field">
                  {RESET.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Lanjutkan dari nomor urut" ket={`Opsional, mis. melanjutkan buku nomor manual. Minimal ${b.urut}; tidak bisa dimundurkan.`}>
              <input type="number" min={b.urut} value={form[j].urut} onChange={(e) => ubah(j, "urut", e.target.value)} placeholder={String(b.urut)} inputMode="numeric" className="field tabular-nums sm:max-w-48" />
            </Field>
          </BagianForm>
        );
      })}
    </FormEdit>
  );
}
