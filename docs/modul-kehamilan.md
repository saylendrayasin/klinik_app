# Modul Kehamilan (ANC — Antenatal Care)

Dokumen rencana lengkap modul Kehamilan. Ikuti pola modul KB dan Pasien yang sudah ada.

---

## 1. Gambaran Umum

Mencatat data ibu hamil + riwayat kunjungan ANC. Satu ibu bisa punya banyak record kehamilan (NIK+HPHT = unique per kehamilan). Setiap kehamilan punya banyak kunjungan bebas (manual, bukan terikat bulan).

**Route prefix:** `/dashboard/kehamilan`  
**API prefix:** `/api/kehamilan`  
**Model:** `src/models/kehamilan.js`

---

## 2. Warna Base (UI Color)

| Module | Base Color | Tailwind |
|---|---|---|
| Pasien | Biru | `blue-600` / `blue-700` |
| KB | Ungu | `purple-600` / `purple-700` |
| **Kehamilan** | **Rose** | **`rose-600` / `rose-700`** |

Terapkan `rose-600` ke: icon header, tombol primary, focus ring input (`focus:ring-rose-400`), tab aktif (`bg-rose-100 text-rose-700 border-b-2 border-rose-600`), spinner (`border-rose-500`), badge pill (`bg-rose-100 text-rose-700`), back link (`text-rose-600 hover:text-rose-800`).

---

## 3. Konsep: Kunjungan Anjuran vs Aktual

Ini fitur kunci yang membedakan modul ini dari KB.

### Kunjungan Aktual
Kunjungan yang benar-benar terjadi — diinput manual oleh bidan saat pasien datang. Disimpan di `visits[]`.

### Kunjungan Anjuran
Dua sumber anjuran:

**A. Jadwal K1–K6 Kemenkes (auto-generate dari HPHT)**
Tidak disimpan di DB. Dihitung di frontend dari HPHT.

| No | Target UK | Estimasi tanggal | Status |
|---|---|---|---|
| K1 | 8 mg | HPHT + 56 hari | ✅ Selesai / ⏳ Belum |
| K2 | 14 mg | HPHT + 98 hari | |
| K3 | 26 mg | HPHT + 182 hari | |
| K4 | 30 mg | HPHT + 210 hari | |
| K5 | 35 mg | HPHT + 245 hari | |
| K6 | 37 mg | HPHT + 259 hari | |

Status "Selesai" jika ada kunjungan aktual yang `usiaKehamilan` masuk range target ±2 minggu.

**B. Jadwal Kembali (per kunjungan)**
Field `jadwalBerikutnya` di setiap visit. Auto-suggest saat bidan input kunjungan berdasarkan UK saat itu:

| UK saat kunjungan | Interval anjuran | Auto-suggest |
|---|---|---|
| < 28 minggu | +4 minggu | `visitDate + 28 hari` |
| 28–35 minggu | +2 minggu | `visitDate + 14 hari` |
| ≥ 36 minggu | +1 minggu | `visitDate + 7 hari` |

Bidan bisa override tanggal ini sebelum save. Disimpan di `visit.jadwalBerikutnya`.

### Tampilan di UI

**Tab Kunjungan — Timeline Anjuran vs Aktual:**

```
  K1  ✅ AKTUAL     15 Jan 2025  UK 9mg   BB: 52kg  TD: 110/70
         ↓ Jadwal berikutnya: 12 Feb 2025

  K2  ✅ AKTUAL     10 Feb 2025  UK 13mg  BB: 53kg  TD: 115/75
         ↓ Jadwal berikutnya: 10 Mar 2025 (terlewat 5 hari)

  K3  ⏳ ANJURAN    ~26 Apr 2025 (estimasi UK 26mg)   ← abu-abu / dashed

  K4  ⏳ ANJURAN    ~24 Mei 2025 (estimasi UK 30mg)   ← abu-abu / dashed
```

- Row aktual: background putih/rose, data klinis lengkap
- Row anjuran: background abu-abu, dashed border, hanya tampil tanggal estimasi + UK target
- Jika jadwal kembali terlewat → badge "Terlambat X hari" di atas row aktual berikutnya

**Kalender:**
- Kunjungan aktual: titik `rose-500` solid
- Jadwal berikutnya (`jadwalBerikutnya` dari visit terakhir): titik `rose-300` outline/ring saja (bukan solid)
- HPL: titik `amber-400` besar

---

## 4. Kalender: Lebih Kaya dari KB

