import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { person_id, pin_code } = await request.json();

    if (!person_id || !pin_code) {
      return NextResponse.json({ error: "person_id and pin_code are required" }, { status: 400 });
    }

    const user = await prisma.person.findUnique({
      where: { id: Number(person_id) },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Default pin_code is "1234" in schema, but check if user.pin_code matches
    if (user.pin_code !== pin_code) {
      return NextResponse.json({ error: "Invalid 4-digit code" }, { status: 401 });
    }

    // Success
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      }
    });

    // Set cookies
    response.cookies.set("bridge_token", `token_${user.id}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    response.cookies.set("user_name", user.name, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error: any) {
    console.error("PIN login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
