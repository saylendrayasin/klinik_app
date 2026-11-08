"use client";

import { FaTrash, FaExclamationTriangle } from "react-icons/fa";
import Modal, { btnBatal, btnBahaya, Spinner } from "@/components/Modal";

export function IkonPeringatan() {
  return (
    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0" aria-hidden="true">
      <FaExclamationTriangle className="text-red-600" size={17} />
    </div>
  );
}

/**
 * Konfirmasi hapus / tindakan berisiko.
 * Props:
 *   open, onClose, onConfirm
 *   title, message
 *   confirmLabel  default "Ya, Hapus"
 *   loading       mengunci tombol & penutupan selama proses berjalan
 */
export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Hapus Data",
  message = "Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.",
  confirmLabel = "Ya, Hapus",
  loading = false,
}) {
  const hapus = /hapus/i.test(confirmLabel);
  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={loading}
      title={title}
      ikon={<IkonPeringatan />}
      size="sm:max-w-sm"
      aksen="bg-red-600"
      tutupDiLuar
      footer={
        <>
          <button type="button" onClick={onClose} disabled={loading} className={btnBatal}>
            Batal
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} className={btnBahaya}>
            {loading ? <Spinner /> : hapus && <FaTrash size={12} aria-hidden="true" />}
            {loading ? (hapus ? "Menghapus..." : "Memproses...") : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-slate-600 text-sm leading-relaxed">{message}</p>
    </Modal>
  );
}
