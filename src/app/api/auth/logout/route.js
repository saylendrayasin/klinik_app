import { serverError } from "@/lib/response";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const response = NextResponse.json(
      { message: "Logout berhasil", data: null, status: "success" },
      { status: 200 }
    );

    response.cookies.set("token", "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    return serverError(error, "Gagal keluar. Silakan coba lagi.");
  }
}
