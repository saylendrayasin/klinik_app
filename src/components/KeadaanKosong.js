import Link from "next/link";
import { ArrowLeft, ClipboardList, SearchX } from "lucide-react";

/** Pesan ramah untuk daftar yang masih kosong, dengan ikon dan aksi opsional. */
export default function KeadaanKosong({ ikon: Ikon = ClipboardList, judul, ket, aksi, nada = "brand" }) {
  const warnaIkon = nada === "merah" ? "bg-red-50 text-red-500" : "bg-brand-50 text-brand-500";
  return (
    <div className="anim-masuk text-center py-12 px-6 bg-white rounded-2xl border border-dashed border-slate-300">
      <div className={`w-14 h-14 rounded-2xl ${warnaIkon} flex items-center justify-center mx-auto mb-3`}>
        <Ikon size={24} aria-hidden="true" />
      </div>
      <p className="font-semibold text-slate-700">{judul}</p>
      {ket && <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">{ket}</p>}
      {aksi && <div className="mt-5 flex justify-center">{aksi}</div>}
    </div>
  );
}

/** Data detail tidak ada (sudah dihapus / tautan salah / gagal dimuat) + jalan kembali. */
export function TidakDitemukan({ kembaliKe, judul = "Data tidak ditemukan" }) {
  return (
    <KeadaanKosong
      ikon={SearchX}
      nada="merah"
      judul={judul}
      ket="Data ini mungkin sudah dihapus, tautannya salah, atau koneksi sedang terputus."
      aksi={
        <Link
          href={kembaliKe}
          className="inline-flex items-center gap-2 min-h-11 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition active:scale-[0.98]"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Kembali ke daftar
        </Link>
      }
    />
  );
}
