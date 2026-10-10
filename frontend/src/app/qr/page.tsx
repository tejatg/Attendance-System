"use client";

import { QRCodeCanvas } from "qrcode.react";

const ATTENDANCE_URL =
  "https://attendance-system-omega-beryl-95.vercel.app/attendance/options";

export default function QRPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white p-6 text-center text-black">
      <h1 className="text-2xl font-bold">QR Attendance</h1>

      <QRCodeCanvas
        value={ATTENDANCE_URL}
        size={300}
        level="H"
        includeMargin
      />

      <p className="text-lg font-semibold">Scan to Mark Attendance</p>
    </main>
  );
}