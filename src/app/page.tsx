"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DATE_PLACES, TIME_SLOTS_BY_DATE } from "@/lib/constants";

export default function BookingForm() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    position: "",
    contact: "",
    datePlace: "", // selected date/place ID
    timeSlot: "",  // selected time slot string
  });
  
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingOccupied, setFetchingOccupied] = useState(true);
  const [error, setError] = useState("");

  // Fetch occupied slots on mount
  useEffect(() => {
    const fetchOccupied = async () => {
      try {
        const res = await fetch("/api/bookings/occupied");
        if (res.ok) {
          const data = await res.json();
          setOccupiedSlots(data);
        }
      } catch (err) {
        console.error("Failed to fetch occupied slots:", err);
      } finally {
        setFetchingOccupied(false);
      }
    };
    fetchOccupied();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleDatePlaceSelect = (id: string) => {
    setFormData({
      ...formData,
      datePlace: id,
      timeSlot: "", // Reset time slot when date changes
    });
  };

  const handleTimeSlotSelect = (time: string) => {
    setFormData({
      ...formData,
      timeSlot: time,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.datePlace || !formData.timeSlot) {
      setError("Please select both a date/place and a time slot.");
      return;
    }

    setLoading(true);
    setError("");

    // Composite slot ID: "datePlaceId|timeSlotId"
    const compositeSlot = `${formData.datePlace}|${formData.timeSlot}`;

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          company: formData.company,
          position: formData.position,
          contact: formData.contact,
          slot: compositeSlot,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      router.push(`/success?id=${data.bookingId}`);
    } catch (err: any) {
      setError(err.message || "Connection failed.");
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="header">
        Book a Meeting with Lacuna
      </div>
      
      <form onSubmit={handleSubmit} className="content">
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

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
            autoComplete="name"
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
            autoComplete="organization"
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
            autoComplete="organization-title"
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
            autoComplete="email"
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
                  id={dp.id}
                  name="datePlace"
                  checked={formData.datePlace === dp.id}
                  onChange={() => handleDatePlaceSelect(dp.id)}
                  required
                />
                <label htmlFor={dp.id} className="radio-text" style={{ fontWeight: "normal", cursor: "pointer", display: "inline" }}>
                  {dp.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Time Slot Selection (conditional upon datePlace selection) */}
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
                      id={`time-${time}`}
                      name="timeSlot"
                      checked={isSelected}
                      disabled={isOccupied}
                      onChange={() => !isOccupied && handleTimeSlotSelect(time)}
                      required
                    />
                    <label
                      htmlFor={`time-${time}`}
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
          <button type="submit" className="btn" disabled={loading || fetchingOccupied}>
            {loading ? "Submitting..." : "提交"}
          </button>
        </div>
      </form>

      <div className="footer">
        <p>此表单已经实名认证的 个人 制作、发布并收集您填写的信息</p>
        <p>提交表单表示您已知悉收集信息的目的，并同意其使用您提交的信息</p>
        <div className="footer-links">
          <a href="#">查询发布者信息</a>
          <a href="#">疑问与咨询</a>
          <a href="#">投诉与举报</a>
        </div>
      </div>
    </div>
  );
}
