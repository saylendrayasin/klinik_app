import NextPWA from "next-pwa";

const withPWA = NextPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: false,
  runtimeCaching: [
    {
      urlPattern: /^\/api\/(patients|public|data).*\.json$/, // only public/data endpoints
      handler: "StaleWhileRevalidate",
      method: "GET",
      options: {
        cacheName: "api-cache",
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
      },
    },

    {
      urlPattern: /\.(?:js|css)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-resources",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },

    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico|webp)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "images",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        },
      },
    },

    {
      urlPattern: /^\/api\/.*$/,
      handler: "NetworkOnly",
      method: "POST",
    },
    {
      urlPattern: /^\/api\/.*$/,
      handler: "NetworkOnly",
      method: "PATCH",
    },
    {
      urlPattern: /^\/api\/.*$/,
      handler: "NetworkOnly",
      method: "DELETE",
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);
