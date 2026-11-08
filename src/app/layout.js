import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import PWAUpdatePrompt from "@/components/PWAUpdatePrompt";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Klinik Iya",
  description: "Sistem manajemen Klinik Iya: pasien, KB, kehamilan, persalinan, dan surat",
  applicationName: "Klinik Iya",
  manifest: "/manifest.json",
  // Tab: tanda ibu-bayi saja (bening, bertepi putih) — logo bertulisan tak
  // terbaca di 16px. favicon.ico di src/app ikut otomatis. Ikon dibuat ulang
  // dari public/kop/logo-klinik.png bila logo berubah.
  icons: {
    icon: [{ url: "/icons/icon-tab.png", type: "image/png", sizes: "192x192" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  authors: [{ name: "Saylendra Yasin" }],
};

export function generateViewport() {
  return {
    width: "device-width",
    initialScale: 1,
    minimumScale: 1,
    viewportFit: "cover",
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-center"
          containerStyle={{ top: "max(12px, env(safe-area-inset-top))" }}
          toastOptions={{
            duration: 3500,
            style: {
              background: "#fff",
              color: "#1e293b",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              boxShadow: "0 10px 30px -12px rgb(15 23 42 / 0.25)",
              fontSize: "14px",
              fontWeight: 500,
              padding: "10px 14px",
              maxWidth: "min(92vw, 420px)",
            },
            success: { iconTheme: { primary: "#059669", secondary: "#fff" } },
            error: { duration: 5000, iconTheme: { primary: "#dc2626", secondary: "#fff" } },
            loading: { iconTheme: { primary: "#1f50d6", secondary: "#dbe7fe" } },
          }}
        />
        <PWAUpdatePrompt />
      </body>
    </html>
  );
}
