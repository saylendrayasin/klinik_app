"use client";

import { useId } from "react";
import { motion } from "framer-motion";

/** Tab halaman detail. Bergulir mendatar di layar sempit, bukan terlipat. */
export default function TabBar({ tabs, active, onChange, label = "Bagian halaman" }) {
  const id = useId();
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0"
    >
      {tabs.map(({ key, label: teks, icon }) => {
        const aktif = active === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={aktif}
            onClick={() => onChange(key)}
            className={`relative flex items-center gap-2 px-3 sm:px-4 min-h-11 font-semibold text-sm whitespace-nowrap rounded-t-xl transition-colors ${
              aktif
                ? "text-brand-700 bg-brand-50"
                : "text-slate-500 hover:text-brand-700 hover:bg-slate-100/70"
            }`}
          >
            <span aria-hidden="true">{icon}</span> {teks}
            {aktif && (
              <motion.span
                layoutId={`tab-${id}`}
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
                aria-hidden="true"
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
