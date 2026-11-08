# Rencana Modul Informed Consent (Persetujuan Tindakan)

Dokumen rencana. Belum ada kode yang ditulis — ini untuk disetujui dulu.

**Route prefix:** `/dashboard/consent`
**API prefix:** `/api/consent`
**Model:** `src/models/consent.js`, `src/models/consentSetting.js`, `src/models/counter.js`
**Warna modul:** **Amber** (`amber-500` / `amber-600`) — satu-satunya warna yang belum dipakai modul lain

> Revisi 2 — sudah menyesuaikan enam jawaban Anda. Ringkasan perubahan ada di §16.

---

## 1. Tujuan

Bidan membuat surat persetujuan tindakan, pasien tanda tangan langsung di layar (HP/tablet), lalu disimpan dan bisa dicetak. Setiap surat punya nomor resmi, bisa dicari, dan bisa dihapus.

Alur inti:

```text
Ketik data & tindakan → pasien TTD di layar
   → bidan TTD → SIMPAN (nomor surat terbit) → Cetak / PDF
```

### Modul ini berdiri sendiri

**Semua data diketik manual setiap kali membuat surat.** Tidak ada pemilihan pasien dari modul Pasien/KB/Kehamilan/Persalinan, dan tidak ada tautan balik ke record mana pun. Ini keputusan sengaja, bukan penyederhanaan sementara.

Konsekuensinya, dan kenapa ini justru masuk akal:

- Yang menandatangani sering **bukan pasien yang terdaftar** — bisa suami, orang tua, atau wali. Memaksa memilih dari daftar pasien malah menghambat.
- Surat persetujuan adalah **potret data saat itu**. Kalau alamat pasien berubah tahun depan, surat lama harus tetap memuat alamat lama. Data yang diketik lepas justru lebih benar secara hukum daripada data yang ikut berubah mengikuti record.
- Tidak ada ketergantungan antar modul, jadi menghapus record pasien tidak akan merusak surat yang sudah terbit.

Efeknya ke rencana ini: tidak ada field relasi di skema, tidak ada tombol "Buat Consent" di halaman modul lain, dan form-nya murni input.

---

## 2. Halaman Pengaturan

Ini bagian baru, lahir dari permintaan Anda supaya **nomor surat gampang diatur**. Begitu ada halaman pengaturan, sekalian jawaban Anda soal ejaan alamat, nama bidan, dan kolom saksi ikut ditaruh di sini — jadi tidak ada lagi yang perlu diubah lewat kode.

**Lokasi:** `/dashboard/consent/pengaturan` (tombol ⚙ di pojok halaman daftar)
**Model:** satu dokumen tunggal di koleksi `consentsettings`, `_id: "consent"`

### 2.1 Isi pengaturan

| Kelompok | Field | Default |
|---|---|---|
| **Kop surat** | Baris 1 | `BIDAN PRAKTEK MANDIRI` |
| | Baris 2 | `KLINIK IYA` |
| | Alamat | `Jln. Kumersot Tendeki – Bitung` |
| | Telepon | `082291237607` |
| | Kota (untuk baris tanggal) | `Bitung` |
| **Nomor surat** | Pola nomor | `{urut2}/IC-KLN-IYA/{romawi}/{tahun}` |
| | Reset penomoran | `Tahunan` |
| | Nomor berikutnya | `1` |
| **Tanda tangan** | Nama bidan | `Bdn. SAMSIA REMBANG, SST` |
| | Tampilkan kolom saksi | `Aktif` |

### 2.2 Pola nomor — token yang tersedia

Pola ditulis bebas, memakai token yang diganti otomatis saat surat ditandatangani:

| Token | Hasil | Keterangan |
|---|---|---|
| `{urut}` | `1`, `2`, `15` | Tanpa nol di depan |
| `{urut2}` | `01`, `02`, `15` | Dua digit |
| `{urut3}` | `001`, `002` | Tiga digit |
| `{bulan}` | `02` | Bulan angka |
| `{romawi}` | `II` | Bulan angka romawi |
| `{tahun}` | `2026` | Tahun penuh |
| `{tahun2}` | `26` | Dua digit terakhir |

Contoh hasil:

