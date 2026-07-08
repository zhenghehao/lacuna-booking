import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { BOOKING_SLOTS } from "@/lib/constants";

// POST /api/bookings - Create a new booking
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, company, position, contact, slot } = body;

    // Validate fields
    if (!name?.trim() || !company?.trim() || !position?.trim() || !contact?.trim() || !slot?.trim()) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate slot selection
    const selectedSlot = BOOKING_SLOTS.find((s) => s.id === slot);
    if (!selectedSlot) {
      return NextResponse.json(
        { error: "Invalid meeting date and place selection" },
        { status: 400 }
      );
    }

    // Check slot capacity (count CONFIRMED bookings for this slot)
    const activeBookingsCount = await prisma.booking.count({
      where: {
        slot,
        status: "CONFIRMED",
      },
    });

    if (activeBookingsCount >= selectedSlot.capacity) {
      return NextResponse.json(
        { error: "This slot is fully booked. Please select another slot." },
        { status: 400 }
      );
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        name: name.trim(),
        company: company.trim(),
        position: position.trim(),
        contact: contact.trim(),
        slot,
        status: "CONFIRMED",
      },
    });

    return NextResponse.json({ success: true, bookingId: booking.id }, { status: 201 });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
