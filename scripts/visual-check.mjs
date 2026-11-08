/**
 * Pemeriksa tampilan & responsivitas.
 *
 * Menjalankan aplikasi sungguhan lalu mengemudikan Chrome yang sudah terpasang
 * di mesin (lewat playwright-core, tanpa mengunduh browser). Tiap halaman
 * dipotret di beberapa ukuran layar dan diperiksa otomatis untuk:
 *
 *   - halaman menggulir mendatar (tanda tata letak jebol di layar sempit)
 *   - elemen yang menonjol keluar layar
 *   - tombol/tautan yang terlalu kecil untuk disentuh jari
 *   - teks yang terlalu kecil untuk dibaca
 *   - tumpang tindih tombol
 *
 * Aman: memakai database terpisah "klinik_visualtest" dan folder build
 * .next-test, jadi tidak menyentuh data produksi maupun dev server.
 *
 * Jalankan: npm run check:visual
 * Hasil potret: .visual/  (tidak ikut git)
 */
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import mongoose from "mongoose";
import { chromium } from "playwright-core";
import { isiDataContoh, isiSuratContoh } from "./data-contoh.mjs";

const ROOT = process.cwd();
const PORT = 3990;
const BASE = `http://127.0.0.1:${PORT}`;
const TEST_DB = "klinik_visualtest";
const USER = "visualtest";
const PASS = "visualtest-12345";
const DIST = ".next-test";
const OUT = path.join(ROOT, ".visual");

const CHROME_KANDIDAT = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];

const LAYAR = [
  { nama: "hp-kecil", w: 360, h: 740, mobile: true },
  { nama: "hp", w: 390, h: 844, mobile: true },
  { nama: "tablet", w: 820, h: 1180, mobile: true },
  { nama: "desktop", w: 1440, h: 900, mobile: false },
];

// ---------- env ----------
const envRaw = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
const env = {};
for (const line of envRaw.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const uri = env.MONGODB_URI;
const [scheme, rest] = uri.split("://");
const qi = rest.indexOf("?");
const query = qi === -1 ? "" : rest.slice(qi);
const before = qi === -1 ? rest : rest.slice(0, qi);
const host = before.includes("/") ? before.slice(0, before.indexOf("/")) : before;
const TEST_URI = `${scheme}://${host}/${TEST_DB}${query}`;

const ENV_SERVER = {
  MONGODB_URI: TEST_URI,
  JWT_SECRET: "visual-test-secret",
  AUTH_USERNAME: USER,
  AUTH_PASSWORD: PASS,
  NEXT_DIST_DIR: DIST,
};

// <main> adalah wadah gulir (layout h-dvh), jadi fullPage biasa hanya memotret
// setinggi layar. Buka gulirnya sementara agar seluruh isi halaman terpotret.
async function potretPenuh(p, file) {
  const css = await p.addStyleTag({ content: ".h-dvh{height:auto!important}.h-dvh,.h-dvh>div,main{overflow:visible!important}" });
  await p.screenshot({ path: file, fullPage: true });
  await css.evaluate((el) => el.remove());
}

// ---------- laporan ----------
const temuan = [];
const alur = [];
const catat = (layar, halaman, jenis, pesan) =>
  temuan.push({ layar, halaman, jenis, pesan });

// ---------- server ----------
let server;
const NEXT_BIN = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");

function perluBuild() {
  const penanda = path.join(ROOT, DIST, "BUILD_ID");
  if (!fs.existsSync(penanda)) return true;
  const waktu = fs.statSync(penanda).mtimeMs;
  let terbaru = 0;
  const telusuri = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) telusuri(p);
      else terbaru = Math.max(terbaru, fs.statSync(p).mtimeMs);
    }
  };
  telusuri(path.join(ROOT, "src"));
  return terbaru > waktu;
}

function jalankan(args, label) {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [NEXT_BIN, ...args], {
      cwd: ROOT,
      env: { ...process.env, ...ENV_SERVER, NODE_ENV: "production" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (out += d));
    p.on("close", (c) =>
      c === 0 ? resolve() : reject(new Error(`${label} gagal:\n${out.slice(-2500)}`))
    );
  });
}

