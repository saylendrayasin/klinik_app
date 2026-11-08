# Panduan Deploy ke Vercel

Daftar periksa sebelum dan sesudah deploy. Urutannya sengaja — nomor 1 dan 2 adalah penyebab paling sering aplikasi gagal jalan padahal build-nya sukses.

---

## 0. Naik dari `main` lama ke rilis ini (Next 16, modul surat, Master Data)

Tidak ada environment variable baru — empat variabel di nomor 2 tetap sama. Yang perlu diperiksa:

| Hal | Tindakan |
|---|---|
| **Versi Node di Vercel** | Settings → General → Node.js Version: **22.x** (atau 20.x). Next 16 menolak Node di bawah 20.9. |
| **Build Command** | Biarkan kosong/bawaan (`npm run build`). Skrip itu menjalankan `next build --webpack` — wajib, karena `next-pwa` hanya jalan dengan webpack. Kalau di Vercel pernah diisi manual `next build`, hapus: tanpa `--webpack` service worker tidak dibuat. |
| **Riwayat git berisi TTD & cap asli** | Commit lama di branch fitur memuat `public/kop/ttd-bidan.png` dan `cap-klinik.png`. Jangan push branch itu apa adanya; lihat "Sebelum push" di bawah. |
| **Database** | Tidak ada migrasi. Koleksi baru (`gambars`, `penandatangans`, `pengaturansurats`, `consents`, `suratsakits`, `counters`) dan indeksnya dibuat otomatis saat pertama dipakai. Data pasien/KB/kehamilan/persalinan tidak berubah bentuk. |
| **URL lama** | `/dashboard/config…` dialihkan otomatis ke Master Data. Bookmark lama tetap jalan. |
| **PWA terpasang** | Service worker baru aktif sendiri saat aplikasi dibuka, lalu menghapus cache API lama di perangkat. Ikon baru dipakai Android dalam beberapa hari; di iPhone hapus lalu "Add to Home Screen" ulang agar ikonnya berganti. |

### Sebelum push

Pilih salah satu, lalu baru push:

- **Squash ke branch baru (paling sederhana):** `git switch -c rilis-surat origin/main` → `git merge --squash feat/ui-polish` → commit → push `rilis-surat` dan buka PR dari sana. Hasil akhirnya tidak memuat berkas TTD/cap; riwayat per-commit tidak ikut.
- **Pertahankan riwayat:** hapus kedua berkas dari seluruh riwayat branch dengan `git filter-repo --path public/kop/ttd-bidan.png --path public/kop/cap-klinik.png --invert-paths` (pada salinan repo), lalu push.

Kalau berkas itu sempat ter-push, menghapusnya belakangan tidak cukup — salinan lama tetap bisa diambil dari GitHub/fork. Anggap bocor dan ganti cap/TTD-nya.

---

## 1. Izinkan Vercel mengakses MongoDB Atlas

**Ini penyebab kegagalan paling umum.** Build akan sukses, halaman login muncul, tapi semua data gagal dimuat.

Vercel menjalankan fungsi di alamat IP yang berubah-ubah, jadi IP-nya tidak bisa didaftarkan satu per satu.

> Atlas → **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`)

Ini aman selama kredensial di connection string kuat, karena akses tetap butuh username dan password. Tapi pastikan:

- User database dibuat khusus untuk aplikasi ini, bukan user admin cluster
- Perannya cukup **Read and write to any database**, bukan Atlas Admin
- Passwordnya panjang dan acak, dan **di-URL-encode** kalau memuat karakter seperti `@`, `#`, `:`, `/`

---

## 2. Isi Environment Variables di Vercel

Project → **Settings** → **Environment Variables**. Isi untuk **Production**, **Preview**, dan **Development**.

| Variabel | Keterangan |
|---|---|
| `MONGODB_URI` | Connection string Atlas, **lengkap dengan nama database** di path. Contoh: `mongodb+srv://user:pass@cluster.xxx.mongodb.net/klinik?retryWrites=true&w=majority` |
| `JWT_SECRET` | Kunci penandatangan token. Buat acak, minimal 32 karakter |
| `AUTH_USERNAME` | Username login bidan |
| `AUTH_PASSWORD` | Password login bidan |

Membuat `JWT_SECRET` yang kuat:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

> ⚠️ Kalau nama database tidak ditulis di `MONGODB_URI`, Mongoose memakai database bernama `test`. Data akan tersimpan, tapi di tempat yang tidak Anda kira.

`JWT_SECRET` juga dibaca oleh proxy (`src/proxy.js`, pengganti middleware di Next 16). Kalau variabelnya lupa diisi, deploy akan **gagal saat start** dengan pesan yang jelas — itu disengaja, lebih baik ketahuan langsung daripada aplikasi jalan tanpa penjagaan.

---

## 3. Hal yang Sudah Ditangani di Kode

Anda tidak perlu melakukan apa pun untuk poin-poin ini — ditulis di sini supaya tidak ada yang "diperbaiki" sehingga malah rusak.

### Filesystem Vercel bersifat sementara

Fungsi serverless berjalan di filesystem read-only, dan apa pun yang ditulis saat runtime akan hilang. Karena itu **tanda tangan, cap klinik, dan logo disimpan sebagai base64 di MongoDB** (koleksi `gambars`), bukan sebagai berkas. Jangan diubah menjadi upload ke folder `public/` — akan bekerja di laptop lalu gagal senyap di Vercel, dan semua isi `public/` bisa diunduh siapa saja tanpa login.

### Zona waktu server adalah UTC

Vercel menjalankan Node dengan `TZ=UTC`, sedangkan klinik berada di WITA (UTC+8). Tanpa penanganan, surat tertanggal 1 Maret bisa terbaca 28 Februari — nomornya masuk bulan yang salah dan tanggal yang tercetak meleset sehari.