Salin `CalendarKb.js` → `CalendarKehamilan.js`.

| Marker | Style | Sumber data |
|---|---|---|
| Kunjungan aktual | `bg-rose-500 ring-rose-300` solid | `visits[].date` |
| Jadwal berikutnya | `border-2 border-rose-400` ring saja, transparan | `visits[-1].jadwalBerikutnya` (visit terakhir saja) |
| HPL | `bg-amber-400 ring-amber-200` solid besar | `kehamilan.hpl` |

Legend bawah kalender: chip "Kunjungan Aktual" + chip "Jadwal Berikutnya" + chip "HPL".

Detail panel saat klik tanggal (jauh lebih kaya dari CalendarKb):
- Jika tanggal = kunjungan aktual → tampilkan: nomor K, UK, BB, TD, TFU, DJJ, letak janin, keluhan, tindakan, catatan, jadwal berikutnya
- Jika tanggal = jadwal berikutnya → tampilkan: "Jadwal kunjungan dari K{n} pada {tgl}" + tombol shortcut buka form tambah kunjungan

---

## 5. Dashboard Summary Cards (List Page)

4 kartu ringkasan di atas tabel:

```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Total Aktif    │ │  HPL ≤ 2 Minggu │ │  Kunjungan      │ │  Overdue        │
│     [N]         │ │     [N] ⚠️      │ │  Terlambat [N]⚠️│ │     [N] 🔴      │
│  rose badge     │ │  amber badge    │ │  orange badge   │ │  red badge      │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

| Kartu | Kondisi |
|---|---|
| Total Aktif | `status === "aktif"` |
| HPL ≤ 2 Minggu | `status === "aktif"` + `hpl - today ≤ 14 hari` |
| Kunjungan Terlambat | `status === "aktif"` + `jadwalBerikutnya` dari visit terakhir sudah lewat |
| Overdue | `status === "aktif"` + `today > hpl` |

Klik kartu → otomatis filter list. Didukung `GET /api/kehamilan/summary`.

---

## 6. Alert / Warning Flags

### Di List Page — badge di baris tabel

| Flag | Kondisi | Badge |
|---|---|---|
| 🔴 Overdue | today > hpl, status aktif | `bg-red-100 text-red-700` |
| 🟠 HPL Dekat | hpl - today ≤ 14 hari | `bg-amber-100 text-amber-700` |
| 🟡 Jadwal Terlewat | `jadwalBerikutnya` visit terakhir < today | `bg-yellow-100 text-yellow-700` |

### Di Halaman Detail — banner alert di atas tab

| Kondisi | Pesan |
|---|---|
| TD sistolik ≥ 140 atau diastolik ≥ 90 di visit terakhir | "⚠️ TD terakhir [X/Y] — perhatikan risiko preeklampsia" |
| UK > 40 minggu | "⚠️ Usia kehamilan sudah >40 minggu" |
| `jadwalBerikutnya` sudah terlewat | "⚠️ Jadwal kunjungan [tgl] belum terpenuhi" |
| HPL sudah lewat | "⚠️ HPL sudah terlewat — perbarui status" |

---

## 7. Riwayat Kehamilan Per NIK

Satu ibu bisa punya beberapa record (kehamilan berbeda). Di halaman detail `[id]`:
- Saat load, cek record lain dengan NIK yang sama
- Jika ada → tampilkan tab **"Kehamilan Lain"** berisi list (HPHT, status, jumlah kunjungan)
- Tiap item klikable → navigate ke `[id]` record tersebut

---

## 8. Duplicate Guard (Saat Create)

```
POST /api/kehamilan
→ jika NIK + status aktif sudah ada:
   return 409 { message: "Ibu ini masih memiliki kehamilan aktif." }
