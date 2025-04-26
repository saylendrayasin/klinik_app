// src/middleware.js
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET environment variable is not set.");
const secretKey = new TextEncoder().encode(JWT_SECRET);

function isPublicPath(path) {
  return ["/login", "/api/auth/login"].some((allowed) =>
    path.startsWith(allowed)
  );
}

export async function middleware(request) {
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
  matcher: ["/((?!_next|favicon.ico).*)"],
};
