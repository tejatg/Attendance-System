"use client";

import { useRouter } from "next/navigation";

export default function AttendanceOptionsPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col justify-center">

        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Attendance Options
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            Select an option to continue
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4">

          {/* Check In */}
          <button
            type="button"
            onClick={() => router.push("/attendance/check-in")}
            className="w-full rounded-xl bg-black px-6 py-4 text-lg font-bold text-white transition hover:opacity-90"
          >
            CHECK IN
          </button>

          {/* Check Out */}
          <button
            type="button"
            onClick={() => router.push("/attendance")}
            className="w-full rounded-xl bg-black px-6 py-4 text-lg font-bold text-white transition hover:opacity-90"
          >
            CHECK OUT
          </button>

          {/* Register New Employee */}
          <button
            type="button"
            onClick={() => router.push("/employees")}
            className="w-full rounded-xl border-2 border-black bg-white px-6 py-4 text-lg font-bold text-black transition hover:bg-gray-100"
          >
            REGISTER NEW EMPLOYEE
          </button>

          {/* Admin Dashboard */}
          <button
            type="button"
            onClick={() => router.push("/admin-login")}
            className="w-full rounded-xl bg-black px-6 py-4 text-lg font-bold text-white transition hover:opacity-90"
          >
            ADMIN DASHBOARD
          </button>

        </div>
      </div>
    </main>
  );
}