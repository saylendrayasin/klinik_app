# Modul Persalinan (Intrapartum & Nifas)

Dokumen rencana lengkap modul Persalinan. Ikuti pola modul Kehamilan, KB, dan Pasien yang sudah ada.

---

## 1. Gambaran Umum

Mencatat data persalinan ibu secara mandiri + riwayat kunjungan nifas (post-partum). Tidak ada relasi ke modul Kehamilan — semua field diisi manual oleh bidan. Setiap persalinan memiliki satu data kelahiran bayi dan banyak kunjungan nifas.

**Route prefix:** `/dashboard/persalinan`  
**API prefix:** `/api/persalinan`  
**Model:** `src/models/persalinan.js`

---

## 2. Warna Base (UI Color)

| Module | Base Color | Tailwind |
|---|---|---|
| Pasien | Biru | `blue-600` / `blue-700` |
| KB | Ungu | `purple-600` / `purple-700` |
| Kehamilan | Rose | `rose-600` / `rose-700` |
| **Persalinan** | **Emerald** | **`emerald-600` / `emerald-700`** |
| Config | Slate | `slate-600` / `slate-700` |

Terapkan `emerald-600` ke: icon header, tombol primary, focus ring input (`focus:ring-emerald-400`), tab aktif (`bg-emerald-100 text-emerald-700 border-b-2 border-emerald-600`), spinner (`border-emerald-500`), badge pill (`bg-emerald-100 text-emerald-700`), back link (`text-emerald-600 hover:text-emerald-800`), table header (`bg-emerald-50 border-emerald-100`), mobile card border (`border-l-4 border-emerald-500`).

---

## 3. Konsep: Kunjungan Nifas Anjuran vs Aktual

Mirip dengan K1–K6 di Kehamilan, Persalinan punya jadwal kunjungan nifas (KF) yang direkomendasikan Kemenkes.

### Kunjungan Nifas Aktual
Kunjungan yang benar-benar terjadi — diinput bidan. Disimpan di `visits[]`.

### Kunjungan Nifas Anjuran (KF1–KF4)
**Tidak disimpan di DB.** Dihitung dari `tanggalPersalinan`.

| No | Window | Estimasi Tanggal | Target |
|---|---|---|---|
| KF1 | 6 jam – 2 hari | `tanggalPersalinan + 1 hari` | Pemantauan awal pasca salin |
| KF2 | 3 – 7 hari | `tanggalPersalinan + 5 hari` | Cek infeksi, ASI, involusi uterus |
| KF3 | 8 – 28 hari | `tanggalPersalinan + 14 hari` | Evaluasi nifas lanjutan |
| KF4 | 29 – 42 hari | `tanggalPersalinan + 35 hari` | Kunjungan nifas terakhir, KB pasca salin |

Status "Terpenuhi" jika ada kunjungan aktual yang `date` masuk window masing-masing KF.

### Tampilan di UI

**Tab Kunjungan — Timeline Anjuran vs Aktual:**

```
  KF1  ✅ AKTUAL     05 Jan 2025  (1 hari pasca salin)  TD: 110/70  TFU: 2 jari bawah pusat
         ↓ Jadwal KF2: ~09 Jan 2025

  KF2  ✅ AKTUAL     08 Jan 2025  (4 hari pasca salin)  Lokhia: Rubra  ASI: Lancar
         ↓ Jadwal KF3: ~18 Jan 2025

  KF3  ⏳ ANJURAN    ~18 Jan 2025 (window: 8–28 hari)   ← abu-abu / dashed

  KF4  ⏳ ANJURAN    ~08 Feb 2025 (window: 29–42 hari)  ← abu-abu / dashed
```

- Row aktual: background putih/emerald, data klinis lengkap
- Row anjuran: background abu-abu, dashed border, hanya tampil tanggal estimasi + window
- Jika jadwal terlewat → badge "Terlambat X hari"

**Kalender:**
- Kunjungan nifas aktual: titik `emerald-500` solid
- Jadwal kunjungan berikutnya: titik `emerald-300` ring saja (tidak solid)
- Tanggal persalinan: titik `amber-500` besar (milestone utama)

---

## 4. Kalender Persalinan

Salin `CalendarKehamilan.js` → `CalendarPersalinan.js`.

