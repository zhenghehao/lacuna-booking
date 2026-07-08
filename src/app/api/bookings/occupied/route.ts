import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/bookings/occupied - Get list of occupied slot IDs
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const excludeId = searchParams.get("excludeId");

    const queryConditions: any = {
      status: "CONFIRMED",
    };

    // If an excludeId is provided, do not mark their own booking slot as occupied
    if (excludeId) {
      queryConditions.id = {
        not: excludeId,
      };
    }

    const confirmedBookings = await prisma.booking.findMany({
      where: queryConditions,
      select: {
        slot: true,
      },
    });

    const occupiedSlots = confirmedBookings.map((b) => b.slot);

    return NextResponse.json(occupiedSlots);
  } catch (error) {
    console.error("Fetch occupied slots error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
