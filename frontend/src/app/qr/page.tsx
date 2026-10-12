
"use client";

import { QRCodeCanvas } from "qrcode.react";

const ATTENDANCE_URL =
  "https://attendance-system-omega-beryl-95.vercel.app/attendance";

export default function QRPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-50 px-4 py-10 text-center text-gray-900">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        <h1 className="mb-2 text-3xl font-bold">
          QR Attendance
        </h1>

        <p className="mb-6 text-sm text-gray-600">
          Scan the QR code to open the employee attendance page.
        </p>

        <div className="mx-auto mb-6 inline-block rounded-xl border border-gray-200 bg-white p-4">
          <QRCodeCanvas
            value={ATTENDANCE_URL}
            size={280}
            level="H"
            includeMargin={true}
          />
        </div>

        <h2 className="mb-3 text-xl font-semibold">
          Scan to Mark Attendance
        </h2>

        <p className="mb-4 break-all rounded-lg bg-gray-50 p-3 text-sm text-blue-700">
          {ATTENDANCE_URL}
        </p>

        <p className="text-sm leading-6 text-gray-600">
          Open your mobile phone camera and scan this QR code.
          Tap the link to open the attendance page.
        </p>
      </div>

      <p className="max-w-md text-xs text-gray-500">
        Make sure your attendance website is deployed and accessible
        before scanning.
      </p>
    </main>
  );
}