| Marker | Style | Sumber Data |
|---|---|---|
| Kunjungan nifas aktual | `bg-emerald-500 ring-emerald-300` solid | `visits[].date` |
| Jadwal nifas berikutnya | `border-2 border-emerald-400` ring, transparan | Dari window KF berikutnya yang belum terpenuhi |
| Tanggal persalinan | `bg-amber-500 ring-amber-200` solid besar | `persalinan.tanggalPersalinan` |

Legend bawah kalender: chip "Kunjungan Nifas" + chip "Jadwal Berikutnya" + chip "Tanggal Persalinan".

Detail panel klik tanggal:
- Jika tanggal = kunjungan nifas → tampilkan: nomor KF, hari pasca salin, kondisi ibu, TD, TFU, lokhia, ASI, kondisi bayi, catatan
- Jika tanggal = tanggal persalinan → tampilkan: ringkasan persalinan (jenis, penolong, data bayi)

---

## 5. Dashboard Summary Cards (List Page)

4 kartu ringkasan di atas tabel:

```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Total Nifas    │ │  Nifas Aktif    │ │  Kunjungan      │ │  Perlu          │
│  Bulan Ini [N]  │ │  [N]            │ │  Terlewat [N] ⚠️│ │  Perhatian [N]🔴│
│  emerald badge  │ │  emerald badge  │ │  orange badge   │ │  red badge      │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

| Kartu | Kondisi |
|---|---|
| Total Nifas Bulan Ini | `tanggalPersalinan` dalam bulan & tahun saat ini |
| Nifas Aktif | `status === "aktif"` (masih dalam masa 42 hari nifas) |
| Kunjungan Terlewat | `status === "aktif"` + estimasi tanggal KF berikutnya sudah lewat hari ini |
| Perlu Perhatian | Ada komplikasi ibu/bayi, BBLR, atau Apgar 5 menit < 7 |

Klik kartu → filter list otomatis. Didukung `GET /api/persalinan/summary`.

---

## 6. Alert / Warning Flags

### Di List Page — badge di baris tabel

| Flag | Kondisi | Badge |
|---|---|---|
| 🔴 Komplikasi | `komplikasiIbu` atau `bayi.komplikasiBayi` tidak kosong | `bg-red-100 text-red-700` |
| 🔴 BBLR | `bayi.beratLahir < 2500` gram | `bg-red-100 text-red-700` |
| 🟠 Apgar Rendah | `bayi.nilaiApgar5 < 7` | `bg-orange-100 text-orange-700` |
| 🟡 Nifas Terlewat | Estimasi KF berikutnya sudah lewat, status aktif | `bg-yellow-100 text-yellow-700` |
| 🟢 Nifas Selesai | `status === "selesai"` | `bg-emerald-100 text-emerald-700` |

### Di Halaman Detail — banner alert di atas tab

| Kondisi | Pesan |
|---|---|
| BBLR (`bayi.beratLahir < 2500 gram`) | "⚠️ Bayi BBLR — berat lahir [X] gram, pantau kondisi bayi" |
| Apgar 5 menit < 7 | "⚠️ Nilai Apgar 5 menit [X] — evaluasi kondisi neonatus" |
| Perdarahan > 500 mL | "⚠️ Perdarahan banyak [X] mL — pantau kondisi ibu" |
| `komplikasiIbu` tidak kosong | "⚠️ Tercatat komplikasi ibu: [komplikasi]" |
| Kunjungan KF terlewat | "⚠️ Jadwal kunjungan nifas [KFn] belum terpenuhi" |
| Masa nifas >42 hari, status masih aktif | "⚠️ Masa nifas >42 hari — perbarui status persalinan" |

---

## 7. Duplicate Guard (Saat Create)

```
POST /api/persalinan
→ jika NIK + tanggalPersalinan sudah ada:
   return 409 { message: "Record persalinan dengan NIK dan tanggal ini sudah ada." }
