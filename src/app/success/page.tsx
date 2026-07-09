"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DATE_PLACES } from "@/lib/constants";

interface BookingData {
  id: string;
  name: string;
  company: string;
  position: string;
  contact: string;
  slot: string;
  status: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("No booking ID found.");
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        const res = await fetch(`/api/bookings/${id}`);
        if (!res.ok) {
          throw new Error("Could not find booking data.");
        }
        const data = await res.json();
        setBooking(data);
      } catch (err: any) {
        setError(err.message || "Failed to load booking details.");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  const handleCopyLink = () => {
    if (typeof window === "undefined") return;
    
    const manageUrl = `${window.location.origin}/manage?id=${id}`;
    navigator.clipboard.writeText(manageUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "2rem" }}>Loading your booking...</div>;
  }

  if (error || !booking) {
    return (
      <div style={{ padding: "2rem" }}>
        <div className="alert alert-error">{error || "Booking not found."}</div>
        <div className="btn-container">
          <Link href="/" className="btn">
            Go Back Home
          </Link>
        </div>
      </div>
    );
  }

  const [datePlaceId, timeSlotId] = booking.slot.split("|");
  const datePlaceObj = DATE_PLACES.find((d) => d.id === datePlaceId);
  const displaySlot = datePlaceObj ? `${datePlaceObj.label.split(";")[0]} @ ${timeSlotId}` : booking.slot;

  return (
    <div>
      <div className="alert alert-success" style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "0.5rem" }}>Booking Successful!</h2>
        <p>Your meeting has been scheduled and the slot is locked.</p>
      </div>

      <div className="card">
        <div className="card-title">Booking Details</div>
        <div className="detail-row">
          <div className="detail-label">Booking ID:</div>
          <div className="detail-value" style={{ fontFamily: "monospace", fontWeight: "bold" }}>{booking.id}</div>
        </div>
        <div className="detail-row">
          <div className="detail-label">Name:</div>
          <div className="detail-value">{booking.name}</div>
        </div>
        <div className="detail-row">
          <div className="detail-label">Company:</div>
          <div className="detail-value">{booking.company}</div>
        </div>
        <div className="detail-row">
          <div className="detail-label">Position:</div>
          <div className="detail-value">{booking.position}</div>
        </div>
        <div className="detail-row">
          <div className="detail-label">Contact:</div>
          <div className="detail-value">{booking.contact}</div>
        </div>
        <div className="detail-row">
          <div className="detail-label">Slot:</div>
          <div className="detail-value" style={{ fontWeight: "500" }}>{displaySlot}</div>
        </div>
        <div className="detail-row">
          <div className="detail-label">Status:</div>
          <div className="detail-value">
            <span className={`status-badge status-${booking.status.toLowerCase()}`}>
              {booking.status === "CONFIRMED" ? "Confirmed" : "Cancelled"}
            </span>
          </div>
        </div>
      </div>

      <div className="card" style={{ backgroundColor: "rgba(59, 103, 160, 0.05)" }}>
        <div className="card-title" style={{ color: "var(--primary-color)" }}>🔑 Manage Booking</div>
        <p className="description" style={{ marginBottom: "1rem" }}>
          If you need to cancel or re-fill, please save the link below. Simply visit this link to manage your booking self-serve.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <input
            type="text"
            readOnly
            value={typeof window !== "undefined" ? `${window.location.origin}/manage?id=${id}` : ""}
            style={{ flex: 1, padding: "0.5rem", fontSize: "0.85rem" }}
          />
          <button onClick={handleCopyLink} className="btn" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
            {copied ? "Copied" : "Copy Link"}
          </button>
        </div>
      </div>

      <div className="btn-container">
        <Link href={`/manage?id=${id}`} className="btn">
          Manage
        </Link>
        <Link href="/" className="btn btn-secondary">
          Home
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="container">
      <div className="header">
        Lacuna - Booking Confirmed
      </div>
      <div className="content">
        <Suspense fallback={<div style={{ textAlign: "center", padding: "2rem" }}>Loading...</div>}>
          <SuccessContent />
        </Suspense>
      </div>
    </div>
  );
}
