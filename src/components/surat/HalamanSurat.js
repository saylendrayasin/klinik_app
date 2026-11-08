"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { FaFileSignature, FaFileMedical, FaPrint, FaTrash } from "react-icons/fa";
import { ArrowLeft, BadgeCheck, Lock, PenLine, Unlock } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { tanggalPanjang } from "@/lib/tanggal";
import { consentKeSurat, sakitKeSurat, timpaMaster } from "@/lib/suratView";
import Modal, { btnBatal, btnUtama, Spinner } from "@/components/Modal";
import ConfirmModal from "@/components/ConfirmModal";
import SignatureModal from "@/components/SignatureModal";
import LayoutFormPratinjau from "@/components/LayoutFormPratinjau";
import SuratConsent from "@/components/SuratConsent";
import SuratSakit from "@/components/SuratSakit";
import HapusSuratModal from "@/components/surat/HapusSuratModal";
import ConsentForm, { formConsentKosong, consentKeForm, penggores } from "@/components/surat/ConsentForm";
import SuratSakitForm, { formSakitKosong, sakitKeForm } from "@/components/surat/SuratSakitForm";
import { SkeletonHalaman } from "@/components/Skeleton";
import { TidakDitemukan } from "@/components/KeadaanKosong";

const JENIS = {
  consent: {
    api: "/api/consent",
    dasar: "/dashboard/consent",
    cetak: "/print/consent",
    nama: "Persetujuan Tindakan",
    ikon: FaFileSignature,
    Form: ConsentForm,
    Surat: SuratConsent,
    keSurat: consentKeSurat,
    kosong: formConsentKosong,
    keForm: consentKeForm,
    sub: (d) => [d.pembuat?.nama, d.tindakan].filter(Boolean).join(" · "),
    rincian: (d) => [["Yang menyatakan", d.pembuat?.nama], ["Tindakan", d.tindakan], ["Tanggal", tanggalPanjang(d.tanggalSurat)]],
    cekSimpan: (f) =>
      !f.pembuat.nama.trim() ? "Nama yang membuat pernyataan wajib diisi"
        : !f.tindakan.trim() ? "Tindakan medik wajib diisi"
          : null,
    cekTerbit: (f, gores) => {
      if (f.hubungan !== "diri_sendiri" && !f.pasien.nama.trim()) return "Nama pasien wajib diisi";
      if (!f.petugas.penandatanganId) return "Pilih petugas yang menjelaskan";
      const sk = f.saksiKlinik;
      if (sk.aktif && sk.dariMaster && !sk.penandatanganId) return "Pilih saksi dari klinik, atau ketik manual";
      if (sk.aktif && !sk.dariMaster && !sk.nama.trim()) return "Nama saksi dari klinik wajib diisi";
      if (f.saksiKeluarga.aktif && f.saksiKeluarga.mode === "gambar" && !f.saksiKeluarga.nama.trim()) {
        return "Nama saksi dari keluarga wajib diisi";
      }
      const kurang = penggores(f).find((g) => g.mode === "gambar" && !gores[g.kunci]);
      return kurang ? `Tanda tangan ${kurang.judul} belum digores` : null;
    },
  },
  sakit: {
    api: "/api/surat-sakit",
    dasar: "/dashboard/surat-sakit",
    cetak: "/print/surat-sakit",
    nama: "Surat Keterangan Sakit",
    ikon: FaFileMedical,
    Form: SuratSakitForm,
    Surat: SuratSakit,
    keSurat: sakitKeSurat,
    kosong: formSakitKosong,
    keForm: sakitKeForm,
    sub: (d) => [d.nama, d.lamaHari ? `${d.lamaHari} hari istirahat` : ""].filter(Boolean).join(" · "),
    rincian: (d) => [["Nama", d.nama], ["Istirahat", `${d.lamaHari} hari`], ["Tanggal", tanggalPanjang(d.tanggalSurat)]],
    cekSimpan: (f) =>
      !f.nama.trim() ? "Nama wajib diisi"
        : !f.mulai || !f.selesai ? "Tanggal istirahat wajib diisi"
          : f.selesai < f.mulai ? "Tanggal selesai tidak boleh sebelum tanggal mulai"
            : null,
    cekTerbit: (f) => (!f.pemeriksa.penandatanganId ? "Pilih pemeriksa" : null),
  },
};

const GORESAN_KOSONG = { pembuat: "", saksiKlinik: "", saksiKeluarga: "" };

/**
 * Halaman buat (id kosong) & detail satu surat: form + pratinjau A4,
 * simpan draf, terbitkan (nomor + TTD + cap), batal terbit, cetak, hapus.
 */
