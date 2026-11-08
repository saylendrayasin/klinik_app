/**
 * Layout polos untuk halaman cetak — sengaja di luar /dashboard supaya
 * sidebar dan topbar tidak ikut terbawa ke kertas.
 * Middleware tetap melindungi rute ini karena bukan public path.
 */
export const metadata = {
  title: "Cetak Dokumen",
};

export default function PrintLayout({ children }) {
  return <div className="min-h-screen bg-slate-100">{children}</div>;
}
