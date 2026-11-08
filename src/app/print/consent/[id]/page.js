import { Consent } from "@/models/consent";
import { consentKeSurat } from "@/lib/suratView";
import SuratConsent from "@/components/SuratConsent";
import HalamanCetak from "@/components/surat/HalamanCetak";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cetak Persetujuan Tindakan" };

export default async function CetakConsentPage({ params }) {
  const { id } = await params;
  return (
    <HalamanCetak Model={Consent} id={id} keSurat={consentKeSurat} Surat={SuratConsent} kembali={`/dashboard/consent/${id}`} />
  );
}
