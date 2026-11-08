import withPWAInit, { runtimeCaching as cacheBawaan } from "@ducanh2912/next-pwa";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { version } = require("./package.json");

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  // next-pwa v10 hanya membaca runtimeCaching/skipWaiting/clientsClaim dari
  // workboxOptions. Dulu ditaruh di tingkat atas sehingga diabaikan, dan aturan
  // bawaan "apis" (NetworkFirst) diam-diam menyimpan respons /api — data pasien,
  // TTD, cap — di cache perangkat selama sehari.
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      // Data klinis & halaman cetak (TTD, cap tersisip) tidak pernah di-cache.
      // Aturan pertama yang cocok yang dipakai, jadi ini harus paling atas.
      {
        urlPattern: ({ url, sameOrigin }) =>
          sameOrigin && (url.pathname.startsWith("/api/") || url.pathname.startsWith("/print/")),
        handler: "NetworkOnly",
        method: "GET",
      },
      // Aset statis, font, ikon, dan cangkang halaman tetap dari aturan bawaan.
      ...cacheBawaan.filter((r) => r.options?.cacheName !== "apis"),
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Suite test memakai folder build sendiri (.next-test) lewat variabel ini.
  // Tanpa pemisahan itu, menjalankan test sambil `npm run dev` akan menimpa
  // .next milik dev server dan membuatnya rusak (ENOENT build-manifest).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  // Halaman cetak memuat data pasien, tanda tangan, dan cap: jangan pernah
  // tersimpan di cache browser/proxy mana pun.
  async headers() {
    return [
      {
        source: "/print/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
    ];
  },
  // "Konfigurasi" & pengaturan consent lama pindah ke Master Data.
  async redirects() {
    return [
      { source: "/dashboard/config", destination: "/dashboard/master", permanent: false },
      { source: "/dashboard/config/new", destination: "/dashboard/master/diagnosis/new", permanent: false },
      { source: "/dashboard/config/:id", destination: "/dashboard/master/diagnosis/:id", permanent: false },
      { source: "/dashboard/consent/pengaturan", destination: "/dashboard/master?tab=kop", permanent: false },
    ];
  },
};

export default withPWA(nextConfig);