export default function HalamanSurat({ jenis, id = null }) {
  const cfg = JENIS[jenis];
  const router = useRouter();

  const [master, setMaster] = useState(null);
  const [saran, setSaran] = useState([]);
  const [doc, setDoc] = useState(null);
  const [form, setForm] = useState(null);
  const [awal, setAwal] = useState("");
  const [gagal, setGagal] = useState(false);
  const [sorot, setSorot] = useState(null);
  const [goresan, setGoresan] = useState(GORESAN_KOSONG);
  const [modalGores, setModalGores] = useState(null);
  const [modal, setModal] = useState(null); // "terbit" | "batal" | "hapus"
  const [busy, setBusy] = useState(null); // "simpan" | "terbit" | "batal" | "hapus"

  const pakaiDoc = (d) => {
    const f = cfg.keForm(d);
    setDoc(d);
    setForm(f);
    setAwal(JSON.stringify(f));
    setGoresan(GORESAN_KOSONG);
  };

  useEffect(() => {
    let hidup = true;
    (async () => {
      try {
        const [pengaturan, penandatangan, surat, tindakan] = await Promise.all([
          fetcher("/api/master/surat"),
          fetcher("/api/master/penandatangan"),
          id ? fetcher(`${cfg.api}/${id}`) : null,
          jenis === "consent" ? fetcher("/api/consent/tindakan").catch(() => null) : null,
        ]);
        if (!hidup) return;
        setMaster({ pengaturan: pengaturan.data, penandatangan: penandatangan.data || [] });
        setSaran(tindakan?.data || []);
        if (surat) pakaiDoc(surat.data);
        else {
          const f = cfg.kosong(penandatangan.data || []);
          setForm(f);
          setAwal(JSON.stringify(f));
        }
      } catch (e) {
        if (hidup) setGagal(true);
        toast.error(e?.message || "Gagal memuat surat");
      }
    })();
    return () => { hidup = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, jenis]);

  const terbit = doc?.status === "issued";
  const dirty = !!form && !terbit && JSON.stringify(form) !== awal;

  // Jangan biarkan ketikan hilang karena menutup tab / memuat ulang tanpa sengaja.
  useEffect(() => {
    if (!dirty) return;
    const tahan = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", tahan);
    return () => window.removeEventListener("beforeunload", tahan);
  }, [dirty]);

  const surat = useMemo(() => {
    if (!form || !master) return null;
    if (terbit) return cfg.keSurat(doc);
    const data = { ...form, nomorSurat: doc?.nomorSurat, status: "draft" };
    if (jenis === "consent") {
      data.ttdPembuat = { ...form.ttdPembuat, dataUrl: goresan.pembuat };
      data.saksiKlinik = { ...form.saksiKlinik, dataUrl: goresan.saksiKlinik };
      data.saksiKeluarga = { ...form.saksiKeluarga, dataUrl: goresan.saksiKeluarga };
    }
    return cfg.keSurat(timpaMaster(data, master));
  }, [form, master, doc, terbit, goresan, cfg, jenis]);

  const kirim = (body) => fetcher(`${cfg.api}/${doc._id}`, { method: "PATCH", body: JSON.stringify(body) });

  const simpan = async (e) => {
    e?.preventDefault();
    const salah = cfg.cekSimpan(form);
    if (salah) return toast.error(salah);
    setBusy("simpan");
    try {
      if (!doc) {
        const res = await fetcher(cfg.api, { method: "POST", body: JSON.stringify(form) });
        setAwal(JSON.stringify(form)); // lepas penjaga beforeunload sebelum pindah halaman
        toast.success("Draf tersimpan. Lanjutkan sampai terbit.");
        router.replace(`${cfg.dasar}/${res.data._id}`);
        return;
      }
      const res = await kirim({ action: "updateData", data: form });
      const g = goresan;
      pakaiDoc(res.data);
      setGoresan(g); // goresan belum terkirim tetap dipertahankan
      toast.success("Perubahan tersimpan");
    } catch (err) {
      toast.error(err?.message || "Gagal menyimpan");
    } finally {
      setBusy(null);
    }
  };

  const bukaTerbit = () => {
    const salah = cfg.cekSimpan(form) || cfg.cekTerbit(form, goresan);
    if (salah) return toast.error(salah);
    setModal("terbit");
  };

  const terbitkan = async () => {
    setBusy("terbit");
    try {
      // Simpan isi dulu, baru terbitkan — isi dan tanda tangan selalu sinkron.
      if (dirty) await kirim({ action: "updateData", data: form });
      const res = await kirim({ action: "issue", ttd: goresan });
      pakaiDoc(res.data);
      setModal(null);
      toast.success(res.message, { duration: 5000 });
    } catch (err) {
      toast.error(err?.message || "Gagal menerbitkan");
    } finally {
      setBusy(null);
    }
  };

  const batalTerbit = async () => {
    setBusy("batal");
    try {
      const res = await kirim({ action: "unissue" });
      pakaiDoc(res.data);
      setModal(null);
      toast.success(res.message);
    } catch (err) {
      toast.error(err?.message || "Gagal membatalkan terbit");
    } finally {
      setBusy(null);
    }
  };

  const hapus = async (konfirmasi) => {
    setBusy("hapus");
    try {
      const qs = konfirmasi ? `?konfirmasi=${encodeURIComponent(konfirmasi)}` : "";
      await fetcher(`${cfg.api}/${doc._id}${qs}`, { method: "DELETE" });
      setAwal(JSON.stringify(form));
      toast.success("Surat dihapus");
      router.push(cfg.dasar);
    } catch (err) {
      toast.error(err?.message || "Gagal menghapus");
      setBusy(null);
    }
  };

  if (gagal && id) {
    return (
      <div className="max-w-3xl mx-auto">
        <TidakDitemukan kembaliKe={cfg.dasar} judul="Surat tidak ditemukan" />
      </div>
    );
  }
  if (!form || !surat) return <SkeletonHalaman label="Menyiapkan surat..." baris={6} />;

  const { Form, Surat, ikon: Ikon } = cfg;
  const nomorBerikutnya = master.pengaturan?.berikutnya?.[jenis]?.nomor;
  const goresanTampil = terbit
    ? { pembuat: doc.ttdPembuat?.dataUrl, saksiKlinik: doc.saksiKlinik?.dataUrl, saksiKeluarga: doc.saksiKeluarga?.dataUrl }
    : goresan;
  const gTerpilih = modalGores && jenis === "consent" ? penggores(form).find((g) => g.kunci === modalGores) : null;

  return (
    <div className="max-w-3xl xl:max-w-[92rem] mx-auto space-y-4">
      <Link
        href={cfg.dasar}
        className="inline-flex items-center gap-2 min-h-11 -ml-2 px-2 rounded-xl text-sm font-semibold text-brand-700 hover:bg-brand-50 transition"
      >
        <ArrowLeft size={15} aria-hidden="true" /> Kembali ke Daftar
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center shadow-md shadow-brand-600/25 shrink-0">
            <Ikon size={17} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-800 leading-tight truncate tabular-nums">
              {!doc ? `Buat ${cfg.nama}` : doc.nomorSurat || `Draf ${cfg.nama}`}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5 truncate">
              {!doc ? "Isi data, simpan sebagai draf, lalu terbitkan." : cfg.sub(doc) || cfg.nama}
            </p>
          </div>
        </div>
        {doc && (
          <div className="flex gap-2 shrink-0">
            {terbit && (
              <a
                href={`${cfg.cetak}/${doc._id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-xl text-sm font-semibold bg-brand-700 hover:bg-brand-800 text-white transition active:scale-95"
              >
                <FaPrint size={13} aria-hidden="true" /> Cetak / PDF
              </a>
            )}
            <button
              type="button"
              onClick={() => setModal("hapus")}
              className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-xl text-sm font-semibold bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 transition active:scale-95"
            >
              <FaTrash size={12} aria-hidden="true" /> Hapus
            </button>
          </div>
        )}
      </div>

      {doc && (
        <div className={`rounded-2xl border px-4 py-3 flex flex-wrap items-center gap-3 ${terbit ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
          {terbit
            ? <Lock size={17} className="text-emerald-600 shrink-0" aria-hidden="true" />
            : <PenLine size={17} className="text-amber-600 shrink-0" aria-hidden="true" />}
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-bold ${terbit ? "text-emerald-800" : "text-amber-800"}`}>
              {terbit ? "Sudah terbit dan terkunci" : "Draf — belum terbit"}
            </p>
            <p className={`text-xs mt-0.5 ${terbit ? "text-emerald-700" : "text-amber-700"}`}>
              {terbit
                ? "Isi surat tidak bisa diubah. Batalkan terbit bila ada yang salah — nomornya tetap."
                : doc.nomorSurat
                  ? `Pernah terbit. Saat diterbitkan lagi tetap memakai nomor ${doc.nomorSurat}.`
                  : "Nomor surat diberikan saat diterbitkan."}
            </p>
          </div>
          {terbit && (
            <button
              type="button"
              onClick={() => setModal("batal")}
              className="inline-flex items-center gap-1.5 text-sm font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 min-h-11 rounded-xl transition active:scale-95"
            >
              <Unlock size={14} aria-hidden="true" /> Batalkan Terbit
            </button>
          )}
        </div>
      )}

      <form onSubmit={simpan}>
        <LayoutFormPratinjau pratinjau={<Surat surat={surat} sorot={sorot} />}>
          <Form
            form={form}
            setForm={setForm}
            disabled={terbit}
            onFokus={setSorot}
            penandatangan={master.penandatangan}
            saranTindakan={saran}
            goresan={goresanTampil}
            onGores={doc && !terbit ? setModalGores : undefined}
          />

          {!terbit && (
            <div className="sticky bottom-0 z-10 flex gap-2.5 sm:justify-end p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] rounded-2xl bg-white/90 backdrop-blur border border-slate-200 shadow-lg shadow-slate-900/5">
              {!doc ? (
                <button type="button" onClick={() => router.push(cfg.dasar)} disabled={!!busy} className={`${btnBatal} sm:flex-none sm:px-6`}>
                  Batal
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!!busy || !dirty}
                  className={`${btnBatal} sm:flex-none sm:px-6 inline-flex items-center justify-center gap-2`}
                >
                  {busy === "simpan" ? <><Spinner /> Menyimpan...</> : dirty ? "Simpan Draf" : "Tersimpan"}
                </button>
              )}
              {!doc ? (
                <button type="submit" disabled={!!busy} className={`${btnUtama} flex-[2] sm:flex-none sm:px-6`}>
                  {busy === "simpan" ? <><Spinner /> Menyimpan...</> : "Simpan Draf"}
                </button>
              ) : (
                <button type="button" onClick={bukaTerbit} disabled={!!busy} className={`${btnUtama} flex-[2] sm:flex-none sm:px-6`}>
                  <BadgeCheck size={16} aria-hidden="true" /> Terbitkan
                </button>
              )}
            </div>
          )}
        </LayoutFormPratinjau>
      </form>

      <SignatureModal
        open={!!gTerpilih}
        onClose={() => setModalGores(null)}
        judul={`Tanda Tangan ${gTerpilih?.judul || ""}`}
        namaAwal={gTerpilih?.nama || ""}
        kunciNama={gTerpilih?.kunciNama}
        onSimpan={({ dataUrl, nama }) => {
          const k = modalGores;
          setGoresan((p) => ({ ...p, [k]: dataUrl }));
          // Nama saksi yang diketik di modal ikut mengisi form.
          if (k !== "pembuat" && nama) setForm((p) => ({ ...p, [k]: { ...p[k], nama } }));
        }}
      />

      <Modal
        open={modal === "terbit"}
        onClose={() => busy !== "terbit" && setModal(null)}
        busy={busy === "terbit"}
        title="Terbitkan Surat?"
        subtitle={cfg.nama}
        ikon={<BadgeCheck size={18} aria-hidden="true" />}
        size="sm:max-w-md"
        tutupDiLuar
        footer={
          <>
            <button type="button" onClick={() => setModal(null)} disabled={busy === "terbit"} className={btnBatal}>
              Periksa Lagi
            </button>
            <button type="button" onClick={terbitkan} disabled={busy === "terbit"} className={btnUtama}>
              {busy === "terbit" ? <><Spinner /> Menerbitkan...</> : "Ya, Terbitkan"}
            </button>
          </>
        }
      >
        <ul className="text-sm text-slate-600 space-y-2 list-disc pl-5">
          <li>
            Nomor surat:{" "}
            <b className="text-slate-800 tabular-nums">{doc?.nomorSurat || nomorBerikutnya || "nomor berikutnya"}</b>
            {!doc?.nomorSurat && " (perkiraan, ditetapkan saat terbit)"}
          </li>
          <li>Tanda tangan digital dan cap klinik dipasang dari Master Data.</li>
          <li>Surat terkunci dan siap dicetak.</li>
        </ul>
      </Modal>

      <ConfirmModal
        open={modal === "batal"}
        onClose={() => busy !== "batal" && setModal(null)}
        onConfirm={batalTerbit}
        loading={busy === "batal"}
        title="Batalkan Terbit?"
        message="Surat kembali menjadi draf agar bisa diedit. Nomor surat tetap dipertahankan, tetapi goresan tanda tangan dihapus dan harus dibubuhkan ulang."
        confirmLabel="Ya, Batalkan Terbit"
      />

      <HapusSuratModal
        open={modal === "hapus"}
        onClose={() => busy !== "hapus" && setModal(null)}
        onConfirm={hapus}
        loading={busy === "hapus"}
        surat={doc}
        rincian={doc ? cfg.rincian(doc) : []}
      />
    </div>
  );
}
