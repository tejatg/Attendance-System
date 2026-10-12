
"use client";

import { useRouter } from "next/navigation";

export default function AttendancePage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-50 p-6 text-gray-900">
      <h1 className="text-3xl font-bold">Employee Attendance</h1>

      <p className="text-center text-gray-600">
        Select the attendance action you want to perform.
      </p>

      <div className="grid w-full max-w-md grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          onClick={() => router.push("/attendance/check-in")}
          className="rounded-xl bg-blue-600 p-5 font-semibold text-white hover:bg-blue-700"
        >
          Check In
        </button>

        <button
          onClick={() => router.push("/attendance/check-out")}
          className="rounded-xl bg-gray-800 p-5 font-semibold text-white hover:bg-gray-900"
        >
          Check Out
        </button>
      </div>

      <button
        onClick={() => router.push("/my-attendance")}
        className="rounded-lg border border-gray-300 bg-white px-5 py-3"
      >
        View My Attendance
      </button>
    </main>
  );
}
