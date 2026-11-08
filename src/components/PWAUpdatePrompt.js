"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";

export default function PWAUpdatePrompt() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const wasControlled = !!navigator.serviceWorker.controller;

    const handleControllerChange = () => {
      if (!wasControlled) return;
      toast(
        (t) => (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-800">Versi baru tersedia!</span>
            <button
              onClick={() => { toast.dismiss(t.id); window.location.reload(); }}
              className="shrink-0 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg transition"
            >
              Perbarui
            </button>
          </div>
        ),
        { duration: Infinity, id: "pwa-update" }
      );
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    return () => navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
  }, []);

  return null;
}