async function startServer() {
  if (perluBuild()) {
    console.log(`Membangun ke ${DIST}/ ...`);
    await jalankan(["build", "--webpack"], "Build");
  }
  console.log(`Menjalankan server di ${BASE} ...`);
  server = spawn(process.execPath, [NEXT_BIN, "start", "-p", String(PORT)], {
    cwd: ROOT,
    env: { ...process.env, ...ENV_SERVER, NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", () => {});
  server.stderr.on("data", () => {});
  const dl = Date.now() + 60000;
  while (Date.now() < dl) {
    try {
      const r = await fetch(`${BASE}/login`, { redirect: "manual" });
      if (r.status === 200) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Server tidak siap");
}

// ---------- pemeriksaan otomatis di dalam halaman ----------
const PEMERIKSA = () => {
  const hasil = { lebarGulir: 0, lebarLayar: 0, menonjol: [], sentuhKecil: [], teksKecil: [], tanpaLabel: [] };
  hasil.lebarGulir = document.documentElement.scrollWidth;
  hasil.lebarLayar = window.innerWidth;

  const terlihat = (el) => {
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden" || s.opacity === "0") return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  // Elemen yang keluar dari sisi kanan layar
  for (const el of document.querySelectorAll("body *")) {
    if (!terlihat(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.right > window.innerWidth + 1 || r.left < -1) {
      // Abaikan yang memang wadah bergulir sendiri
      let bolehGulir = false;
      let p = el.parentElement;
      while (p && p !== document.body) {
        const s = getComputedStyle(p);
        if (/(auto|scroll)/.test(s.overflowX)) { bolehGulir = true; break; }
        p = p.parentElement;
      }
      if (bolehGulir) continue;
      hasil.menonjol.push({
        tag: el.tagName.toLowerCase(),
        kelas: (el.className || "").toString().slice(0, 70),
        teks: (el.textContent || "").trim().slice(0, 40),
        kanan: Math.round(r.right),
      });
    }
  }

  // Target sentuh & ukuran teks
  for (const el0 of document.querySelectorAll("button, a, select, input[type=checkbox], input[type=radio]")) {
    if (!terlihat(el0)) continue;
    // Checkbox/radio di dalam <label>: label itulah target sentuhnya.
    const el = (el0.type === "checkbox" || el0.type === "radio") && el0.closest("label") || el0;
    const r = el.getBoundingClientRect();
    if (r.height < 32 || r.width < 32) {
      hasil.sentuhKecil.push({
        tag: el.tagName.toLowerCase(),
        teks: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 34),
        kelas: (el.className || "").toString().slice(0, 60),
        ukuran: `${Math.round(r.width)}x${Math.round(r.height)}`,
      });
    }
  }

  for (const el of document.querySelectorAll("p, span, td, th, label, li")) {
    if (!terlihat(el)) continue;
    if (!el.textContent?.trim()) continue;
    if (el.querySelector("*")) continue;
    const px = parseFloat(getComputedStyle(el).fontSize);
    if (px && px < 10.5) {
      hasil.teksKecil.push({
        teks: el.textContent.trim().slice(0, 34),
        px: Math.round(px * 10) / 10,
      });
    }
  }

  // Kolom form tanpa nama yang bisa dibaca pembaca layar (placeholder tidak dihitung)
  for (const el of document.querySelectorAll("input, select, textarea")) {
    if (el.type === "hidden" || !terlihat(el)) continue;
    const punyaNama =
      el.labels?.length ||
      el.getAttribute("aria-label")?.trim() ||
      el.getAttribute("aria-labelledby") ||
      el.closest("[role=group][aria-labelledby]");
    if (!punyaNama) {
      hasil.tanpaLabel.push({
        tag: el.tagName.toLowerCase(),
        nama: el.name || el.id || "",
        placeholder: el.placeholder || "",
      });
    }
  }

  hasil.menonjol = hasil.menonjol.slice(0, 8);
  hasil.sentuhKecil = hasil.sentuhKecil.slice(0, 12);
  hasil.teksKecil = hasil.teksKecil.slice(0, 6);
  return hasil;
};

// ---------- alur utama ----------
let browser;
try {
  const exe = CHROME_KANDIDAT.find((p) => fs.existsSync(p));
  if (!exe) throw new Error("Chrome/Edge tidak ditemukan di mesin ini");
  console.log(`Browser: ${exe}\n`);

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  await startServer();
  console.log("Server siap.\n");

  await mongoose.connect(TEST_URI, { bufferCommands: false });
  for (const c of ["consents", "suratsakits", "penandatangans", "gambars", "pengaturansurats", "counters", "patients", "kbs", "kehamilans", "persalinans", "configs"]) {
    await mongoose.connection.db.collection(c).deleteMany({});
  }

  // Siapkan data agar halaman tidak kosong
  const bootstrap = async () => {
    const login = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: USER, password: PASS }),
      redirect: "manual",
    });
    const cookie = (login.headers.getSetCookie?.() || [])
      .find((c) => c.startsWith("token="))?.split(";")[0];

    const api = (p, o = {}) =>
      fetch(`${BASE}${p}`, {
        ...o,
        headers: { "Content-Type": "application/json", Cookie: cookie, ...(o.headers || {}) },
      }).then((r) => r.json());

    // Data modul lain — supaya halaman daftar & detail tidak kosong.
    // Dibuat lewat API sungguhan supaya field turunan (diagnosis, metodes, UK,
    // trimester, KF) dihitung server persis seperti saat dipakai bidan.
    // Record PERTAMA tiap modul dipakai uji alur (ID.*) — biarkan di urutan pertama.
    const ids = await isiDataContoh(api);
    return { ...ids, ...(await isiSuratContoh(api, await gambarContoh())) };
  };

  // TTD & cap contoh digambar di kanvas browser: TTD/cap asli klinik tidak ada di repo.
  const gambarContoh = async () => {
    const p = await browser.newPage();
    const hasil = await p.evaluate(() => {
      const kanvas = (w, h) => {
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        return [c, c.getContext("2d")];
      };
      const ttd = (n) => {
        const [c, g] = kanvas(480, 180);
        g.strokeStyle = "#1e2a6e";
        g.lineWidth = 4;
        g.lineCap = g.lineJoin = "round";
        g.beginPath();
        g.moveTo(40, 120);
        for (let i = 0; i < 8; i++) {
          const x = 40 + i * 48;
          g.bezierCurveTo(x + 12, 40 + ((i * n) % 3) * 15, x + 30, 150, x + 48, 95 + ((i + n) % 3) * 12);
        }
        g.stroke();
        g.beginPath();
        g.moveTo(70, 150);
        g.quadraticCurveTo(250, 128 - n * 6, 440, 142);
        g.stroke();
        return c.toDataURL("image/png");
      };
      const cap = () => {
        const [c, g] = kanvas(400, 400);
        g.strokeStyle = g.fillStyle = "rgba(67, 56, 202, 0.9)";
        g.translate(200, 200);
        g.lineWidth = 9;
        g.beginPath(); g.arc(0, 0, 186, 0, Math.PI * 2); g.stroke();
        g.lineWidth = 3;
        g.beginPath(); g.arc(0, 0, 128, 0, Math.PI * 2); g.stroke();
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.font = "bold 46px Arial";
        g.fillText("KLINIK", 0, -22);
        g.fillText("IYA", 0, 30);
        g.font = "bold 28px Arial";
        const teks = "BIDAN PRAKTIK MANDIRI ★ BITUNG ★ ";
        [...teks].forEach((h, i) => {
          g.save();
          g.rotate((i / teks.length) * Math.PI * 2);
          g.fillText(h, 0, -156);
          g.restore();
        });
        return c.toDataURL("image/png");
      };
      return { ttd: ttd(1), ttd2: ttd(2), cap: cap() };
    });
    await p.close();
    return hasil;
  };

  browser = await chromium.launch({ executablePath: exe, headless: true });
  const ID = await bootstrap();

  const HALAMAN = [
    { nama: "01-login", url: "/login", perluLogin: false },
    { nama: "02-dashboard", url: "/dashboard" },
    { nama: "03-consent-daftar", url: "/dashboard/consent" },
    { nama: "04-consent-baru", url: "/dashboard/consent/new" },
    { nama: "05-consent-baru-pratinjau", url: "/dashboard/consent/new", tabPratinjau: true },
    { nama: "06-consent-terbit", url: `/dashboard/consent/${ID.consent}` },
    { nama: "06-consent-draf", url: `/dashboard/consent/${ID.consentDraf}` },
    { nama: "07-sakit-daftar", url: "/dashboard/surat-sakit" },
    { nama: "07-sakit-baru", url: "/dashboard/surat-sakit/new" },
    { nama: "07-sakit-terbit-pratinjau", url: `/dashboard/surat-sakit/${ID.sakit}`, tabPratinjau: true },
    { nama: "08-cetak-consent", url: `/print/consent/${ID.consent}` },
    { nama: "08-cetak-sakit", url: `/print/surat-sakit/${ID.sakit}` },
    { nama: "09-pasien", url: "/dashboard/patients" },
    { nama: "10-kehamilan", url: "/dashboard/kehamilan" },
    { nama: "11-pasien-detail", url: `/dashboard/patients/${ID.pasien}` },
    { nama: "12-pasien-baru", url: "/dashboard/patients/new" },
    { nama: "13-kb", url: "/dashboard/kb" },
    { nama: "14-kb-detail", url: `/dashboard/kb/${ID.kb}` },
    { nama: "15-kb-baru", url: "/dashboard/kb/new" },
    { nama: "16-kehamilan-detail", url: `/dashboard/kehamilan/${ID.hamil}` },
    { nama: "17-kehamilan-baru", url: "/dashboard/kehamilan/new" },
    { nama: "18-persalinan", url: "/dashboard/persalinan" },
    { nama: "19-persalinan-detail", url: `/dashboard/persalinan/${ID.salin}` },
    { nama: "20-persalinan-baru", url: "/dashboard/persalinan/new" },
    { nama: "21-master-diagnosis", url: "/dashboard/master" },
    { nama: "21-master-penandatangan", url: "/dashboard/master?tab=penandatangan" },
    { nama: "21-master-kop", url: "/dashboard/master?tab=kop" },
    { nama: "21-master-penomoran", url: "/dashboard/master?tab=penomoran" },
    { nama: "22-diagnosis-edit", url: `/dashboard/master/diagnosis/${ID.config}` },
    { nama: "23-diagnosis-baru", url: "/dashboard/master/diagnosis/new" },
  ];
  // Filter opsional: VISUAL_ONLY=kb,pasien hanya memotret halaman yang namanya cocok.
  const SARING = process.env.VISUAL_ONLY?.split(",").filter(Boolean);
  if (SARING?.length) HALAMAN.splice(0, HALAMAN.length, ...HALAMAN.filter((h) => SARING.some((k) => h.nama.includes(k))));

  for (const layar of LAYAR) {
    const ctx = await browser.newContext({
      viewport: { width: layar.w, height: layar.h },
      deviceScaleFactor: 2,
      isMobile: layar.mobile,
      hasTouch: layar.mobile,
    });
    const page = await ctx.newPage();
    let halamanAktif = "-";
    page.on("pageerror", (e) => catat(layar.nama, halamanAktif, "ERROR-JS", e.message.slice(0, 160)));
    page.on("console", (m) => {
      if (m.type() === "error") catat(layar.nama, halamanAktif, "ERROR-KONSOL", m.text().slice(0, 160));
    });

    // login sekali per konteks
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await page.fill('input[name="username"], input[type="text"]', USER);
    await page.fill('input[type="password"]', PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 15000 }).catch(() => {});

    for (const h of HALAMAN) {
      halamanAktif = h.nama;
      try {
        if (h.url === "/login") {
          const ctx2 = await browser.newContext({
            viewport: { width: layar.w, height: layar.h },
            deviceScaleFactor: 2, isMobile: layar.mobile, hasTouch: layar.mobile,
          });
          const p2 = await ctx2.newPage();
          await p2.goto(`${BASE}/login`, { waitUntil: "networkidle" });
          await p2.screenshot({ path: path.join(OUT, `${h.nama}__${layar.nama}.png`), fullPage: true });
          const r = await p2.evaluate(PEMERIKSA);
          nilai(r, layar, h);
          await ctx2.close();
          continue;
        }

        await page.goto(`${BASE}${h.url}`, { waitUntil: "networkidle", timeout: 25000 });
        await page.waitForTimeout(700);

        if (h.tabPratinjau) {
          const tombol = page.getByRole("button", { name: /Pratinjau Surat/i });
          if (await tombol.count()) {
            await tombol.first().click().catch(() => {});
            await page.waitForTimeout(600);
          }
        }

        await potretPenuh(page, path.join(OUT, `${h.nama}__${layar.nama}.png`));

        const r = await page.evaluate(PEMERIKSA);
        nilai(r, layar, h);
      } catch (e) {
        catat(layar.nama, h.nama, "GAGAL", e.message.slice(0, 120));
      }
    }

    await ctx.close();
  }

  // Uji alur dilewati saat VISUAL_ONLY dipakai (pemeriksaan cepat).
  if (!SARING?.length || process.env.ALUR_ONLY) {
  // ---------- uji alur UI (klik sungguhan) ----------
  // Screenshot hanya membuktikan halaman tampil. Bagian ini membuktikan tombol,
  // modal, tab, dan form masih bekerja setelah perubahan tampilan.
  const SARING_ALUR = process.env.ALUR_ONLY;
  let pgAktif = null; // halaman yang dipotret bila alur gagal
  const uji = async (nama, fn) => {
    if (SARING_ALUR && !nama.toLowerCase().includes(SARING_ALUR.toLowerCase())) return;
    try {
      await fn();
      alur.push({ nama, ok: true });
    } catch (e) {
      await pgAktif?.screenshot({ path: path.join(OUT, `alur-gagal-${alur.length}.png`), fullPage: true }).catch(() => {});
      alur.push({ nama, ok: false, pesan: e.message.split("\n")[0].slice(0, 200) });
      catat("alur", nama, "ALUR-GAGAL", e.message.split("\n")[0].slice(0, 200));
    }
  };
  const harus = (kondisi, pesan) => { if (!kondisi) throw new Error(pesan); };
  const hariIni = new Date().toISOString().slice(0, 10);

  const bukaKonteks = async (w, h, mobile) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, acceptDownloads: true });
    const pg = await ctx.newPage();
    pgAktif = pg;
    pg.on("pageerror", (e) => catat("alur", pg.url().replace(BASE, ""), "ERROR-JS", e.message.slice(0, 160)));
    await pg.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await pg.fill('input[name="username"]', USER);
    await pg.fill('input[type="password"]', PASS);
    await pg.click('button[type="submit"]');
    await pg.waitForURL("**/dashboard", { timeout: 15000 });
    return { ctx, pg };
  };
  // Semua kolom di modal yang terbuka harus punya label yang tersambung.
  const cekLabelModal = async (pg) => {
    const tanpa = await pg.evaluate(() =>
      [...document.querySelectorAll("[role=dialog] input, [role=dialog] select, [role=dialog] textarea")]
        .filter((el) => el.type !== "hidden" && el.offsetParent !== null)
        .filter((el) => !(el.labels?.length || el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.closest("[role=group][aria-labelledby]")))
        .map((el) => el.name || el.placeholder || el.tagName.toLowerCase())
    );
    harus(!tanpa.length, `kolom tanpa label: ${tanpa.join(", ")}`);
  };
  const toast = (pg, teks) => pg.getByText(teks).first().waitFor({ timeout: 10000 });
  const ke = async (pg, url) => {
    await pg.goto(`${BASE}${url}`, { waitUntil: "networkidle", timeout: 25000 });
    await pg.waitForTimeout(400);
  };
  const gambarTtd = async (pg) => {
    const c = pg.locator("[role=dialog] canvas, canvas").last();
    const b = await c.boundingBox();
    harus(b, "kanvas tanda tangan tidak terlihat");
    await pg.mouse.move(b.x + 30, b.y + b.height / 2);
    await pg.mouse.down();
    for (let i = 1; i <= 12; i++) await pg.mouse.move(b.x + 30 + i * 15, b.y + b.height / 2 + (i % 2 ? -25 : 25), { steps: 2 });
    await pg.mouse.up();
  };

  // --- HP: laci menu ---
  {
    const { ctx, pg } = await bukaKonteks(390, 844, true);
    await uji("HP: buka & tutup menu dengan Escape", async () => {
      await pg.getByRole("button", { name: "Buka menu" }).click();
      const laci = pg.getByRole("dialog", { name: "Menu navigasi" });
      await laci.waitFor({ state: "visible" });
      await pg.keyboard.press("Escape");
      await laci.waitFor({ state: "hidden" });
    });
    await uji("HP: navigasi lewat menu → KB", async () => {
      await pg.getByRole("button", { name: "Buka menu" }).click();
      const laci = pg.getByRole("dialog", { name: "Menu navigasi" });
      await laci.getByRole("link", { name: "KB" }).click();
      await pg.waitForURL("**/dashboard/kb");
      await laci.waitFor({ state: "hidden" });
    });
    await uji("HP: modal kunjungan tampil sebagai lembar bawah, tombol simpan terjangkau", async () => {
      await ke(pg, `/dashboard/kehamilan/${ID.hamil}`);
      await pg.getByRole("tab", { name: /^Kunjungan/ }).click();
      await pg.getByRole("button", { name: /Tambah Kunjungan/ }).click();
      const dlg = pg.getByRole("dialog", { name: /Tambah Kunjungan ANC/ });
      await dlg.waitFor();
      await pg.waitForTimeout(500);
      await pg.screenshot({ path: path.join(OUT, "modal-anc__hp.png") });
      const kotak = await dlg.boundingBox();
      harus(Math.abs(kotak.y + kotak.height - 844) <= 2, `lembar tidak menempel di bawah (bawah=${kotak.y + kotak.height})`);
      const simpan = await pg.getByRole("button", { name: "Simpan Kunjungan" }).boundingBox();
      harus(simpan && simpan.y + simpan.height <= 844, "tombol Simpan di luar layar");
      await pg.keyboard.press("Escape");
      await dlg.waitFor({ state: "hidden" });
    });
    await uji("HP: tombol Keluar di topbar mengarah ke login", async () => {
      await pg.getByRole("button", { name: "Keluar" }).click();
      await pg.waitForURL("**/login", { timeout: 10000 });
    });
    await ctx.close();
  }

  const { ctx: dctx, pg } = await bukaKonteks(1440, 900, false);

  await uji("Desktop: sidebar → Persalinan", async () => {
    await pg.getByRole("navigation", { name: "Menu utama" }).getByRole("link", { name: "Persalinan" }).click();
    await pg.waitForURL("**/dashboard/persalinan");
  });

  await uji("Dashboard: kartu modul Persetujuan Tindakan berfungsi", async () => {
    await ke(pg, "/dashboard");
    await pg.locator("main").getByRole("link", { name: /Persetujuan Tindakan/ }).click();
    await pg.waitForURL("**/dashboard/consent");
  });

  await uji("Pasien: pencarian menyaring daftar", async () => {
    await ke(pg, "/dashboard/patients");
    await pg.fill('input[placeholder="Cari nama pasien..."]', "Dewi");
    await pg.waitForTimeout(1200);
    const teks = await pg.locator("main table tbody").innerText();
    harus(/Dewi/.test(teks) && !/Aminah/.test(teks), `hasil cari tidak tersaring: ${teks.slice(0, 80)}`);
  });

  for (const [modul, id] of [["patients", ID.pasien], ["kb", ID.kb], ["kehamilan", ID.hamil], ["persalinan", ID.salin]]) {
    await uji(`${modul}: semua tab bisa dibuka`, async () => {
      await ke(pg, `/dashboard/${modul}/${id}`);
      await pg.locator("main h1").first().waitFor(); // header terisi = data selesai dimuat
      const tabs = pg.getByRole("tab");
      const n = await tabs.count();
      harus(n >= 2, `hanya ${n} tab`);
      for (let i = 0; i < n; i++) {
        await tabs.nth(i).click();
        await pg.waitForTimeout(400);
        harus((await tabs.nth(i).getAttribute("aria-selected")) === "true", `tab ${i} tidak aktif`);
        await potretPenuh(pg, path.join(OUT, `tab-${modul}-${i + 1}__desktop.png`));
      }
    });
  }

  await uji("HP: semua tab detail dipotret (termasuk jadwal anjuran)", async () => {
    const { ctx, pg: hp } = await bukaKonteks(390, 844, true);
    try {
      for (const [modul, id] of [["patients", ID.pasien], ["kb", ID.kb], ["kehamilan", ID.hamil], ["persalinan", ID.salin]]) {
        await ke(hp, `/dashboard/${modul}/${id}`);
        await hp.locator("main h1").first().waitFor();
        const tabs = hp.getByRole("tab");
        const n = await tabs.count();
        for (let i = 0; i < n; i++) {
          await tabs.nth(i).click();
          await hp.waitForTimeout(400);
          const anjuran = hp.getByRole("button", { name: /jadwal anjuran/i });
          if (await anjuran.count()) {
            await anjuran.click();
            await hp.waitForTimeout(450); // tunggu animasi masuk selesai
          }
          await potretPenuh(hp, path.join(OUT, `tab-${modul}-${i + 1}__hp.png`));
        }
      }
    } finally {
      await ctx.close();
      pgAktif = pg;
    }
  });

  await uji("Pasien: tambah kunjungan lewat modal", async () => {
    await ke(pg, `/dashboard/patients/${ID.pasien}`);
    await pg.getByRole("tab", { name: /Kunjungan/ }).click();
    const awal = Number((await pg.getByText(/^Kunjungan: \d+x$/).innerText()).match(/\d+/)[0]);
    await pg.getByRole("button", { name: /Tambah Kunjungan/ }).click();
    await pg.getByText("Tambah Kunjungan Baru").waitFor();
    await cekLabelModal(pg);
    await pg.waitForTimeout(350);
    await pg.screenshot({ path: path.join(OUT, "modal-pasien__desktop.png") });
    // focus trap: Tab berkali-kali tidak boleh keluar dari modal
    for (let i = 0; i < 25; i++) await pg.keyboard.press("Tab");
    harus(await pg.evaluate(() => !!document.activeElement?.closest("[role=dialog]")), "fokus keluar dari modal saat menekan Tab");
    await pg.fill('input[name="date"]', hariIni);
    await pg.fill('[name="complaint"]', "Uji alur otomatis");
    await pg.getByRole("button", { name: "Simpan Kunjungan" }).click();
    await toast(pg, "Kunjungan berhasil disimpan");
    await pg.getByText(`Kunjungan: ${awal + 1}x`).waitFor({ timeout: 8000 });
  });

  await uji("Pasien: penjaga 'perubahan belum disimpan' lalu simpan", async () => {
    await ke(pg, `/dashboard/patients/${ID.pasien}`);
    await pg.getByRole("tab", { name: /Edit Data/ }).click();
    const alamat = pg.locator('input[name="address"], textarea[name="address"]').first();
    await alamat.fill("Jl. Uji Alur 1, Bitung");
    await pg.getByRole("button", { name: "Kembali" }).click();
    await pg.getByText("Perubahan Belum Disimpan").waitFor();
    await pg.getByRole("dialog").getByRole("button", { name: "Batal", exact: true }).click();
    harus(pg.url().includes(`/patients/${ID.pasien}`), "halaman ikut berpindah padahal dibatalkan");
    await pg.getByRole("button", { name: /Simpan Perubahan/ }).click();
    await toast(pg, "Perubahan berhasil disimpan");
  });

  await uji("KB: edit data tersimpan & tetap ada setelah dimuat ulang", async () => {
    await ke(pg, `/dashboard/kb/${ID.kb}`);
    await pg.getByRole("tab", { name: /Edit Data/ }).click();
    const alamat = pg.locator('[name="address"]');
    await alamat.fill("Jl. Uji Edit KB 7, Bitung");
    // tap label harus memfokuskan kolomnya (label tersambung)
    await pg.locator('label[for="numberOfChildren"]').click();
    harus(await pg.evaluate(() => document.activeElement?.name === "numberOfChildren"), "label Jumlah Anak tidak tersambung ke kolomnya");
    await pg.getByRole("button", { name: /Simpan Perubahan/ }).click();
    await toast(pg, "Perubahan berhasil disimpan");
    await ke(pg, `/dashboard/kb/${ID.kb}`);
    await pg.getByRole("tab", { name: /Edit Data/ }).click();
    harus((await pg.locator('[name="address"]').inputValue()) === "Jl. Uji Edit KB 7, Bitung", "alamat tidak tersimpan");
    const simpan = pg.getByRole("button", { name: /Tersimpan/ });
    harus(await simpan.isDisabled(), "tombol simpan aktif padahal tidak ada perubahan");
  });

  await uji("Kehamilan: ubah status minta konfirmasi & tidak menghapus isian form", async () => {
    await ke(pg, `/dashboard/kehamilan/${ID.hamil}`);
    await pg.getByRole("tab", { name: /Edit Data/ }).click();
    const alamat = pg.locator('[name="address"]');
    await alamat.fill("Jl. Belum Disimpan 3");
    for (const [ke_, balik] of [["rujuk", false], ["aktif", true]]) {
      await pg.getByRole("button", { name: ke_, exact: true }).click();
      await pg.getByRole("button", { name: "Ya, Ubah Status" }).click();
      await toast(pg, "Status berhasil diperbarui");
      await pg.getByRole("dialog").waitFor({ state: "detached" });
      harus(await pg.getByRole("button", { name: ke_, exact: true }).getAttribute("aria-pressed") === "true", `status ${ke_} tidak aktif`);
      if (!balik) harus((await alamat.inputValue()) === "Jl. Belum Disimpan 3", "isian form hilang setelah ubah status");
    }
    await pg.getByRole("button", { name: "Batalkan" }).click();
    harus((await alamat.inputValue()) !== "Jl. Belum Disimpan 3", "tombol Batalkan tidak mengembalikan isian");
  });

  await uji("Detail: ID tak dikenal → pesan 'tidak ditemukan' + kembali ke daftar", async () => {
    await ke(pg, "/dashboard/kb/000000000000000000000000");
    await pg.getByText("Data KB tidak ditemukan").waitFor();
    await pg.getByRole("link", { name: /Kembali ke daftar/ }).click();
    await pg.waitForURL("**/dashboard/kb");
  });

  await uji("KB: tambah kunjungan lewat modal", async () => {
    await ke(pg, `/dashboard/kb/${ID.kb}`);
    await pg.getByRole("tab", { name: /Kunjungan/ }).click();
    const awalKb = Number((await pg.getByText(/^Kunjungan: \d+x$/).innerText()).match(/\d+/)[0]);
    await pg.getByRole("button", { name: /Tambah Kunjungan/ }).click();
    await pg.getByText("Tambah Kunjungan KB").waitFor();
    await cekLabelModal(pg);
    await pg.fill('input[name="date"]', hariIni);
    await pg.selectOption('select[name="metode"]', { index: 1 });
    await pg.getByRole("button", { name: "Simpan Kunjungan" }).click();
    await toast(pg, "Kunjungan berhasil disimpan");
    await pg.getByText(`Kunjungan: ${awalKb + 1}x`).waitFor({ timeout: 8000 });
  });

  await uji("Kehamilan: tambah kunjungan ANC lewat modal", async () => {
    await ke(pg, `/dashboard/kehamilan/${ID.hamil}`);
    await pg.getByRole("tab", { name: /^Kunjungan/ }).click();
    await pg.getByRole("button", { name: /Tambah Kunjungan/ }).click();
    await pg.getByText("Tambah Kunjungan ANC").waitFor();
    await cekLabelModal(pg);
    await pg.fill('input[name="date"]', hariIni);
    await pg.fill('input[name="beratBadan"]', "60");
    await pg.getByRole("button", { name: "Simpan Kunjungan" }).click();
    await toast(pg, /berhasil/i);
  });

  await uji("Persalinan: tambah kunjungan nifas lewat modal", async () => {
    await ke(pg, `/dashboard/persalinan/${ID.salin}`);
    const awalNifas = Number((await pg.getByText(/^\d+ kunjungan nifas$/).first().innerText()).match(/\d+/)[0]);
    await pg.getByRole("tab", { name: /Kunjungan Nifas/ }).click();
    await pg.getByRole("button", { name: /Tambah Kunjungan/ }).click();
    await pg.getByText("Tambah Kunjungan Nifas").waitFor();
    await cekLabelModal(pg);
    await pg.waitForTimeout(350);
    await pg.screenshot({ path: path.join(OUT, "modal-nifas__desktop.png") });
    await pg.fill('input[name="date"]', hariIni);
    await pg.getByRole("button", { name: "Simpan Kunjungan" }).click();
    await toast(pg, /berhasil/i);
    await pg.getByText(`${awalNifas + 1} kunjungan nifas`).first().waitFor({ timeout: 8000 });
  });

  await uji("KB: export Excel mengunduh berkas", async () => {
    await ke(pg, "/dashboard/kb");
    await pg.getByRole("button", { name: /Export Excel/ }).click();
    await pg.getByText("Export Data KB").waitFor();
    await cekLabelModal(pg);
    await pg.waitForTimeout(350);
    await pg.screenshot({ path: path.join(OUT, "modal-export-kb__desktop.png") });
    const [unduh] = await Promise.all([
      pg.waitForEvent("download", { timeout: 20000 }),
      pg.getByRole("button", { name: /Download Excel/ }).click(),
    ]);
    harus(/\.xlsx$/i.test(unduh.suggestedFilename()), `nama berkas: ${unduh.suggestedFilename()}`);
  });

  await uji("KB: hapus data lewat modal konfirmasi", async () => {
    await ke(pg, "/dashboard/kb");
    const sebelum = await pg.locator("main table tbody tr").count();
    await pg.locator("main table tbody tr").last().getByRole("button", { name: /Hapus/ }).click();
    await pg.getByRole("dialog").waitFor();
    await pg.waitForTimeout(350);
    await pg.screenshot({ path: path.join(OUT, "modal-konfirmasi__desktop.png") });
    await pg.getByRole("button", { name: "Ya, Hapus" }).click();
    await toast(pg, /berhasil/i);
    await pg.waitForTimeout(1000);
    const sesudah = await pg.locator("main table tbody tr").count();
    harus(sesudah === sebelum - 1, `baris ${sebelum} → ${sesudah}`);
  });

  await uji("Master Data: tambah diagnosis baru", async () => {
    await ke(pg, "/dashboard/master/diagnosis/new");
    await pg.fill('input[placeholder="Contoh: Sakit Kepala"]', "Anemia Uji");
    await pg.locator('main button[type=submit]').click();
    await pg.waitForURL("**/dashboard/master?tab=diagnosis", { timeout: 10000 });
    await pg.getByText("Anemia Uji").first().waitFor();
  });

  await uji("Master Data: tambah penanda tangan dengan TTD digores", async () => {
    await ke(pg, "/dashboard/master?tab=penandatangan");
    await pg.getByRole("button", { name: "Tambah Petugas" }).click();
    const modal = pg.getByRole("dialog");
    await modal.getByLabel("Nama & Gelar").fill("dr. Uji Alur");
    await modal.getByText("Dokter", { exact: true }).click();
    await modal.getByText("Gores di layar").click();
    await gambarTtd(pg);
    await cekLabelModal(pg);
    await pg.waitForTimeout(300);
    await pg.screenshot({ path: path.join(OUT, "modal-petugas__desktop.png") });
    await modal.getByRole("button", { name: "Simpan", exact: true }).click();
    await modal.waitFor({ state: "detached", timeout: 10000 });
    await pg.getByRole("heading", { name: "dr. Uji Alur" }).waitFor();
    harus(await pg.getByRole("img", { name: "Tanda tangan dr. Uji Alur" }).count(), "TTD tidak tampil di kartu");
  });

  await uji("Master Data: berpindah antar-tab bolak-balik tanpa error", async () => {
    const galat = [];
    const catatGalat = (e) => galat.push(e.message);
    pg.on("pageerror", catatGalat);
    await ke(pg, "/dashboard/master?tab=penomoran");
    for (const nama of ["Penanda Tangan", "Diagnosis", "Kop & Cap", "Penomoran", "Diagnosis"]) {
      await pg.getByRole("tab", { name: nama }).click();
      await pg.waitForURL(/tab=/);
      await pg.getByRole("tabpanel", { name: nama }).waitFor();
    }
    pg.off("pageerror", catatGalat);
    harus(!galat.length, `error saat pindah tab: ${galat[0]}`);
  });

  await uji("Master Data: tombol sisip pola nomor di posisi kursor & hapus per bagian", async () => {
    await ke(pg, "/dashboard/master?tab=penomoran");
    const pola = pg.getByLabel("Pola nomor").first();
    await pola.click();
    await pola.evaluate((el) => { const i = el.value.indexOf("/IC/") + 4; el.setSelectionRange(i, i); });
    await pg.getByRole("button", { name: /strip -$/ }).first().click();
    const v1 = await pola.inputValue();
    harus(v1.includes("/IC/-KLN"), `tidak tersisip di kursor: ${v1}`);
    harus(await pola.evaluate((el) => document.activeElement === el), "fokus pindah dari kolom pola");
    await pola.evaluate((el) => el.setSelectionRange(el.value.length, el.value.length));
    await pg.keyboard.press("Backspace");
    harus((await pola.inputValue()).endsWith("{romawi}/"), "hapus mundur tidak menghapus token utuh");
    await pg.getByRole("button", { name: "Pola bawaan" }).first().click();
    harus(/^\{urut3\}\/IC\/KLN-IYA\/\{romawi\}\/\{tahun\}$/.test(await pola.inputValue()), "pola bawaan tidak kembali");
    await pg.getByRole("button", { name: "Tersimpan" }).waitFor(); // kembali ke pola tersimpan → tidak ada perubahan
  });

  await uji("Surat (laptop): tidak tergulir melewati isi, saklar saksi tidak melompat", async () => {
    await pg.setViewportSize({ width: 1366, height: 768 });
    await ke(pg, "/dashboard/consent/new");
    const posisi = () => pg.evaluate(() => {
      const p = [...document.querySelectorAll("h2")].find((h) => h.textContent === "Pratinjau Surat").closest(".rounded-2xl");
      return { doc: document.scrollingElement.scrollTop, docTinggi: document.scrollingElement.scrollHeight, main: document.querySelector("main").scrollTop, pratinjau: Math.round(p.getBoundingClientRect().top) };
    });
    await pg.mouse.move(500, 400);
    for (let i = 0; i < 16; i++) await pg.mouse.wheel(0, 300);
    await pg.waitForTimeout(400);
    let s = await posisi();
    harus(s.doc === 0 && s.docTinggi <= 768, `dokumen ikut tergulir (${s.doc}px, tinggi ${s.docTinggi})`);
    harus(s.pratinjau >= 0, `pratinjau terdorong ke atas (${s.pratinjau}px)`);
    const saklar = pg.getByRole("switch", { name: /Saksi dari keluarga/ });
    // Bawa ke layar dulu: klik Playwright sendiri menggulir ke elemen sebelum mengeklik
    await saklar.evaluate((el) => el.closest("label").scrollIntoView({ block: "center" }));
    await pg.waitForTimeout(300);
    const awal = await posisi();
    await saklar.click({ force: true });
    await pg.waitForTimeout(300);
    s = await posisi();
    harus(s.doc === 0 && Math.abs(s.main - awal.main) < 3 && s.pratinjau === awal.pratinjau, `saklar saksi menggeser halaman: ${JSON.stringify(awal)} → ${JSON.stringify(s)}`);
    await pg.setViewportSize({ width: 1440, height: 900 });
  });

  await uji("Consent: buat draf → gores TTD → terbitkan → cetak", async () => {
    await ke(pg, "/dashboard/consent/new");
    await pg.locator('input[placeholder="Nama lengkap"]').first().fill("Ny. Uji Alur");
    await pg.fill('input[placeholder="mis. Pemasangan IUD"]', "Pemasangan Implan");
    await pg.getByRole("combobox", { name: "Saksi dari klinik" }).selectOption({ index: 1 });
    await pg.getByRole("group", { name: "Cara tanda tangan Saksi dari Keluarga Pasien" }).getByText("TTD basah").click();
    await pg.getByRole("button", { name: "Simpan Draf" }).click();
    await pg.waitForURL(/\/dashboard\/consent\/[a-f0-9]{24}$/, { timeout: 15000 });
    await pg.getByRole("button", { name: "Gores TTD" }).click();
    const modal = pg.getByRole("dialog");
    await gambarTtd(pg);
    await pg.waitForTimeout(350);
    await pg.screenshot({ path: path.join(OUT, "modal-ttd__desktop.png") });
    await modal.getByRole("button", { name: /Simpan Tanda Tangan/ }).click();
    await modal.waitFor({ state: "detached", timeout: 10000 });
    await pg.getByRole("button", { name: "Terbitkan" }).click();
    await pg.getByRole("dialog", { name: "Terbitkan Surat?" }).waitFor();
    await pg.waitForTimeout(350);
    await pg.screenshot({ path: path.join(OUT, "modal-terbit__desktop.png") });
    await pg.getByRole("button", { name: "Ya, Terbitkan" }).click();
    await pg.getByText("Sudah terbit dan terkunci").waitFor({ timeout: 15000 });
    const href = await pg.getByRole("link", { name: /Cetak/ }).getAttribute("href");
    await ke(pg, href);
    const teks = await pg.locator("body").innerText();
    harus(/INFORMED CONSENT TINDAKAN MEDIK/.test(teks) && /Ny\. Uji Alur/.test(teks), "isi cetak tidak lengkap");
  });

  await uji("Surat sakit: ambil dari data pasien → terbitkan", async () => {
    await ke(pg, "/dashboard/surat-sakit/new");
    await pg.getByRole("button", { name: "Ambil dari data pasien" }).click();
    const modal = pg.getByRole("dialog");
    await modal.getByRole("searchbox", { name: "Cari nama pasien" }).fill("Dewi");
    await modal.getByRole("button", { name: /Dewi Lestari/ }).first().click();
    await modal.waitFor({ state: "detached", timeout: 10000 });
    harus((await pg.getByLabel("Nama Lengkap").inputValue()) === "Ny. Dewi Lestari", "nama tidak tersalin");
    harus(Number(await pg.getByLabel("Umur (tahun)").inputValue()) > 30, "umur tidak dihitung");
    await pg.getByLabel("Pekerjaan").fill("Guru");
    await pg.getByRole("button", { name: "Simpan Draf" }).click();
    await pg.waitForURL(/\/dashboard\/surat-sakit\/[a-f0-9]{24}$/, { timeout: 15000 });
    await pg.getByRole("button", { name: "Terbitkan" }).click();
    await pg.getByRole("button", { name: "Ya, Terbitkan" }).click();
    await pg.getByText("Sudah terbit dan terkunci").waitFor({ timeout: 15000 });
    harus(/\/SKS\//.test(await pg.locator("h1").innerText()), "nomor surat sakit tidak tampil");
  });

  await dctx.close();
  }

  function nilai(r, layar, h) {
    if (r.lebarGulir > r.lebarLayar + 1) {
      catat(layar.nama, h.nama, "GULIR-MENDATAR",
        `halaman ${r.lebarGulir}px pada layar ${r.lebarLayar}px`);
    }
    for (const m of r.menonjol) {
      catat(layar.nama, h.nama, "MENONJOL",
        `<${m.tag}> "${m.teks}" kanan=${m.kanan}px (layar ${r.lebarLayar}px) [${m.kelas}]`);
    }
    if (layar.mobile) {
      for (const s of r.sentuhKecil) {
        catat(layar.nama, h.nama, "SENTUH-KECIL", `<${s.tag}> "${s.teks}" ${s.ukuran}px [${s.kelas}]`);
      }
    }
    for (const t of r.teksKecil) {
      catat(layar.nama, h.nama, "TEKS-KECIL", `"${t.teks}" ${t.px}px`);
    }
    // cukup sekali per halaman (di layar terlebar), bukan per ukuran layar
    if (layar.nama === "desktop") {
      for (const t of r.tanpaLabel) {
        catat(layar.nama, h.nama, "TANPA-LABEL", `<${t.tag}> name="${t.nama}" placeholder="${t.placeholder}"`);
      }
    }
  }
} catch (e) {
  console.error("FATAL:", e.message);
  temuan.push({ layar: "-", halaman: "-", jenis: "FATAL", pesan: e.message });
} finally {
  if (browser) await browser.close().catch(() => {});
  try {
    if (mongoose.connection.readyState === 1) {
      // Data contoh sengaja disimpan (dikosongkan lagi di awal run berikutnya)
      // supaya bisa dibuka dengan `npm run dev:demo`.
      await mongoose.disconnect();
    }
  } catch {}
  if (server && !server.killed) {
    server.kill();
    if (process.platform === "win32") {
      try { spawn("taskkill", ["/pid", String(server.pid), "/f", "/t"], { stdio: "ignore" }); } catch {}
    }
  }
}

