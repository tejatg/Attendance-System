"use client";

import { QRCodeCanvas } from "qrcode.react";

const ATTENDANCE_URL =
  "https://attendance-system-omega-beryl-95.vercel.app/attendance";

export default function QRPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-10 text-gray-900">
      <section className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-lg sm:p-8">
        <h1 className="text-3xl font-bold">QR Attendance</h1>

        <p className="mb-6 mt-2 text-sm text-gray-600">
          Scan this QR code with your mobile phone to open the
          employee attendance page.
        </p>

        <div className="mx-auto mb-6 flex w-fit items-center justify-center rounded-xl border border-gray-200 bg-white p-4">
          <QRCodeCanvas
            value={ATTENDANCE_URL}
            size={280}
            level="H"
            marginSize={4}
            title="Employee Attendance QR Code"
          />
        </div>

        <h2 className="mb-3 text-xl font-semibold">
          Scan to Mark Attendance
        </h2>

        <p className="mb-4 break-all rounded-lg bg-gray-50 p-3 text-sm text-blue-700">
          {ATTENDANCE_URL}
        </p>

        <p className="mt-5 text-sm leading-6 text-gray-600">
          Open your phone camera, scan the QR code, and tap the
          link that appears to access the attendance page.
        </p>
      </section>

      <p className="mt-5 max-w-md text-center text-xs text-gray-500">
        The QR code opens the deployed attendance page. Check that
        the page is accessible before using it at your office.
      </p>
    </main>
  );
}