```

Flag `force: true` untuk override (data entry retrospektif / koreksi).

---

## 8. Skema Data

### 8a. Data Ibu & Persalinan (level dokumen)

| Field | Type | Input | Keterangan |
|---|---|---|---|
| `name` | String | Manual | Nama lengkap ibu |
| `nik` | String | Manual | NIK ibu |
| `dateOfBirth` | Date | Manual | Tanggal lahir ibu |
| `address` | String | Manual | Alamat ibu |
| `phone` | String | Manual | No. HP (opsional) |
| `bloodType` | String | Manual | A / B / AB / O |
| `gravida` | Number | Manual | Kehamilan ke-berapa (G) |
| `para` | Number | Manual | Sudah melahirkan berapa kali termasuk ini (P) |
| `abortus` | Number | Manual | Riwayat keguguran (A) |
| `tanggalPersalinan` | Date | Manual | Tanggal persalinan — kunci semua kalkulasi nifas |
| `usiaKehamilanSaatPersalinan` | Number | Manual | Usia kehamilan saat persalinan (minggu) |
| `jenisPersalinan` | String | Manual | `normal` / `sc` / `vakum` / `forcep` |
| `penolongPersalinan` | String | Manual | `bidan` / `dokter` / `paraji` / `lainnya` |
| `tempatPersalinan` | String | Manual | `klinik` / `puskesmas` / `rs` / `rumah` / `lainnya` |
| `lamaPersalinanKala1` | Number | Manual | Durasi Kala I (menit) |
| `lamaPersalinanKala2` | Number | Manual | Durasi Kala II (menit) |
| `lamaPersalinanKala3` | Number | Manual | Durasi Kala III (menit) |
| `lamaPersalinanKala4` | Number | Manual | Durasi Kala IV — 2 jam observasi (menit) |
| `tekananDarahSistol` | Number | Manual | TD sistolik ibu saat persalinan (mmHg) |
| `tekananDarahDiastol` | Number | Manual | TD diastolik ibu saat persalinan (mmHg) |
| `beratBadan` | Number | Manual | BB ibu saat persalinan (kg) |
| `pendarahan` | Number | Manual | Jumlah perdarahan (mL). Alert jika > 500 |
| `kondisiIbu` | String | Manual | `baik` / `lemah` / `buruk` |
| `komplikasiIbu` | String | Manual | Deskripsi komplikasi ibu (opsional) |
| `tindakanIbu` | String | Manual | Tindakan / obat pada ibu |
| `bayi` | Object | — | Data bayi (lihat 8b) |
| `status` | String | Manual | `aktif` / `selesai` / `rujuk` / `meninggal` |
| `notes` | String | Manual | Catatan tambahan persalinan |
| `visits` | Array | — | Kunjungan nifas (lihat 8c) |

### 8b. Data Bayi (embedded object `bayi`)

| Field | Type | Input | Keterangan |
|---|---|---|---|
| `jenisKelamin` | String | Manual | `laki-laki` / `perempuan` / `tidak_diketahui` |
| `beratLahir` | Number | Manual | Berat lahir bayi (gram). BBLR jika < 2500 |
| `panjangBadan` | Number | Manual | Panjang badan (cm) |
| `lingkarKepala` | Number | Manual | Lingkar kepala (cm) |
| `lingkarDada` | Number | Manual | Lingkar dada (cm) |
| `nilaiApgar1` | Number | Manual | Skor Apgar menit ke-1 (0–10) |
| `nilaiApgar5` | Number | Manual | Skor Apgar menit ke-5 (0–10). Alert jika < 7 |
| `nilaiApgar10` | Number | Manual | Skor Apgar menit ke-10 (0–10, opsional) |
| `kondisiBayi` | String | Manual | `hidup` / `meninggal` / `iufd` |
| `komplikasiBayi` | String | Manual | Deskripsi komplikasi bayi (opsional) |
| `tindakanBayi` | String | Manual | Resusitasi / tindakan lain pada bayi |
| `imd` | Boolean | Manual | Inisiasi Menyusu Dini berhasil (true/false) |

### 8c. Kunjungan Nifas (embedded `visits[]`)

| Field | Type | Input | Keterangan |
|---|---|---|---|
| `date` | Date | Manual | Tanggal kunjungan nifas |
| `hariPascaSalin` | Number | **Auto** | `floor((date - tanggalPersalinan) / 1hari)` |
| `nomorKF` | Number | **Auto** | KF1/KF2/KF3/KF4 — dari window `hariPascaSalin` |
| `tekananDarahSistol` | Number | Manual | Sistolik (mmHg) |
| `tekananDarahDiastol` | Number | Manual | Diastolik (mmHg) |
| `nadi` | Number | Manual | Denyut nadi (bpm) |
| `suhu` | Number | Manual | Suhu tubuh (°C) |
| `tfu` | String | Manual | Tinggi Fundus Uteri, contoh: "2 jari bawah pusat" |
| `lokhia` | String | Manual | `rubra` / `sanguinolenta` / `serosa` / `alba` |
| `kondisiPerineum` | String | Manual | `baik` / `edema` / `infeksi` / `tidak_ada_luka` |
| `kondisiLukaOperasi` | String | Manual | `baik` / `kemerahan` / `basah` / `infeksi` (hanya tampil jika SC) |
| `asi` | String | Manual | `lancar` / `kurang` / `tidak_ada` |
| `kondisiBayi` | String | Manual | `baik` / `ikterus` / `infeksi` / `rujuk` |
| `beratBayiSekarang` | Number | Manual | BB bayi saat kunjungan nifas (gram) |
| `pemberianVitaminA` | Boolean | Manual | Vitamin A ibu sudah diberikan |
| `pemberianFe` | Boolean | Manual | Tablet Fe sudah diberikan |
| `rencanKb` | String | Manual | `belum` / `kondom` / `pil` / `suntik` / `iud` / `implant` / `mow` / `mop` |
| `keluhan` | String | Manual | Keluhan ibu |
| `tindakan` | String | Manual | Tindakan / obat |
| `notes` | String | Manual | Catatan tambahan |

---

## 9. Model Mongoose (`src/models/persalinan.js`)

```js
import mongoose from "mongoose";

