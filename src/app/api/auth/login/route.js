import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { errorResponse, serverError } from "@/lib/response";

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(req) {
  try {
    const { username, password, rememberMe = false } = await req.json();

    const envUsername = process.env.AUTH_USERNAME;
    const envPassword = process.env.AUTH_PASSWORD;

    if (!username || !password) {
      return errorResponse("Username dan password wajib diisi", 400);
    }

    if (username !== envUsername || password !== envPassword) {
      return errorResponse("Username atau password salah", 401);
    }

    const expiresIn = rememberMe ? "7d" : "1d";
    const maxAge = rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60;

    const token = await new SignJWT({ username })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(secretKey);

    const response = NextResponse.json(
      { message: "Login berhasil", data: { username }, status: "success" },
      { status: 200 }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    return response;
  } catch (error) {
    return serverError(error, "Gagal masuk. Silakan coba lagi.");
  }
}