// ---------- ringkasan ----------
if (fs.existsSync(OUT)) fs.writeFileSync(path.join(OUT, "temuan.json"), JSON.stringify(temuan, null, 1));
const berkas = fs.existsSync(OUT) ? fs.readdirSync(OUT).filter((f) => f.endsWith(".png")).length : 0;
console.log(`\nPotret tersimpan: ${berkas} berkas di .visual/`);

if (!temuan.length) {
  console.log("\nTidak ada masalah tata letak terdeteksi.");
} else {
  const perJenis = {};
  for (const t of temuan) (perJenis[t.jenis] ||= []).push(t);
  console.log(`\n${temuan.length} temuan:\n`);
  for (const [jenis, daftar] of Object.entries(perJenis)) {
    console.log(`── ${jenis} (${daftar.length})`);
    for (const t of daftar.slice(0, 14)) {
      console.log(`   [${t.layar.padEnd(9)}] ${t.halaman.padEnd(28)} ${t.pesan}`);
    }
    if (daftar.length > 14) console.log(`   ... dan ${daftar.length - 14} lagi`);
    console.log("");
  }
}
if (alur.length) {
  const gagal = alur.filter((a) => !a.ok);
  console.log(`Uji alur UI: ${alur.length - gagal.length}/${alur.length} lolos`);
  for (const a of alur) console.log(`  ${a.ok ? "LOLOS" : "GAGAL"}  ${a.nama}${a.ok ? "" : `  →  ${a.pesan}`}`);
}
process.exit(alur.some((a) => !a.ok) ? 1 : 0);
