// Digabung ke public/sw.js oleh next-pwa (customWorkerSrc bawaan: "worker").
// Versi lama menyimpan respons /api (data pasien, TTD, cap) di cache "apis".
// Hapus saat service worker baru aktif — aturan sekarang tidak pernah mengisinya lagi.
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.delete("apis"));
});
