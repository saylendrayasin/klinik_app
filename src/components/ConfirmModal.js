"use client";

import { useEffect } from "react";
import { FaTrash, FaExclamationTriangle } from "react-icons/fa";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Reusable delete/confirmation modal.
 * Props:
 *   open       boolean  - show/hide
 *   onClose    fn       - called on overlay click or Batal
 *   onConfirm  fn       - called on confirm button
 *   title      string
 *   message    string
 *   confirmLabel string  default "Ya, Hapus"
 *   loading    boolean  - disables buttons while async op runs
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
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape" && !loading) onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, loading, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="confirm-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => !loading && onClose()}
        >
          <motion.div
            key="confirm-modal"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            className="w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
              {/* Red top accent */}
              <div className="h-1 bg-gradient-to-r from-red-500 to-rose-400" />

              {/* Header */}
              <div className="flex items-start gap-3.5 px-5 pt-5 pb-4">
                <div className="w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                  <FaExclamationTriangle className="text-red-500" size={19} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 text-base leading-tight">{title}</h3>
                  <p className="text-slate-500 text-sm mt-1 leading-relaxed">{message}</p>
                </div>
                <button
                  onClick={() => !loading && onClose()}
                  disabled={loading}
                  aria-label="Tutup"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition shrink-0 -mr-1"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Divider */}
              <div className="h-px bg-slate-100 mx-5" />

              {/* Footer */}
              <div className="px-5 py-4 flex gap-2.5">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-sm transition disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="flex-1 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-60 shadow-md shadow-red-200"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FaTrash size={12} />
                  )}
                  {loading ? "Menghapus..." : confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
