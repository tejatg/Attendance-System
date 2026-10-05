"use client";

const ATTENDANCE_OPTIONS_URL =
  "https://attendance-system-omega-beryl-95.vercel.app/attendance/options";

const QR_IMAGE_URL =
  `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    ATTENDANCE_OPTIONS_URL
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
              alt="TALENTRONAUT PVT LTD Attendance QR Code"
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
          Scan this QR code to continue
        </p>

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