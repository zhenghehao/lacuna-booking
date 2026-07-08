import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { BOOKING_SLOTS } from "@/lib/constants";

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

    // Validate slot selection
    const selectedSlot = BOOKING_SLOTS.find((s) => s.id === slot);
    if (!selectedSlot) {
      return NextResponse.json(
        { error: "Invalid meeting date and place selection" },
        { status: 400 }
      );
    }

    const targetStatus = status || "CONFIRMED";

    // If slot changed or booking is being re-confirmed from CANCELLED status
    const slotChanged = existingBooking.slot !== slot;
    const statusReconfirmed = existingBooking.status === "CANCELLED" && targetStatus === "CONFIRMED";

    if (targetStatus === "CONFIRMED" && (slotChanged || statusReconfirmed)) {
      // Check capacity of the target slot
      const activeBookingsCount = await prisma.booking.count({
        where: {
          slot,
          status: "CONFIRMED",
        },
      });

      if (activeBookingsCount >= selectedSlot.capacity) {
        return NextResponse.json(
          { error: "The selected slot is fully booked. Please select another slot." },
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
