"use client";

import Link from "next/link";

export default function AttendanceOptionsPage() {
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
          padding: "32px 28px",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "30px",
            fontWeight: 700,
            color: "#111827",
          }}
        >
          TALENTRONAUT PVT LTD
        </h1>

        <p
          style={{
            marginTop: "10px",
            color: "#6b7280",
            fontSize: "16px",
          }}
        >
          Employee Attendance
        </p>

        <h2
          style={{
            marginTop: "32px",
            fontSize: "24px",
            fontWeight: 700,
            color: "#111827",
          }}
        >
          Select an Option
        </h2>

        <div
          style={{
            marginTop: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <Link
            href="/attendance/check-in"
            style={{
              display: "block",
              padding: "17px 20px",
              borderRadius: "10px",
              background: "#2563eb",
              color: "#ffffff",
              textDecoration: "none",
              fontSize: "19px",
              fontWeight: 700,
            }}
          >
            CHECK IN
          </Link>

          <Link
            href="/attendance"
            style={{
              display: "block",
              padding: "17px 20px",
              borderRadius: "10px",
              background: "#16a34a",
              color: "#ffffff",
              textDecoration: "none",
              fontSize: "19px",
              fontWeight: 700,
            }}
          >
            CHECK OUT
          </Link>

          <Link
            href="/employees"
            style={{
              display: "block",
              padding: "17px 20px",
              borderRadius: "10px",
              background: "#7c3aed",
              color: "#ffffff",
              textDecoration: "none",
              fontSize: "19px",
              fontWeight: 700,
            }}
          >
            REGISTER NEW EMPLOYEE
          </Link>
        </div>

        <p
          style={{
            marginTop: "28px",
            fontSize: "13px",
            color: "#9ca3af",
          }}
        >
          TALENTRONAUT PVT LTD
        </p>
      </div>
    </main>
  );
}