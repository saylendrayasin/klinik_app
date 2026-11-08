"use client";

import { useState } from "react";
import { Check, PenLine } from "lucide-react";
import Modal, { btnBatal, btnUtama } from "@/components/Modal";
import SignaturePad from "@/components/SignaturePad";

/**
 * Modal untuk menggoreskan tanda tangan di layar (yang membuat pernyataan,
 * saksi). Sengaja TIDAK ada pilihan "pakai tanda tangan tersimpan": TTD
 * tersimpan hanya milik petugas di Master Data dan dipasang server saat
 * terbit. Tanda tangan pasien/saksi wajib digores saat itu juga — kalau bisa
 * dipasang otomatis, surat berhenti menjadi bukti persetujuan.
 *
 * onSimpan({ dataUrl, nama })
 */
export default function SignatureModal({
  open,
  onClose,
  judul = "Tanda Tangan",
  subjudul = "Bubuhkan tanda tangan pada kotak di bawah",
  namaAwal = "",
  kunciNama = false,
  onSimpan,
}) {
  const [dataUrl, setDataUrl] = useState("");
  const [nama, setNama] = useState(namaAwal);

  // Reset hanya saat modal BARU dibuka — bukan setiap namaAwal berubah,
  // yang dulu menghapus nama yang diketik dan coretan di tengah jalan.
  const [sebelumnyaTerbuka, setSebelumnyaTerbuka] = useState(false);
  if (open !== sebelumnyaTerbuka) {
    setSebelumnyaTerbuka(open);
    if (open) {
      setDataUrl("");
      setNama(namaAwal);
    }
  }

  const bisaSimpan = !!dataUrl && String(nama).trim() !== "";

  const simpan = () => {
    if (!bisaSimpan) return;
    onSimpan?.({ dataUrl, nama: String(nama).trim() });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={judul}
      subtitle={subjudul}
      ikon={<PenLine size={18} aria-hidden="true" />}
      size="sm:max-w-2xl"
      footer={
        <>
          <button type="button" onClick={onClose} className={btnBatal}>
            Batal
          </button>
          <button type="button" onClick={simpan} disabled={!bisaSimpan} className={`${btnUtama} disabled:cursor-not-allowed`}>
            <Check size={15} aria-hidden="true" /> Simpan Tanda Tangan
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ttd-nama" className="font-semibold text-slate-700 text-sm">
          Nama Penanda Tangan <span className="text-red-500">*</span>
        </label>
        <input
          id="ttd-nama"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          readOnly={kunciNama}
          placeholder="Nama lengkap"
          className="field"
        />
      </div>
      <SignaturePad onChange={setDataUrl} tinggi={200} />
    </Modal>
  );
}
