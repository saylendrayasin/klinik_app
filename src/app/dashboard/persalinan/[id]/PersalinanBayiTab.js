"use client";

import { useState } from "react";
import { fetcher } from "@/lib/fetcher";
import toast from "react-hot-toast";
import { FaEdit, FaSpinner, FaSave, FaTimes } from "react-icons/fa";

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
      <div className="max-w-2xl mx-auto space-y-4">
        {(isBBLR || isApgarLow) && (
          <div className="space-y-2">
            {isBBLR && (
              <div className="rounded-lg px-4 py-2.5 text-sm bg-red-50 border border-red-200 text-red-800">
                ⚠️ Bayi BBLR — berat lahir {b.beratLahir} gram, pantau kondisi bayi
              </div>
            )}
            {isApgarLow && (
              <div className="rounded-lg px-4 py-2.5 text-sm bg-red-50 border border-red-200 text-red-800">
                ⚠️ Nilai Apgar 5 menit: {b.nilaiApgar5} — evaluasi kondisi neonatus
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg border shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Data Bayi</h3>
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition"
            >
              <FaEdit /> Edit
            </button>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <InfoRow label="Jenis Kelamin" value={JENIS_KELAMIN_LABEL[b.jenisKelamin] || "-"} />
            <InfoRow label="Kondisi Bayi" value={KONDISI_BAYI_LABEL[b.kondisiBayi] || "-"} />
            <InfoRow
              label="Berat Lahir"
              value={b.beratLahir != null ? `${b.beratLahir} gram` : "-"}
              highlight={isBBLR ? "text-red-600 font-bold" : ""}
            />
            <InfoRow
              label="Panjang Badan"
              value={b.panjangBadan != null ? `${b.panjangBadan} cm` : "-"}
            />
            <InfoRow
              label="Lingkar Kepala"
              value={b.lingkarKepala != null ? `${b.lingkarKepala} cm` : "-"}
            />
            <InfoRow
              label="Lingkar Dada"
              value={b.lingkarDada != null ? `${b.lingkarDada} cm` : "-"}
            />
          </div>

          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Nilai Apgar
            </p>
            <div className="flex gap-6">
              <ApgarBadge label="1 menit" value={b.nilaiApgar1} />
              <ApgarBadge label="5 menit" value={b.nilaiApgar5} />
              <ApgarBadge label="10 menit" value={b.nilaiApgar10} />
            </div>
          </div>

          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Asuhan Bayi Baru Lahir
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <CheckBadge label="IMD" done={b.imd} />
              <CheckBadge label="Vitamin K1" done={b.injeksiVitaminK} />
              <CheckBadge label="Salep Mata" done={b.salepMata} />
              <CheckBadge label="Imunisasi HB0" done={b.imunisasiHB0} />
              <CheckBadge label="Resusitasi" done={b.resusitasi} />
            </div>
          </div>

          {(b.komplikasiBayi || b.tindakanBayi) && (
            <div className="border-t pt-3 space-y-3">
              {b.komplikasiBayi && <InfoRow label="Komplikasi" value={b.komplikasiBayi} />}
              {b.tindakanBayi && <InfoRow label="Tindakan Bayi" value={b.tindakanBayi} />}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border shadow-sm p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Edit Data Bayi</h3>
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition"
          >
            <FaTimes /> Batal
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Jenis Kelamin">
            <select name="jenisKelamin" value={form.jenisKelamin} onChange={handleChange} className="input-em">
              <option value="tidak_diketahui">Tidak Diketahui</option>
              <option value="laki-laki">Laki-laki</option>
              <option value="perempuan">Perempuan</option>
            </select>
          </Field>
          <Field label="Kondisi Bayi">
            <select name="kondisiBayi" value={form.kondisiBayi} onChange={handleChange} className="input-em">
              <option value="hidup">Hidup</option>
              <option value="meninggal">Meninggal</option>
              <option value="iufd">IUFD</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Berat Lahir (gram)">
            <input name="beratLahir" type="number" min="0" value={form.beratLahir} onChange={handleChange} placeholder="3200" className="input-em" />
          </Field>
          <Field label="Panjang Badan (cm)">
            <input name="panjangBadan" type="number" step="0.1" min="0" value={form.panjangBadan} onChange={handleChange} placeholder="50" className="input-em" />
          </Field>
          <Field label="Lingkar Kepala (cm)">
            <input name="lingkarKepala" type="number" step="0.1" min="0" value={form.lingkarKepala} onChange={handleChange} placeholder="34" className="input-em" />
          </Field>
          <Field label="Lingkar Dada (cm)">
            <input name="lingkarDada" type="number" step="0.1" min="0" value={form.lingkarDada} onChange={handleChange} placeholder="33" className="input-em" />
          </Field>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Nilai Apgar</p>
          <div className="grid grid-cols-3 gap-3">
            <Field label="1 Menit">
              <input name="nilaiApgar1" type="number" min="0" max="10" value={form.nilaiApgar1} onChange={handleChange} placeholder="0–10" className="input-em" />
            </Field>
            <Field label="5 Menit">
              <input name="nilaiApgar5" type="number" min="0" max="10" value={form.nilaiApgar5} onChange={handleChange} placeholder="0–10" className="input-em" />
            </Field>
            <Field label="10 Menit">
              <input name="nilaiApgar10" type="number" min="0" max="10" value={form.nilaiApgar10} onChange={handleChange} placeholder="0–10" className="input-em" />
            </Field>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Asuhan Bayi Baru Lahir</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-emerald-50/50 border border-emerald-100 rounded-md p-3">
            <CheckInput name="imd" checked={form.imd} onChange={handleChange} label="Inisiasi Menyusu Dini (IMD)" />
            <CheckInput name="injeksiVitaminK" checked={form.injeksiVitaminK} onChange={handleChange} label="Injeksi Vitamin K1" />
            <CheckInput name="salepMata" checked={form.salepMata} onChange={handleChange} label="Salep/Tetes Mata" />
            <CheckInput name="imunisasiHB0" checked={form.imunisasiHB0} onChange={handleChange} label="Imunisasi HB0" />
            <CheckInput name="resusitasi" checked={form.resusitasi} onChange={handleChange} label="Resusitasi dilakukan" />
          </div>
        </div>

        <Field label="Komplikasi Bayi">
          <textarea name="komplikasiBayi" value={form.komplikasiBayi} onChange={handleChange} rows={2} className="input-em resize-none" />
        </Field>

        <Field label="Tindakan Bayi">
          <textarea name="tindakanBayi" value={form.tindakanBayi} onChange={handleChange} rows={2} className="input-em resize-none" />
        </Field>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-md transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><FaSpinner className="animate-spin" /> Menyimpan...</>
          ) : (
            <><FaSave /> Simpan Data Bayi</>
          )}
        </button>
      </form>

      <style jsx>{`
        .input-em {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          outline: none;
        }
        .input-em:focus {
          border-color: #34d399;
          box-shadow: 0 0 0 2px rgba(52, 211, 153, 0.3);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function InfoRow({ label, value, highlight = "" }) {
  return (
    <div>
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <p className={`font-medium text-gray-800 ${highlight}`}>{value || "-"}</p>
    </div>
  );
}

function CheckBadge({ label, done }) {
  return (
    <div
      className={`flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-md border ${
        done
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-gray-50 border-gray-200 text-gray-400"
      }`}
    >
      <span className="font-bold">{done ? "✓" : "—"}</span>
      <span className="font-medium">{label}</span>
    </div>
  );
}

function CheckInput({ name, checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <input
        name={name}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded accent-emerald-600 shrink-0"
      />
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
  );
}

function ApgarBadge({ label, value }) {
  const low = value != null && value < 7;
  return (
    <div className="text-center">
      <div
        className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center font-bold text-base border-2 ${
          value == null
            ? "border-gray-200 text-gray-300"
            : low
            ? "border-red-400 bg-red-50 text-red-700"
            : "border-emerald-400 bg-emerald-50 text-emerald-700"
        }`}
      >
        {value ?? "—"}
      </div>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
