// next.config.mjs
import withPWA from "next-pwa";
import defaultRuntimeCaching from "next-pwa/cache.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {},
  },
};

const customRuntimeCaching = [
  ...defaultRuntimeCaching,
  {
    urlPattern: /^\/$/, // halaman root
    handler: "NetworkFirst",
    options: {
      cacheName: "start-url",
      networkTimeoutSeconds: 10,
      expiration: {
        maxEntries: 1,
      },
      plugins: [
        {
          handlerDidError: async () => {
            return await caches.match("/offline.html");
          },
        },
      ],
    },
  },
];

const pwaConfig = {
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: false,
  runtimeCaching: customRuntimeCaching,
};

export default withPWA(pwaConfig)(nextConfig);
