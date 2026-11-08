import Link from "next/link";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { connectDB } from "@/lib/database";
import { petaGambar } from "@/models/gambar";
import { LOGO_BAWAAN } from "@/lib/suratView";
import PrintToolbar from "@/components/PrintToolbar";
import LembarSkala from "@/components/LembarSkala";

/**
 * Halaman cetak surat (server component). Isinya lengkap sejak awal — dialog
 * cetak tidak berlomba dengan fetch klien — dan gambar (TTD, cap, logo)
 * disisipkan sebagai data URL dari salinan di surat, bukan URL publik.
 * Hanya surat terbit yang bisa dicetak. Header no-store diatur di next.config.mjs.
 */
export default async function HalamanCetak({ Model, id, keSurat, Surat, kembali }) {
  if (!mongoose.isValidObjectId(id)) notFound();
  await connectDB();
  const doc = await Model.findById(id).lean();
  if (!doc) notFound();

  if (doc.status !== "issued") {
    return (
      <main className="min-h-dvh flex items-center justify-center p-6 text-center">
        <div className="max-w-sm space-y-3">
          <h1 className="text-lg font-bold text-slate-800">Surat belum terbit</h1>
          <p className="text-sm text-slate-500">Terbitkan surat ini dulu agar nomor, tanda tangan, dan cap terpasang sebelum dicetak.</p>
          <Link href={kembali} className="inline-flex min-h-11 items-center px-4 rounded-xl bg-brand-700 text-white text-sm font-semibold">
            Buka surat
          </Link>
        </div>
      </main>
    );
  }

  const ids = [doc.logoId, doc.capId, doc.petugas?.ttdId, doc.saksiKlinik?.ttdId, doc.pemeriksa?.ttdId];
  const peta = await petaGambar(ids);
  const src = (gid) => peta[String(gid)] || "";
  const surat = keSurat(doc, src);
  if (!surat.logo) surat.logo = LOGO_BAWAAN;

  return (
    <>
      <PrintToolbar />
      <div className="py-6 px-3 print:p-0">
        <LembarSkala>
          <Surat surat={surat} />
        </LembarSkala>
      </div>
    </>
  );
}
