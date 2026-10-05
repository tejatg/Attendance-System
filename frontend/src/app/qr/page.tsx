"use client";

import Link from "next/link";

export default function QRPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "#f5f7fb",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "#ffffff",
          padding: "40px 30px",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "32px",
            fontWeight: 700,
            color: "#111827",
          }}
        >
          Smart Attendance
        </h1>

        <p
          style={{
            marginTop: "12px",
            marginBottom: "32px",
            color: "#6b7280",
            fontSize: "16px",
          }}
        >
          Please select an option
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <Link
            href="/attendance/check-in"
            style={{
              display: "block",
              padding: "16px 20px",
              borderRadius: "10px",
              background: "#2563eb",
              color: "#ffffff",
              textDecoration: "none",
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            1. Check In
          </Link>

          <Link
            href="/attendance"
            style={{
              display: "block",
              padding: "16px 20px",
              borderRadius: "10px",
              background: "#16a34a",
              color: "#ffffff",
              textDecoration: "none",
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            2. Check Out
          </Link>

          <Link
            href="/employees"
            style={{
              display: "block",
              padding: "16px 20px",
              borderRadius: "10px",
              background: "#7c3aed",
              color: "#ffffff",
              textDecoration: "none",
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            3. Register a New Employee
          </Link>
        </div>

        <p
          style={{
            marginTop: "28px",
            fontSize: "13px",
            color: "#9ca3af",
          }}
        >
          Smart Attendance System
        </p>
      </div>
    </main>
  );
}