Ditangani di `src/lib/tanggal.js`: tanggal surat selalu disimpan sebagai tengah malam UTC pada tanggal kalendernya, dan semua pembacaan memakai getter UTC. **Tidak perlu menyetel variabel `TZ`** — hasilnya sama di zona waktu mana pun. Sudah diuji dengan menjalankan seluruh suite pada `TZ=UTC`.

### Kolam koneksi database

`src/lib/database.js` memakai `maxPoolSize: 10` dan cache koneksi di `global.mongoose`. Di serverless bisa ada banyak instance sekaligus, masing-masing dengan poolnya sendiri; batas ini mencegah kuota koneksi Atlas terkuras.

### Build tidak menyentuh database

Halaman cetak memakai `export const dynamic = "force-dynamic"`, jadi tidak ada halaman yang mencoba membaca MongoDB saat build. Build tetap sukses walau database sedang tidak bisa dihubungi.

### Service worker PWA

`public/sw.js`, `workbox-*.js`, dan `worker-*.js` dibuat ulang setiap build dan sudah masuk `.gitignore`. `/api/*` dan `/print/*` disetel `NetworkOnly` — data klinis dan surat tidak pernah disimpan di perangkat. (Di `main` lama aturan ini tidak terbaca oleh next-pwa, sehingga respons API sempat tersimpan di cache perangkat sampai sehari; service worker baru menghapus cache itu.)

### Cetak

Margin 15mm ada di dalam lembar surat, bukan di pengaturan printer. Hasilnya sama walau di dialog cetak dipilih "Margin: Tidak ada", dan header/footer browser (URL, tanggal) tidak ikut tercetak.

---

## 4. Setelah Deploy — Periksa Berurutan

1. Buka domainnya → harus dialihkan ke `/login`
2. Login dengan `AUTH_USERNAME` / `AUTH_PASSWORD` → masuk ke dashboard
3. **Master Data → Kop & Cap**: periksa nama klinik, alamat, telepon, kota; unggah logo (opsional) dan **cap klinik** → Simpan
4. **Master Data → Penanda Tangan → Tambah Penanda Tangan**: nama + gelar, jabatan, NIP, unggah/gores **TTD** → Simpan. Ulangi untuk tiap dokter/bidan/perawat
5. **Master Data → Penomoran**: pola bawaan sudah `001/IC/KLN-IYA/XI/2026` dan `001/SKS/…`. Bila melanjutkan buku nomor manual, isi "Lanjutkan dari nomor urut" (hanya bisa maju) → Simpan
6. Buat satu Persetujuan Tindakan dan satu Surat Keterangan Sakit percobaan → **Terbitkan** → **Cetak / PDF**. Periksa kop, TTD, cap, dan margin di hasil cetak
7. **Hapus surat percobaan itu** (ketik ulang nomornya). Nomornya hangus — surat asli pertama akan bernomor 002. Kalau ingin mulai dari 001, lakukan percobaan di Preview deployment dengan database terpisah, bukan di produksi

Kalau langkah 2 gagal dengan galat koneksi, hampir pasti penyebabnya nomor 1 atau nomor 2 di atas.

---

## 5. Perkiraan Kebutuhan Penyimpanan

TTD petugas, cap, dan logo disimpan **sekali** per versi (koleksi `gambars`) dan surat hanya menyimpan id versinya — tidak disalin ke setiap surat. Yang ikut tersimpan di surat hanya tanda tangan yang **digores di layar** (± 2–5 KB per goresan).

| Isi | Ukuran |
|---|---|
| Satu versi TTD / cap / logo (diperkecil ke ≤ 600px saat unggah) | ± 20–110 KB, sekali saja |
| Surat dengan 2 goresan di layar | ± 5–10 KB |
| Surat tanpa goresan (TTD master + basah) | < 2 KB |

Atlas M0 (512 MB) cukup untuk puluhan ribu surat. Mengganti TTD/cap membuat versi baru (versi lama tetap disimpan untuk surat lama), jadi jangan mengunggah ulang berkali-kali tanpa perlu.

---

## 6. Yang Masih Menjadi Risiko

Jujur disampaikan, bukan hal yang sudah beres:

- **Belum ada pembatasan percobaan login** (sengaja, aplikasi internal). Endpoint `/api/auth/login` bisa dicoba berkali-kali tanpa jeda. Kalau domainnya publik, aktifkan minimal Vercel Firewall / Attack Challenge Mode, atau pakai **Deployment Protection** (Vercel Authentication) agar halaman login pun tidak terbuka untuk umum.
- **Deployment lama tetap bisa dibuka.** Setiap deploy Vercel punya URL permanen sendiri (`…-git-…vercel.app`). Aktifkan Deployment Protection untuk Preview, atau hapus deployment lama yang tidak dipakai.
- **Perbandingan password belum constant-time.** Secara teori bisa dianalisis lewat selisih waktu respons; secara praktik sulit dilakukan lewat internet.
- **Satu akun untuk semua orang.** Tidak ada jejak siapa membuat surat mana. Kalau nanti ada lebih dari satu bidan, ini perlu dipikirkan ulang.
- **Tanda tangan di layar bukan tanda tangan digital bersertifikat.** Nilainya setara tanda tangan basah yang dipindai.

---

## 7. Rutin Setelah Berjalan

- **Backup:** Atlas M0 tidak menyediakan backup otomatis. Jadwalkan `mongodump` berkala, atau naikkan ke M2 ke atas yang sudah punya backup harian.
- **Ganti password berkala** lewat Environment Variables, lalu **Redeploy** agar nilainya terpakai.
- Mengubah environment variable **tidak langsung berlaku** — wajib redeploy.