```text
{urut2}/IC-KLN-IYA/{romawi}/{tahun}   →  01/IC-KLN-IYA/II/2026
{urut3}/KLN-IYA/{romawi}/{tahun}      →  001/KLN-IYA/II/2026
IC-{tahun}{bulan}-{urut3}             →  IC-202602-001
```

Halaman pengaturan menampilkan **pratinjau langsung** — begitu pola diketik, contoh nomornya langsung muncul di bawahnya. Jadi tidak perlu coba-coba membuat surat untuk tahu hasilnya.

### 2.3 Reset penomoran

Tiga pilihan: **Tahunan** (default) · **Bulanan** · **Tidak pernah**.

Ini menentukan kunci penghitung di database:

| Reset | Kunci penghitung | Perilaku |
|---|---|---|
| Tahunan | `consent-2026` | Kembali ke 1 setiap ganti tahun |
| Bulanan | `consent-2026-02` | Kembali ke 1 setiap ganti bulan |
| Tidak pernah | `consent` | Terus naik selamanya |

> ⚠️ **Aturan validasi penting:** kalau reset dipilih **Bulanan**, pola nomor **wajib** memuat `{bulan}` atau `{romawi}`. Kalau tidak, bulan Februari dan Maret sama-sama akan menghasilkan `01/IC-KLN-IYA/2026` — nomor kembar. Halaman pengaturan menolak menyimpan dan menjelaskan alasannya. Aturan serupa berlaku untuk reset Tahunan yang polanya tidak memuat `{tahun}`.

### 2.4 Nomor berikutnya bisa diatur manual

Kolom **"Nomor berikutnya"** memungkinkan Anda melanjutkan penomoran dari catatan kertas. Misalnya klinik sudah menerbitkan 14 surat secara manual tahun ini — isi `15`, maka surat berikutnya lewat aplikasi jadi nomor 15, bukan mulai lagi dari 1.

Di belakang layar ini menulis `seq = 14` ke penghitung. Aman dilakukan kapan saja.

### 2.5 Yang tidak berubah surut

**Surat yang sudah terbit nomornya tidak ikut berubah** kalau pola diganti belakangan. Nomor disimpan sebagai teks di dokumen surat, bukan dihitung ulang setiap kali dibuka.

Ini disengaja: surat yang sudah dicetak dan ditandatangani pasien tidak boleh berubah nomornya hanya karena pengaturan diutak-atik. Jadi wajar kalau nanti terlihat campuran format lama dan baru di daftar — itu memang benar secara arsip.

---

## 3. Keputusan Desain Utama

Lima keputusan beserta alasannya. Kalau ada yang tidak setuju, ubah di sini dulu sebelum implementasi.

### 3.1 Tanda tangan: canvas gambar tangan, disimpan sebagai PNG

Pasien tanda tangan pakai jari/stylus di atas `<canvas>`. Hasilnya disimpan sebagai PNG base64 di dokumen MongoDB.

**Kenapa begitu:** tidak perlu library baru (canvas + pointer events sudah cukup), jalan di HP maupun desktop, dan hasilnya langsung bisa ditempel ke halaman cetak.

**Yang ditolak:** upload foto TTD (ribet, pasien harus tanda tangan di kertas dulu — menghilangkan gunanya), dan tanda tangan digital bersertifikat (overkill, butuh infrastruktur PKI).

**Ukuran:** PNG di-trim area kosongnya dan diperkecil ke lebar maks 600px → sekitar 15–40 KB per tanda tangan. Tiga tanda tangan per surat ≈ 100 KB. Aman sampai ribuan surat; kalau nanti tembus ~500 MB, baru pertimbangkan pindah ke penyimpanan file terpisah.

### 3.2 Tiga tanda tangan, kolom saksi bisa dimatikan

| Penanda tangan | Wajib | Keterangan |
|---|---|---|
| Pasien / keluarga | Ya | Yang memberi persetujuan |
| Bidan pelaksana | Ya | Nama dari pengaturan |
| Saksi | **Bisa dinyalakan/dimatikan** | Keluarga atau petugas |

Kolom saksi dikendalikan dua lapis:

1. **Pengaturan global** — kalau dimatikan, kolom saksi hilang dari form dan dari surat cetak untuk semua surat baru.
2. **Per surat** — di form ada centang "Sertakan saksi" yang nilai awalnya mengikuti pengaturan global, tapi bisa diubah untuk surat itu saja.