const bayiSchema = new mongoose.Schema(
  {
    jenisKelamin: {
      type: String,
      enum: ["laki-laki", "perempuan", "tidak_diketahui"],
      default: "tidak_diketahui",
    },
    beratLahir: { type: Number },
    panjangBadan: { type: Number },
    lingkarKepala: { type: Number },
    lingkarDada: { type: Number },
    nilaiApgar1: { type: Number, min: 0, max: 10 },
    nilaiApgar5: { type: Number, min: 0, max: 10 },
    nilaiApgar10: { type: Number, min: 0, max: 10 },
    kondisiBayi: {
      type: String,
      enum: ["hidup", "meninggal", "iufd"],
      default: "hidup",
    },
    komplikasiBayi: { type: String },
    tindakanBayi: { type: String },
    imd: { type: Boolean, default: false },
  },
  { _id: false }
);

const visitNifasSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    hariPascaSalin: { type: Number },
    nomorKF: { type: Number, enum: [1, 2, 3, 4] },
    tekananDarahSistol: { type: Number },
    tekananDarahDiastol: { type: Number },
    nadi: { type: Number },
    suhu: { type: Number },
    tfu: { type: String },
    lokhia: {
      type: String,
      enum: ["rubra", "sanguinolenta", "serosa", "alba"],
    },
    kondisiPerineum: {
      type: String,
      enum: ["baik", "edema", "infeksi", "tidak_ada_luka"],
    },
    kondisiLukaOperasi: {
      type: String,
      enum: ["baik", "kemerahan", "basah", "infeksi"],
    },
    asi: {
      type: String,
      enum: ["lancar", "kurang", "tidak_ada"],
    },
    kondisiBayi: {
      type: String,
      enum: ["baik", "ikterus", "infeksi", "rujuk"],
    },
    beratBayiSekarang: { type: Number },
    pemberianVitaminA: { type: Boolean, default: false },
    pemberianFe: { type: Boolean, default: false },
    rencanKb: {
      type: String,
      enum: ["belum", "kondom", "pil", "suntik", "iud", "implant", "mow", "mop"],
      default: "belum",
    },
    keluhan: { type: String },
    tindakan: { type: String },
    notes: { type: String },
  },
  { _id: true }
);

const persalinanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    nik: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    address: { type: String },
    phone: { type: String },
    bloodType: { type: String, enum: ["A", "B", "AB", "O", ""] },
    gravida: { type: Number, default: 1, min: 1 },
    para: { type: Number, default: 1, min: 1 },
    abortus: { type: Number, default: 0, min: 0 },
    tanggalPersalinan: { type: Date, required: true },
    usiaKehamilanSaatPersalinan: { type: Number },
    jenisPersalinan: {
      type: String,
      enum: ["normal", "sc", "vakum", "forcep"],
      default: "normal",
    },
    penolongPersalinan: {
      type: String,
      enum: ["bidan", "dokter", "paraji", "lainnya"],
      default: "bidan",
    },
    tempatPersalinan: {
      type: String,
      enum: ["klinik", "puskesmas", "rs", "rumah", "lainnya"],
      default: "klinik",
    },
    lamaPersalinanKala1: { type: Number },
    lamaPersalinanKala2: { type: Number },
    lamaPersalinanKala3: { type: Number },
    lamaPersalinanKala4: { type: Number },
    tekananDarahSistol: { type: Number },
    tekananDarahDiastol: { type: Number },
    beratBadan: { type: Number },
    pendarahan: { type: Number },
    kondisiIbu: {
      type: String,
      enum: ["baik", "lemah", "buruk"],
      default: "baik",
    },
    komplikasiIbu: { type: String },
    tindakanIbu: { type: String },
    bayi: { type: bayiSchema, default: () => ({}) },
    status: {
      type: String,
      enum: ["aktif", "selesai", "rujuk", "meninggal"],
      default: "aktif",
    },
    notes: { type: String },
    visits: [visitNifasSchema],
  },
  { timestamps: true }
);

persalinanSchema.index({ nik: 1, tanggalPersalinan: 1 }, { unique: true });

export const Persalinan =
  mongoose.models.Persalinan || mongoose.model("Persalinan", persalinanSchema);
```

---

## 10. API Routes

```
GET    /api/persalinan              # list — page, limit, search, sort, status, bulan, tahun
POST   /api/persalinan              # create (duplicate guard NIK+tanggal)
GET    /api/persalinan/summary      # counts untuk summary cards
GET    /api/persalinan/[id]         # detail 1 record
PATCH  /api/persalinan/[id]         # update data / addVisit / editVisit / deleteVisit / updateStatus
DELETE /api/persalinan/[id]         # hapus record
GET    /api/persalinan/export       # export Excel (?mode=persalinan|nifas&from=&to=)
```

### PATCH payload

```js
{ action: "addVisit",     visit: { date, nadi, tekananDarahSistol, ... } }
{ action: "editVisit",    visitId: "...", visit: { ... } }
{ action: "deleteVisit",  visitId: "..." }
{ action: "updateStatus", status: "selesai" }
{ action: "updateData",   data: { name, address, jenisPersalinan, ... } }
```

### POST — Auto-actions saat Create

1. Duplikat guard: `nik + tanggalPersalinan` sudah ada → 409.
2. Tidak ada side-effect ke modul lain — pure standalone insert.

### PATCH addVisit — Auto-calc fields

```js
visit.hariPascaSalin = Math.floor((new Date(visit.date) - new Date(persalinan.tanggalPersalinan)) / MS_PER_DAY);
visit.nomorKF = getKFNumber(visit.hariPascaSalin);
```

---

## 11. Sort & Filter di List Page

| Kontrol | Pilihan |
|---|---|
| Search | Nama / NIK |
| Filter Status | Semua · Aktif · Selesai · Rujuk · Meninggal |
| Filter Bulan/Tahun | Dropdown bulan + tahun (filter `tanggalPersalinan`) |
| Sort | Nama · Tanggal Persalinan Terbaru · Kunjungan Nifas Terbaru |

---

## 12. Export Excel — 2 Mode + Range Tanggal

```
GET /api/persalinan/export?mode=persalinan&from=2025-01-01&to=2025-01-31
GET /api/persalinan/export?mode=nifas&from=2025-01-01&to=2025-01-31
```

**Modal export:** pilih mode → muncul date range picker (dari–sampai) → download.

---

### Mode `persalinan` — Data Persalinan per Range

Satu baris per persalinan. Filter `tanggalPersalinan` dalam range.

| Kolom | Sumber |
|---|---|
| Tanggal Persalinan | `persalinan.tanggalPersalinan` |
| Nama Ibu | `persalinan.name` |
| NIK | `persalinan.nik` |
| Tanggal Lahir | `persalinan.dateOfBirth` |
| Alamat | `persalinan.address` |
| G/P/A | `G{gravida}P{para}A{abortus}` |
| UK Saat Persalinan (mg) | `persalinan.usiaKehamilanSaatPersalinan` |
| Jenis Persalinan | `persalinan.jenisPersalinan` |
| Penolong | `persalinan.penolongPersalinan` |
| Tempat | `persalinan.tempatPersalinan` |
| TD Sistolik / Diastolik | `persalinan.tekananDarahSistol` / `Diastol` |
| Perdarahan (mL) | `persalinan.pendarahan` |
| Kondisi Ibu | `persalinan.kondisiIbu` |
| Komplikasi Ibu | `persalinan.komplikasiIbu` |
| Jenis Kelamin Bayi | `persalinan.bayi.jenisKelamin` |
| Berat Lahir (gram) | `persalinan.bayi.beratLahir` |
| Panjang Badan (cm) | `persalinan.bayi.panjangBadan` |
| Apgar 1 / 5 | `persalinan.bayi.nilaiApgar1` / `nilaiApgar5` |
| IMD | `persalinan.bayi.imd` |
| Kondisi Bayi | `persalinan.bayi.kondisiBayi` |
| Komplikasi Bayi | `persalinan.bayi.komplikasiBayi` |
| Total Kunjungan Nifas | `visits.length` |
| Status | `persalinan.status` |

---

### Mode `nifas` — Riwayat Kunjungan Nifas per Range

Satu baris per kunjungan nifas. Filter `visits.date` dalam range.

| Kolom | Sumber |
|---|---|
| Tanggal Kunjungan | `visit.date` |
| Nomor KF | `KF{visit.nomorKF}` |
| Hari Pasca Salin | `visit.hariPascaSalin` |
| TD Sistol / Diastol | `visit.tekananDarahSistol` / `Diastol` |
| Nadi (bpm) | `visit.nadi` |
| Suhu (°C) | `visit.suhu` |
| TFU | `visit.tfu` |
| Lokhia | `visit.lokhia` |
| Kondisi Perineum / Luka | `visit.kondisiPerineum` atau `visit.kondisiLukaOperasi` |
| ASI | `visit.asi` |
| Kondisi Bayi | `visit.kondisiBayi` |
| BB Bayi Sekarang (gram) | `visit.beratBayiSekarang` |
| Vitamin A | `visit.pemberianVitaminA` |
| Tablet Fe | `visit.pemberianFe` |
| Rencana KB | `visit.rencanKb` |
| Keluhan | `visit.keluhan` |
| Tindakan | `visit.tindakan` |
| Catatan | `visit.notes` |
| Nama Ibu | `persalinan.name` |
| NIK | `persalinan.nik` |
| Tanggal Persalinan | `persalinan.tanggalPersalinan` |
| Jenis Persalinan | `persalinan.jenisPersalinan` |

---

## 13. Halaman UI — Struktur File

```
src/app/dashboard/persalinan/
  page.js                       # list + summary cards + filter + sort
  new/
    page.js                     # form tambah record persalinan baru (2-step)
  [id]/
    page.js                     # detail: tab Kalender | Edit Data | Data Bayi | Kunjungan Nifas
    PersalinanEditForm.js        # form edit data ibu & persalinan
    PersalinanBayiTab.js        # tampilkan + edit data bayi
    PersalinanVisitTab.js       # timeline KF anjuran + aktual + form tambah kunjungan
    CalendarPersalinan.js       # kalender + marker nifas + marker tanggal persalinan
