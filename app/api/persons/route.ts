import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const persons = await prisma.person.findMany({
      select: {
        id: true,
        name: true,
        role: true,
      },
    });
    return NextResponse.json(persons);
  } catch (error) {
    console.error("Failed to fetch persons:", error);
    return NextResponse.json({ error: "Failed to fetch persons" }, { status: 500 });
  }
}
