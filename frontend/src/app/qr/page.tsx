"use client";

import { QRCodeCanvas } from "qrcode.react";

const ATTENDANCE_URL =
  "https://attendance-system-omega-beryl-95.vercel.app/attendance/check-in";

export default function QRPage() {
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">

        <h1 className="text-3xl font-bold text-slate-900">
          TALENTRONAUT PVT LTD
        </h1>

        <h2 className="mt-2 text-xl font-semibold text-slate-700">
          Employee Attendance
        </h2>

        <p className="mt-3 text-slate-600">
          Scan this QR code using your mobile phone to open
          the Employee Attendance page.
        </p>

        <div className="mt-8 flex justify-center">
          <div className="rounded-2xl border bg-white p-5">
            <QRCodeCanvas
              value={ATTENDANCE_URL}
              size={280}
              level="H"
            />
          </div>
        </div>

        <p className="mt-6 text-sm font-semibold text-slate-700">
          Scan to Start Attendance
        </p>

        <p className="mt-3 break-all text-xs text-slate-500">
          {ATTENDANCE_URL}
        </p>

      </div>
    </main>
  );
}