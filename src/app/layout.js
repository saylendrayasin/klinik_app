import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

// metadata normal masih bisa di sini
export const metadata = {
  title: "Klinik App",
  description: "Aplikasi Klinik",
  manifest: "/manifest.json",
  icons: [
    { rel: "icon", url: "/icons/icon-192x192.png" },
    { rel: "apple-touch-icon", url: "/icons/icon-192x192.png" },
  ],
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
    <html lang="en">
      <head>
        <meta
          name="theme-color"
          content="#ffffff"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#000000"
          media="(prefers-color-scheme: dark)"
        />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster position="top-center" reverseOrder={false} />
      </body>
    </html>
  );
}