Jadi Anda bisa mematikannya secara umum tapi tetap menyalakannya untuk tindakan berisiko tinggi, tanpa bolak-balik ke pengaturan.

Status "aktif/tidak" disimpan di masing-masing surat (`saksiDisertakan`), bukan dibaca dari pengaturan saat mencetak. Kalau tidak begitu, mematikan saksi hari ini akan menghapus kolom saksi dari surat lama yang sudah terlanjur ditandatangani saksi — jelas keliru.

### 3.3 Setelah ditandatangani, surat dikunci

Begitu status jadi `signed`, isi surat tidak bisa diedit lagi. Kalau ada yang salah, bidan harus klik **"Batalkan tanda tangan"** — tanda tangan dihapus, status kembali `draft`, dan waktu pembatalan dicatat.

**Kenapa:** ini dokumen persetujuan. Kalau isinya bisa diubah diam-diam setelah pasien tanda tangan, tanda tangannya kehilangan makna. Nomor surat tetap dipertahankan supaya tidak lompat.

Ini berbeda dari modul lain yang bebas diedit kapan saja — dan memang harus berbeda.

### 3.4 Hapus permanen, dengan peringatan bertingkat

Sesuai keputusan Anda: hapus permanen, tidak ada tong sampah. Tapi karena ini dokumen persetujuan medis, peringatannya dibuat bertingkat sesuai risiko:

| Kondisi | Cara konfirmasi |
|---|---|
| Masih **draft** | `ConfirmModal` merah biasa, seperti modul lain |
| Sudah **ditandatangani** | Modal peringatan tegas + **wajib mengetik ulang nomor suratnya** untuk mengaktifkan tombol hapus |

Mengetik ulang nomor surat terdengar merepotkan, dan memang sengaja. Menghapus surat yang sudah ditandatangani pasien artinya membuang bukti persetujuan — itu tidak boleh bisa terjadi karena salah pencet di HP.

Isi peringatan menyebut secara terang: nomor surat, nama penandatangan, tanggal, dan kalimat *"Dokumen ini tidak dapat dipulihkan setelah dihapus."*

**Nomor yang sudah terpakai tidak dipakai ulang** walaupun suratnya dihapus. Penghitung tidak pernah mundur — supaya tidak ada dua dokumen berbeda dengan nomor sama beredar di luar.

### 3.5 PDF: lewat halaman cetak, bukan generator PDF

Saya sarankan **halaman cetak khusus + `window.print()`**, bukan library PDF.

**Kenapa:**

- Nol dependensi baru. Library PDF server-side (puppeteer) berat dan sering bermasalah kalau di-deploy ke Vercel.
- Di Chrome — desktop maupun Android — dialog print sudah punya opsi **"Save as PDF"**. Jadi tujuan "bisa jadi PDF" dan "bisa di-print" tercapai sekaligus lewat satu tombol.
- Hasilnya persis seperti yang dilihat di layar, dan gampang diatur ulang tata letaknya cuma dengan CSS.

**Kalau nanti Anda mau tombol "Download PDF" satu klik** tanpa lewat dialog print, upgrade-nya pakai `@react-pdf/renderer` (jalan di Node, tidak butuh browser headless). Itu saya taruh sebagai fase opsional, bukan bagian awal.

---

## 4. Kop Surat

Semua isinya diambil dari pengaturan (§2), jadi bisa diubah sendiri tanpa menyentuh kode.

```text
┌──────────────────────────────────────────────────────────┐
│  [logo]     BIDAN PRAKTEK MANDIRI                        │
│             KLINIK IYA                                   │
│             Jln. Kumersot Tendeki – Bitung               │
│             Telp. 082291237607                           │
├══════════════════════════════════════════════════════════┤   ← garis ganda
```

Ejaan **Kumersot Tendeki** sudah sesuai koreksi Anda, dan kota **Bitung** ditambahkan karena baris tanggal surat memang berbunyi "Bitung, …".

**Logo:** file `word/media/image5.png` di dalam docx — logo ibu-dan-bayi versi **biru**. Ini logo yang sama dengan icon aplikasi (`public/icons/icon-512x512.png`) tapi icon aplikasi warnanya ungu. Untuk surat resmi saya pakai versi biru dari docx supaya konsisten dengan surat yang selama ini Anda pakai. Nanti disalin ke `public/kop/logo-klinik.png`.

