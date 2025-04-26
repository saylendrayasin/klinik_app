import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { errorResponse } from "@/lib/response";

export async function POST(req) {
  const { username, password } = await req.json();

  const envUsername = process.env.AUTH_USERNAME;
  const envPassword = process.env.AUTH_PASSWORD;
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "1d";

  if (!username || !password) {
    return errorResponse("Username dan password wajib diisi", 400);
  }

  if (username !== envUsername || password !== envPassword) {
    return errorResponse("Username atau password salah", 401);
  }

  const payload = { username };
  const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });

  const response = NextResponse.json(
    { status: true, message: "Login berhasil", data: { username } },
    { status: 200 }
  );

  response.cookies.set("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
  });

  return response;
}
