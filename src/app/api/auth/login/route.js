import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { errorResponse } from "@/lib/response";

export async function POST(req) {
  try {
    const { username, password, rememberMe = false } = await req.json();

    const envUsername = process.env.AUTH_USERNAME;
    const envPassword = process.env.AUTH_PASSWORD;
    const jwtSecret = process.env.JWT_SECRET;

    if (!username || !password) {
      return errorResponse("Username dan password wajib diisi", 400);
    }

    if (username !== envUsername || password !== envPassword) {
      return errorResponse("Username atau password salah", 401);
    }

    const payload = { username };

    const expiresIn = rememberMe ? "7d" : "1d";
    const maxAge = rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60;

    const token = jwt.sign(payload, jwtSecret, { expiresIn });

    const response = NextResponse.json(
      { status: true, message: "Login berhasil", data: { username } },
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
    console.error("Login API error:", error);
    return errorResponse("Gagal login. Silakan coba lagi.", 500, error.message);
  }
}
