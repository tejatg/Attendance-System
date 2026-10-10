"use client";

import { QRCodeCanvas } from "qrcode.react";

const ATTENDANCE_URL =
  "https://attendance-system-omega-beryl-95.vercel.app/attendance";

export default function QRPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white p-6 text-center text-black">
      <h1 className="text-2xl font-bold">QR Attendance</h1>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <QRCodeCanvas
          value={ATTENDANCE_URL}
          size={280}
          level="H"
          includeMargin={true}
        />
      </div>

      <h2 className="text-xl font-semibold">
        Scan to Mark Attendance
      </h2>

      <p className="max-w-md break-all text-sm text-gray-600">
        {ATTENDANCE_URL}
      </p>

      <p className="max-w-md text-sm text-gray-500">
        Scan this QR code with your mobile phone camera to open the
        attendance page.
      </p>
    </main>
  );
}