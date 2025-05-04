import { errorResponse, successResponse } from "@/lib/response";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const response = NextResponse.json(
      { status: true, message: "Logout berhasil", data: null },
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
    console.error(error);
    return errorResponse("Logout gagal", 500, error.message);
  }
}
