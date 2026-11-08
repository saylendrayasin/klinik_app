"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import { PenLine, Pencil, Power, Trash2, UserRoundPen } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { urlGambar } from "@/lib/suratView";
import Modal, { btnBatal, btnUtama, Spinner } from "@/components/Modal";
import ConfirmModal from "@/components/ConfirmModal";
import KeadaanKosong from "@/components/KeadaanKosong";
import { SkeletonKartu } from "@/components/Skeleton";
import SignaturePad from "@/components/SignaturePad";
import Field from "@/components/Field";
import { Segmen } from "@/components/surat/FormKit";
import UnggahGambar from "@/components/master/UnggahGambar";

const JABATAN = [["Dokter", "Dokter"], ["Bidan", "Bidan"], ["Perawat", "Perawat"]];

/**
 * Master petugas penanda tangan surat. Mengganti TTD membuat versi gambar
 * baru — surat yang sudah terbit tetap memakai versi lamanya.
 */
export default function TabPenandatangan() {
  const [list, setList] = useState(null);
  const [edit, setEdit] = useState(null); // null | {} (baru) | petugas
  const [konfirmasi, setKonfirmasi] = useState(null); // { aksi: "aktif"|"hapus", p }
  const [busy, setBusy] = useState(false);
  const [segar, setSegar] = useState(0);

  useEffect(() => {
    fetcher("/api/master/penandatangan")
      .then((r) => setList(r.data || []))
      .catch(() => { setList([]); toast.error("Gagal memuat penanda tangan"); });
  }, [segar]);

  const jalankan = async () => {
    const { aksi, p } = konfirmasi;
    setBusy(true);
    try {
      const res = aksi === "hapus"
        ? await fetcher(`/api/master/penandatangan/${p._id}`, { method: "DELETE" })
        : await fetcher(`/api/master/penandatangan/${p._id}`, { method: "PATCH", body: JSON.stringify({ aktif: !p.aktif }) });
      toast.success(res.message);
      setKonfirmasi(null);
      setSegar((n) => n + 1);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!list) return <SkeletonKartu baris={3} label="Memuat penanda tangan..." />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-slate-500">Dokter, bidan, dan perawat yang menandatangani surat. TTD tersimpan dipasang otomatis saat surat terbit.</p>
        <button
          type="button"
          onClick={() => setEdit({})}
          className="inline-flex items-center justify-center gap-2 min-h-11 bg-brand-700 hover:bg-brand-800 text-white font-semibold px-5 rounded-xl text-sm transition shadow-md shadow-brand-600/20 active:scale-95 shrink-0"
        >
          <FaPlus size={11} aria-hidden="true" /> Tambah Petugas
        </button>
      </div>

      {!list.length ? (
        <KeadaanKosong ikon={UserRoundPen} judul="Belum ada penanda tangan" ket="Tambahkan dokter, bidan, atau perawat beserta tanda tangannya." />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 anim-stagger">
          {list.map((p) => (
            <article key={p._id} className={`bg-white rounded-2xl border shadow-sm p-4 space-y-3 ${p.aktif ? "border-slate-200" : "border-slate-200 opacity-70"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-800 break-words">{p.nama}</h3>
                  <p className="text-sm text-slate-500">{p.jabatan}{p.nip ? ` · NIP ${p.nip}` : ""}</p>
                </div>
                <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${p.aktif ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                  {p.aktif ? "Aktif" : "Nonaktif"}
                </span>
              </div>
              <div className="h-20 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                {p.ttdId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={urlGambar(p.ttdId)} alt={`Tanda tangan ${p.nama}`} className="max-h-full max-w-full object-contain p-1" />
                ) : (
                  <span className="text-xs text-slate-500 flex items-center gap-1.5"><PenLine size={13} aria-hidden="true" /> Tanpa TTD — selalu tanda tangan basah</span>
                )}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEdit(p)} className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-11 rounded-xl text-sm font-semibold bg-brand-50 hover:bg-brand-100 text-brand-700 transition">
                  <Pencil size={14} aria-hidden="true" /> Edit
                </button>
                <button type="button" onClick={() => setKonfirmasi({ aksi: "aktif", p })} aria-label={`${p.aktif ? "Nonaktifkan" : "Aktifkan"} ${p.nama}`} title={p.aktif ? "Nonaktifkan" : "Aktifkan"} className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition">
                  <Power size={15} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => setKonfirmasi({ aksi: "hapus", p })} aria-label={`Hapus ${p.nama}`} title="Hapus" className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition">
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ModalPetugas data={edit} onClose={() => setEdit(null)} onTersimpan={() => { setEdit(null); setSegar((n) => n + 1); }} />

      <ConfirmModal
        open={!!konfirmasi}
        onClose={() => !busy && setKonfirmasi(null)}
        onConfirm={jalankan}
        loading={busy}
        title={konfirmasi?.aksi === "hapus" ? "Hapus Penanda Tangan" : konfirmasi?.p.aktif ? "Nonaktifkan Penanda Tangan" : "Aktifkan Penanda Tangan"}
        message={
          konfirmasi?.aksi === "hapus"
            ? `Hapus ${konfirmasi?.p.nama}? Petugas yang sudah menandatangani surat terbit tidak bisa dihapus — nonaktifkan saja.`
            : konfirmasi?.p.aktif
              ? `${konfirmasi?.p.nama} tidak akan muncul di pilihan surat baru. Surat yang sudah terbit tidak berubah.`
              : `${konfirmasi?.p.nama} akan muncul lagi di pilihan surat.`
        }
        confirmLabel={konfirmasi?.aksi === "hapus" ? "Ya, Hapus" : konfirmasi?.p.aktif ? "Ya, Nonaktifkan" : "Ya, Aktifkan"}
      />
    </div>
  );
}

function ModalPetugas({ data, onClose, onTersimpan }) {
  const baru = data && !data._id;
  const [form, setForm] = useState({ nama: "", jabatan: "Bidan", nip: "" });
  const [ttd, setTtd] = useState(undefined); // undefined = tidak diubah, null = dihapus, string = baru
  const [cara, setCara] = useState("unggah");
  const [busy, setBusy] = useState(false);

  // Isi ulang setiap kali modal dibuka untuk petugas lain.
  const [sebelumnya, setSebelumnya] = useState(null);
  if (data !== sebelumnya) {
    setSebelumnya(data);
    if (data) {
      setForm({ nama: data.nama || "", jabatan: data.jabatan || "Bidan", nip: data.nip || "" });
      setTtd(undefined);
      setCara("unggah");
    }
  }

  const srcTtd = ttd === undefined ? urlGambar(data?.ttdId) : ttd || "";

  const simpan = async (e) => {
    e.preventDefault();
    if (!form.nama.trim()) return toast.error("Nama wajib diisi");
    setBusy(true);
    try {
      const body = { ...form, ...(ttd !== undefined && { ttd }) };
      const res = baru
        ? await fetcher("/api/master/penandatangan", { method: "POST", body: JSON.stringify(body) })
        : await fetcher(`/api/master/penandatangan/${data._id}`, { method: "PATCH", body: JSON.stringify(body) });
      toast.success(res.message);
      onTersimpan();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={!!data}
      onClose={onClose}
      busy={busy}
      onSubmit={simpan}
      title={baru ? "Tambah Penanda Tangan" : "Edit Penanda Tangan"}
      ikon={<UserRoundPen size={18} aria-hidden="true" />}
      size="sm:max-w-xl"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={btnBatal}>Batal</button>
          <button type="submit" disabled={busy} className={btnUtama}>{busy ? <><Spinner /> Menyimpan...</> : "Simpan"}</button>
        </>
      }
    >
      <Field label="Nama & Gelar" required>
        <input value={form.nama} onChange={(e) => setForm((p) => ({ ...p, nama: e.target.value }))} placeholder="mis. Bdn. Samsia Rembang, S.ST" maxLength={100} className="field" />
      </Field>
      <Field label="Jabatan" required>
        <Segmen name="jabatan-petugas" value={form.jabatan} onChange={(v) => setForm((p) => ({ ...p, jabatan: v }))} opsi={JABATAN} />
      </Field>
      <Field label="NIP" ket="Opsional. Tercetak di bawah nama bila diisi.">
        <input value={form.nip} onChange={(e) => setForm((p) => ({ ...p, nip: e.target.value }))} inputMode="numeric" maxLength={40} className="field tabular-nums" />
      </Field>

      <div className="space-y-3 rounded-xl border border-slate-200 p-4">
        <Field label="Tanda tangan digital">
          <Segmen name="cara-ttd" value={cara} onChange={setCara} opsi={[["unggah", "Unggah gambar"], ["gores", "Gores di layar"]]} />
        </Field>
        {cara === "unggah" ? (
          <UnggahGambar
            label="Gambar tanda tangan"
            ket="Sebaiknya PNG berlatar transparan. Mengganti TTD tidak mengubah surat yang sudah terbit."
            src={srcTtd}
            onPilih={setTtd}
            onHapus={() => setTtd(null)}
            labelHapus="Tanpa TTD"
          />
        ) : (
          <SignaturePad onChange={(v) => setTtd(v || undefined)} tinggi={180} />
        )}
      </div>
    </Modal>
  );
}