**Cap/stempel:** sesuai arahan Anda, tidak dipakai. Halaman cetak hanya menyediakan ruang kosong di area tanda tangan supaya bisa dicap manual setelah dicetak, kalau perlu.

> Catatan kecil: cap klinik menulis alamatnya sebagai `JL. **M.** KUMERSOT TENDEKI`, pakai inisial "M." di depan. Kop docx tidak memakainya. Saya ikut kop docx (tanpa "M."), tapi kalau ternyata yang benar pakai "M.", tinggal Anda betulkan sendiri di halaman pengaturan — tidak perlu ubah kode.

---

## 5. Isi Dokumen

Struktur mengikuti format persetujuan tindakan yang lazim dipakai fasilitas kesehatan di Indonesia, dengan daftar penjelasan yang diwajibkan Permenkes 290/2008 tentang Persetujuan Tindakan Kedokteran.

```text
              PERSETUJUAN TINDAKAN MEDIS
                 (INFORMED CONSENT)
              No: 01/IC-KLN-IYA/II/2026

Yang bertanda tangan di bawah ini:
  Nama            : ...
  NIK             : ...
  Umur            : ... tahun
  Jenis Kelamin   : ...
  Alamat          : ...

Bertindak sebagai : ☑ Pasien sendiri  ☐ Suami  ☐ Istri
                    ☐ Orang tua  ☐ Wali  ☐ Anak

[Kalau bukan pasien sendiri, muncul blok data pasien]

Dengan ini menyatakan  ☑ SETUJU  ☐ MENOLAK
untuk dilakukan tindakan: ......................................

Terhadap diagnosis: ...........................................

Setelah mendapat penjelasan yang saya mengerti mengenai:
  ☑ Diagnosis dan dasar diagnosis
  ☑ Tindakan yang akan dilakukan dan tata caranya
  ☑ Tujuan tindakan
  ☑ Risiko dan komplikasi yang mungkin terjadi
  ☑ Alternatif tindakan lain beserta risikonya
  ☑ Prognosis terhadap tindakan yang dilakukan
  ☑ Perkiraan pembiayaan

Catatan tambahan: ...

Saya menyatakan persetujuan ini diberikan tanpa paksaan dari pihak mana pun,
dan saya telah diberi kesempatan untuk bertanya serta mendapat jawaban
yang memuaskan.

                              Bitung, 28 Februari 2026

  Yang menyatakan          Saksi              Bidan Pelaksana

  [TTD pasien]         [TTD saksi]        [TTD bidan]

  (Nama Pasien)        (Nama Saksi)     Bdn. SAMSIA REMBANG, SST
```

Kolom **Saksi** hilang otomatis dan dua kolom sisanya melebar kalau saksi dimatikan.

Tujuh poin penjelasan itu bukan karangan — itu daftar yang diwajibkan Permenkes 290/2008 Pasal 7 ayat (3). Dibuat sebagai checkbox supaya bidan menandai apa yang benar-benar sudah dijelaskan, bukan sekadar formalitas tercetak.

> ⚠️ **Tetap perlu Anda periksa:** saya bukan ahli hukum kesehatan. Redaksi di atas saya susun dari format yang umum dan profesional, bukan menyalin dokumen resmi. Sebelum dipakai untuk pasien sungguhan, sebaiknya dibaca ulang oleh yang berwenang di klinik Anda.

---

## 6. Jenis Tindakan

**Diketik bebas**, sesuai prinsip modul ini yang murni input. Tidak diambil dari modul Konfigurasi dan tidak terikat daftar apa pun — bidan mengetik tindakan apa adanya sesuai yang dikerjakan.

Contoh isian yang lazim, sekadar gambaran:

| Kelompok | Contoh |
|---|---|
| KB | Pemasangan IUD, Pencabutan IUD, Pemasangan Implan, Pencabutan Implan, Suntik KB |
| Persalinan | Pertolongan Persalinan Normal, Episiotomi, Penjahitan Perineum, Rujukan |
| Kehamilan | Pemeriksaan Dalam, USG |
| Lain | Pemasangan Infus, Injeksi, Tindakan Kegawatdaruratan |

Supaya mengetik tidak melelahkan, input tindakan diberi **saran ketik dari surat-surat sebelumnya** (`<datalist>` berisi tindakan yang pernah dipakai). Ini murni bantuan mengetik — nilainya tetap bebas dan tersimpan sebagai teks, bukan referensi ke tabel lain.

