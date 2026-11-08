/**
 * Suite test API end-to-end untuk klinik_app.
 *
 * Aman terhadap data produksi:
 *  - MONGODB_URI dialihkan ke database terpisah "klinik_apitest" di cluster yang sama
 *  - Kredensial login diganti kredensial test (AUTH_* asli tidak dipakai)
 *  - Database test dikosongkan di AWAL run dan dibiarkan setelah selesai,
 *    supaya hasilnya bisa dibuka dengan `npm run dev:demo api`
 *
 * Menjalankan server Next produksi sungguhan lalu memukul HTTP endpoint-nya.
 */
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import mongoose from "mongoose";

const ROOT = process.cwd();
const PORT = 3987;
const BASE = `http://127.0.0.1:${PORT}`;
const TEST_DB = "klinik_apitest";
const TEST_USER = "testadmin";
const TEST_PASS = "testpass-12345";

// ---------- env ----------
const envRaw = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
const envReal = {};
for (const line of envRaw.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m) envReal[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

function toTestUri(uri) {
  // ganti nama database di path dengan TEST_DB
  const [scheme, rest] = uri.split("://");
  const qIdx = rest.indexOf("?");
  const query = qIdx === -1 ? "" : rest.slice(qIdx);
  const beforeQuery = qIdx === -1 ? rest : rest.slice(0, qIdx);
  const slashIdx = beforeQuery.indexOf("/");
  const hostPart = slashIdx === -1 ? beforeQuery : beforeQuery.slice(0, slashIdx);
  return `${scheme}://${hostPart}/${TEST_DB}${query}`;
}

const TEST_URI = toTestUri(envReal.MONGODB_URI);
if (!TEST_URI.includes(`/${TEST_DB}`)) {
  console.error("Gagal menurunkan URI test. Batal.");
  process.exit(1);
}

// ---------- mini test framework ----------
let pass = 0,
  fail = 0;
const failures = [];
let section = "";

function head(name) {
  section = name;
  console.log(`\n── ${name} ${"─".repeat(Math.max(0, 58 - name.length))}`);
}

async function t(name, fn) {
  try {
    await fn();
    pass++;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    fail++;
    failures.push(`[${section}] ${name}\n        ${e.message}`);
    console.log(`  FAIL  ${name}\n        ${e.message}`);
  }
}

function eq(actual, expected, label = "nilai") {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${label}: harap ${b}, dapat ${a}`);
}
function ok(cond, msg) {
  if (!cond) throw new Error(msg);
}

// ---------- http helper ----------
let cookie = "";
async function api(pathname, options = {}) {
  const res = await fetch(`${BASE}${pathname}`, {
    redirect: "manual",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* halaman HTML */
  }
  return { status: res.status, json, text, headers: res.headers };
}

// ---------- server ----------
// Suite memakai folder build sendiri. Kalau memakai .next, menjalankan test
// sambil `npm run dev` akan menimpa build dev server dan merusaknya.
const DIST = ".next-test";
const NEXT_BIN = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
const ENV_SERVER = {
  MONGODB_URI: TEST_URI,
  JWT_SECRET: "test-jwt-secret-for-api-suite-only",
  AUTH_USERNAME: TEST_USER,
  AUTH_PASSWORD: TEST_PASS,
  NEXT_DIST_DIR: DIST,
};

/** Build ulang hanya kalau ada sumber yang lebih baru dari build terakhir. */
function perluBuild() {
  const penanda = path.join(ROOT, DIST, "BUILD_ID");
  if (!fs.existsSync(penanda)) return true;
  const waktuBuild = fs.statSync(penanda).mtimeMs;

  let terbaru = 0;
  const telusuri = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) telusuri(p);
      else terbaru = Math.max(terbaru, fs.statSync(p).mtimeMs);
    }
  };
  telusuri(path.join(ROOT, "src"));
  for (const f of ["next.config.mjs", "package.json"]) {
    const p = path.join(ROOT, f);
    if (fs.existsSync(p)) terbaru = Math.max(terbaru, fs.statSync(p).mtimeMs);
  }
  return terbaru > waktuBuild;
}

function buildTest() {
  return new Promise((resolve, reject) => {
    console.log(`Membangun ke ${DIST}/ (tidak mengganggu .next milik dev server)...`);
    const p = spawn(process.execPath, [NEXT_BIN, "build", "--webpack"], {
      cwd: ROOT,
      env: { ...process.env, ...ENV_SERVER, NODE_ENV: "production" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let keluaran = "";
    p.stdout.on("data", (d) => { keluaran += d.toString(); });
    p.stderr.on("data", (d) => { keluaran += d.toString(); });
    p.on("close", (code) => {
      if (code === 0) { console.log("Build selesai.\n"); resolve(); }
      else reject(new Error(`Build gagal:\n${keluaran.slice(-3000)}`));
    });
  });
}

let server;
async function startServer() {
  if (perluBuild()) await buildTest();

  console.log(`Menjalankan server di ${BASE} (database: ${TEST_DB})...`);
  const nextBin = NEXT_BIN;
  server = spawn(process.execPath, [nextBin, "start", "-p", String(PORT)], {
    cwd: ROOT,
    env: {
      ...process.env,
      ...ENV_SERVER,
      NODE_ENV: "production",
    },
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
  });
  server.stdout.on("data", () => {});
  server.stderr.on("data", (d) => {
    const s = d.toString();
    if (/Error|error/.test(s)) process.stdout.write(`  [server] ${s}`);
  });

  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${BASE}/login`, { redirect: "manual" });
      if (r.status === 200) {
        console.log("Server siap.\n");
        return;
      }
    } catch {
      /* belum naik */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Server tidak siap dalam 60 detik");
}

// ---------- util domain ----------
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const iso = (d) => new Date(d).toISOString();
// Tanggal surat selalu dikirim sebagai tanggal kalender, sama seperti <input type="date">.
const tgl = (y, m, d) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const tglHariIni = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n) => new Date(Date.now() - n * MS_PER_DAY);
const daysAhead = (n) => new Date(Date.now() + n * MS_PER_DAY);

async function clearCollection(name) {
  await mongoose.connection.db.collection(name).deleteMany({});
}

