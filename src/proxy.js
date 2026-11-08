// src/proxy.js
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET environment variable is not set.");
const secretKey = new TextEncoder().encode(JWT_SECRET);

function isPublicPath(path) {
  return (
    [
      "/login",
      "/api/auth/login",
      "/manifest.json",
      "/offline.html",
      "/favicon.ico",
    ].some((allowed) => path.startsWith(allowed)) ||
    path.startsWith("/icons/") ||
    // Logo kop surat: aset publik seperti /icons. Tanpa ini, gambar kop ikut
    // diverifikasi JWT dan gagal dimuat begitu sesi habis saat halaman cetak terbuka.
    path.startsWith("/kop/") ||
    // Service worker PWA: browser menolak mendaftarkan SW yang di-redirect,
    // jadi tanpa ini PWA gagal terpasang sebelum login / setelah sesi habis.
    path === "/sw.js" ||
    /^\/(workbox|swe-worker|worker)-[\w-]+\.js$/.test(path)
  );
}

// API menjawab 401 JSON, bukan redirect: fetch() mengikuti redirect diam-diam
// dan menerima HTML halaman login berstatus 200, sehingga klien tidak tahu
// sesinya habis (dan unduhan Excel tersimpan berisi HTML).
function tolak(request, path) {
  if (path.startsWith("/api/")) {
    return NextResponse.json(
      { message: "Sesi habis, silakan login ulang", data: null, status: "error" },
      { status: 401 }
    );
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export async function proxy(request) {
  const token = request.cookies.get("token")?.value;
  const path = request.nextUrl.pathname;

  // 1. Special handling for "/" root route
  if (path === "/") {
    if (token) {
      try {
        await jwtVerify(token, secretKey);
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } catch (error) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // 2. Allow free access to public paths
  if (isPublicPath(path)) {
    return NextResponse.next();
  }

  // 3. Guard all other API & dashboard pages
  if (!token) return tolak(request, path);

  try {
    await jwtVerify(token, secretKey);
    return NextResponse.next();
  } catch {
    return tolak(request, path);
  }
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|manifest.json|offline.html|icons|kop|sw.js|workbox-|swe-worker-|worker-).*)"],
};
