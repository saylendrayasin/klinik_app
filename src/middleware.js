// src/middleware.js
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
    ].some((allowed) => path.startsWith(allowed)) || path.startsWith("/icons/") // tambahkan ini
  );
}

export async function middleware(request) {
  const token = request.cookies.get("token")?.value;
  const path = request.nextUrl.pathname;

  if (isPublicPath(path)) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, secretKey);
    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/api/(.*)"],
};