---

## 7. Skema Data

```js
// src/models/consent.js
const signatureSchema = new mongoose.Schema({
  dataUrl:   { type: String },              // PNG base64
  nama:      { type: String },
  signedAt:  { type: Date },
}, { _id: false });

const consentSchema = new mongoose.Schema({
  nomorSurat:    { type: String, required: true, unique: true },
  nomorUrut:     { type: Number, required: true },
  tahun:         { type: Number, required: true },
  bulan:         { type: Number, required: true },
  tanggalSurat:  { type: Date, required: true, default: Date.now },

  // Pihak yang menandatangani
  penandatangan: {
    nama:        { type: String, required: true },
    nik:         { type: String },
    umur:        { type: Number },
    jenisKelamin:{ type: String, enum: ["Laki-laki", "Perempuan"] },
    alamat:      { type: String },
    hubungan:    { type: String, enum: ["pasien", "suami", "istri", "orang_tua", "wali", "anak"], default: "pasien" },
  },

  // Diisi hanya kalau penandatangan bukan pasien sendiri
  pasien: {
    nama:        { type: String },
    nik:         { type: String },
    umur:        { type: Number },
    alamat:      { type: String },
  },

  // Semua teks bebas — tidak ada referensi ke koleksi lain
  keputusan:     { type: String, enum: ["setuju", "menolak"], default: "setuju" },
  tindakan:      { type: String, required: true },
  diagnosis:     { type: String },

  penjelasan: {
    diagnosis:   { type: Boolean, default: true },
    tataCara:    { type: Boolean, default: true },
    tujuan:      { type: Boolean, default: true },
    risiko:      { type: Boolean, default: true },
    alternatif:  { type: Boolean, default: true },
    prognosis:   { type: Boolean, default: true },
    biaya:       { type: Boolean, default: true },
  },

  catatan:       { type: String },

  saksiDisertakan: { type: Boolean, default: true },
  ttdPasien:     { type: signatureSchema, default: () => ({}) },
  ttdSaksi:      { type: signatureSchema, default: () => ({}) },
  ttdBidan:      { type: signatureSchema, default: () => ({}) },

  // Salinan identitas klinik saat surat terbit — supaya surat lama tidak
  // ikut berubah kalau pengaturan kop diubah belakangan
  kopSnapshot: {
    baris1: String, baris2: String, alamat: String, telepon: String,
    kota: String, namaBidan: String,
  },

  status:        { type: String, enum: ["draft", "signed"], default: "draft" },
  signedAt:      { type: Date },
  unsignedAt:    { type: Date },     // jejak kalau TTD pernah dibatalkan
}, { timestamps: true });

consentSchema.index({ tanggalSurat: -1 });
consentSchema.index({ "penandatangan.nik": 1 });
```

```js
// src/models/consentSetting.js — dokumen tunggal, _id: "consent"
const consentSettingSchema = new mongoose.Schema({
  _id:            { type: String, default: "consent" },
  kopBaris1:      { type: String, default: "BIDAN PRAKTEK MANDIRI" },
  kopBaris2:      { type: String, default: "KLINIK IYA" },
  alamat:         { type: String, default: "Jln. Kumersot Tendeki – Bitung" },
  telepon:        { type: String, default: "082291237607" },
  kota:           { type: String, default: "Bitung" },
  namaBidan:      { type: String, default: "Bdn. SAMSIA REMBANG, SST" },
  polaNomor:      { type: String, default: "{urut2}/IC-KLN-IYA/{romawi}/{tahun}" },
  resetPenomoran: { type: String, enum: ["tahunan", "bulanan", "tidak_pernah"], default: "tahunan" },
  tampilkanSaksi: { type: Boolean, default: true },
}, { timestamps: true, _id: false });
```

```js
// src/models/counter.js
const counterSchema = new mongoose.Schema({
  _id: { type: String },      // "consent-2026" | "consent-2026-02" | "consent"
  seq: { type: Number, default: 0 },
});
```

**Kenapa ada `kopSnapshot`:** kalau nomor telepon klinik berubah tahun depan, surat yang sudah dicetak dan ditandatangani tahun ini harus tetap memuat telepon yang lama. Menyimpan salinannya di dokumen surat adalah cara paling sederhana untuk itu — sama alasannya dengan kenapa data pasien diketik lepas (§1).

