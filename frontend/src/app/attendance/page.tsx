
"use client";

import { useRouter } from "next/navigation";

export default function AttendanceOptionsPage() {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-10 text-gray-900">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 border-b border-gray-200 pb-6">
          <h1 className="text-2xl font-bold tracking-tight">
            TALENTRONAUT
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Smart Attendance System
          </p>
        </header>

        <section className="mb-8">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Attendance
          </h2>
          <p className="mt-3 text-gray-600">
            Choose an option to start or finish your workday.
          </p>
        </section>

        <section
          aria-label="Attendance options"
          className="grid gap-5 sm:grid-cols-2"
        >
          <button
            type="button"
            onClick={() => handleNavigation("/attendance/check-in")}
            className="group min-h-64 rounded-xl bg-black p-7 text-left text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <div className="mb-8 flex items-center justify-between">
              <span aria-hidden="true" className="text-3xl">
                ↗
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Start
              </span>
            </div>

            <h3 className="text-3xl font-bold">Check In</h3>

            <p className="mt-3 text-sm leading-6 text-gray-300">
              Capture your photo and record the beginning of your workday.
            </p>

            <div className="mt-8 font-semibold">
              Continue <span aria-hidden="true">→</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleNavigation("/attendance/check-out")}
            className="group min-h-64 rounded-xl border border-gray-200 bg-white p-7 text-left transition hover:border-gray-400 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <div className="mb-8 flex items-center justify-between">
              <span aria-hidden="true" className="text-3xl">
                ↙
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                Finish
              </span>
            </div>

            <h3 className="text-3xl font-bold">Check Out</h3>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              Capture your photo and record the end of your workday.
            </p>

            <div className="mt-8 font-semibold">
              Continue <span aria-hidden="true">→</span>
            </div>
          </button>
        </section>

        <footer className="mt-12 border-t border-gray-200 pt-5 text-sm text-gray-500">
          <p>Talentronaut Pvt Ltd</p>
          <p className="mt-1">Smart Attendance System</p>
        </footer>
      </div>
    </main>
  );
}