```

---

## 14. Form Create — 2 Step

Form create dibagi 2 langkah karena fieldnya banyak. Tampilkan step indicator di atas.

### Step 1 — Data Ibu & Persalinan

| Field | Wajib | Note |
|---|---|---|
| Nama Lengkap | ✅ | Text |
| NIK | ✅ | Text |
| Tanggal Lahir | ✅ | Date |
| Alamat | | Textarea |
| No. HP | | Text |
| Golongan Darah | | Select A/B/AB/O |
| G / P / A | ✅ | 3 number input sejajar |
| Tanggal Persalinan | ✅ | Date — kunci kalkulasi nifas |
| UK Saat Persalinan (minggu) | | Number |
| Jenis Persalinan | ✅ | Select: Normal / SC / Vakum / Forcep |
| Penolong | ✅ | Select: Bidan / Dokter / Paraji / Lainnya |
| Tempat | ✅ | Select: Klinik / Puskesmas / RS / Rumah / Lainnya |
| Lama Persalinan Kala I–IV | | 4 number input (menit) dalam grid 2×2 |
| TD Sistolik / Diastolik | | 2 number input sejajar |
| BB Ibu (kg) | | Number |
| Perdarahan (mL) | | Number — border merah jika ≥ 500 |
| Kondisi Ibu | | Select: Baik / Lemah / Buruk |
| Komplikasi Ibu | | Textarea |
| Tindakan Ibu | | Textarea |
| Catatan | | Textarea |

### Step 2 — Data Bayi

| Field | Wajib | Note |
|---|---|---|
| Jenis Kelamin | ✅ | Select: Laki-laki / Perempuan / Tidak Diketahui |
| Berat Lahir (gram) | ✅ | Number — border merah jika < 2500 (BBLR) |
| Panjang Badan (cm) | | Number |
| Lingkar Kepala (cm) | | Number |
| Lingkar Dada (cm) | | Number |
| Apgar 1 Menit | | Number 0–10 |
| Apgar 5 Menit | | Number 0–10 — border merah jika < 7 |
| Apgar 10 Menit | | Number 0–10 (opsional) |
| IMD | | Checkbox: Inisiasi Menyusu Dini berhasil |
| Kondisi Bayi | ✅ | Select: Hidup / Meninggal / IUFD |
| Komplikasi Bayi | | Textarea |
| Tindakan Bayi | | Textarea |

Navigasi: tombol **Sebelumnya** + **Simpan**.

---

## 15. Form Tambah Kunjungan Nifas

| Field | Note |
|---|---|
| Tanggal Kunjungan | Date picker, required |
| Hari Pasca Salin | Read-only chip, auto-hitung real-time dari `tanggalPersalinan` |
| Nomor KF | Read-only badge KF1/KF2/KF3/KF4, auto dari `hariPascaSalin` |
| TD Sistolik / Diastolik | 2 number input sejajar |
| Nadi (bpm) | Number |
| Suhu (°C) | Number — border kuning jika > 38 |
| TFU | Text input bebas |
| Lokhia | Select: Rubra / Sanguinolenta / Serosa / Alba |
| Kondisi Perineum | Select: Baik / Edema / Infeksi / Tidak Ada Luka |
| Kondisi Luka Operasi | Select — **hanya tampil jika** `jenisPersalinan === "sc"` |
| ASI | Select: Lancar / Kurang / Tidak Ada |
| Kondisi Bayi | Select: Baik / Ikterus / Infeksi / Rujuk |
| BB Bayi Sekarang (gram) | Number |
| Pemberian Vitamin A | Checkbox |
| Pemberian Fe | Checkbox |
| Rencana KB Pasca Salin | Select: Belum / Kondom / Pil / Suntik / IUD / Implant / MOW / MOP |
| Keluhan | Textarea |
| Tindakan / Obat | Textarea |
| Catatan | Textarea |

---

## 16. Kalkulasi Helper

```js
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function calcHariPascaSalin(tanggalPersalinan, visitDate) {
  return Math.floor((new Date(visitDate) - new Date(tanggalPersalinan)) / MS_PER_DAY);
}