// =====================================================================
async function run() {
  await startServer();
  await mongoose.connect(TEST_URI, { bufferCommands: false });
  // Mulai dari kosong; data run sebelumnya sengaja tidak dihapus saat selesai.
  if (mongoose.connection.db.databaseName === TEST_DB) await mongoose.connection.dropDatabase();

  // ---------------------------------------------------------------
  head("Autentikasi & middleware");

  // Harus 401 JSON, bukan redirect: fetch() mengikuti redirect dan menerima
  // HTML login berstatus 200, jadi klien tidak pernah tahu sesinya habis.
  await t("API tanpa cookie → 401 JSON (bukan redirect)", async () => {
    const r = await api("/api/patients");
    eq(r.status, 401, "status");
    eq(r.json?.status, "error", "status payload");
  });

  await t("API dengan token rusak → 401 JSON", async () => {
    const r = await api("/api/kb/export?month=1&year=2026", { headers: { Cookie: "token=rusak" } });
    eq(r.status, 401, "status");
  });

  await t("halaman dashboard tanpa cookie tetap redirect ke /login", async () => {
    const r = await api("/dashboard/patients");
    ok(r.status === 307 || r.status === 302, `harap redirect, dapat ${r.status}`);
    ok(/\/login/.test(r.headers.get("location") || ""), "lokasi redirect");
  });

  await t("login dengan password salah → 401", async () => {
    const r = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: TEST_USER, password: "salah" }),
    });
    eq(r.status, 401, "status");
  });

  await t("login tanpa password → 400", async () => {
    const r = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: TEST_USER }),
    });
    eq(r.status, 400, "status");
  });

  await t("login benar → 200 + cookie httpOnly", async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: TEST_USER, password: TEST_PASS }),
      redirect: "manual",
    });
    eq(res.status, 200, "status");
    const setCookies = res.headers.getSetCookie?.() || [];
    const tok = setCookies.find((c) => c.startsWith("token="));
    ok(tok, "cookie token tidak ada");
    ok(/HttpOnly/i.test(tok), "cookie bukan HttpOnly");
    cookie = tok.split(";")[0];
  });

  await t("setelah login, API bisa diakses", async () => {
    const r = await api("/api/patients?page=1&limit=10");
    eq(r.status, 200, "status");
    eq(r.json.status, "success", "status payload");
  });

  // ---------------------------------------------------------------
  head("Pagination guard (perbaikan baru)");

  await t("page=-1 tidak error, dinormalisasi ke 1", async () => {
    const r = await api("/api/patients?page=-1&limit=10");
    eq(r.status, 200, "status");
    eq(r.json.page, 1, "page");
  });

  await t("page=abc → 1", async () => {
    const r = await api("/api/patients?page=abc&limit=10");
    eq(r.status, 200, "status");
    eq(r.json.page, 1, "page");
  });

  await t("limit=0 → pakai default, bukan 0", async () => {
    const r = await api("/api/patients?page=1&limit=0");
    eq(r.status, 200, "status");
    ok(Array.isArray(r.json.data), "data bukan array");
  });

  await t("limit=99999 di-clamp (tidak scan tak terbatas)", async () => {
    for (let i = 0; i < 12; i++) {
      await api("/api/patients", {
        method: "POST",
        body: JSON.stringify({
          name: `Clamp ${i}`,
          dateOfBirth: iso("1990-01-01"),
          gender: "Female",
        }),
      });
    }
    const r = await api("/api/patients?page=1&limit=99999");
    eq(r.status, 200, "status");
    ok(
      r.json.data.length <= 100,
      `harap <=100 (maxLimit), dapat ${r.json.data.length}`
    );
  });

  await t("limit besar tidak bikin totalPages jadi 0", async () => {
    const r = await api("/api/patients?page=1&limit=99999");
    ok(r.json.totalPages >= 1, `totalPages=${r.json.totalPages}`);
  });

  await clearCollection("patients");

  // ---------------------------------------------------------------
  head("Pasien — CRUD & proyeksi list");

  let patientId;
  await t("POST pasien → 201", async () => {
    const r = await api("/api/patients", {
      method: "POST",
      body: JSON.stringify({
        name: "Siti Aminah",
        dateOfBirth: iso("1995-06-15"),
        gender: "Female",
        address: "Jl. Mawar 10",
      }),
    });
    eq(r.status, 201, "status");
    patientId = r.json.data._id;
    ok(patientId, "tidak dapat _id");
  });

  await t("list TIDAK mengirim visits[] (perbaikan select+lean)", async () => {
    const r = await api("/api/patients?page=1&limit=10");
    const row = r.json.data.find((p) => p._id === patientId);
    ok(row, "pasien tidak ada di list");
    ok(!("visits" in row), "visits[] masih ikut terkirim");
    ok(!("diagnosis" in row), "diagnosis masih ikut terkirim");
  });

  await t("list tetap mengirim field yang dipakai UI", async () => {
    const r = await api("/api/patients?page=1&limit=10");
    const row = r.json.data.find((p) => p._id === patientId);
    for (const f of ["_id", "name", "dateOfBirth", "gender"]) {
      ok(f in row, `field ${f} hilang dari payload list`);
    }
  });

  await t("search di-escape: '.*' tidak match semua", async () => {
    const r = await api("/api/patients?page=1&limit=10&search=.*");
    eq(r.json.data.length, 0, "jumlah hasil");
  });

  await t("search normal tetap jalan", async () => {
    const r = await api("/api/patients?page=1&limit=10&search=Aminah");
    eq(r.json.data.length, 1, "jumlah hasil");
  });

  await t("PATCH tambah kunjungan → diagnosis auto-derive", async () => {
    const r = await api(`/api/patients/${patientId}`, {
      method: "PATCH",
      body: JSON.stringify({
        visits: [
          {
            date: iso(daysAgo(3)),
            complaint: "Demam",
            medication: "Paracetamol",
            visitDiagnosis: ["ISPA", "Demam"],
          },
          {
            date: iso(daysAgo(1)),
            complaint: "Batuk",
            visitDiagnosis: ["ISPA"],
          },
        ],
      }),
    });
    eq(r.status, 200, "status");
    eq([...r.json.data.diagnosis].sort(), ["Demam", "ISPA"], "diagnosis unik");
  });

  await t("GET detail tetap mengirim visits[]", async () => {
    const r = await api(`/api/patients/${patientId}`);
    eq(r.status, 200, "status");
    eq(r.json.data.visits.length, 2, "jumlah visits");
  });

  await t("GET detail id tidak ada → 404", async () => {
    const r = await api("/api/patients/000000000000000000000000");
    eq(r.status, 404, "status");
  });

  // Detail error internal (pesan Mongo/Mongoose, nama koleksi) tidak boleh sampai ke klien.
  const tanpaBocor = (r) => {
    eq(r.json?.status, "error", "status payload");
    eq(r.json?.data, null, "data error");
    ok(!/Cast|ObjectId|E11000|mongo|JSON|position/i.test(r.json.message), `pesan bocor: ${r.json.message}`);
  };

  await t("id bukan ObjectId → 400 tanpa detail internal", async () => {
    const r = await api("/api/patients/bukan-id");
    eq(r.status, 400, "status");
    tanpaBocor(r);
  });

  await t("body JSON rusak → 400 tanpa detail internal", async () => {
    const r = await api("/api/patients", { method: "POST", body: "{rusak" });
    eq(r.status, 400, "status");
    tanpaBocor(r);
  });

  await t("validasi skema gagal → 400, hanya nama field", async () => {
    const r = await api("/api/patients", { method: "POST", body: JSON.stringify({}) });
    eq(r.status, 400, "status");
    tanpaBocor(r);
  });

  // Field turunan dihitung server: request rakitan tidak boleh bisa mengisinya.
  // (Koleksi KB/kehamilan/persalinan dibersihkan lagi di bagian masing-masing.)
  await t("POST pasien mengabaikan diagnosis & visits karangan", async () => {
    const r = await api("/api/patients", {
      method: "POST",
      body: JSON.stringify({
        name: "Susupan", dateOfBirth: iso("1990-01-01"), gender: "Female",
        diagnosis: ["karangan"],
        visits: [{ date: iso("2024-01-01"), complaint: "x", visitDiagnosis: ["karangan"] }],
      }),
    });
    eq(r.status, 201, "status");
    eq(r.json.data.diagnosis.length, 0, "diagnosis");
    eq(r.json.data.visits.length, 0, "visits");
    await api(`/api/patients/${r.json.data._id}`, { method: "DELETE" });
  });

  await t("POST KB mengabaikan metodes & visits karangan", async () => {
    const r = await api("/api/kb", {
      method: "POST",
      body: JSON.stringify({
        name: "Susupan", nik: "3201119999999999", dateOfBirth: iso("1990-01-01"),
        metodes: ["Pil"], visits: [{ date: iso("2024-01-01"), metode: "Pil" }],
      }),
    });
    eq(r.status, 201, "status");
    eq(r.json.data.metodes.length, 0, "metodes");
    eq(r.json.data.visits.length, 0, "visits");
  });

  await t("POST kehamilan: HPL tetap dihitung, visits karangan dibuang", async () => {
    const hpht = new Date("2026-01-01T00:00:00Z");
    const r = await api("/api/kehamilan", {
      method: "POST",
      body: JSON.stringify({
        name: "Susupan", nik: "3201229999999999", dateOfBirth: iso("1990-01-01"),
        hpht: hpht.toISOString(), hpl: iso("2030-01-01"),
        visits: [{ date: iso("2026-02-01"), usiaKehamilan: 99, trimester: 3 }],
      }),
    });
    eq(r.status, 201, "status");
    eq(new Date(r.json.data.hpl).getTime(), hpht.getTime() + 280 * MS_PER_DAY, "hpl");
    eq(r.json.data.visits.length, 0, "visits");
  });

  await t("POST kehamilan body null → 400, bukan 500", async () => {
    const r = await api("/api/kehamilan", { method: "POST", body: "null" });
    eq(r.status, 400, "status");
  });

  await t("POST persalinan mengabaikan status, bayi & visits karangan", async () => {
    const r = await api("/api/persalinan", {
      method: "POST",
      body: JSON.stringify({
        name: "Susupan", nik: "3201449999999999", dateOfBirth: iso("1990-01-01"),
        status: "selesai", bayi: { beratLahir: 9999 },
        visits: [{ date: iso("2026-02-01"), nomorKF: 4, hariPascaSalin: 40 }],
      }),
    });
    eq(r.status, 201, "status");
    eq(r.json.data.status, "terdaftar", "status");
    ok(r.json.data.bayi?.beratLahir == null, "bayi.beratLahir ikut tersimpan");
    eq(r.json.data.visits.length, 0, "visits");
  });

  await t("DELETE pasien → 200, lalu detail 404", async () => {
    const r = await api(`/api/patients/${patientId}`, { method: "DELETE" });
    eq(r.status, 200, "status");
    const after = await api(`/api/patients/${patientId}`);
    eq(after.status, 404, "status setelah hapus");
  });

  // ---------------------------------------------------------------
  head("KB — search NIK & sort umur (perbaikan baru)");

  await clearCollection("kbs");

  await t("POST KB → 201", async () => {
    const r = await api("/api/kb", {
      method: "POST",
      body: JSON.stringify({
        name: "Dewi Lestari",
        nik: "3201110000000001",
        dateOfBirth: iso("1992-03-20"),
        numberOfChildren: 2,
      }),
    });
    eq(r.status, 201, "status");
  });

  await t("POST KB kedua (umur berbeda) → 201", async () => {
    const r = await api("/api/kb", {
      method: "POST",
      body: JSON.stringify({
        name: "Ayu Pratiwi",
        nik: "3201110000000002",
        dateOfBirth: iso("1985-01-05"),
        numberOfChildren: 3,
      }),
    });
    eq(r.status, 201, "status");
  });

  await t("NIK duplikat → 409", async () => {
    const r = await api("/api/kb", {
      method: "POST",
      body: JSON.stringify({
        name: "Duplikat",
        nik: "3201110000000001",
        dateOfBirth: iso("1990-01-01"),
      }),
    });
    eq(r.status, 409, "status");
  });

  await t("search by NIK sekarang ketemu (sebelumnya tidak)", async () => {
    const r = await api("/api/kb?page=1&limit=10&search=3201110000000002");
    eq(r.status, 200, "status");
    eq(r.json.data.length, 1, "jumlah hasil");
    eq(r.json.data[0].name, "Ayu Pratiwi", "nama");
  });

  await t("search by nama tetap jalan", async () => {
    const r = await api("/api/kb?page=1&limit=10&search=Dewi");
    eq(r.json.data.length, 1, "jumlah hasil");
  });

  await t("sort=dateOfBirth berfungsi (dulu diam-diam jatuh ke nama)", async () => {
    const r = await api("/api/kb?page=1&limit=10&sort=dateOfBirth");
    eq(r.status, 200, "status");
    eq(r.json.data[0].name, "Ayu Pratiwi", "yang tertua harus di atas");
  });

  await t("sort tidak dikenal → fallback aman, bukan error", async () => {
    const r = await api("/api/kb?page=1&limit=10&sort=;drop()");
    eq(r.status, 200, "status");
    eq(r.json.data[0].name, "Ayu Pratiwi", "fallback ke sort nama A-Z");
  });

  await t("list KB tidak mengirim visits[]", async () => {
    const r = await api("/api/kb?page=1&limit=10");
    ok(!("visits" in r.json.data[0]), "visits[] masih terkirim");
    for (const f of ["_id", "name", "nik", "dateOfBirth", "numberOfChildren"]) {
      ok(f in r.json.data[0], `field ${f} hilang`);
    }
  });

  // ---------------------------------------------------------------
  head("Kehamilan — kalkulasi & guard");

  await clearCollection("kehamilans");
  let hamilId;
  const hpht = daysAgo(150);

  await t("POST kehamilan → 201 & HPL = HPHT + 280 hari", async () => {
    const r = await api("/api/kehamilan", {
      method: "POST",
      body: JSON.stringify({
        name: "Rina Wati",
        nik: "3201220000000001",
        dateOfBirth: iso("1994-04-04"),
        hpht: iso(hpht),
        gravida: 2,
        para: 1,
      }),
    });
    eq(r.status, 201, "status");
    hamilId = r.json.data._id;
    const expected = new Date(hpht.getTime() + 280 * MS_PER_DAY);
    const actual = new Date(r.json.data.hpl);
    ok(
      Math.abs(actual - expected) < 1000,
      `HPL harap ${expected.toISOString()}, dapat ${actual.toISOString()}`
    );
  });

  await t("POST tanpa HPHT → 400", async () => {
    const r = await api("/api/kehamilan", {
      method: "POST",
      body: JSON.stringify({
        name: "Tanpa HPHT",
        nik: "3201220000000009",
        dateOfBirth: iso("1994-04-04"),
      }),
    });
    eq(r.status, 400, "status");
  });

  await t("NIK sama masih hamil aktif → 409 (duplicate guard)", async () => {
    const r = await api("/api/kehamilan", {
      method: "POST",
      body: JSON.stringify({
        name: "Rina Wati",
        nik: "3201220000000001",
        dateOfBirth: iso("1994-04-04"),
        hpht: iso(daysAgo(40)),
      }),
    });
    eq(r.status, 409, "status");
  });

  await t("force:true menembus guard → 201", async () => {
    const r = await api("/api/kehamilan", {
      method: "POST",
      body: JSON.stringify({
        force: true,
        name: "Rina Wati",
        nik: "3201220000000001",
        dateOfBirth: iso("1994-04-04"),
        hpht: iso(daysAgo(40)),
      }),
    });
    eq(r.status, 201, "status");
  });

  await t("addVisit → usiaKehamilan & trimester auto-hitung", async () => {
    const visitDate = daysAgo(10); // UK = (150-10)/7 = 20 minggu
    const r = await api(`/api/kehamilan/${hamilId}`, {
      method: "PATCH",
      body: JSON.stringify({
        action: "addVisit",
        visit: {
          date: iso(visitDate),
          beratBadan: 58,
          tekananDarahSistol: 120,
          tekananDarahDiastol: 80,
          jadwalBerikutnya: iso(daysAhead(18)),
        },
      }),
    });
    eq(r.status, 200, "status");
    const v = r.json.data.visits[0];
    eq(v.usiaKehamilan, 20, "usia kehamilan");
    eq(v.trimester, 2, "trimester");
  });

  await t("addVisit tanggal < HPHT → 400 (guard baru)", async () => {
    const r = await api(`/api/kehamilan/${hamilId}`, {
      method: "PATCH",
      body: JSON.stringify({
        action: "addVisit",
        visit: { date: iso(daysAgo(200)) },
      }),
    });
    eq(r.status, 400, "status");
    ok(/HPHT/.test(r.json.message), `pesan: ${r.json.message}`);
  });

  await t("addVisit tanpa tanggal → 400", async () => {
    const r = await api(`/api/kehamilan/${hamilId}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "addVisit", visit: {} }),
    });
    eq(r.status, 400, "status");
  });

  await t("action tidak dikenal → 400", async () => {
    const r = await api(`/api/kehamilan/${hamilId}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "hapusSemua" }),
    });
    eq(r.status, 400, "status");
  });

  await t("updateStatus tidak valid → 400", async () => {
    const r = await api(`/api/kehamilan/${hamilId}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "updateStatus", status: "ngawur" }),
    });
    eq(r.status, 400, "status");
  });

  await t("updateData ubah HPHT → HPL ikut dihitung ulang", async () => {
    const newHpht = daysAgo(100);
    const r = await api(`/api/kehamilan/${hamilId}`, {
      method: "PATCH",
      body: JSON.stringify({
        action: "updateData",
        data: { hpht: iso(newHpht) },
      }),
    });
    eq(r.status, 200, "status");
    const expected = new Date(newHpht.getTime() + 280 * MS_PER_DAY);
    ok(
      Math.abs(new Date(r.json.data.hpl) - expected) < 1000,
      "HPL tidak dihitung ulang"
    );
  });

  // ---------------------------------------------------------------
  head("Kehamilan — 'Jadwal Terlewat' (perbaikan utama)");

  await clearCollection("kehamilans");

  // Kasus A: kunjungan lama terlewat, TAPI kunjungan terakhir belum jatuh tempo
  //          → definisi lama salah menghitung ini, definisi baru tidak.
  await t("setup A: jadwal lama lewat, jadwal terakhir belum", async () => {
    const r = await api("/api/kehamilan", {
      method: "POST",
      body: JSON.stringify({
        name: "Kasus A Tidak Terlewat",
        nik: "3201330000000001",
        dateOfBirth: iso("1993-02-02"),
        hpht: iso(daysAgo(120)),
      }),
    });
    eq(r.status, 201, "status");
    const id = r.json.data._id;
    await api(`/api/kehamilan/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        action: "addVisit",
        visit: { date: iso(daysAgo(60)), jadwalBerikutnya: iso(daysAgo(30)) },
      }),
    });
    await api(`/api/kehamilan/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        action: "addVisit",
        visit: { date: iso(daysAgo(5)), jadwalBerikutnya: iso(daysAhead(20)) },
      }),
    });
  });

  // Kasus B: kunjungan terakhir memang sudah terlewat → harus terhitung
  await t("setup B: jadwal kunjungan terakhir sudah lewat", async () => {
    const r = await api("/api/kehamilan", {
      method: "POST",
      body: JSON.stringify({
        name: "Kasus B Terlewat",
        nik: "3201330000000002",
        dateOfBirth: iso("1991-07-07"),
        hpht: iso(daysAgo(120)),
      }),
    });
    eq(r.status, 201, "status");
    const id = r.json.data._id;
    await api(`/api/kehamilan/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        action: "addVisit",
        visit: { date: iso(daysAgo(40)), jadwalBerikutnya: iso(daysAgo(12)) },
      }),
    });
  });

  // Kasus C: belum ada kunjungan sama sekali → tidak terhitung
  await t("setup C: belum ada kunjungan", async () => {
    const r = await api("/api/kehamilan", {
      method: "POST",
      body: JSON.stringify({
        name: "Kasus C Tanpa Kunjungan",
        nik: "3201330000000003",
        dateOfBirth: iso("1996-09-09"),
        hpht: iso(daysAgo(60)),
      }),
    });
    eq(r.status, 201, "status");
  });

  await t("summary jadwalTerlewat = 1 (hanya kasus B)", async () => {
    const r = await api("/api/kehamilan/summary");
    eq(r.status, 200, "status");
    eq(r.json.data.jadwalTerlewat, 1, "jumlah jadwal terlewat");
  });

  await t("dashboard alerts.jadwalTerlewat konsisten dengan summary", async () => {
    const d = await api("/api/dashboard");
    const s = await api("/api/kehamilan/summary");
    eq(
      d.json.data.alerts.jadwalTerlewat,
      s.json.data.jadwalTerlewat,
      "dashboard vs summary"
    );
  });

  await t("filter=jadwalTerlewat hanya mengembalikan kasus B", async () => {
    const r = await api("/api/kehamilan?page=1&limit=10&filter=jadwalTerlewat");
    eq(r.status, 200, "status");
    eq(r.json.data.length, 1, "jumlah baris");
    eq(r.json.data[0].name, "Kasus B Terlewat", "nama");
  });

  await t("jumlah baris list == angka summary card", async () => {
    const list = await api("/api/kehamilan?page=1&limit=50&filter=jadwalTerlewat");
    const sum = await api("/api/kehamilan/summary");
    eq(list.json.data.length, sum.json.data.jadwalTerlewat, "list vs card");
  });

  await t("kehamilan selesai tidak ikut terhitung", async () => {
    const list = await api("/api/kehamilan?page=1&limit=10&filter=jadwalTerlewat");
    const id = list.json.data[0]._id;
    await api(`/api/kehamilan/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "updateStatus", status: "selesai" }),
    });
    const r = await api("/api/kehamilan/summary");
    eq(r.json.data.jadwalTerlewat, 0, "setelah status selesai");
  });

  // ---------------------------------------------------------------
  head("Persalinan — auto-status & KF");

  await clearCollection("persalinans");

  await t("POST tanpa tanggalPersalinan → status 'terdaftar'", async () => {
    const r = await api("/api/persalinan", {
      method: "POST",
      body: JSON.stringify({
        name: "Bumil Menunggu",
        nik: "3201440000000001",
        dateOfBirth: iso("1994-11-11"),
      }),
    });
    eq(r.status, 201, "status");
    eq(r.json.data.status, "terdaftar", "status");
  });

  let persalinanId;
  await t("POST dengan tanggalPersalinan → status 'aktif' (perbaikan baru)", async () => {
    const r = await api("/api/persalinan", {
      method: "POST",
      body: JSON.stringify({
        name: "Ibu Bersalin",
        nik: "3201440000000002",
        dateOfBirth: iso("1990-05-05"),
        tanggalPersalinan: iso(daysAgo(10)),
      }),
    });
    eq(r.status, 201, "status");
    eq(r.json.data.status, "aktif", "status");
    persalinanId = r.json.data._id;
  });

  await t("addVisit nifas → hariPascaSalin & nomorKF auto", async () => {
    const r = await api(`/api/persalinan/${persalinanId}`, {
      method: "PATCH",
      body: JSON.stringify({
        action: "addVisit",
        visit: { date: iso(daysAgo(5)), suhu: 36.5 },
      }),
    });
    eq(r.status, 200, "status");
    const v = r.json.data.visits[0];
    eq(v.hariPascaSalin, 5, "hari pasca salin");
    eq(v.nomorKF, 2, "nomor KF (hari 3-7 = KF2)");
  });

  await t("addVisit ditolak bila tanggal persalinan belum diisi", async () => {
    const created = await api("/api/persalinan", {
      method: "POST",
      body: JSON.stringify({
        name: "Belum Bersalin",
        nik: "3201440000000003",
        dateOfBirth: iso("1997-01-01"),
      }),
    });
    const r = await api(`/api/persalinan/${created.json.data._id}`, {
      method: "PATCH",
      body: JSON.stringify({
        action: "addVisit",
        visit: { date: iso(new Date()) },
      }),
    });
    eq(r.status, 400, "status");
  });

  await t("updateBayi menyimpan data bayi", async () => {
    const r = await api(`/api/persalinan/${persalinanId}`, {
      method: "PATCH",
      body: JSON.stringify({
        action: "updateBayi",
        bayi: { beratLahir: 2300, nilaiApgar5: 6, jenisKelamin: "perempuan" },
      }),
    });
    eq(r.status, 200, "status");
    eq(r.json.data.bayi.beratLahir, 2300, "berat lahir");
  });

  await t("filter=perluPerhatian menangkap BBLR & APGAR rendah", async () => {
    const r = await api("/api/persalinan?page=1&limit=10&filter=perluPerhatian");
    eq(r.status, 200, "status");
    eq(r.json.data.length, 1, "jumlah baris");
    eq(r.json.data[0].name, "Ibu Bersalin", "nama");
  });

  await t("summary persalinan konsisten", async () => {
    const r = await api("/api/persalinan/summary");
    eq(r.status, 200, "status");
    eq(r.json.data.belumPersalinan, 2, "belum persalinan");
    eq(r.json.data.perluPerhatian, 1, "perlu perhatian");
  });

  // ---------------------------------------------------------------
  head("Config — slugify & validasi");

  await clearCollection("configs");

  await t("GET tanpa type → 400", async () => {
    const r = await api("/api/config");
    eq(r.status, 400, "status");
  });

  await t("POST → code otomatis di-slugify dari label", async () => {
    const r = await api("/api/config", {
      method: "POST",
      body: JSON.stringify({ type: "diagnosis", label: "ISPA Akut / Berat" }),
    });
    eq(r.status, 201, "status");
    eq(r.json.data.code, "ispa-akut-berat", "code");
  });

  await t("label berbeda tapi slug sama → 409", async () => {
    const r = await api("/api/config", {
      method: "POST",
      body: JSON.stringify({ type: "diagnosis", label: "ISPA  Akut   Berat" }),
    });
    eq(r.status, 409, "status");
  });

  await t("POST tanpa label → 400", async () => {
    const r = await api("/api/config", {
      method: "POST",
      body: JSON.stringify({ type: "diagnosis" }),
    });
    eq(r.status, 400, "status");
  });

  await t("limit=200 (dipakai DiagnosisSelect) tetap dilayani", async () => {
    const r = await api("/api/config?type=diagnosis&limit=200");
    eq(r.status, 200, "status");
    ok(Array.isArray(r.json.data), "data bukan array");
  });

  // ---------------------------------------------------------------
  head("Master Data — penanda tangan & gambar");

  // PNG 1x1 asli (diawali tanda tangan berkas \x89PNG).
  const PNG =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const ROMAWI = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  const sekarang = new Date();
  const periodeIni = `${ROMAWI[sekarang.getUTCMonth() + 1]}/${sekarang.getUTCFullYear()}`;

  const kirim = (url, method, body) => api(url, { method, body: body === undefined ? undefined : JSON.stringify(body) });
  const buatPetugas = (body) => kirim("/api/master/penandatangan", "POST", body);

  await t("nama wajib, jabatan harus Dokter/Bidan/Perawat", async () => {
    eq((await buatPetugas({ jabatan: "Bidan" })).status, 400, "tanpa nama");
    eq((await buatPetugas({ nama: "X", jabatan: "Dukun" })).status, 400, "jabatan asing");
  });

  await t("gambar TTD ditolak bila bukan PNG/JPEG/WebP asli", async () => {
    for (const ttd of [
      "data:text/html;base64,PHNjcmlwdD4=",
      "data:image/svg+xml;base64,PHN2Zy8+",
      "data:image/png;base64,QUFBQUFBQUFBQUFB", // awalan PNG, isi bukan PNG
      "https://contoh.com/ttd.png",
    ]) {
      const r = await buatPetugas({ nama: "Uji", jabatan: "Bidan", ttd });
      eq(r.status, 400, `status untuk ${ttd.slice(0, 22)}`);
    }
  });

  let bidan, perawat, dokter;
  await t("tambah petugas dengan TTD → versi gambar tersimpan", async () => {
    const r = await buatPetugas({ nama: "Bdn. Uji Bidan, S.ST", jabatan: "Bidan", nip: "1977", ttd: PNG });
    eq(r.status, 201, "status");
    ok(r.json.data.ttdId, "ttdId kosong");
    bidan = r.json.data;
    perawat = (await buatPetugas({ nama: "Ns. Uji Perawat", jabatan: "Perawat" })).json.data;
    dokter = (await buatPetugas({ nama: "dr. Uji Dokter", jabatan: "Dokter", ttd: PNG })).json.data;
    eq(perawat.ttdId, null, "perawat tanpa TTD");
  });

  await t("gambar hanya bisa diambil saat login, tanpa cache", async () => {
    const r = await fetch(`${BASE}/api/gambar/${bidan.ttdId}`, { headers: { Cookie: cookie } });
    eq(r.status, 200, "status");
    eq(r.headers.get("content-type"), "image/png", "content-type");
    ok(/no-store/.test(r.headers.get("cache-control") || ""), "cache-control harus no-store");
    eq(r.headers.get("x-content-type-options"), "nosniff", "nosniff");
    const anon = await fetch(`${BASE}/api/gambar/${bidan.ttdId}`, { redirect: "manual" });
    eq(anon.status, 401, "tanpa cookie");
    eq((await api("/api/gambar/bukan-id")).status, 404, "id rusak");
  });

  let ttdLamaBidan;
  await t("mengganti TTD membuat versi baru, versi lama tetap ada", async () => {
    ttdLamaBidan = bidan.ttdId;
    const r = await kirim(`/api/master/penandatangan/${bidan._id}`, "PATCH", { ttd: PNG });
    eq(r.status, 200, "status");
    ok(r.json.data.ttdId !== ttdLamaBidan, "ttdId tidak berubah");
    eq((await api(`/api/gambar/${ttdLamaBidan}`)).status, 200, "versi lama hilang");
    bidan = r.json.data;
  });

  // ---------------------------------------------------------------
  head("Master Data — kop, cap & penomoran");

  await t("pengaturan default terbentuk otomatis", async () => {
    const r = await api("/api/master/surat");
    eq(r.status, 200, "status");
    eq(r.json.data.penomoran.consent.pola, "{urut3}/IC/KLN-IYA/{romawi}/{tahun}", "pola consent");
    eq(r.json.data.penomoran.sakit.pola, "{urut3}/SKS/KLN-IYA/{romawi}/{tahun}", "pola sakit");
    eq(r.json.data.berikutnya.consent.nomor, `001/IC/KLN-IYA/${periodeIni}`, "nomor berikutnya");
  });

  await t("pola tidak valid ditolak & tidak tersimpan sebagian", async () => {
    eq((await kirim("/api/master/surat", "PATCH", { penomoran: { consent: { pola: "{urut3}/IC/{tahun}", reset: "bulanan" } } })).status, 400, "bulanan tanpa bulan");
    eq((await kirim("/api/master/surat", "PATCH", { penomoran: { sakit: { pola: "SKS/{tahun}" } } })).status, 400, "tanpa urut");
    eq((await kirim("/api/master/surat", "PATCH", { penomoran: { sakit: { pola: "{urut3}/{ngawur}/{tahun}" } } })).status, 400, "token asing");
    eq((await kirim("/api/master/surat", "PATCH", { kop: { kota: "Manado" }, penomoran: { sakit: { pola: "X" } } })).status, 400, "campuran");
    const r = await api("/api/master/surat");
    eq(r.json.data.kop.kota, "Bitung", "kota ikut tersimpan padahal ditolak");
  });

  await t("kop & cap disimpan; nama klinik wajib", async () => {
    eq((await kirim("/api/master/surat", "PATCH", { kop: { baris2: "" } })).status, 400, "baris2 kosong");
    const r = await kirim("/api/master/surat", "PATCH", { kop: { alamat: "Jln. Uji No. 1" }, cap: PNG });
    eq(r.status, 200, "status");
    eq(r.json.data.kop.alamat, "Jln. Uji No. 1", "alamat");
    ok(r.json.data.capId, "capId kosong");
  });

  await t("cap tidak valid ditolak", async () => {
    eq((await kirim("/api/master/surat", "PATCH", { cap: "data:image/svg+xml;base64,PHN2Zy8+" })).status, 400, "svg");
  });

  // ---------------------------------------------------------------
  head("Persetujuan Tindakan — draf & validasi");

  const DATA_CONSENT = {
    tanggalSurat: tglHariIni(),
    keputusan: "setuju",
    tindakan: "Pemasangan IUD",
    pembuat: { nama: "Ibu Uji", umur: 30, jenisKelamin: "P", alamat: "Tendeki" },
    hubungan: "diri_sendiri",
    petugas: { penandatanganId: null },
    ttdPembuat: { mode: "gambar" },
    saksiKlinik: { aktif: false },
    saksiKeluarga: { aktif: false },
  };
  const buatConsent = (over = {}) => kirim("/api/consent", "POST", { ...DATA_CONSENT, petugas: { penandatanganId: bidan._id }, ...over });
  const terbitkan = (id, ttd = { pembuat: PNG }) => kirim(`/api/consent/${id}`, "PATCH", { action: "issue", ttd });

  await t("nama pembuat & tindakan wajib", async () => {
    const a = await buatConsent({ pembuat: { nama: "" } });
    eq(a.status, 400, "tanpa nama");
    ok(/nama/i.test(a.json.message), a.json.message);
    eq((await buatConsent({ tindakan: "  " })).status, 400, "tanpa tindakan");
  });

  await t("nilai tidak valid ditolak (hubungan, umur, id petugas)", async () => {
    eq((await buatConsent({ hubungan: "tetangga" })).status, 400, "hubungan");
    eq((await buatConsent({ pembuat: { nama: "A", umur: -1 } })).status, 400, "umur negatif");
    eq((await buatConsent({ petugas: { penandatanganId: "bukan-id" } })).status, 400, "id petugas");
  });

  let c1;
  await t("draf baru: tanpa nomor, pasien = pembuat bila untuk diri sendiri", async () => {
    const r = await buatConsent({ status: "issued", nomorSurat: "PALSU/1", kop: { baris2: "PALSU" } });
    eq(r.status, 201, "status");
    eq(r.json.data.status, "draft", "status dipalsukan");
    eq(r.json.data.nomorSurat, undefined, "nomor dipalsukan");
    eq(r.json.data.pasien.nama, "Ibu Uji", "pasien tidak disalin");
    c1 = r.json.data;
  });

  // ---------------------------------------------------------------
  head("Persetujuan Tindakan — terbit, nomor & salinan master");

  await t("terbit tanpa petugas ditolak", async () => {
    const d = (await buatConsent({ petugas: { penandatanganId: null } })).json.data;
    const r = await terbitkan(d._id);
    eq(r.status, 400, "status");
    ok(/petugas/i.test(r.json.message), r.json.message);
  });

  await t("goresan wajib untuk kolom 'gores di layar', harus PNG asli", async () => {
    eq((await terbitkan(c1._id, {})).status, 400, "tanpa goresan");
    eq((await terbitkan(c1._id, { pembuat: "data:image/png;base64,QUFBQQ==" })).status, 400, "PNG palsu");
  });

  await t("saksi klinik manual wajib bernama", async () => {
    const d = (await buatConsent({ saksiKlinik: { aktif: true, nama: "", mode: "basah" } })).json.data;
    eq((await terbitkan(d._id)).status, 400, "status");
    await kirim(`/api/consent/${d._id}`, "DELETE");
  });

  await t("terbit → nomor 001, salinan petugas, kop & cap", async () => {
    const r = await terbitkan(c1._id);
    eq(r.status, 200, "status");
    const d = r.json.data;
    eq(d.status, "issued", "status");
    eq(d.nomorSurat, `001/IC/KLN-IYA/${periodeIni}`, "nomor");
    eq(d.petugas.nama, bidan.nama, "nama petugas");
    eq(d.petugas.jabatan, "Bidan", "jabatan");
    eq(d.petugas.ttdId, bidan.ttdId, "versi TTD");
    ok(d.capId, "cap tidak dibubuhkan");
    eq(d.kop.alamat, "Jln. Uji No. 1", "kop tidak disalin");
    eq(d.ttdPembuat.dataUrl, PNG, "goresan pembuat");
    c1 = d;
  });

  await t("surat terbit terkunci: updateData & terbit ulang → 409", async () => {
    eq((await kirim(`/api/consent/${c1._id}`, "PATCH", { action: "updateData", data: { tindakan: "Lain" } })).status, 409, "updateData");
    eq((await terbitkan(c1._id)).status, 409, "issue ulang");
  });

  await t("mengubah master tidak mengubah surat yang sudah terbit", async () => {
    await kirim(`/api/master/penandatangan/${bidan._id}`, "PATCH", { nama: "Nama Baru", ttd: PNG });
    await kirim("/api/master/surat", "PATCH", { kop: { alamat: "Alamat Baru" }, cap: PNG });
    const d = (await api(`/api/consent/${c1._id}`)).json.data;
    eq(d.petugas.nama, "Bdn. Uji Bidan, S.ST", "nama berubah");
    eq(d.petugas.ttdId, c1.petugas.ttdId, "TTD berubah");
    eq(d.capId, c1.capId, "cap berubah");
    eq(d.kop.alamat, "Jln. Uji No. 1", "kop berubah");
  });

  await t("petugas tanpa TTD → kolom basah, tanpa cap; saksi master & keluarga basah", async () => {
    const d = (await buatConsent({
      hubungan: "anak",
      pasien: { nama: "Anak Uji", umur: 4, jenisKelamin: "L" },
      petugas: { penandatanganId: perawat._id },
      saksiKlinik: { aktif: true, penandatanganId: dokter._id },
      saksiKeluarga: { aktif: true, nama: "", mode: "basah" },
    })).json.data;
    const r = await terbitkan(d._id);
    eq(r.status, 200, `status (${r.json?.message})`);
    eq(r.json.data.nomorSurat, `002/IC/KLN-IYA/${periodeIni}`, "nomor");
    eq(r.json.data.petugas.ttdId, null, "ttd perawat");
    eq(r.json.data.capId, null, "cap tanpa TTD digital");
    eq(r.json.data.saksiKlinik.nama, dokter.nama, "saksi master");
    eq(r.json.data.saksiKlinik.ttdId, dokter.ttdId, "TTD saksi master");
    eq(r.json.data.saksiKeluarga.dataUrl, "", "saksi keluarga basah");
  });

  await t("batal terbit: nomor tetap, goresan dihapus, terbit ulang memakai nomor yang sama", async () => {
    const b = await kirim(`/api/consent/${c1._id}`, "PATCH", { action: "unissue" });
    eq(b.status, 200, "status");
    eq(b.json.data.status, "draft", "status");
    eq(b.json.data.nomorSurat, c1.nomorSurat, "nomor hilang");
    eq(b.json.data.ttdPembuat.dataUrl, "", "goresan tersisa");
    eq((await kirim(`/api/consent/${c1._id}`, "PATCH", { action: "updateData", data: { tindakan: "Pencabutan IUD" } })).status, 200, "edit setelah batal");
    const r = await terbitkan(c1._id);
    eq(r.json.data.nomorSurat, c1.nomorSurat, "nomor berubah");
    eq(r.json.data.petugas.nama, "Nama Baru", "salinan petugas tidak diperbarui saat terbit ulang");
  });

  await t("nomor yang dihapus tidak pernah dipakai ulang", async () => {
    const d = (await buatConsent()).json.data;
    const r = await terbitkan(d._id);
    eq(r.json.data.nomorSurat, `003/IC/KLN-IYA/${periodeIni}`, "nomor");
    eq((await kirim(`/api/consent/${d._id}`, "DELETE")).status, 400, "hapus tanpa konfirmasi");
    eq((await api(`/api/consent/${d._id}?konfirmasi=salah`, { method: "DELETE" })).status, 400, "konfirmasi salah");
    const h = await api(`/api/consent/${d._id}?konfirmasi=${encodeURIComponent(r.json.data.nomorSurat)}`, { method: "DELETE" });
    eq(h.status, 200, "hapus dengan konfirmasi");
    const e = (await buatConsent()).json.data;
    eq((await terbitkan(e._id)).json.data.nomorSurat, `004/IC/KLN-IYA/${periodeIni}`, "nomor dipakai ulang");
  });

  await t("draf boleh dihapus tanpa konfirmasi dan tidak memakan nomor", async () => {
    const d = (await buatConsent()).json.data;
    eq((await kirim(`/api/consent/${d._id}`, "DELETE")).status, 200, "hapus draf");
    const r = await api("/api/master/surat");
    eq(r.json.data.berikutnya.consent.urut, 5, "urut berikutnya");
  });

  await t("tanggal surat menentukan bulan nomor (dibaca UTC)", async () => {
    const d = (await buatConsent({ tanggalSurat: "2026-03-01" })).json.data;
    const r = await terbitkan(d._id);
    // Reset tahunan: Maret 2026 melanjutkan urutan 2026 (001–004 sudah terpakai bila suite jalan di 2026).
    const urut = sekarang.getUTCFullYear() === 2026 ? "005" : "001";
    eq(r.json.data.nomorSurat, `${urut}/IC/KLN-IYA/III/2026`, "nomor");
  });

  await t("urutan bisa dimajukan, tidak bisa dimundurkan", async () => {
    eq((await kirim("/api/master/surat", "PATCH", { urutBerikutnya: { consent: 2 } })).status, 400, "mundur");
    eq((await kirim("/api/master/surat", "PATCH", { urutBerikutnya: { consent: 0 } })).status, 400, "nol");
    const r = await kirim("/api/master/surat", "PATCH", { urutBerikutnya: { consent: 50 } });
    eq(r.status, 200, "maju");
    eq(r.json.data.berikutnya.consent.urut, 50, "urut");
    const d = (await buatConsent()).json.data;
    eq((await terbitkan(d._id)).json.data.nomorSurat, `050/IC/KLN-IYA/${periodeIni}`, "nomor");
  });

  await t("petugas nonaktif tidak bisa menerbitkan surat baru", async () => {
    await kirim(`/api/master/penandatangan/${perawat._id}`, "PATCH", { aktif: false });
    const d = (await buatConsent({ petugas: { penandatanganId: perawat._id } })).json.data;
    const r = await terbitkan(d._id);
    eq(r.status, 400, "status");
    ok(/nonaktif/i.test(r.json.message), r.json.message);
    await kirim(`/api/master/penandatangan/${perawat._id}`, "PATCH", { aktif: true });
  });

  await t("petugas yang dipakai surat terbit tidak bisa dihapus", async () => {
    const r = await kirim(`/api/master/penandatangan/${bidan._id}`, "DELETE");
    eq(r.status, 409, "status");
    ok(/nonaktifkan/i.test(r.json.message), r.json.message);
    const lepas = (await buatPetugas({ nama: "Belum Dipakai", jabatan: "Perawat" })).json.data;
    eq((await kirim(`/api/master/penandatangan/${lepas._id}`, "DELETE")).status, 200, "hapus yang belum dipakai");
  });

  await t("daftar: tanpa goresan/gambar, cari & filter status, ringkasan", async () => {
    const r = await api("/api/consent?search=Ibu%20Uji&status=issued&limit=50");
    eq(r.status, 200, "status");
    ok(r.json.data.length > 0, "kosong");
    ok(r.json.data.every((s) => s.status === "issued" && !s.ttdPembuat && !s.petugas), "field berat ikut terkirim");
    const s = (await api("/api/consent/summary")).json.data;
    eq(s.total, s.draft + s.issued, "ringkasan");
  });

  await t("id rusak / tidak ada → 404 tanpa bocoran", async () => {
    const a = await api("/api/consent/bukan-id");
    eq(a.status, 404, "id rusak");
    const b = await kirim("/api/consent/000000000000000000000000", "PATCH", { action: "issue" });
    eq(b.status, 404, "tidak ada");
    eq((await kirim(`/api/consent/${c1._id}`, "PATCH", { action: "sulap" })).status, 400, "aksi asing");
  });

  // ---------------------------------------------------------------
  head("Surat Keterangan Sakit");

  const buatSakit = (over = {}) =>
    kirim("/api/surat-sakit", "POST", {
      tanggalSurat: tglHariIni(),
      nama: "Pak Uji Sakit",
      umur: 40,
      pekerjaan: "Nelayan",
      alamat: "Bitung",
      mulai: "2026-11-03",
      selesai: "2026-11-05",
      pemeriksa: { penandatanganId: dokter._id },
      ...over,
    });

  await t("validasi nama & rentang tanggal; lama hari dihitung server", async () => {
    eq((await buatSakit({ nama: "" })).status, 400, "tanpa nama");
    eq((await buatSakit({ selesai: "2026-11-01" })).status, 400, "selesai < mulai");
    eq((await buatSakit({ selesai: "2028-01-01" })).status, 400, "terlalu lama");
    const r = await buatSakit({ lamaHari: 99 });
    eq(r.status, 201, "status");
    eq(r.json.data.lamaHari, 3, "lama hari (inklusif)");
  });

  let s1;
  await t("urutan nomor terpisah dari consent: 001/SKS", async () => {
    const d = (await buatSakit()).json.data;
    const r = await kirim(`/api/surat-sakit/${d._id}`, "PATCH", { action: "issue" });
    eq(r.status, 200, `status (${r.json?.message})`);
    eq(r.json.data.nomorSurat, `001/SKS/KLN-IYA/${periodeIni}`, "nomor");
    eq(r.json.data.pemeriksa.nama, dokter.nama, "pemeriksa");
    ok(r.json.data.capId, "cap");
    s1 = r.json.data;
  });

  await t("pemeriksa TTD basah → tanpa TTD digital & tanpa cap", async () => {
    const d = (await buatSakit({ ttdBasah: true })).json.data;
    const r = await kirim(`/api/surat-sakit/${d._id}`, "PATCH", { action: "issue" });
    eq(r.json.data.pemeriksa.ttdId, null, "ttd");
    eq(r.json.data.capId, null, "cap");
  });

  await t("terbit tanpa pemeriksa ditolak; surat terbit terkunci", async () => {
    const d = (await buatSakit({ pemeriksa: { penandatanganId: null } })).json.data;
    eq((await kirim(`/api/surat-sakit/${d._id}`, "PATCH", { action: "issue" })).status, 400, "tanpa pemeriksa");
    eq((await kirim(`/api/surat-sakit/${s1._id}`, "PATCH", { action: "updateData", data: { nama: "X" } })).status, 409, "terkunci");
  });

  // ---------------------------------------------------------------
  head("Cari pasien untuk surat");

  await t("minimal 2 huruf, regex aman, tanpa visits, orang yang sama tampil sekali", async () => {
    eq((await api("/api/cari-pasien?q=a")).json.data.length, 0, "1 huruf");
    eq((await api(`/api/cari-pasien?q=${encodeURIComponent("(.*")}`)).status, 200, "regex");
    const dob = "1990-05-05";
    await kirim("/api/patients", "POST", { name: "Zulaikha Carisurat", dateOfBirth: dob, address: "Girian", gender: "Female" });
    await kirim("/api/kb", "POST", { name: "Zulaikha Carisurat", nik: "7172000000009999", dateOfBirth: dob, address: "Girian", numberOfChildren: 1 });
    const r = await api("/api/cari-pasien?q=carisurat");
    eq(r.json.data.length, 1, "duplikat lintas modul");
    eq(r.json.data[0].jenisKelamin, "P", "jenis kelamin");
    ok(!("visits" in r.json.data[0]), "visits ikut terkirim");
  });

  // ---------------------------------------------------------------
  head("Halaman cetak surat");

  await t("cetak consent: judul, nomor, gambar tersisip, no-store", async () => {
    const r = await api(`/print/consent/${c1._id}`);
    eq(r.status, 200, "status");
    ok(r.text.includes("INFORMED CONSENT TINDAKAN MEDIK"), "judul");
    ok(r.text.includes(c1.nomorSurat), "nomor");
    ok(r.text.includes("data:image/png;base64"), "TTD/cap tidak tersisip");
    ok(!r.text.includes("/api/gambar/"), "gambar lewat URL API");
    ok(/no-store/.test(r.headers.get("cache-control") || ""), `cache-control: ${r.headers.get("cache-control")}`);
  });

  await t("cetak surat sakit: lama hari terbilang", async () => {
    const r = await api(`/print/surat-sakit/${s1._id}`);
    eq(r.status, 200, "status");
    ok(r.text.includes("SURAT KETERANGAN SAKIT"), "judul");
    // React menyisipkan <!-- --> di antara potongan teks; buang dulu sebelum mencocokkan kalimat.
    ok(r.text.replace(/<!-- -->/g, "").includes("3 (tiga) hari"), "lama hari terbilang");
  });

  await t("draf tidak bisa dicetak", async () => {
    const d = (await buatSakit()).json.data;
    const r = await api(`/print/surat-sakit/${d._id}`);
    ok(r.text.includes("Surat belum terbit"), "pesan draf");
    ok(!r.text.includes("SURAT KETERANGAN SAKIT"), "isi draf tercetak");
  });

  await t("TTD & cap tidak lagi tersedia sebagai aset publik", async () => {
    for (const f of ["/kop/ttd-bidan.png", "/kop/cap-klinik.png"]) {
      const res = await fetch(`${BASE}${f}`, { redirect: "manual" });
      eq(res.status, 404, `status ${f}`);
    }
  });

  // ---------------------------------------------------------------
  head("Smoke test halaman (frontend routing)");

  for (const [route, marker] of [
    ["/dashboard", "Dashboard"],
    ["/dashboard/patients", "Pasien"],
    ["/dashboard/kb", "KB"],
    ["/dashboard/kehamilan", "Kehamilan"],
    ["/dashboard/persalinan", "Persalinan"],
    ["/dashboard/master", "Master Data"],
    ["/dashboard/master?tab=penandatangan", "Master Data"],
    ["/dashboard/master/diagnosis/new", "Diagnosis"],
    ["/dashboard/patients/new", "Pasien"],
    ["/dashboard/kehamilan/new", "Kehamilan"],
    ["/dashboard/consent", "Persetujuan Tindakan"],
    ["/dashboard/consent/new", "Persetujuan Tindakan"],
    ["/dashboard/surat-sakit", "Surat Keterangan Sakit"],
    ["/dashboard/surat-sakit/new", "Surat Keterangan Sakit"],
  ]) {
    await t(`${route} → 200 & ter-render`, async () => {
      const r = await api(route);
      eq(r.status, 200, "status");
      ok(r.text.includes(marker), `HTML tidak memuat "${marker}"`);
      ok(!/Application error/i.test(r.text), "halaman error");
    });
  }

  await t("/ tanpa cookie → redirect ke /login", async () => {
    const res = await fetch(`${BASE}/`, { redirect: "manual" });
    ok([302, 307].includes(res.status), `status ${res.status}`);
    ok(/\/login/.test(res.headers.get("location") || ""), "tujuan redirect salah");
  });

  await t("/login dapat diakses publik", async () => {
    const res = await fetch(`${BASE}/login`, { redirect: "manual" });
    eq(res.status, 200, "status");
    // dikirim sebelum JS siap → harus POST, bukan GET yang menaruh sandi di URL
    ok(/<form[^>]*method="post"/.test(await res.text()), "form login bukan method=post");
    const kirim = await fetch(`${BASE}/login`, {
      method: "POST", redirect: "manual",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "username=x&password=y",
    });
    ok(kirim.status < 500, `POST form login sebelum JS siap → ${kirim.status}`);
  });

  await t("URL Konfigurasi & pengaturan consent lama dialihkan ke Master Data", async () => {
    for (const [dari, ke] of [
      ["/dashboard/config", "/dashboard/master"],
      ["/dashboard/config/new", "/dashboard/master/diagnosis/new"],
      ["/dashboard/consent/pengaturan", "/dashboard/master?tab=kop"],
    ]) {
      const r = await api(dari);
      ok([307, 308].includes(r.status), `${dari}: status ${r.status}`);
      ok((r.headers.get("location") || "").endsWith(ke), `${dari} → ${r.headers.get("location")}`);
    }
  });

  await t("logo kop dapat dimuat tanpa cookie (aset publik)", async () => {
    // Regresi: sebelumnya /kop/ ikut dijaga middleware, jadi logo hilang
    // dari surat begitu sesi habis saat halaman cetak masih terbuka.
    const res = await fetch(`${BASE}/kop/logo-klinik.png`, { redirect: "manual" });
    eq(res.status, 200, "status");
    ok(
      (res.headers.get("content-type") || "").startsWith("image/"),
      `content-type: ${res.headers.get("content-type")}`
    );
  });

  await t("service worker PWA dapat dimuat tanpa cookie", async () => {
    // Regresi: /sw.js ikut di-redirect ke /login, dan browser menolak
    // mendaftarkan service worker yang di-redirect.
    const res = await fetch(`${BASE}/sw.js`, { redirect: "manual" });
    eq(res.status, 200, "status");
    ok(/javascript/.test(res.headers.get("content-type") || ""), "bukan javascript");
    const sw = await res.text();
    // Semua skrip yang di-importScripts juga harus publik, atau pemasangan SW gagal
    for (const [, skrip] of sw.matchAll(/importScripts\("([^"]+)"\)/g)) {
      const r = await fetch(`${BASE}${skrip}`, { redirect: "manual" });
      eq(r.status, 200, `${skrip} status`);
    }
    // Regresi: aturan cache dulu diabaikan dan respons /api ikut tersimpan di perangkat
    ok(!sw.includes('"apis"'), "cache 'apis' (respons API) masih ada di service worker");
    ok(sw.includes('startsWith("/api/")') && sw.includes('startsWith("/print/")') && sw.includes("NetworkOnly"), "API & halaman cetak tidak dijaga NetworkOnly");
  });

  await t("halaman cetak tetap ditolak tanpa cookie", async () => {
    const list = await api("/api/consent?page=1&limit=1&status=issued");
    const surat = list.json.data[0];
    const res = await fetch(`${BASE}/print/consent/${surat._id}`, { redirect: "manual" });
    ok([302, 307].includes(res.status), `harap redirect, dapat ${res.status}`);
  });
}

// =====================================================================
async function cleanup() {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log(`\nData test disimpan di "${TEST_DB}" — lihat dengan: npm run dev:demo api`);
      await mongoose.disconnect();
    }
  } catch (e) {
    console.error("Cleanup DB gagal:", e.message);
  }
  if (server && !server.killed) {
    server.kill();
    // pastikan proses anak next-server ikut mati di Windows
    if (process.platform === "win32") {
      try {
        spawn("taskkill", ["/pid", String(server.pid), "/f", "/t"], {
          stdio: "ignore",
        });
      } catch {}
    }
  }
}

try {
  await run();
} catch (e) {
  fail++;
  failures.push(`[fatal] ${e.stack || e.message}`);
  console.error("\nFATAL:", e.message);
} finally {
  await cleanup();
}

console.log("\n" + "═".repeat(64));
console.log(`HASIL: ${pass} lolos, ${fail} gagal`);
if (failures.length) {
  console.log("\nKegagalan:");
  failures.forEach((f) => console.log("  - " + f));
}
console.log("═".repeat(64));
process.exit(fail === 0 ? 0 : 1);
