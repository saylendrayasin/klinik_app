"use client";

import { useState } from "react";
import { fetcher } from "@/lib/fetcher";
import toast from "react-hot-toast";
import { FaEdit } from "react-icons/fa";
import { AlertTriangle, Check, Minus } from "lucide-react";
import Field from "@/components/Field";
import { FormEdit, BagianForm } from "@/components/HalamanForm";

const JENIS_KELAMIN_LABEL = {
  "laki-laki": "Laki-laki",
  perempuan: "Perempuan",
  tidak_diketahui: "Tidak Diketahui",
};

const KONDISI_BAYI_LABEL = {
  hidup: "Hidup",
  meninggal: "Meninggal",
  iufd: "IUFD",
};

function buildFormFromBayi(b) {
  return {
    jenisKelamin: b.jenisKelamin || "tidak_diketahui",
    beratLahir: b.beratLahir ?? "",
    panjangBadan: b.panjangBadan ?? "",
    lingkarKepala: b.lingkarKepala ?? "",
    lingkarDada: b.lingkarDada ?? "",
    nilaiApgar1: b.nilaiApgar1 ?? "",
    nilaiApgar5: b.nilaiApgar5 ?? "",
    nilaiApgar10: b.nilaiApgar10 ?? "",
    kondisiBayi: b.kondisiBayi || "hidup",
    komplikasiBayi: b.komplikasiBayi || "",
    tindakanBayi: b.tindakanBayi || "",
    imd: b.imd ?? false,
    resusitasi: b.resusitasi ?? false,
    injeksiVitaminK: b.injeksiVitaminK ?? false,
    salepMata: b.salepMata ?? false,
    imunisasiHB0: b.imunisasiHB0 ?? false,
  };
}

