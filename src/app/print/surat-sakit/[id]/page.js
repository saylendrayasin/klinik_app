import { SuratSakit } from "@/models/suratSakit";
import { sakitKeSurat } from "@/lib/suratView";
import SuratSakitView from "@/components/SuratSakit";
import HalamanCetak from "@/components/surat/HalamanCetak";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cetak Surat Keterangan Sakit" };

export default async function CetakSuratSakitPage({ params }) {
  const { id } = await params;
  return (
    <HalamanCetak Model={SuratSakit} id={id} keSurat={sakitKeSurat} Surat={SuratSakitView} kembali={`/dashboard/surat-sakit/${id}`} />
  );
}
