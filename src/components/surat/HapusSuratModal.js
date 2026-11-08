"use client";

import { useState } from "react";
import { FaTrash } from "react-icons/fa";
import Modal, { btnBatal, btnBahaya, Spinner } from "@/components/Modal";
import { IkonPeringatan } from "@/components/ConfirmModal";

/**
 * Konfirmasi hapus bertingkat.
 *
 * Draf  → konfirmasi biasa.
 * Terbit → wajib mengetik ulang nomor suratnya. Surat terbit adalah dokumen
 *          resmi, jadi menghapusnya tidak boleh terjadi karena salah pencet.
 *
 * rincian: [[label, nilai], ...] untuk mengenali surat yang akan dihapus.
 */
export default function HapusSuratModal({
  open,
  onClose,
  onConfirm,
  loading = false,
  surat,
  rincian = [],
}) {
  const [ketikan, setKetikan] = useState("");

  const terbit = surat?.status === "issued";
  const nomor = surat?.nomorSurat || "";
  const cocok = !terbit || ketikan.trim() === nomor;

  // Kosongkan ketikan setiap kali modal dibuka (tanpa efek, seperti SignatureModal).
  const [sebelumnya, setSebelumnya] = useState(false);
  if (open !== sebelumnya) {
    setSebelumnya(open);
    if (open) setKetikan("");
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={loading}
      title={terbit ? "Hapus Surat yang Sudah Terbit" : "Hapus Draf"}
      subtitle={
        terbit
          ? "Surat ini dokumen resmi yang sudah bernomor dan mungkin sudah dicetak."
          : "Draf ini belum terbit dan akan dihapus permanen."
      }
      ikon={<IkonPeringatan />}
      size="sm:max-w-md"
      aksen="bg-red-600"
      tutupDiLuar
      footer={
        <>
          <button type="button" onClick={onClose} disabled={loading} className={btnBatal}>
            Batal
          </button>
          <button
            type="button"
            onClick={() => onConfirm(terbit ? nomor : undefined)}
            disabled={loading || !cocok}
            className={btnBahaya}
          >
            {loading ? <Spinner /> : <FaTrash size={12} aria-hidden="true" />}
            {loading ? "Menghapus..." : "Hapus Permanen"}
          </button>
        </>
      }
    >
      <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 space-y-1 text-sm">
        {terbit && (
          <Baris label="Nomor" nilai={<span className="font-bold tabular-nums">{nomor}</span>} />
        )}
        {rincian.map(([label, nilai]) => (
          <Baris key={label} label={label} nilai={nilai || "-"} />
        ))}
      </div>

      <p className="text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
        Surat tidak dapat dipulihkan, dan nomornya tidak akan dipakai lagi.
      </p>

      {terbit && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="konfirmasi-nomor" className="font-semibold text-slate-700 text-sm">
            Ketik ulang nomor surat untuk mengonfirmasi
          </label>
          <input
            id="konfirmasi-nomor"
            value={ketikan}
            onChange={(e) => setKetikan(e.target.value)}
            placeholder={nomor}
            autoComplete="off"
            className="field tabular-nums"
          />
        </div>
      )}
    </Modal>
  );
}

function Baris({ label, nilai }) {
  return (
    <div className="flex gap-2 min-w-0">
      <span className="text-slate-500 shrink-0 w-28">{label}</span>
      <span className="text-slate-800 font-medium min-w-0 break-words">{nilai}</span>
    </div>
  );
}
