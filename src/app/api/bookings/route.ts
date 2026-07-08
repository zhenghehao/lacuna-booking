import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DATE_PLACES, TIME_SLOTS_BY_DATE } from "@/lib/constants";

// POST /api/bookings - Create a new slot-booking
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

    // Parse composite slot (format: "datePlaceId|timeSlotId")
    const parts = slot.split("|");
    if (parts.length !== 2) {
      return NextResponse.json(
        { error: "Invalid slot format selection" },
        { status: 400 }
      );
    }

    const [datePlaceId, timeSlotId] = parts;

    // Validate Date/Place selection
    const selectedDatePlace = DATE_PLACES.find((d) => d.id === datePlaceId);
    if (!selectedDatePlace) {
      return NextResponse.json(
        { error: "Invalid meeting date and place selection" },
        { status: 400 }
      );
    }

    // Validate Time Slot selection
    const availableTimeSlots = TIME_SLOTS_BY_DATE[datePlaceId];
    if (!availableTimeSlots || !availableTimeSlots.includes(timeSlotId)) {
      return NextResponse.json(
        { error: "Invalid time slot selection" },
        { status: 400 }
      );
    }

    // Check if slot is already occupied (since capacity per slot is 1)
    const existingConfirmedBooking = await prisma.booking.findFirst({
      where: {
        slot,
        status: "CONFIRMED",
      },
    });

    if (existingConfirmedBooking) {
      return NextResponse.json(
        { error: "该时间段已被预约，请选择其他时间。 This time slot is already booked." },
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
    console.error("Booking creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
