import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/admin/bookings - Retrieve all bookings (admin view)
export async function GET(request: Request) {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    const authHeader = request.headers.get("authorization");
    
    // Check if password matches
    if (!authHeader || authHeader !== `Bearer ${adminPassword}`) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const bookings = await prisma.booking.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Admin fetch bookings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
