"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

// Kelas tombol footer, dipakai bersama agar semua modal seragam.
export const btnBatal =
  "flex-1 min-h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition disabled:opacity-50";
export const btnUtama =
  "flex-1 min-h-11 bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-semibold rounded-xl text-sm transition inline-flex items-center justify-center gap-2 disabled:opacity-60 shadow-md shadow-brand-600/20";
export const btnBahaya =
  "flex-1 min-h-11 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-semibold rounded-xl text-sm transition inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-red-600/20";
export const btnExcel =
  "flex-1 min-h-11 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold rounded-xl text-sm transition inline-flex items-center justify-center gap-2 disabled:opacity-60";

export function Spinner() {
  return <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />;
}

const FOKUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useLayarSm() {
  const [sm, setSm] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const ubah = () => setSm(mq.matches);
    ubah();
    mq.addEventListener("change", ubah);
    return () => mq.removeEventListener("change", ubah);
  }, []);
  return sm;
}

/**
 * Kerangka modal bersama: lembar dari bawah di HP, kotak di tengah mulai `sm`.
 * - `onSubmit` membuat isi + footer menjadi satu <form>, jadi tombol submit di footer bekerja biasa.
 * - `busy` mengunci tombol tutup, Escape, dan klik latar selama menyimpan.
 * - `tutupDiLuar` default false untuk form agar ketikan tidak hilang karena salah sentuh.
 * - Tab/Shift+Tab berputar di dalam modal (focus trap), tidak lari ke halaman di belakang.
 */
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  onSubmit,
  busy = false,
  size = "sm:max-w-lg",
  aksen = "bg-brand-600",
  ikon = null,
  tutupDiLuar = false,
}) {
  const sm = useLayarSm();
  const judulId = useId();
  const panel = useRef(null);

  useEffect(() => {
    if (!open) return;
    const sebelumnya = document.activeElement;
    const overflowLama = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus({ preventScroll: true });
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onClose?.();
      if (e.key !== "Tab" || !panel.current) return;
      const el = [...panel.current.querySelectorAll(FOKUSABLE)].filter((n) => n.offsetParent !== null);
      if (!el.length) return;
      const [awal, akhir] = [el[0], el[el.length - 1]];
      const aktif = document.activeElement;
      if (e.shiftKey && (aktif === awal || aktif === panel.current || !panel.current.contains(aktif))) {
        e.preventDefault();
        akhir.focus();
      } else if (!e.shiftKey && (aktif === akhir || !panel.current.contains(aktif))) {
        e.preventDefault();
        awal.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflowLama;
      sebelumnya?.focus?.({ preventScroll: true });
    };
  }, [open, busy, onClose]);

  const Wrap = onSubmit ? "form" : "div";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
            onClick={tutupDiLuar && !busy ? onClose : undefined}
            aria-hidden="true"
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={judulId}
            tabIndex={-1}
            initial={sm ? { opacity: 0, scale: 0.96, y: 12 } : { y: "100%" }}
            animate={sm ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
            exit={sm ? { opacity: 0, scale: 0.97, y: 8 } : { y: "100%" }}
            transition={sm ? { duration: 0.2, ease: [0.32, 0.72, 0, 1] } : { type: "spring", damping: 34, stiffness: 380 }}
            className={`relative w-full ${size} bg-white shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88dvh] rounded-t-3xl sm:rounded-2xl overflow-hidden outline-none`}
          >
            <div className={`hidden sm:block h-1 shrink-0 ${aksen}`} />
            <div className="sm:hidden flex justify-center pt-2.5" aria-hidden="true">
              <span className="h-1.5 w-10 rounded-full bg-slate-300" />
            </div>

            <div className="flex items-start justify-between gap-3 px-5 pt-3 pb-3.5 sm:pt-4 sm:pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-start gap-3 min-w-0">
                {ikon}
                <div className="min-w-0">
                  <h2 id={judulId} className="text-base font-bold text-slate-800 leading-snug">{title}</h2>
                  {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                aria-label="Tutup"
                className="-mr-2 -mt-1 w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </div>

            <Wrap onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
              {children && (
                <div className="px-5 py-5 space-y-4 overflow-y-auto overscroll-contain flex-1">{children}</div>
              )}
              {footer && (
                <div className="flex gap-2.5 px-5 pt-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] border-t border-slate-100 bg-slate-50/60 shrink-0">
                  {footer}
                </div>
              )}
            </Wrap>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
