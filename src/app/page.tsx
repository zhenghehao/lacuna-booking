"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BOOKING_SLOTS } from "@/lib/constants";

export default function BookingForm() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    position: "",
    contact: "",
    slot: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSlotSelect = (slotId: string) => {
    setFormData({
      ...formData,
      slot: slotId,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
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

        <div className="form-group">
          <label>
            Date and Place <span className="required">*</span>
          </label>
          <div className="radio-group">
            {BOOKING_SLOTS.map((slot) => (
              <div
                key={slot.id}
                className={`radio-option ${
                  formData.slot === slot.id ? "selected" : ""
                }`}
                onClick={() => handleSlotSelect(slot.id)}
              >
                <input
                  type="radio"
                  id={slot.id}
                  name="slot"
                  checked={formData.slot === slot.id}
                  onChange={() => handleSlotSelect(slot.id)}
                  required
                />
                <label htmlFor={slot.id} className="radio-text" style={{ fontWeight: "normal", cursor: "pointer", display: "inline" }}>
                  {slot.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="btn-container">
          <button type="submit" className="btn" disabled={loading}>
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
