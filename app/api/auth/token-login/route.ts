import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const user = await prisma.person.findUnique({
      where: { login_token: token },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Create the response object
    const response = NextResponse.json({
      id: user.id,
      name: user.name,
      role: user.role,
      ha_entity_id: user.ha_entity_id,
      contact_id: user.contact_id,
    });

    // Set a secure cookie for the session
    // 'bridge_token' is currently used as mock_token_<id>
    response.cookies.set("bridge_token", `token_${user.id}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Set user_name cookie for UI display (matches original app/login behavior)
    response.cookies.set("user_name", user.name, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error: any) {
    console.error("Token login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