function getKFNumber(hariPascaSalin) {
  if (hariPascaSalin >= 0 && hariPascaSalin <= 2)  return 1;
  if (hariPascaSalin >= 3 && hariPascaSalin <= 7)  return 2;
  if (hariPascaSalin >= 8 && hariPascaSalin <= 28) return 3;
  if (hariPascaSalin >= 29 && hariPascaSalin <= 42) return 4;
  return null; // di luar masa nifas → simpan tanpa nomor KF
}

const KF_SCHEDULE = [
  { kf: 1, label: "KF1 (6 jam – 2 hari)",  windowStart: 0,  windowEnd: 2,  estimasiHari: 1  },
  { kf: 2, label: "KF2 (3 – 7 hari)",      windowStart: 3,  windowEnd: 7,  estimasiHari: 5  },
  { kf: 3, label: "KF3 (8 – 28 hari)",     windowStart: 8,  windowEnd: 28, estimasiHari: 14 },
  { kf: 4, label: "KF4 (29 – 42 hari)",    windowStart: 29, windowEnd: 42, estimasiHari: 35 },
];

function getKFSchedule(tanggalPersalinan) {
  return KF_SCHEDULE.map(({ kf, label, windowStart, windowEnd, estimasiHari }) => ({
    kf,
    label,
    windowStart: new Date(new Date(tanggalPersalinan).getTime() + windowStart * MS_PER_DAY),
    windowEnd:   new Date(new Date(tanggalPersalinan).getTime() + windowEnd   * MS_PER_DAY),
    estimasiTanggal: new Date(new Date(tanggalPersalinan).getTime() + estimasiHari * MS_PER_DAY),
  }));
}

