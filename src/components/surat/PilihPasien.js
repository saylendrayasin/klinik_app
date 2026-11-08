"use client";

import { useEffect, useState } from "react";
import { Search, UserRoundSearch } from "lucide-react";
import Modal, { btnBatal } from "@/components/Modal";
import { fetcher } from "@/lib/fetcher";
import { tanggalSingkat } from "@/lib/tanggal";

/**
 * Tombol "Ambil dari data pasien": cari nama di semua modul lalu salin
 * identitasnya ke form. Hanya bantuan — semua kolom tetap bisa diketik
 * manual, dan surat tidak menyimpan rujukan ke data pasien.
 * onPilih({ nama, tanggalLahir, alamat, jenisKelamin })
 */
export default function PilihPasien({ onPilih, disabled, label = "Ambil dari data pasien" }) {
  const [buka, setBuka] = useState(false);
  const [q, setQ] = useState("");
  const [hasil, setHasil] = useState([]);
  const [status, setStatus] = useState("awal"); // awal | memuat | selesai | gagal

  useEffect(() => {
    const kata = q.trim();
    if (!buka || kata.length < 2) return;
    // Debounce + batalkan permintaan lama: mengetik cepat tidak membanjiri server.
    const ac = new AbortController();
    const t = setTimeout(async () => {
      setStatus("memuat");
      try {
        const res = await fetcher(`/api/cari-pasien?q=${encodeURIComponent(kata)}`, { signal: ac.signal });
        setHasil(res.data || []);
        setStatus("selesai");
      } catch (e) {
        if (e?.name !== "AbortError") setStatus("gagal");
      }
    }, 300);
    return () => { clearTimeout(t); ac.abort(); };
  }, [q, buka]);

  const tutup = () => { setBuka(false); setQ(""); setHasil([]); setStatus("awal"); };
  const kurang = q.trim().length < 2;

  return (
    <>
      <button
        type="button"
        onClick={() => setBuka(true)}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 min-h-10 px-3 rounded-lg text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-100 transition disabled:opacity-50 shrink-0"
      >
        <UserRoundSearch size={15} aria-hidden="true" />
        <span className="max-sm:sr-only">{label}</span>
        <span className="sm:hidden" aria-hidden="true">Cari</span>
      </button>

      <Modal
        open={buka}
        onClose={tutup}
        title="Ambil dari Data Pasien"
        subtitle="Cari di Pasien, KB, Kehamilan, dan Persalinan. Data disalin — tetap bisa diubah."
        ikon={<UserRoundSearch size={18} aria-hidden="true" />}
        tutupDiLuar
        footer={<button type="button" onClick={tutup} className={btnBatal}>Tutup</button>}
      >
        <div className="relative">
          <Search size={16} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ketik nama, minimal 2 huruf"
            aria-label="Cari nama pasien"
            autoFocus
            className="field pl-10"
          />
        </div>

        <div aria-live="polite" className="min-h-24">
          {kurang ? (
            <p className="text-sm text-slate-400 text-center py-6">Ketik minimal 2 huruf nama.</p>
          ) : status === "memuat" ? (
            <p className="text-sm text-slate-400 text-center py-6">Mencari…</p>
          ) : status === "gagal" ? (
            <p className="text-sm text-red-600 text-center py-6">Gagal mencari. Coba lagi.</p>
          ) : status === "selesai" && !hasil.length ? (
            <p className="text-sm text-slate-500 text-center py-6">Tidak ada yang cocok. Isi data secara manual.</p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
              {hasil.map((p, i) => (
                <li key={`${p.nama}-${i}`}>
                  <button
                    type="button"
                    onClick={() => { onPilih(p); tutup(); }}
                    className="w-full text-left px-4 py-3 min-h-11 hover:bg-brand-50 focus-visible:bg-brand-50 transition"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800 truncate">{p.nama}</span>
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5 shrink-0">{p.sumber}</span>
                    </span>
                    <span className="block text-xs text-slate-500 mt-0.5 truncate">
                      {tanggalSingkat(p.tanggalLahir)} · {p.alamat || "alamat belum diisi"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </>
  );
}