---

## 8. API

Mengikuti pola **action-based** seperti Kehamilan & Persalinan (pola yang lebih baik, lihat CLAUDE.md).

```text
GET    /api/consent               # list — page, limit, search, status, tahun, sort
POST   /api/consent               # buat draft (nomor surat BELUM terbit)
GET    /api/consent/[id]          # detail
PATCH  /api/consent/[id]          # action-based, lihat bawah
DELETE /api/consent/[id]          # hapus permanen
GET    /api/consent/summary       # jumlah: draft, signed, bulan ini
GET    /api/consent/settings      # baca pengaturan (buat default kalau belum ada)
PATCH  /api/consent/settings      # simpan pengaturan + atur nomor berikutnya
GET    /api/consent/tindakan      # daftar tindakan unik untuk saran ketik
```

Payload PATCH surat:

```js
{ action: "updateData", data: { ...field } }          // ditolak kalau status = signed
{ action: "sign",       ttdPasien: {...}, ttdSaksi: {...}, ttdBidan: {...} }
{ action: "unsign" }                                   // buka kunci, catat unsignedAt
```

Payload PATCH pengaturan:

```js
{ ...field pengaturan, nomorBerikutnya: 15 }           // nomorBerikutnya opsional
```

**Kapan nomor surat terbit:** saat `action: "sign"` berhasil, bukan saat draft dibuat. Supaya draft yang dibuang tidak memakan nomor.

Validasi di server:

- `sign` ditolak kalau `ttdPasien.dataUrl` atau `ttdBidan.dataUrl` kosong
- `sign` ditolak kalau `saksiDisertakan` aktif tapi `ttdSaksi.dataUrl` kosong
- `updateData` ditolak dengan 409 kalau status sudah `signed`
- `dataUrl` wajib cocok pola `data:image/png;base64,...` dan dibatasi ~200 KB
- Pengaturan: reset bulanan wajib disertai `{bulan}` atau `{romawi}` di pola (§2.3)
- Pengaturan: pola wajib memuat salah satu token `{urut*}`, kalau tidak semua surat akan bernomor sama
- `DELETE` pada surat `signed` wajib menyertakan `?konfirmasi=<nomorSurat>` yang cocok
- Semua list query lewat `parsePagination()` + `escapeRegex()` dari `src/lib/query.js`
- Semua respons pakai `successResponse` / `paginatedResponse` / `errorResponse`

---

## 9. Struktur File

```text
src/models/consent.js                       # model surat
src/models/consentSetting.js                # pengaturan (dokumen tunggal)
src/models/counter.js                       # penomoran atomik
src/lib/nomorSurat.js                       # token → nomor, romawi, kunci penghitung

src/components/SignaturePad.js              # canvas TTD (dipakai 3x)
src/components/SignatureModal.js            # modal "silakan tanda tangan"
src/components/ConsentForm.js               # form isi surat
src/components/DeleteConsentModal.js        # konfirmasi bertingkat (§3.4)

src/app/api/consent/route.js
src/app/api/consent/[id]/route.js
src/app/api/consent/summary/route.js
src/app/api/consent/settings/route.js
src/app/api/consent/tindakan/route.js

src/app/dashboard/consent/page.js           # daftar + kartu ringkasan + cari
src/app/dashboard/consent/new/page.js       # buat baru
src/app/dashboard/consent/[id]/page.js      # detail + tanda tangan + tombol cetak
src/app/dashboard/consent/pengaturan/page.js # kop, pola nomor, saksi + pratinjau

src/app/print/layout.js                     # layout polos, tanpa sidebar
src/app/print/consent/[id]/page.js          # halaman siap cetak

public/kop/logo-klinik.png                  # logo biru dari docx
```

Halaman cetak sengaja ditaruh di luar `/dashboard` supaya tidak kebawa sidebar. Middleware tetap melindunginya karena bukan public path.

Tambahan satu entri di sidebar `src/app/dashboard/layout.js`:

```js
{ href: "/dashboard/consent", label: "Informed Consent", icon: <FaFileSignature />,
  activeColor: "text-amber-400", activeBg: "bg-amber-500/10", dot: "bg-amber-400" }
```

---

## 10. Komponen Tanda Tangan

