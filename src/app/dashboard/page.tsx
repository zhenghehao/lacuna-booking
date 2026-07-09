"use client";

import React, { useEffect, useState } from "react";
import { DATE_PLACES, TIME_SLOTS_BY_DATE } from "@/lib/constants";

interface BookingData {
  id: string;
  name: string;
  company: string;
  position: string;
  contact: string;
  slot: string;
  status: string;
  createdAt: string;
}

export default function PublicDashboard() {
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if password exists in localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPassword = localStorage.getItem("lacuna_dashboard_pwd");
      if (savedPassword) {
        setPassword(savedPassword);
        fetchBookings(savedPassword);
      }
    }
  }, []);

  const fetchBookings = async (pwd: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/public/bookings", {
        headers: {
          Authorization: `Bearer ${pwd}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("密码错误。 Incorrect Password.");
        }
        throw new Error("Failed to load booking details.");
      }

      const data = await response.json();
      setBookings(data);
      setIsAuthorized(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("lacuna_dashboard_pwd", pwd);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch bookings.");
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized && password) {
      // Auto refresh every 30 seconds for live screen display once logged in
      const interval = setInterval(() => fetchBookings(password), 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthorized, password]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Password is required.");
      return;
    }
    fetchBookings(password);
  };

  const handleLogout = () => {
    setIsAuthorized(false);
    setPassword("");
    if (typeof window !== "undefined") {
      localStorage.removeItem("lacuna_dashboard_pwd");
    }
  };

  if (!isAuthorized) {
    return (
      <div className="container" style={{ maxWidth: "450px" }}>
        <div className="header">Live Dashboard</div>
        <div className="content">
          <form onSubmit={handleLoginSubmit}>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label htmlFor="dashboard-pwd">输入查看密码 (Dashboard Password):</label>
              <input
                type="password"
                id="dashboard-pwd"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Default: viewer123"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  fontSize: "1rem",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                }}
              />
            </div>
            <div className="btn-container" style={{ marginTop: "1rem" }}>
              <button type="submit" className="btn" disabled={loading} style={{ width: "100%" }}>
                {loading ? "Verifying..." : "Enter Dashboard"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter((b) => b.status === "CONFIRMED").length;
  const cancelledBookings = bookings.filter((b) => b.status === "CANCELLED").length;

  return (
    <div className="container" style={{ maxWidth: "1000px" }}>
      <div className="header">
        Lacuna Meeting Live Dashboard
      </div>
      
      <div className="content">
        <div className="admin-header">
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700" }}>Live Booking Dashboard</h2>
            <p className="description">Real-time schedule occupancy and confirmed participant monitor. (Auto-refreshes every 30s)</p>
          </div>
          <div>
            <button onClick={handleLogout} className="btn btn-secondary" style={{ fontSize: "0.9rem", padding: "0.5rem 1.25rem" }}>
              Logout
            </button>
          </div>
        </div>

        {/* Statistical cards */}
        <div className="admin-stats">
          <div className="stat-card">
            <div className="description">Total Submissions</div>
            <div className="stat-number">{totalBookings}</div>
          </div>
          <div className="stat-card" style={{ borderColor: "rgba(16, 185, 129, 0.3)" }}>
            <div className="description">Confirmed Bookings</div>
            <div className="stat-number" style={{ color: "var(--success-color)" }}>{confirmedBookings}</div>
          </div>
          <div className="stat-card" style={{ borderColor: "rgba(239, 68, 68, 0.3)" }}>
            <div className="description">Cancelled Bookings</div>
            <div className="stat-number" style={{ color: "var(--error-color)" }}>{cancelledBookings}</div>
          </div>
        </div>

        {/* Slot fill level */}
        {DATE_PLACES.map((dp) => (
          <div className="card" key={dp.id} style={{ marginBottom: "1.5rem" }}>
            <div className="card-title" style={{ fontSize: "1.05rem" }}>
              Occupancy: {dp.label.split(";")[0]}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem" }}>
              {TIME_SLOTS_BY_DATE[dp.id].map((time) => {
                const compositeId = `${dp.id}|${time}`;
                const isOccupied = bookings.some(
                  (b) => b.slot === compositeId && b.status === "CONFIRMED"
                );
                return (
                  <div
                    key={time}
                    style={{
                      padding: "0.75rem",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: isOccupied ? "rgba(239, 68, 68, 0.05)" : "rgba(16, 185, 129, 0.05)",
                      borderColor: isOccupied ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.85rem",
                    }}
                  >
                    <span style={{ fontWeight: "600" }}>{time}</span>
                    <span
                      style={{
                        padding: "0.15rem 0.4rem",
                        borderRadius: "4px",
                        fontSize: "0.7rem",
                        fontWeight: "bold",
                        backgroundColor: isOccupied ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                        color: isOccupied ? "var(--error-color)" : "var(--success-color)",
                      }}
                    >
                      {isOccupied ? "Booked" : "Available"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Bookings table */}
        <div className="card" style={{ marginTop: "2rem" }}>
          <div className="card-title">Bookings List</div>
          
          {bookings.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>No bookings yet.</p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Company / Title</th>
                    <th>Contact (Masked)</th>
                    <th>Slot & Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => {
                    const parts = booking.slot.split("|");
                    const [datePlaceId, timeSlotId] = parts;
                    const datePlaceObj = DATE_PLACES.find((d) => d.id === datePlaceId);
                    
                    return (
                      <tr key={booking.id}>
                        <td style={{ fontWeight: "600" }}>{booking.name}</td>
                        <td>
                          <div>{booking.company}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{booking.position}</div>
                        </td>
                        <td style={{ fontFamily: "monospace" }}>{booking.contact}</td>
                        <td>
                          <div style={{ fontWeight: "500" }}>{timeSlotId}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {datePlaceObj ? datePlaceObj.label.split(";")[0] : datePlaceId}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge status-${booking.status.toLowerCase()}`}>
                            {booking.status === "CONFIRMED" ? "Confirmed" : "Cancelled"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