```

User bisa force-create dengan `{ force: true }` untuk data entry retrospektif.

---

## 9. Skema Data

### 9a. Data Ibu (level dokumen)

| Field | Type | Input | Keterangan |
|---|---|---|---|
| `name` | String | Manual | Nama lengkap ibu |
| `nik` | String | Manual | NIK — tidak unique per koleksi |
| `dateOfBirth` | Date | Manual | Tanggal lahir ibu |
| `address` | String | Manual | Alamat |
| `phone` | String | Manual | No. HP (opsional) |
| `bloodType` | String | Manual | A / B / AB / O (opsional) |
| `gravida` | Number | Manual | Kehamilan ke-berapa (G) |
| `para` | Number | Manual | Sudah melahirkan berapa kali (P) |
| `abortus` | Number | Manual | Riwayat keguguran (A) |
| `hpht` | Date | Manual | Hari Pertama Haid Terakhir — kunci semua kalkulasi |
| `hpl` | Date | **Auto** | HPL = HPHT + 280 hari |
| `status` | String | Manual | `aktif` / `selesai` / `keguguran` / `rujuk` |
| `visits` | Array | — | Kunjungan ANC (lihat 9b) |

### 9b. Kunjungan ANC (embedded `visits[]`)

| Field | Type | Input | Keterangan |
|---|---|---|---|
| `date` | Date | Manual | Tanggal kunjungan aktual |
| `usiaKehamilan` | Number | **Auto** | UK minggu = `floor((date - hpht) / 7hari)` |
| `trimester` | Number | **Auto** | T1 ≤12mg · T2 13–27mg · T3 ≥28mg |
| `jadwalBerikutnya` | Date | **Auto+Override** | Tanggal anjuran kunjungan berikutnya — auto-suggest, bidan bisa ubah |
| `beratBadan` | Number | Manual | BB ibu saat kunjungan (kg) |
| `tekananDarahSistol` | Number | Manual | Sistolik (mmHg) |
| `tekananDarahDiastol` | Number | Manual | Diastolik (mmHg) |
| `tfu` | Number | Manual | Tinggi Fundus Uteri (cm) |
| `djj` | Number | Manual | Denyut Jantung Janin (bpm) |
| `letakJanin` | String | Manual | `kepala` / `sungsang` / `lintang` / `belum_diketahui` |
| `keluhan` | String | Manual | Keluhan ibu |
| `tindakan` | String | Manual | Tindakan / obat |
| `notes` | String | Manual | Catatan tambahan |

---

## 10. Model Mongoose (`src/models/kehamilan.js`)

```js
import mongoose from "mongoose";

const visitSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    usiaKehamilan: { type: Number },
    trimester: { type: Number, enum: [1, 2, 3] },
    jadwalBerikutnya: { type: Date },          // auto-suggest + override bidan
    beratBadan: { type: Number },
    tekananDarahSistol: { type: Number },
    tekananDarahDiastol: { type: Number },
    tfu: { type: Number },
    djj: { type: Number },
    letakJanin: {
      type: String,
      enum: ["kepala", "sungsang", "lintang", "belum_diketahui"],
      default: "belum_diketahui",
    },
    keluhan: { type: String },
    tindakan: { type: String },
    notes: { type: String },
  },
  { _id: true }
);

const kehamilanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    nik: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    address: { type: String },
    phone: { type: String },
    bloodType: { type: String, enum: ["A", "B", "AB", "O", ""] },
    gravida: { type: Number, default: 1 },
    para: { type: Number, default: 0 },
    abortus: { type: Number, default: 0 },
    hpht: { type: Date, required: true },
    hpl: { type: Date },
    status: {
      type: String,
      enum: ["aktif", "selesai", "keguguran", "rujuk"],
      default: "aktif",
    },
    visits: [visitSchema],
  },
  { timestamps: true }
);

kehamilanSchema.index({ nik: 1, hpht: 1 }, { unique: true });

export const Kehamilan =
  mongoose.models.Kehamilan || mongoose.model("Kehamilan", kehamilanSchema);
