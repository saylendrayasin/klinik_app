/**
 * Dev server yang membaca data contoh hasil tes, bukan database utama.
 *
 *   npm run dev:demo        → data dari `npm run check:visual` (klinik_visualtest)
 *   npm run dev:demo api    → data dari `npm run test:api`     (klinik_apitest)
 *
 * Login tetap memakai AUTH_USERNAME / AUTH_PASSWORD dari .env.
 */
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const DB = process.argv[2] === "api" ? "klinik_apitest" : "klinik_visualtest";

const env = fs.readFileSync(path.join(process.cwd(), ".env"), "utf8");
const uri = env.match(/^\s*MONGODB_URI\s*=\s*["']?(.*?)["']?\s*$/m)?.[1];
if (!uri) throw new Error("MONGODB_URI tidak ditemukan di .env");

// ganti nama database di URI, pertahankan host dan query string
const DEMO_URI = uri.replace(/^(mongodb(?:\+srv)?:\/\/[^/?]+)(?:\/[^?]*)?/, `$1/${DB}`);

console.log(`Dev server memakai database "${DB}"`);
const next = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
spawn(process.execPath, [next, "dev", "--turbopack"], {
  stdio: "inherit",
  env: { ...process.env, MONGODB_URI: DEMO_URI },
}).on("exit", (code) => process.exit(code ?? 0));
