# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # dev server with Turbopack
npm run dev:demo     # dev server on the sample data left by check:visual (`dev:demo api` → test:api data)
npm run dev-clear    # wipe .next cache then dev
npm run build        # production build — `next build --webpack` (next-pwa is a webpack plugin; Next 16 defaults to Turbopack)
npm run build        # run this to verify changes compile
npm run test:api     # end-to-end API suite (requires `npm run build` first)
```

### Testing

`scripts/api-test.mjs` builds to **`.next-test/`** (via `NEXT_DIST_DIR`, wired in `next.config.mjs`) and boots a real `next start` on port 3987. The separate build directory matters: running the suite — or a plain `npm run build` — while `npm run dev` is live overwrites the dev server's `.next` and breaks it with `ENOENT ... _buildManifest.js.tmp` / `app-paths-manifest.json` errors that look like application bugs but are not. The suite rebuilds only when something under `src/` is newer than the last test build.

If `.next` does get clobbered, `npm run dev-clear` wipes it and restarts. Never point the suite back at `.next`.

It is safe to run against a production `.env`:

- `MONGODB_URI` is rewritten to a separate `klinik_apitest` database on the same cluster
- `AUTH_*` and `JWT_SECRET` are overridden with test values, so real credentials are never used
- the test database is emptied at the *start* of a run and kept afterwards (browse it with `npm run dev:demo api`); the server is killed on exit, including on failure

Covers auth/middleware, pagination guards, per-module CRUD, derived-field calculations (HPL, usia kehamilan, nomor KF, slugify), the "jadwal terlewat" definition, and an SSR smoke test of every dashboard route. Add a scenario here when changing route behavior — there is no unit-test framework in this project.

### Visual / responsiveness check

`npm run check:visual` (`scripts/visual-check.mjs`) drives the **installed Chrome** through `playwright-core` — no browser download, no Playwright test runner. It seeds (from `scripts/data-contoh.mjs`, through the real API so derived fields are computed) a separate `klinik_visualtest` database (cleared at the start, kept afterwards for `npm run dev:demo`), screenshots all 29 dashboard pages (lists, details, create forms, letters, Master Data tabs, print) at 360 / 390 / 820 / 1440 px into `.visual/` (gitignored), and flags horizontal scrolling, elements overflowing the viewport, sub-32px touch targets, sub-10.5px text, and JS/console errors. Full findings land in `.visual/temuan.json`; `VISUAL_ONLY=kb,master npm run check:visual` limits it to pages whose name matches.

After the screenshots it runs **UI flow tests** (29 real-click scenarios): mobile drawer + Escape, the add-visit modal opening as a bottom sheet on a phone with Save on screen, sidebar/dashboard navigation, search, every detail-page tab, add-visit modals in all four modules, KB "Edit Data" saved and still there after a reload, status change asks for confirmation and keeps unsaved edits, unknown ID shows "tidak ditemukan" with a way back, the unsaved-changes guard, Excel download, delete via `ConfirmModal`, adding a diagnosis and a signer (drawn TTD) in Master Data, switching Master Data tabs, inserting numbering tokens at the cursor, letter pages not scrolling past their content on a laptop, consent draft → drawn signature → issue → print, and surat sakit filled from patient data → issue. Seeded signatures and the stamp are drawn on a browser canvas (`gambarContoh()`) because the clinic's real ones are not in the repo. It exits non-zero if any flow fails and saves `.visual/alur-gagal-N.png`. Open modals are also captured as `.visual/modal-*.png` and every detail tab as `.visual/tab-<modul>-<n>__desktop.png` / `__hp.png` (phone, with the schedule list expanded). `potretPenuh()` unlocks the `<main>` scroll container so these are the whole page, not one screen — look at them after touching a modal. `ALUR_ONLY=consent` runs only matching flows; flows are skipped when `VISUAL_ONLY` is set alone.

Read the PNGs to actually look at the result — the automated flags catch overflow, not ugliness. Checkboxes inside a `<label>` are measured by the label. One known false positive remains: the decorative circles on the `/login` brand panel, clipped by an `overflow-hidden` parent.

## Required Environment Variables

```
MONGODB_URI       # MongoDB connection string
JWT_SECRET        # Secret for jose JWT signing (HS256)
AUTH_USERNAME     # Single admin username (plaintext)
AUTH_PASSWORD     # Single admin password (plaintext)
```

## Architecture

Next.js 16 App Router, single-user clinic management app. No TypeScript — plain JS with `@/*` alias pointing to `src/`.

### Auth Flow

- Login: `POST /api/auth/login` signs JWT with `jose` `SignJWT` (HS256), sets `httpOnly` cookie `token`
- Proxy (`src/proxy.js`, Next 16's rename of middleware): runs on the Node runtime, verifies token via `jwtVerify` from `jose`, guards all non-public routes. Unauthenticated `/api/*` requests get a **401 JSON** response, pages get a redirect to `/login` — never redirect an API call: `fetch()` follows it silently, receives the login HTML with status 200, and the client never learns the session expired (an Excel download would even save that HTML as `.xlsx`)
- Client auth hook: `src/lib/auth.js` — `useAuth()` returns `{ signIn, signOut }`
- Public paths: `/login`, `/api/auth/login`, `/manifest.json`, `/offline.html`, `/favicon.ico`, `/icons/*`

### Data Modules

Mongoose models, each with its own API route group. The four record modules use an embedded `visits[]` array:

| Module | Model | Route | Notes |
|---|---|---|---|
| Pasien | `src/models/patient.js` | `/api/patients` | `diagnosis` + `diagnosisIds` auto-derived from visits on PATCH |
| KB (Keluarga Berencana) | `src/models/kb.js` | `/api/kb` | `metodes[]` auto-derived from visits on PATCH. `nik` is unique. Export via `/api/kb/export` |
| Kehamilan (ANC) | `src/models/kehamilan.js` | `/api/kehamilan` | `hpl` = `hpht` + 280 days; `usiaKehamilan` + `trimester` auto-derived per visit. Unique index on `{nik, hpht}` — one mother can have several pregnancies. Spec: `docs/modul-kehamilan.md` |
| Persalinan (+ nifas) | `src/models/persalinan.js` | `/api/persalinan` | Embedded `bayi` subdoc + `visits[]` of KF1–KF4 postnatal checks; `hariPascaSalin` + `nomorKF` auto-derived. `nik` NOT unique. Spec: `docs/modul-persalinan.md` |
| Persetujuan Tindakan | `src/models/consent.js` | `/api/consent` | Letter — see *Letters* below |
| Surat Keterangan Sakit | `src/models/suratSakit.js` | `/api/surat-sakit` | Letter — `lamaHari` derived (inclusive) from `mulai`–`selesai` |
| Master Data surat | `penandatangan.js`, `gambar.js`, `pengaturanSurat.js` | `/api/master/*`, `/api/gambar/[id]` | Signers, versioned images, kop/cap/numbering — see below |
| Config | `src/models/config.js` | `/api/config` | Lookup table for diagnosis codes. Keyed by `type`+`code` (unique compound index). `code` is auto-slugified from `label` |

Kehamilan and Persalinan also expose `/summary` (counts for the list-page cards) and `/export` (Excel). `/api/dashboard` returns cross-module counts for the home page.

### Letters (Persetujuan Tindakan, Surat Keterangan Sakit) & Master Data

Both letter types share one implementation: `src/lib/surat.js` holds the generic route handlers (`ruteDaftar`, `ruteDetail`, `ruteRingkasan`), numbering and image validation; `src/lib/consent.js` / `src/lib/suratSakit.js` hold only what is specific (`terapkan`, `terbitkan`, `batalkan`, list/search config). Route files are one-liners. The UI is shared the same way: `components/surat/HalamanSurat.js` (new + detail page: form, live preview, save, issue, unissue, delete), `DaftarSurat.js` (list), `HalamanCetak.js` (print). Add a third letter type by adding a config, not by copying a module.

Letters are **standalone**: people are typed by hand, or copied once via "Ambil dari data pasien" (`/api/cari-pasien`, identity fields only, max 8, never `visits[]`). A letter keeps no reference to patient records — it is a snapshot, and the signer is often not the patient. Pekerjaan is always typed. The only references are to Master Data, and those are snapshotted at issue. Rationale for consent: `plan/PLAN-INFORMED-CONSENT.md`.

Rules that are easy to break — keep them:

- **Draft → `issue` → print.** The number is issued on `issue`, not on create, so abandoned drafts don't consume numbers. It is never reused, not even after deletion. `unissue` keeps the number (re-issuing reuses it) and wipes drawn signatures, because the content is about to change. Drafts cannot be printed — `/print/*` shows "Surat belum terbit".
- **An issued letter is locked.** `updateData` returns 409 while `status === "issued"`.
- **Separate sequence per letter type**: counter key `${jenis}-${tahun}` (`counterKey(jenis, reset, …)`), so consent and surat sakit both start at 001. Patterns live in `pengaturanSurat.penomoran.{consent,sakit}`; `validatePola()` rejects patterns that would produce duplicates — load-bearing. `urutBerikutnya` may only move the counter **forward**; moving it back would reissue numbers of deleted letters.
- **Snapshot at issue, never read live.** `issue` copies `kop`, `logoId`, `capId` and the signer (`petugas` / `pemeriksa` / master `saksiKlinik`: `nama, jabatan, nip, ttdId`) onto the letter. Print and preview of an issued letter read only those copies — editing Master Data must never rewrite a printed letter. Drafts preview the *current* master via `timpaMaster()` in `src/lib/suratView.js`.
- **Images are versioned, never overwritten** (`models/gambar.js`). Replacing a signature, cap or logo creates a new `Gambar`; letters keep the id of the version they used. Don't add an update or delete path for `Gambar`. A signer used by an issued letter can't be deleted (409) — only deactivated; inactive signers can't issue new letters.
- **Who gets a digital signature.** Master signers (petugas, pemeriksa, saksi klinik picked from master) get their master TTD automatically; no TTD in master → wet column. The clinic cap goes only next to the *main* signer's digital TTD (`terbitkan()` returns whether to stamp) — a stamp over an empty line looks pre-approved. Surat sakit `ttdBasah` forces a wet column without cap. Everyone else (yang membuat pernyataan, saksi keluarga, manually typed saksi klinik) either draws on screen at issue time (`body.ttd`, PNG only) or signs wet on paper — **never** fill their column from a stored image; that would fabricate consent.
- **Client sends ids, server fills names.** `terapkan` accepts only `penandatanganId`; name/title/NIP/TTD come from the master on the server. Never trust a name or image id from the request body.
- **Deleting an issued letter requires `?konfirmasi=<nomorSurat>`**; `HapusSuratModal` makes the user retype it.
- **Images are never public.** Signatures, cap and logo live as base64 in Mongo (Vercel's disk is read-only). The dashboard loads them through `/api/gambar/[id]` (auth via proxy, `Cache-Control: private, no-store`, `nosniff`, PNG/JPEG/WebP verified by magic bytes — no SVG). The print page embeds them as data URLs. `/print/*` is `no-store` (`next.config.mjs` `headers()`). Only the logo fallback `/kop/logo-klinik.png` stays public; never put a signature or stamp under `public/`. Uploads are shrunk to ≤600px PNG in the browser (`lib/gambarKlien.js`).

**Dates: always go through `src/lib/tanggal.js`.** `tanggalSurat` (and `mulai`/`selesai`) is stored as UTC midnight of its calendar date and read back with UTC getters, so numbering and the printed date are identical whether the server runs in WITA (local dev) or UTC (Vercel). Never call `getMonth()`/`toLocaleDateString()` on a letter date directly — that reintroduces a one-day shift that silently files letters under the wrong month. The suite is run under `TZ=UTC` to prove this.

The print pages (`/print/consent/[id]`, `/print/surat-sakit/[id]`, both through `components/surat/HalamanCetak.js`) are **server components** that read the DB directly. Deliberate: a print page must be complete on first paint so the print dialog isn't racing a client fetch. Print CSS (`@page`, `.no-print`, `.lembar`, `.hindari-potong`) lives in `globals.css`.

**`SuratConsent.js`, `SuratSakit.js` and `components/surat/Lembar.js` render letters and are intentionally neither client nor server components** — no `"use client"`, no hooks — so the print page and the live preview share one definition and cannot drift. Put interactive behaviour in the wrapper. Both callers go through `consentKeSurat()` / `sakitKeSurat()` in `src/lib/suratView.js`, which take `src(id)` (data URL on the server, `/api/gambar/<id>` in the browser). Unchosen options are struck through (`<Pilihan>`), like the paper form.

The letter is fixed at A4 (210mm) by design — a legal document must not reflow to the viewport. `PreviewSurat` scales it with a CSS `transform` measured by `ResizeObserver`; `LayoutFormPratinjau` (`pratinjau` prop + form children) gives side-by-side form+preview at `xl` (the preview is sticky on the grid item itself, viewport-high, and 100% = the whole sheet so nothing scrolls inside it) and a tab switcher below that.

**Master Data** (`/dashboard/master`, tab kept in `?tab=`): Diagnosis (the old Konfigurasi — `/dashboard/config*` and `/dashboard/consent/pengaturan` redirect in `next.config.mjs`), Penanda Tangan, Kop & Cap, Penomoran.

### Language

All user-visible text is **Indonesian** — page titles, labels, toasts, and API `message` strings (which surface directly in toasts). Code identifiers stay English: routes (`/api/consent`), model names, and enum values (`draft`, `issued`). The printed consent is titled "INFORMED CONSENT TINDAKAN MEDIK", following the clinic's paper form.

### Two PATCH Styles

Be aware these differ — follow whichever the module already uses:

- **Pasien, KB** — client sends the *entire* `visits[]` array; the route replaces it wholesale and recomputes derived fields.
- **Kehamilan, Persalinan** — action-based: `{ action: "addVisit" | "editVisit" | "deleteVisit" | "updateStatus" | "updateData" }` (Persalinan adds `"updateBayi"`). Field updates are whitelisted. This is the preferred pattern for new work.

### Shared Query Helpers (`src/lib/query.js`)

- `parsePagination(searchParams, { defaultLimit, maxLimit })` → `{ page, limit, skip }`, clamped so a hostile `page`/`limit` can't produce a negative skip or an unbounded scan. Use it in every list route.
- `escapeRegex(value)` — always run `search` through this before `$regex`.
- `pilihField(body, fields)` — every create route passes the body through this before `Model.create()`. Never `create(body)`: derived fields (`diagnosis`, `metodes`, `hpl`, `status`, `visits[]` with `usiaKehamilan`/`nomorKF`) would then accept made-up values. Persalinan's list is `FIELD_DATA_PERSALINAN` in the model, shared with PATCH `updateData`.

### Derived Domain Logic (`src/lib/kehamilan.js`)

`jadwalTerlewatQuery(today)` — the single source of truth for "kunjungan terlewat": the **last** visit's `jadwalBerikutnya` is in the past. Used by `/api/dashboard`, `/api/kehamilan`, and `/api/kehamilan/summary`. It must stay in sync with `getFlags()` in `src/app/dashboard/kehamilan/page.js`; do not reintroduce `{"visits.jadwalBerikutnya": {$lt: today}}`, which matches *any* visit and overcounts.

### API Response Helpers (`src/lib/response.js`)

Always use these — do not use raw `Response.json()` or `NextResponse.json()` in route handlers:

```js
successResponse(message, data, statusCode?)       // { message, data, status: "success" }
paginatedResponse(message, data, page, totalPages) // adds page+totalPages to success shape
errorResponse(message, statusCode?, data?)         // { message, data, status: "error" }
serverError(error, message)                        // end every catch block with this
```

**Never put `error.message` in a response.** Mongo/Mongoose messages expose collection names, index keys and stack details. `serverError()` logs the full error server-side and maps it to a safe reply: `ValidationError` → 400 naming only the fields, `CastError` / malformed JSON → 400, duplicate key → 409, anything else → 500 with the given message. When a duplicate needs a specific message, check `error.code === 11000` and return `errorResponse(msg, 409)` before calling it. For a message that *is* meant for the user, `throw new ApiError(message, status)` — `serverError` passes it through unchanged. The suite asserts that internal details never leak.

### Pagination Pattern

All list GET routes (`/api/patients`, `/api/kb`, `/api/kehamilan`, `/api/persalinan`, `/api/config`, `/api/consent`, `/api/surat-sakit`) accept:
- `page`, `limit`, `search`, `sort` — parse these via `parsePagination()` from `src/lib/query.js`
- `sort` is whitelisted per route — invalid values fall back to default
- `search` input is regex-escaped before passing to MongoDB `$regex`
- List queries must use `.select()` + `.lean()` and run the `find` and `countDocuments` in one `Promise.all` — never return the whole `visits[]` array to a list page

### DB Connection

`src/lib/database.js` — `connectDB()` uses `global.mongoose` for connection caching across hot-reloads. Always call `await connectDB()` at the top of every route handler.

### Client Data Fetching

`src/lib/fetcher.js` — use `fetcher(url, options?)` for all client-side API calls. Handles 401/403 by auto-signing out, and throws on `status: "error"` payloads. Do not use raw `fetch()` in page components. Excel downloads use `fetchBlob(url)` from the same file, which has the same session handling but returns a `Blob`.


### PWA

`@ducanh2912/next-pwa` configured in `next.config.mjs`. Service worker generated to `public/sw.js` on build. **Caching rules must live in `workboxOptions.runtimeCaching`** — v10 silently ignores a top-level `runtimeCaching`, and its default `apis` rule then caches `/api` responses (patient data, signatures) on the device; that was the case until this fix. The first rule makes `/api/*` and `/print/*` `NetworkOnly`; the rest are the library defaults minus `apis`. `worker/index.js` is bundled into the SW and deletes the old `apis` cache on activate; its output `public/worker-*.js` is public in `proxy.js` like `workbox-*.js`. `test:api` asserts all of this against the built `sw.js`. Icons are generated from `public/kop/logo-klinik.png` by `python scripts/buat-ikon.py` (tab = mark only, transparent with white halo; app icons on white; maskable inside the safe zone).

### UI Conventions

- Tailwind CSS v4 for all styling
- `react-hot-toast` for all user feedback (no `window.confirm`, no `alert`)
- `framer-motion` for sidebar animation
- `lucide-react` + `react-icons` for icons (both are used — don't consolidate)
- Mobile: card layout. Desktop: table layout. Both rendered in same component, toggled with `sm:` breakpoint.
- **Colour comes from the logo.** `brand-50…950` is defined in `@theme` in `globals.css` (`brand-700` = logo `#0C42A2`). Use `brand-*` for primary buttons, active nav, tabs, links, focus and calendar marks — every module, no per-module hues. Green / amber / orange / red are reserved for *status meaning* (aktif, peringatan, terlewat, bahaya); green also marks Excel export. Don't reintroduce `blue-*`/`violet-*`/`pink-*` as module colours.
- `globals.css` restores two Tailwind v3 defaults that v4 dropped — `border` without a colour is `slate-200` (v4 made it `currentColor`, which turned every card border black) and buttons get `cursor: pointer`. Keep both.
- The sidebar is fixed from `lg` (1024px) up; below that it is a drawer opened from the topbar, so tablets get the full content width.
- List pages use `KartuRingkasan` (summary/filter cards, `nada` = brand/amber/orange/red/emerald/slate) and `Paginasi` from `src/components/`; don't copy local versions back in.
- Detail pages use `DetailHeader` (back button + identity card) and `TabBar` (`role="tablist"`) from `src/components/` — reuse them for new detail pages.
- **Form controls use `className="field"`** (defined in `globals.css`, `@layer components`) — inputs, selects (chevron built in, no extra icon) and textareas. Add only layout utilities next to it (`flex-1`, `pl-10` for a leading icon, `resize-none`). It is 16px on phones on purpose: smaller text makes iOS Safari zoom on focus.
- **Create pages use `HalamanForm` + `BagianForm`** (`src/components/HalamanForm.js`): title, one card of numbered sections, and an action bar that is `sticky bottom-0` so Save stays reachable on long phone forms. Don't put `overflow-hidden` on an ancestor of that bar — it kills `sticky`. Sections are deliberately not collapsible (a hidden required field is hard to find). Letter forms number their cards with a CSS counter (`.daftar-bagian` / `.nomor-bagian`, `Kartu` in `components/surat/FormKit.js`) because some cards are conditional.
- **"Edit Data" tabs use `FormEdit`** (same file): same card + sticky bar, no page title. Pass `dirty` (bool) and Save is disabled as "Tersimpan" until something changes, and "Batalkan" appears only when there is something to undo; pass `busy` so a double tap can't send twice. Status pickers go through `KartuStatus` (confirm before changing, locked while saving).
- **A refresh must not wipe unsaved edits.** Pasien/Kehamilan `fetch…(pertahankanForm)` and Persalinan's `segarkanForm` ref: only a successful *save* reloads the form from the server; changing status or a visit refreshes the record but keeps what the user is typing. KB, Pasien and Kehamilan detail pages all guard leaving with unsaved edits.
- Visit history tabs use `KartuKunjungan` (`src/components/`): two-line header (code + short date, then `meta`) so a 360px phone doesn't wrap the date into three lines next to Edit/Hapus. Scheduled visits (ANC K1–K6, nifas KF1–KF4) use `ProgresKunjungan` with `status` per step: `sudah` / `berikutnya` / `terlewat` / `belum`.
- Warnings, overdue flags and "UK now" apply to **active** records only — a finished or miscarried pregnancy must not show "Overdue" or "UK 42 mg". Keep `getFlags()`/`getAlerts()` in step with the `status: "aktif"` filter in `/api/kehamilan/summary`.
- Delete on mobile list cards is an icon-only 44px button with `aria-label`, neutral until hovered/tapped; "Lihat" stays the primary action.
- Empty lists use `KeadaanKosong`; a detail record that can't be loaded uses `TidakDitemukan kembaliKe="/dashboard/…"` (`src/components/KeadaanKosong.js`) — never bare red text with no way back. Icons, not emoji, in alerts (`lucide-react` `AlertTriangle`/`Info`).
- **Loading = skeleton, not spinner.** `SkeletonKartu` (tab content) and `SkeletonHalaman` (whole page) from `src/components/Skeleton.js`; `.skeleton` in `globals.css` is a shimmer that reduced-motion turns off. Spinners are only for buttons that are busy.
- No coloured top strip on cards (`h-1 bg-gradient…`) — it was on every card and became noise; the modal's accent bar is the only one. NIK is shown with `tabular-nums`, not `font-mono`; NIK inputs get `inputMode="numeric"`.
- **Every control needs an accessible name.** Wrap label + control in `Field` (`src/components/Field.js`): it links `<label htmlFor>` to the control automatically, or, when the child is not a single control (radio group, react-select, several inputs), labels the group via `role="group"` + `aria-labelledby`. A custom input component opts in with `MyInput.kontrolForm = true`. Hand-written labels need `htmlFor` + `id`; controls with no visible label (search, sort, diastol) get `aria-label`. Read-only values use `<span>`, not `<label>`. `check:visual` reports `TANPA-LABEL` for any visible field without a name, on pages and in the opened modals.
- **Modals go through `src/components/Modal.js`**: bottom sheet below `sm`, centred card above, Escape, scroll lock, focus trap and focus restore; `busy` locks closing while saving. Pass `onSubmit` to make body + footer one `<form>`; use the exported `btnBatal` / `btnUtama` / `btnBahaya` / `btnExcel`; `ikon` adds a header icon. Form modals keep `tutupDiLuar` off so a stray tap can't discard typing. `ConfirmModal`, `HapusSuratModal` and `SignatureModal` are built on it too.
- Display dates with `tanggalSingkat()` (clinical dates, device time zone) or `tanggalPendek()` (letters, UTC) from `src/lib/tanggal.js` — both give "28 Okt 2026". Excel exports stay numeric.
- Motion: `src/app/dashboard/template.js` fades each page in (`.anim-masuk`); add `anim-stagger` to a list container to cascade its children. Both use fill `backwards` so no transform lingers — a lingering transform on an ancestor breaks `position: fixed` modals. Framer animations respect reduced motion via `MotionConfig` in the dashboard layout.
- Touch targets ≥ 44px on mobile/tablet (`min-h-11`, table actions `min-h-11 lg:min-h-9`); no text under 11px; white text on brand needs `brand-600` or darker for contrast.
