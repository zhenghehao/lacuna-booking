import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DATE_PLACES, TIME_SLOTS_BY_DATE } from "@/lib/constants";

type Props = {
  params: Promise<{ id: string }>;
};

// GET /api/bookings/[id] - Get details of a single booking
export async function GET(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Fetch booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/bookings/[id] - Update/re-fill booking details
export async function PATCH(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, company, position, contact, slot, status } = body;

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

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

    const targetStatus = status || "CONFIRMED";

    // If targetStatus is CONFIRMED, check if the slot is occupied by another booking
    if (targetStatus === "CONFIRMED") {
      const occupiedByOther = await prisma.booking.findFirst({
        where: {
          slot,
          status: "CONFIRMED",
          id: {
            not: id,
          },
        },
      });

      if (occupiedByOther) {
        return NextResponse.json(
          { error: "该时间段已被他人预约，请选择其他时间。 This time slot is already booked." },
          { status: 400 }
        );
      }
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        name: name.trim(),
        company: company.trim(),
        position: position.trim(),
        contact: contact.trim(),
        slot,
        status: targetStatus,
      },
    });

    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error("Update booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/bookings/[id] - Soft cancel booking by setting status to CANCELLED
export async function DELETE(request: Request, { params }: Props) {
  try {
    const { id } = await params;

    const existingBooking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Update status to CANCELLED
    const cancelledBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: "CANCELLED",
      },
    });

    return NextResponse.json({ success: true, booking: cancelledBooking });
  } catch (error) {
    console.error("Cancel booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