Detail teknis yang gampang keliru kalau tidak direncanakan:

- **Pointer Events** (`pointerdown/move/up`), bukan mouse atau touch terpisah — satu kode untuk jari, stylus, dan mouse
- `touch-action: none` di canvas, supaya menggambar tidak ikut men-scroll halaman di HP
- Canvas di-skala mengikuti `devicePixelRatio` supaya garis tidak pecah di layar HP
- Tombol **Ulangi** (hapus) dan **Simpan**
- Sebelum disimpan, area kosong di sekeliling coretan dipangkas lalu diperkecil ke lebar maks 600px
- Tombol Simpan mati kalau kanvas masih kosong
- Di HP: modal tanda tangan dibuka **mode lanskap penuh** — area tanda tangan potret di HP terlalu sempit untuk tanda tangan yang wajar

Ini komponen yang paling menentukan enak-tidaknya fitur dipakai. Layak dikerjakan pelan-pelan.

---

## 11. Halaman Cetak

- Ukuran A4, `@page { size: A4; margin: 15mm; }`
- `@media print` menyembunyikan semua tombol; hanya isi surat yang tercetak
- Blok tanda tangan diberi `break-inside: avoid` supaya tidak terbelah dua halaman
- Tombol **Cetak / Simpan PDF** memanggil `window.print()`
- Warna dibuat hitam-putih untuk cetak, agar hemat tinta dan terbaca di printer laser
- Isi kop diambil dari `kopSnapshot` milik surat, bukan dari pengaturan terkini
- Kolom tanda tangan menyesuaikan `saksiDisertakan` — dua kolom atau tiga kolom
- Draft yang belum ditandatangani diberi watermark **"DRAFT — BELUM DITANDATANGANI"** supaya tidak salah edar

---

## 12. Urutan Pengerjaan

| Fase | Isi | Hasil yang bisa dilihat |
|---|---|---|
| **1** | Model surat + pengaturan + counter, `lib/nomorSurat.js`, API lengkap | API bisa dites, nomor surat terbit benar |
| **2** | Halaman pengaturan + pratinjau nomor | Pola nomor & kop bisa diatur sendiri |
| **3** | `SignaturePad` + modal | Bisa tanda tangan di layar dan tersimpan |
| **4** | Halaman daftar, buat baru, detail + sidebar | Fitur utuh bisa dipakai bidan |
| **5** | Halaman cetak + tombol PDF | Surat bisa dicetak / disimpan PDF |
| **6** | Modal hapus bertingkat | Pengaman dokumen tertandatangani |
| **7** *(opsional)* | Tombol "Download PDF" satu klik via `@react-pdf/renderer` | Tanpa lewat dialog print |

Fase 1–5 sudah membuat fiturnya berguna. Fase 6–7 penyempurnaan.

Karena modul ini tidak menyentuh modul lain sama sekali, pengerjaannya **tidak berisiko merusak fitur yang sudah jalan** — tidak ada file modul lain yang diubah, kecuali satu baris tambahan di sidebar.

---

## 13. Test

Ditambahkan ke `scripts/api-test.mjs` yang sudah ada (`npm run test:api`):

**Penomoran**

- Pola default menghasilkan `01/IC-KLN-IYA/II/2026` dengan benar
- Semua token (`{urut}`, `{urut2}`, `{urut3}`, `{bulan}`, `{romawi}`, `{tahun}`, `{tahun2}`) diterjemahkan benar
- Angka romawi benar untuk 12 bulan (I sampai XII)
- Nomor urut naik berurutan
- Reset **tahunan**: ganti tahun → kembali ke 1
- Reset **bulanan**: ganti bulan → kembali ke 1
- Reset **tidak pernah**: terus naik
- 5 permintaan tanda tangan bersamaan → 5 nomor berbeda, tidak ada yang kembar
- "Nomor berikutnya" diisi 15 → surat berikutnya bernomor 15
- Nomor tidak terbit selama masih draft
- Nomor yang sudah terpakai tidak dipakai ulang setelah suratnya dihapus
- Mengubah pola tidak mengubah nomor surat lama

**Validasi pengaturan**

- Reset bulanan tanpa `{bulan}`/`{romawi}` → ditolak 400
- Pola tanpa token `{urut*}` → ditolak 400

**Surat**

