"use client";

const ATTENDANCE_URL =
  "https://attendance-system-omega-beryl-95.vercel.app/attendance/check-in";

const QR_IMAGE_URL =
  `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    ATTENDANCE_URL
  )}`;

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
          padding: "32px 28px",
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
            marginTop: "10px",
            color: "#6b7280",
            fontSize: "16px",
          }}
        >
          Scan QR Code to access Attendance
        </p>

        {/* QR CODE ONLY */}

        <div
          style={{
            marginTop: "28px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              padding: "14px",
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
            }}
          >
            <img
              src={QR_IMAGE_URL}
              alt="Smart Attendance QR Code"
              width={300}
              height={300}
              style={{
                display: "block",
                width: "300px",
                height: "300px",
              }}
            />
          </div>
        </div>

        <p
          style={{
            marginTop: "16px",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          Scan this QR code to open Employee Check-In
        </p>

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