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

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if password exists in localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPassword = localStorage.getItem("lacuna_admin_pwd");
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
      const response = await fetch("/api/admin/bookings", {
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
        localStorage.setItem("lacuna_admin_pwd", pwd);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch bookings.");
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

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
      localStorage.removeItem("lacuna_admin_pwd");
    }
  };

  const handleExportCSV = () => {
    if (bookings.length === 0) return;

    // Helper to format slot name
    const getSlotLabel = (slotStr: string) => {
      const parts = slotStr.split("|");
      if (parts.length !== 2) return slotStr;
      const [datePlaceId, timeSlotId] = parts;
      const found = DATE_PLACES.find((s) => s.id === datePlaceId);
      const dateName = found ? found.label.split(";")[0] : datePlaceId;
      return `${dateName} @ ${timeSlotId}`;
    };

    // Header row
    const headers = ["Booking ID", "Name", "Company", "Position", "Contact Info", "Selected Slot", "Status", "Created Date"];
    
    // Rows mapping
    const rows = bookings.map((b) => [
      b.id,
      `"${b.name.replace(/"/g, '""')}"`,
      `"${b.company.replace(/"/g, '""')}"`,
      `"${b.position.replace(/"/g, '""')}"`,
      `"${b.contact.replace(/"/g, '""')}"`,
      `"${getSlotLabel(b.slot)}"`,
      b.status,
      new Date(b.createdAt).toLocaleString(),
    ]);

    // Combine headers and rows
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `lacuna_bookings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthorized) {
    return (
      <div className="container" style={{ maxWidth: "450px" }}>
        <div className="header">Admin Dashboard</div>
        <div className="content">
          <form onSubmit={handleLoginSubmit}>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label htmlFor="admin-pwd">输入管理员密码 (Admin Password):</label>
              <input
                type="password"
                id="admin-pwd"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="默认密码: admin123"
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
                {loading ? "Verifying..." : "进入后台 (Enter)"}
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
        Lacuna Booking Admin Backend
      </div>
      
      <div className="content">
        <div className="admin-header">
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700" }}>预约数据概览 (Overview)</h2>
            <p className="description">管理和监控当前的会议预约名额</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={handleExportCSV} className="btn" style={{ fontSize: "0.9rem" }}>
              导出 CSV (Export Data)
            </button>
            <button onClick={handleLogout} className="btn btn-secondary" style={{ fontSize: "0.9rem", padding: "0.5rem 1.25rem" }}>
              退出登录 (Logout)
            </button>
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
                    <th>联系方式 (Contact)</th>
                    <th>场次和时间 (Slot & Time)</th>
                    <th>状态 (Status)</th>
                    <th>操作 (Action)</th>
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
                        <td>{booking.contact}</td>
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
                        <td>
                          <a
                            href={`/manage?id=${booking.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                          >
                            管理 (Manage)
                          </a>
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