- `sign` ditolak kalau TTD pasien atau bidan kosong
- `sign` ditolak kalau saksi disertakan tapi TTD saksi kosong
- `sign` berhasil kalau saksi dimatikan walau TTD saksi kosong
- `updateData` ditolak 409 setelah status `signed`
- `unsign` mengembalikan ke draft tapi nomor surat tetap
- `dataUrl` bukan PNG ditolak
- `kopSnapshot` tersimpan saat tanda tangan, dan tidak berubah walau pengaturan diubah

**Hapus**

- Draft bisa dihapus langsung
- Surat `signed` tanpa parameter konfirmasi → ditolak
- Surat `signed` dengan nomor konfirmasi salah → ditolak
- Surat `signed` dengan nomor konfirmasi benar → terhapus

**Halaman**

- `/dashboard/consent` dan `/dashboard/consent/pengaturan` membalas 200
- `/print/consent/[id]` membalas 200 dan memuat nomor surat
- Tanpa cookie, halaman cetak tetap ditolak

---

## 14. Catatan Jujur

- **Saya bukan ahli hukum kesehatan.** Struktur surat di §5 saya susun dari format informed consent yang umum dan daftar penjelasan wajib di Permenkes 290/2008. Keabsahannya untuk keperluan klinik Anda tetap perlu diperiksa oleh yang berwenang.
- **Tanda tangan di layar bukan tanda tangan digital bersertifikat.** Nilainya setara tanda tangan basah yang dipindai — untuk dokumentasi klinik memadai, tapi bukan alat bukti elektronik yang kuat menurut UU ITE. Kalau nanti butuh yang bersertifikat, itu proyek terpisah.
- **Hapus permanen berarti benar-benar hilang.** Saya sudah pasang pengaman bertingkat, tapi tidak ada pemulihan. Kalau suatu saat berubah pikiran, menambahkan tong sampah setelah fitur jalan jauh lebih repot daripada memasangnya sekarang.
- **Menyimpan gambar di MongoDB ada batasnya.** Perhitungan saya ±100 KB per surat aman untuk skala klinik. Kalau sudah puluhan ribu surat, perlu dipindah ke penyimpanan file terpisah.
- Estimasi kasar: **Fase 1–5 sekitar 20–24 file baru/berubah.** Bagian paling makan waktu bukan API-nya, tapi komponen tanda tangan dan tata letak halaman cetak.

---

## 15. Referensi

- Template kop & nomor: `C:\Users\sayle\OneDrive\ドキュメント\Klinik\Surat_Permintaan_Alkon_Klinik_IYA.docx`
- Cap klinik (tidak dipakai di fitur ini): `C:\Users\sayle\OneDrive\ドキュメント\Klinik\Cap.png`
- Pola modul yang diikuti: `docs/modul-kehamilan.md`, `docs/modul-persalinan.md`
- Konvensi kode: `CLAUDE.md`

---

## 16. Perubahan dari Revisi 1

Menindaklanjuti enam jawaban Anda:

| # | Jawaban Anda | Yang berubah |
|---|---|---|
| 1 | Nomor bisa diatur & reset per bulan/tahun | **Halaman pengaturan baru** (§2) dengan pola bertoken, pilihan reset, atur nomor berikutnya, dan pratinjau langsung |
| 2 | Ejaan `Kumersot Tendeki` | Diperbaiki di §4, kota Bitung ditambahkan, dan seluruh kop jadi bisa diedit sendiri |
| 3 | Hapus permanen, tapi beri peringatan | Soft delete dibuang. Diganti **konfirmasi bertingkat** (§3.4) — surat tertandatangani wajib ketik ulang nomornya |
| 4 | Format umum yang profesional | §5 dipertahankan dan dirapikan; permintaan contoh dari Dinkes/BKKBN dihapus |
| 5 | Nama bidan pakai `Bdn.` | Default jadi `Bdn. SAMSIA REMBANG, SST`, dan bisa diubah lewat pengaturan |
| 6 | Saksi bisa dinyalakan/dimatikan | Bisa. **Dua lapis** (§3.2): saklar global di pengaturan + centang per surat |

Satu hal yang saya tambahkan sendiri tanpa diminta: **`kopSnapshot`** (§7). Tanpa ini, mengubah pengaturan kop akan ikut mengubah tampilan surat-surat lama yang sudah ditandatangani — dan itu tidak benar untuk dokumen arsip.
