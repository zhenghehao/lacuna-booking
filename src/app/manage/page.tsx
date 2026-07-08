"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DATE_PLACES, TIME_SLOTS_BY_DATE } from "@/lib/constants";

interface BookingData {
  id: string;
  name: string;
  company: string;
  position: string;
  contact: string;
  slot: string;
  status: string;
}

function ManageContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    position: "",
    contact: "",
    datePlace: "",
    timeSlot: "",
  });

  const fetchBooking = async () => {
    if (!id) {
      setError("No booking ID found in URL.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/bookings/${id}`);
      if (!res.ok) {
        throw new Error("Could not find booking data.");
      }
      const data = await res.json();
      setBooking(data);

      // Parse composite slot (format: "datePlaceId|timeSlotId")
      const [datePlaceId, timeSlotId] = data.slot.split("|");

      setFormData({
        name: data.name,
        company: data.company,
        position: data.position,
        contact: data.contact,
        datePlace: datePlaceId || "",
        timeSlot: timeSlotId || "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to load booking details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchOccupied = async () => {
    if (!id) return;
    try {
      // Exclude current booking ID so the user's own current slot is not marked as occupied to them
      const res = await fetch(`/api/bookings/occupied?excludeId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setOccupiedSlots(data);
      }
    } catch (err) {
      console.error("Failed to fetch occupied slots:", err);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  useEffect(() => {
    if (isEditing) {
      fetchOccupied();
    }
  }, [isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleDatePlaceSelect = (datePlaceId: string) => {
    setFormData({
      ...formData,
      datePlace: datePlaceId,
      timeSlot: "", // Reset time slot when date changes
    });
  };

  const handleTimeSlotSelect = (timeSlotId: string) => {
    setFormData({
      ...formData,
      timeSlot: timeSlotId,
    });
  };

  const handleCancelBooking = async () => {
    if (!window.confirm("确定要取消此预约吗？ Are you sure you want to cancel this booking?")) {
      return;
    }

    setActionLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel booking.");
      }

      setMessage("预约已成功取消。 Booking successfully cancelled.");
      await fetchBooking();
    } catch (err: any) {
      setError(err.message || "Failed to cancel.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.datePlace || !formData.timeSlot) {
      setError("Please select both a date/place and a time slot.");
      return;
    }

    setActionLoading(true);
    setError("");
    setMessage("");

    const compositeSlot = `${formData.datePlace}|${formData.timeSlot}`;

    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          company: formData.company,
          position: formData.position,
          contact: formData.contact,
          slot: compositeSlot,
          status: "CONFIRMED", // Re-activate if cancelled
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update booking details.");
      }

      setMessage("预约信息更新成功！ Booking details updated successfully.");
      setIsEditing(false);
      await fetchBooking();
    } catch (err: any) {
      setError(err.message || "Update failed.");
    } finally {
      setActionLoading(false);
    }
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

  // Parse current slot for display
  const [dbDatePlace, dbTimeSlot] = booking.slot.split("|");
  const datePlaceObj = DATE_PLACES.find((d) => d.id === dbDatePlace);

  return (
    <div>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!isEditing ? (
        // VIEW MODE
        <div>
          <div className="card">
            <div className="card-title">当前预约状态 (Current Booking Details)</div>
            <div className="detail-row">
              <div className="detail-label">预约状态 (Status):</div>
              <div className="detail-value">
                <span className={`status-badge status-${booking.status.toLowerCase()}`}>
                  {booking.status === "CONFIRMED" ? "已确认 (Confirmed)" : "已取消 (Cancelled)"}
                </span>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">预约编号 (ID):</div>
              <div className="detail-value" style={{ fontFamily: "monospace" }}>{booking.id}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">姓名 (Name):</div>
              <div className="detail-value">{booking.name}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">公司 (Company):</div>
              <div className="detail-value">{booking.company}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">职位 (Position):</div>
              <div className="detail-value">{booking.position}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">联系方式 (Contact):</div>
              <div className="detail-value">{booking.contact}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">时间地点 (Slot):</div>
              <div className="detail-value" style={{ fontWeight: "500" }}>
                {datePlaceObj ? datePlaceObj.label.split(";")[0] : dbDatePlace} @ {dbTimeSlot}
              </div>
            </div>
          </div>

          <div className="btn-container">
            {booking.status === "CONFIRMED" ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn"
                  disabled={actionLoading}
                >
                  修改/重新填写 (Modify / Re-Fill)
                </button>
                <button
                  onClick={handleCancelBooking}
                  className="btn btn-danger"
                  disabled={actionLoading}
                >
                  取消预约 (Cancel Booking)
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="btn"
                disabled={actionLoading}
              >
                重新激活并填写 (Re-activate & Book)
              </button>
            )}
            <Link href="/" className="btn btn-secondary">
              返回首页 (Back Home)
            </Link>
          </div>
        </div>
      ) : (
        // EDIT / RE-FILL FORM MODE
        <form onSubmit={handleUpdateBooking}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
            修改预约信息 (Edit Booking Info)
          </h2>
          
          <div className="form-group">
            <label htmlFor="name">
              Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="company">
              Company <span className="required">*</span>
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="position">
              Position <span className="required">*</span>
            </label>
            <input
              type="text"
              id="position"
              name="position"
              value={formData.position}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="contact">
              Contact Information <span className="required">*</span>
            </label>
            <p className="description">
              If you have a Chinese mainland phone number, please provide it. Otherwise, please share your email address.
            </p>
            <input
              type="text"
              id="contact"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              required
            />
          </div>

          {/* Date and Place Selection */}
          <div className="form-group">
            <label>
              Date and Place <span className="required">*</span>
            </label>
            <div className="radio-group">
              {DATE_PLACES.map((dp) => (
                <div
                  key={dp.id}
                  className={`radio-option ${
                    formData.datePlace === dp.id ? "selected" : ""
                  }`}
                  onClick={() => handleDatePlaceSelect(dp.id)}
                >
                  <input
                    type="radio"
                    id={`edit-${dp.id}`}
                    name="datePlace"
                    checked={formData.datePlace === dp.id}
                    onChange={() => handleDatePlaceSelect(dp.id)}
                    required
                  />
                  <label htmlFor={`edit-${dp.id}`} className="radio-text" style={{ fontWeight: "normal", cursor: "pointer", display: "inline" }}>
                    {dp.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Time Slot Selection */}
          {formData.datePlace && (
            <div className="form-group" style={{ marginTop: "2rem" }}>
              <label>
                Please select your preferred time slot. <span className="required">*</span>
              </label>
              <p className="description">
                Greyed-out options are already booked.
              </p>
              <div className="radio-group">
                {TIME_SLOTS_BY_DATE[formData.datePlace].map((time) => {
                  const compositeId = `${formData.datePlace}|${time}`;
                  const isOccupied = occupiedSlots.includes(compositeId);
                  const isSelected = formData.timeSlot === time;

                  return (
                    <div
                      key={time}
                      className={`radio-option ${isSelected ? "selected" : ""} ${
                        isOccupied ? "disabled" : ""
                      }`}
                      onClick={() => !isOccupied && handleTimeSlotSelect(time)}
                      style={
                        isOccupied
                          ? {
                              opacity: 0.5,
                              cursor: "not-allowed",
                              backgroundColor: "rgba(0,0,0,0.02)",
                            }
                          : {}
                      }
                    >
                      <input
                        type="radio"
                        id={`edit-time-${time}`}
                        name="timeSlot"
                        checked={isSelected}
                        disabled={isOccupied}
                        onChange={() => !isOccupied && handleTimeSlotSelect(time)}
                        required
                      />
                      <label
                        htmlFor={`edit-time-${time}`}
                        className="radio-text"
                        style={{
                          fontWeight: "normal",
                          cursor: isOccupied ? "not-allowed" : "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          width: "100%",
                        }}
                      >
                        <span>{time}</span>
                        {isOccupied && (
                          <span style={{ color: "var(--error-color)", fontSize: "0.85rem", fontWeight: "bold" }}>
                            配额已满
                          </span>
                        )}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="btn-container">
            <button type="submit" className="btn" disabled={actionLoading}>
              {actionLoading ? "Saving..." : "保存修改 (Save Changes)"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="btn btn-secondary"
              disabled={actionLoading}
            >
              取消 (Cancel)
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ManagePage() {
  return (
    <div className="container">
      <div className="header">
        Manage Lacuna Meeting
      </div>
      <div className="content">
        <Suspense fallback={<div style={{ textAlign: "center", padding: "2rem" }}>Loading...</div>}>
          <ManageContent />
        </Suspense>
      </div>
    </div>
  );
}
