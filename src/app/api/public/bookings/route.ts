import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Helper to mask phone numbers or emails for public display
function maskContact(contact: string): string {
  const trimmed = contact.trim();
  if (trimmed.includes("@")) {
    // Mask email (e.g., test@example.com -> te**@example.com)
    const [localPart, domain] = trimmed.split("@");
    if (localPart.length <= 2) {
      return `**@${domain}`;
    }
    return `${localPart.substring(0, 2)}**@${domain}`;
  } else {
    // Mask phone number (e.g., 13812345678 -> 138****5678)
    if (trimmed.length >= 7) {
      const start = trimmed.substring(0, 3);
      const end = trimmed.substring(trimmed.length - 4);
      return `${start}****${end}`;
    }
    return "****";
  }
}

// GET /api/public/bookings - Get list of bookings for public display (contact masked)
export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    const publicBookings = bookings.map((b) => ({
      id: b.id,
      name: b.name,
      company: b.company,
      position: b.position,
      contact: maskContact(b.contact), // Masked to protect privacy
      slot: b.slot,
      status: b.status,
      createdAt: b.createdAt,
    }));

    return NextResponse.json(publicBookings);
  } catch (error) {
    console.error("Fetch public bookings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