```

---

## 11. API Routes

```
GET    /api/kehamilan                  # list — page, limit, search, sort, status
POST   /api/kehamilan                  # create (auto-calc hpl, duplicate guard)
GET    /api/kehamilan/summary          # counts untuk summary cards
GET    /api/kehamilan/[id]             # detail 1 record
PATCH  /api/kehamilan/[id]             # update data / addVisit / updateStatus
DELETE /api/kehamilan/[id]             # hapus record
GET    /api/kehamilan/export           # export Excel (?mode=aktif|visits&from=&to=)
```

### PATCH payload

```js
{ action: "addVisit",     visit: { date, jadwalBerikutnya, beratBadan, ... } }
{ action: "updateStatus", status: "selesai" }
{ action: "updateData",   data: { name, address, hpht, ... } }  // recalc hpl jika hpht berubah
```

---

## 12. Export Excel — 2 Mode + Range Tanggal

**Modal export:** pilih mode → kalau `visits` muncul date range picker (dari–sampai). Kalau `aktif` langsung download.

```
GET /api/kehamilan/export?mode=aktif
GET /api/kehamilan/export?mode=visits&from=2025-01-01&to=2025-03-31
```

---

### Mode `aktif` — Snapshot Ibu Hamil Saat Ini

Ambil semua record `status: "aktif"`. Tidak butuh filter tanggal. Berguna untuk laporan bulanan: "siapa saja yang sedang hamil sekarang."

**Kolom Excel:**

| Kolom | Sumber |
|---|---|
| Nama | `kehamilan.name` |
| NIK | `kehamilan.nik` |
| Tanggal Lahir | `kehamilan.dateOfBirth` |
| Alamat | `kehamilan.address` |
| G/P/A | `G{gravida}P{para}A{abortus}` |
| HPHT | `kehamilan.hpht` |
| HPL | `kehamilan.hpl` |
| UK Saat Ini (mg) | hitung saat export: `calcUK(hpht, today)` |
| Trimester Saat Ini | dari UK |
| Total Kunjungan | `visits.length` |
| Kunjungan Terakhir | tanggal visit terakhir |
| Jadwal Berikutnya | `jadwalBerikutnya` dari visit terakhir |
| Status | `aktif` |

---

### Mode `visits` — Riwayat Kunjungan per Range Tanggal

Filter `visits.date >= from && visits.date <= to`. Satu baris per kunjungan.

**Kolom Excel:**

| Kolom | Sumber |
|---|---|
| Tanggal Kunjungan | `visit.date` |
| No. Kunjungan | K1, K2, ... (urut tanggal per ibu) |
| Usia Kehamilan (mg) | `visit.usiaKehamilan` |
| Trimester | `visit.trimester` |
| Jadwal Kunjungan Berikutnya | `visit.jadwalBerikutnya` |
| BB (kg) | `visit.beratBadan` |
| TD Sistol / Diastol | `visit.tekananDarahSistol` / `Diastol` |
| TFU (cm) | `visit.tfu` |
| DJJ (bpm) | `visit.djj` |
| Letak Janin | `visit.letakJanin` |
| Keluhan | `visit.keluhan` |
| Tindakan | `visit.tindakan` |
| Catatan | `visit.notes` |
| Nama Ibu | `kehamilan.name` |
| NIK | `kehamilan.nik` |
| Alamat | `kehamilan.address` |
| HPHT | `kehamilan.hpht` |
| HPL | `kehamilan.hpl` |
| G/P/A | `G{gravida}P{para}A{abortus}` |
| Status | `kehamilan.status` |

---

## 13. Sort & Filter di List Page

| Kontrol | Pilihan |
|---|---|
| Search | Nama / NIK |
| Filter Status | Semua · Aktif · Selesai · Keguguran · Rujuk |
| Sort | Nama · HPL Terdekat · Kunjungan Terbaru · UK Terbesar |

---

## 14. Halaman UI — Struktur File

```
src/app/dashboard/kehamilan/
  page.js                      # list + summary cards + filter + sort
  new/
    page.js                    # form tambah record baru
  [id]/
    page.js                    # detail: tab Kalender | Edit Data | Kunjungan | Kehamilan Lain
    kehamilanEditForm.js       # form edit data ibu
    KehamilanVisitTab.js       # timeline anjuran + aktual + form tambah kunjungan
    CalendarKehamilan.js       # kalender + marker aktual + marker jadwal + marker HPL
```

### Form Tambah Kunjungan

| Field | Note |
|---|---|
| Tanggal Kunjungan | Date picker, required |
| Usia Kehamilan | Read-only chip, auto-hitung real-time |
| Trimester | Read-only badge T1/T2/T3 |
| Jadwal Kunjungan Berikutnya | Date picker, **pre-fill auto** dari interval tabel, bidan bisa ubah |
| Berat Badan (kg) | Number |
| TD Sistolik / Diastolik | Dua input satu baris |
| TFU (cm) | Number |
| DJJ (bpm) | Number |
| Letak Janin | Select |
| Keluhan | Textarea |
| Tindakan / Obat | Textarea |
| Catatan | Textarea |

---

## 15. Kalkulasi Helper

```js
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function calcHPL(hpht) {
  return new Date(new Date(hpht).getTime() + 280 * MS_PER_DAY);
}

function calcUK(hpht, visitDate) {
  return Math.floor((new Date(visitDate) - new Date(hpht)) / (7 * MS_PER_DAY));
}

function calcTrimester(uk) {
  if (uk <= 12) return 1;
  if (uk <= 27) return 2;
  return 3;
}