export default function PersalinanBayiTab({ persalinan, onRefresh }) {
  const b = persalinan.bayi || {};
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(buildFormFromBayi(b));

  const isBBLR = b.beratLahir != null && b.beratLahir < 2500;
  const isApgarLow = b.nilaiApgar5 != null && b.nilaiApgar5 < 7;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleCancel = () => {
    setForm(buildFormFromBayi(b));
    setEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Menyimpan data bayi...");
    try {
      const payload = {
        ...form,
        beratLahir: form.beratLahir !== "" ? Number(form.beratLahir) : undefined,
        panjangBadan: form.panjangBadan !== "" ? Number(form.panjangBadan) : undefined,
        lingkarKepala: form.lingkarKepala !== "" ? Number(form.lingkarKepala) : undefined,
        lingkarDada: form.lingkarDada !== "" ? Number(form.lingkarDada) : undefined,
        nilaiApgar1: form.nilaiApgar1 !== "" ? Number(form.nilaiApgar1) : undefined,
        nilaiApgar5: form.nilaiApgar5 !== "" ? Number(form.nilaiApgar5) : undefined,
        nilaiApgar10: form.nilaiApgar10 !== "" ? Number(form.nilaiApgar10) : undefined,
      };
      await fetcher(`/api/persalinan/${persalinan._id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "updateBayi", bayi: payload }),
      });
      await onRefresh();
      toast.success("Data bayi berhasil disimpan", { id: toastId });
      setEditing(false);
    } catch (err) {
      toast.error(err?.message || "Gagal menyimpan", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (!editing) {
    return (
      <div className="space-y-4">
        {(isBBLR || isApgarLow) && (
          <div className="space-y-2" role="status">
            {isBBLR && (
              <Peringatan>Bayi BBLR — berat lahir {b.beratLahir} gram, pantau kondisi bayi</Peringatan>
            )}
            {isApgarLow && (
              <Peringatan>Nilai Apgar 5 menit: {b.nilaiApgar5} — evaluasi kondisi neonatus</Peringatan>
            )}
          </div>
        )}

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-900/[0.03] divide-y divide-slate-100">
          <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4">
            <h2 className="font-bold text-slate-800">Data Bayi</h2>
            <button
              type="button"
              onClick={() => { setForm(buildFormFromBayi(b)); setEditing(true); }}
              className="inline-flex items-center gap-2 min-h-11 lg:min-h-9 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition active:scale-[0.98] shadow-sm shadow-brand-600/20"
            >
              <FaEdit aria-hidden="true" /> Edit Data Bayi
            </button>
          </div>

          <div className="px-5 sm:px-6 py-5 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
            <InfoRow label="Jenis Kelamin" value={JENIS_KELAMIN_LABEL[b.jenisKelamin] || "-"} />
            <InfoRow label="Kondisi Bayi" value={KONDISI_BAYI_LABEL[b.kondisiBayi] || "-"} />
            <InfoRow
              label="Berat Lahir"
              value={b.beratLahir != null ? `${b.beratLahir} gram` : "-"}
              highlight={isBBLR ? "text-red-600 font-bold" : ""}
            />
            <InfoRow label="Panjang Badan" value={b.panjangBadan != null ? `${b.panjangBadan} cm` : "-"} />
            <InfoRow label="Lingkar Kepala" value={b.lingkarKepala != null ? `${b.lingkarKepala} cm` : "-"} />
            <InfoRow label="Lingkar Dada" value={b.lingkarDada != null ? `${b.lingkarDada} cm` : "-"} />
          </div>

          <div className="px-5 sm:px-6 py-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Nilai Apgar</p>
            <div className="flex gap-6">
              <ApgarBadge label="1 menit" value={b.nilaiApgar1} />
              <ApgarBadge label="5 menit" value={b.nilaiApgar5} />
              <ApgarBadge label="10 menit" value={b.nilaiApgar10} />
            </div>
          </div>

          <div className="px-5 sm:px-6 py-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Asuhan Bayi Baru Lahir</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <CheckBadge label="IMD" done={b.imd} />
              <CheckBadge label="Vitamin K1" done={b.injeksiVitaminK} />
              <CheckBadge label="Salep Mata" done={b.salepMata} />
              <CheckBadge label="Imunisasi HB0" done={b.imunisasiHB0} />
              <CheckBadge label="Resusitasi" done={b.resusitasi} />
            </div>
          </div>

          {(b.komplikasiBayi || b.tindakanBayi) && (
            <div className="px-5 sm:px-6 py-5 space-y-3">
              {b.komplikasiBayi && <InfoRow label="Komplikasi" value={b.komplikasiBayi} />}
              {b.tindakanBayi && <InfoRow label="Tindakan Bayi" value={b.tindakanBayi} />}
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div>
      <FormEdit
        onSubmit={handleSubmit}
        busy={loading}
        onBatal={handleCancel}
        labelBatal="Batal"
        labelSimpan="Simpan Data Bayi"
      >
        <BagianForm no={1} judul="Identitas & Kondisi">
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-4">
            <Field label="Jenis Kelamin">
              <select name="jenisKelamin" value={form.jenisKelamin} onChange={handleChange} className="field">
                <option value="tidak_diketahui">Tidak Diketahui</option>
                <option value="laki-laki">Laki-laki</option>
                <option value="perempuan">Perempuan</option>
              </select>
            </Field>
            <Field label="Kondisi Bayi">
              <select name="kondisiBayi" value={form.kondisiBayi} onChange={handleChange} className="field">
                <option value="hidup">Hidup</option>
                <option value="meninggal">Meninggal</option>
                <option value="iufd">IUFD</option>
              </select>
            </Field>
          </div>
        </BagianForm>

        <BagianForm no={2} judul="Antropometri" ket="Berat di bawah 2.500 gram ditandai BBLR">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Berat Lahir (gram)">
              <input name="beratLahir" type="number" inputMode="numeric" min="0" value={form.beratLahir} onChange={handleChange} placeholder="3200" className="field" />
            </Field>
            <Field label="Panjang Badan (cm)">
              <input name="panjangBadan" type="number" inputMode="decimal" step="0.1" min="0" value={form.panjangBadan} onChange={handleChange} placeholder="50" className="field" />
            </Field>
            <Field label="Lingkar Kepala (cm)">
              <input name="lingkarKepala" type="number" inputMode="decimal" step="0.1" min="0" value={form.lingkarKepala} onChange={handleChange} placeholder="34" className="field" />
            </Field>
            <Field label="Lingkar Dada (cm)">
              <input name="lingkarDada" type="number" inputMode="decimal" step="0.1" min="0" value={form.lingkarDada} onChange={handleChange} placeholder="33" className="field" />
            </Field>
          </div>
        </BagianForm>

        <BagianForm no={3} judul="Nilai Apgar" ket="Skor 0–10; di bawah 7 pada menit ke-5 perlu evaluasi">
          <div className="grid grid-cols-3 gap-3">
            <Field label="1 Menit">
              <input name="nilaiApgar1" type="number" inputMode="numeric" min="0" max="10" value={form.nilaiApgar1} onChange={handleChange} placeholder="0–10" className="field" />
            </Field>
            <Field label="5 Menit">
              <input name="nilaiApgar5" type="number" inputMode="numeric" min="0" max="10" value={form.nilaiApgar5} onChange={handleChange} placeholder="0–10" className="field" />
            </Field>
            <Field label="10 Menit">
              <input name="nilaiApgar10" type="number" inputMode="numeric" min="0" max="10" value={form.nilaiApgar10} onChange={handleChange} placeholder="0–10" className="field" />
            </Field>
          </div>
        </BagianForm>

        <BagianForm no={4} judul="Asuhan Bayi Baru Lahir">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <CheckInput name="imd" checked={form.imd} onChange={handleChange} label="Inisiasi Menyusu Dini (IMD)" />
            <CheckInput name="injeksiVitaminK" checked={form.injeksiVitaminK} onChange={handleChange} label="Injeksi Vitamin K1" />
            <CheckInput name="salepMata" checked={form.salepMata} onChange={handleChange} label="Salep/Tetes Mata" />
            <CheckInput name="imunisasiHB0" checked={form.imunisasiHB0} onChange={handleChange} label="Imunisasi HB0" />
            <CheckInput name="resusitasi" checked={form.resusitasi} onChange={handleChange} label="Resusitasi dilakukan" />
          </div>
        </BagianForm>

        <BagianForm no={5} judul="Komplikasi & Tindakan">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Komplikasi Bayi">
              <textarea name="komplikasiBayi" value={form.komplikasiBayi} onChange={handleChange} rows={2} className="field resize-none" />
            </Field>
            <Field label="Tindakan Bayi">
              <textarea name="tindakanBayi" value={form.tindakanBayi} onChange={handleChange} rows={2} className="field resize-none" />
            </Field>
          </div>
        </BagianForm>
      </FormEdit>
    </div>
  );
}

function Peringatan({ children }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-medium bg-red-50 border border-red-200 text-red-800">
      <AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

function InfoRow({ label, value, highlight = "" }) {
  return (
    <div>
      <span className="text-xs text-slate-500 uppercase tracking-wide">{label}</span>
      <p className={`font-medium text-slate-800 ${highlight}`}>{value || "-"}</p>
    </div>
  );
}

function CheckBadge({ label, done }) {
  return (
    <div
      className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl border ${
        done ? "bg-brand-50 border-brand-200 text-brand-700" : "bg-slate-50 border-slate-200 text-slate-500"
      }`}
    >
      {done ? <Check size={15} aria-hidden="true" /> : <Minus size={15} aria-hidden="true" />}
      <span className="font-medium">{label}</span>
      <span className="sr-only">{done ? "sudah" : "belum"}</span>
    </div>
  );
}

function CheckInput({ name, checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 min-h-11 px-3 rounded-xl border border-slate-200 hover:border-brand-200 hover:bg-brand-50/50 has-[:checked]:border-brand-300 has-[:checked]:bg-brand-50 cursor-pointer select-none transition">
      <input
        name={name}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded accent-brand-600 shrink-0"
      />
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </label>
  );
}

function ApgarBadge({ label, value }) {
  const low = value != null && value < 7;
  return (
    <div className="text-center">
      <div
        className={`w-11 h-11 rounded-full mx-auto flex items-center justify-center font-bold text-base border-2 ${
          value == null
            ? "border-slate-200 text-slate-400"
            : low
            ? "border-red-400 bg-red-50 text-red-700"
            : "border-brand-400 bg-brand-50 text-brand-700"
        }`}
      >
        {value ?? "—"}
      </div>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}
