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
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/public/bookings");

      if (!response.ok) {
        throw new Error("Failed to load booking details.");
      }

      const data = await response.json();
      setBookings(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    
    // Auto refresh every 30 seconds for live screen display
    const interval = setInterval(fetchBookings, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div style={{ textAlign: "center", padding: "4rem" }}>正在加载预约看板 Loading...</div>;
  }

  if (error) {
    return (
      <div className="container">
        <div className="content">
          <div className="alert alert-error">{error}</div>
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
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700" }}>预约数据看板 (Public Monitor)</h2>
            <p className="description">实时监控当前的会议预约和场次占用情况 (每30秒自动更新)</p>
          </div>
        </div>

        {/* Statistical cards */}
        <div className="admin-stats">
          <div className="stat-card">
            <div className="description">总提交数 (Total Submissions)</div>
            <div className="stat-number">{totalBookings}</div>
          </div>
          <div className="stat-card" style={{ borderColor: "rgba(16, 185, 129, 0.3)" }}>
            <div className="description">有效预约 (Confirmed Bookings)</div>
            <div className="stat-number" style={{ color: "var(--success-color)" }}>{confirmedBookings}</div>
          </div>
          <div className="stat-card" style={{ borderColor: "rgba(239, 68, 68, 0.3)" }}>
            <div className="description">已取消预约 (Cancelled Bookings)</div>
            <div className="stat-number" style={{ color: "var(--error-color)" }}>{cancelledBookings}</div>
          </div>
        </div>

        {/* Slot fill level */}
        {DATE_PLACES.map((dp) => (
          <div className="card" key={dp.id} style={{ marginBottom: "1.5rem" }}>
            <div className="card-title" style={{ fontSize: "1.05rem" }}>
              {dp.label} - 时间段占用情况
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
                      {isOccupied ? "已占用" : "空闲"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Bookings table */}
        <div className="card" style={{ marginTop: "2rem" }}>
          <div className="card-title">预约名单 (Bookings List)</div>
          
          {bookings.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>暂无预约记录 (No bookings yet.)</p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>姓名 (Name)</th>
                    <th>公司/职位 (Company/Title)</th>
                    <th>联系方式 (Contact - Masked)</th>
                    <th>场次和时间 (Slot & Time)</th>
                    <th>状态 (Status)</th>
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
                            {booking.status === "CONFIRMED" ? "有效" : "已取消"}
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