// Auto-suggest jadwal kunjungan berikutnya berdasarkan UK
function calcJadwalBerikutnya(visitDate, uk) {
  let intervalDays;
  if (uk < 28) intervalDays = 28;       // +4 minggu
  else if (uk < 36) intervalDays = 14;  // +2 minggu
  else intervalDays = 7;                // +1 minggu
  return new Date(new Date(visitDate).getTime() + intervalDays * MS_PER_DAY);
}

// Nomor kunjungan K1, K2, ... — urut tanggal asc
function getVisitNumber(visits, targetId) {
  const sorted = [...visits].sort((a, b) => new Date(a.date) - new Date(b.date));
  return sorted.findIndex((v) => String(v._id) === String(targetId)) + 1;
}

// Jadwal K1-K6 anjuran dari HPHT (tidak disimpan di DB, hanya untuk display)
const KEMENKES_SCHEDULE = [
  { k: 1, targetUK: 8 },
  { k: 2, targetUK: 14 },
  { k: 3, targetUK: 26 },
  { k: 4, targetUK: 30 },
  { k: 5, targetUK: 35 },
  { k: 6, targetUK: 37 },
];

function getKSchedule(hpht) {
  return KEMENKES_SCHEDULE.map(({ k, targetUK }) => ({
    k,
    targetUK,
    estimasiTanggal: new Date(new Date(hpht).getTime() + targetUK * 7 * MS_PER_DAY),
  }));
}

// Tandai K mana yang sudah terpenuhi (ada visit aktual dalam range ±2 minggu dari target)
function matchVisitsToSchedule(hpht, visits) {
  const schedule = getKSchedule(hpht);
  const sorted = [...visits].sort((a, b) => new Date(a.date) - new Date(b.date));

  return schedule.map((s) => {
    const matched = sorted.find((v) => {
      const diff = Math.abs(v.usiaKehamilan - s.targetUK);
      return diff <= 2;
    });
    return { ...s, aktual: matched || null };
  });
}

// Alert flags
function getAlertFlags(kehamilan) {
  const today = new Date();
  const hpl = new Date(kehamilan.hpl);
  const daysToHPL = Math.floor((hpl - today) / MS_PER_DAY);
  const lastVisit = [...(kehamilan.visits || [])]
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  const jadwalLewat =
    lastVisit?.jadwalBerikutnya &&
    new Date(lastVisit.jadwalBerikutnya) < today;

  return {
    overdue: today > hpl,
    hplDekat: daysToHPL >= 0 && daysToHPL <= 14,
    jadwalTerlewat: !!jadwalLewat,
    tinggiTensi:
      lastVisit &&
      (lastVisit.tekananDarahSistol >= 140 || lastVisit.tekananDarahDiastol >= 90),
  };
}
```

---

## 16. Urutan Implementasi

1. Model — `src/models/kehamilan.js`
2. API list+create — `src/app/api/kehamilan/route.js`
3. API summary — `src/app/api/kehamilan/summary/route.js`
4. API detail — `src/app/api/kehamilan/[id]/route.js`
5. API export (aktif + visits range) — `src/app/api/kehamilan/export/route.js`
6. Halaman list + summary cards — `page.js`
7. Halaman baru — `new/page.js`
8. Halaman detail + KehamilanVisitTab (timeline) — `[id]/page.js`
9. CalendarKehamilan — `[id]/CalendarKehamilan.js`
10. Tambah ke sidebar

---

## 17. Catatan Penting

- NIK tidak unique per koleksi. Unique index: `{ nik, hpht }`.
- `hpl` set di POST. Recalc jika `hpht` diubah via PATCH `updateData`.
- `usiaKehamilan` + `trimester` selalu auto-calc — tidak diinput user.
- `jadwalBerikutnya` auto-suggest di frontend saat user pilih tanggal kunjungan, tapi bisa diubah. Dikirim bersama payload visit.
- Jadwal K1–K6 Kemenkes **tidak disimpan di DB** — dihitung ulang di frontend dari `hpht`.
- Export mode `aktif`: query `{ status: "aktif" }` tanpa filter tanggal.
- Export mode `visits`: filter `visits.date` antara `from` dan `to` (ISO string dari query param).
- Semua API wajib gunakan `successResponse` / `paginatedResponse` / `errorResponse` dari `src/lib/response.js`.
- Semua client component wajib gunakan `fetcher()` dari `src/lib/fetcher.js`.
- Toast via `react-hot-toast`. Tidak ada `alert()` / `window.confirm()`.