function matchVisitsToKFSchedule(tanggalPersalinan, visits) {
  const schedule = getKFSchedule(tanggalPersalinan);
  const sorted = [...visits].sort((a, b) => new Date(a.date) - new Date(b.date));
  return schedule.map((s) => {
    const matched = sorted.find((v) => {
      const hari = calcHariPascaSalin(tanggalPersalinan, v.date);
      return hari >= s.windowStart && hari <= s.windowEnd;
    });
    return { ...s, aktual: matched || null };
  });
}

function getAlertFlags(persalinan) {
  const today = new Date();
  const hariSalin = calcHariPascaSalin(persalinan.tanggalPersalinan, today);
  const kfSchedule = matchVisitsToKFSchedule(persalinan.tanggalPersalinan, persalinan.visits || []);
  const kfTerlewat = kfSchedule.find(
    (s) => !s.aktual && today > s.estimasiTanggal && hariSalin >= s.windowStart
  );
  return {
    bblr:              (persalinan.bayi?.beratLahir ?? Infinity) < 2500,
    apgarRendah:       (persalinan.bayi?.nilaiApgar5 ?? Infinity) < 7,
    pendarahanBanyak:  (persalinan.pendarahan ?? 0) > 500,
    komplikasiIbu:     !!persalinan.komplikasiIbu,
    komplikasiBayi:    !!persalinan.bayi?.komplikasiBayi,
    kfTerlewat:        !!kfTerlewat,
    nifasMelewatiWaktu: hariSalin > 42 && persalinan.status === "aktif",
  };
}
```

---

## 17. Sidebar — Tambah Nav Item

Tambahkan item "Persalinan" di sidebar antara "Kehamilan" dan "Konfigurasi":

```jsx
// src/app/dashboard/layout.js — navItems array
{
  href: "/dashboard/persalinan",
  label: "Persalinan",
  icon: <Baby size={18} />,          // lucide-react
  activeColor: "text-emerald-400",
  activeBg: "bg-emerald-500/20",
  activeBorder: "border-l-2 border-emerald-400",
}
```

Icon alternatif: `HeartPulse` (lucide-react), `MdChildCare` (react-icons/md), `FaBaby` (react-icons/fa).

---

## 18. Urutan Implementasi

1. **Model** — `src/models/persalinan.js`
2. **API list + create** — `src/app/api/persalinan/route.js`
3. **API summary** — `src/app/api/persalinan/summary/route.js`
4. **API detail** — `src/app/api/persalinan/[id]/route.js`
5. **API export** — `src/app/api/persalinan/export/route.js`
6. **Halaman list** — `page.js` (summary cards + tabel + filter)
7. **Halaman baru (2-step form)** — `new/page.js`
8. **Halaman detail** — `[id]/page.js` (4 tab)
9. **PersalinanVisitTab** — timeline KF anjuran vs aktual
10. **CalendarPersalinan** — kalender + markers
11. **Tambah ke sidebar**

---

## 19. Catatan Penting

- Module ini **standalone** — tidak ada koneksi ke modul Kehamilan.
- `usiaKehamilanSaatPersalinan` diisi manual oleh bidan, bukan auto-calc.
- `hariPascaSalin` dan `nomorKF` selalu auto-calc server-side saat `addVisit` — tidak diinput user.
- `kondisiLukaOperasi` hanya tampil di form jika `jenisPersalinan === "sc"`.
- Kunjungan nifas di luar window 0–42 hari (`getKFNumber` → `null`) tetap bisa disimpan — tampilkan sebagai "Kunjungan Tambahan" tanpa badge KF.
- Jadwal KF1–KF4 **tidak disimpan di DB** — dihitung ulang di frontend dari `tanggalPersalinan`.
- Unique index: `{ nik, tanggalPersalinan }`.
- Export mode `persalinan`: query `{ tanggalPersalinan: { $gte: from, $lte: to } }`.
- Export mode `nifas`: perlu aggregation `$unwind visits` lalu filter `visits.date` dalam range.
- Semua API wajib gunakan `successResponse` / `paginatedResponse` / `errorResponse` dari `src/lib/response.js`.
- Semua client component wajib gunakan `fetcher()` dari `src/lib/fetcher.js`.
- Toast via `react-hot-toast`. Tidak ada `alert()` / `window.confirm()`.
- Icon: gunakan `lucide-react` atau `react-icons` — jangan konsolidasi, keduanya sudah dipakai.
