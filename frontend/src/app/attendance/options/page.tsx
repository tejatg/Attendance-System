"use client";

import { useRouter } from "next/navigation";

export default function AttendanceOptionsPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#f3f1eb] text-[#111111]">

      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div className="absolute right-[-180px] top-[-180px] h-[520px] w-[520px] rounded-full bg-[#d8ff32]/20 blur-3xl" />

        <div className="absolute bottom-[-220px] left-[-180px] h-[500px] w-[500px] rounded-full bg-black/[0.035] blur-3xl" />

        <div className="absolute left-1/2 top-0 h-full w-px bg-black/[0.035]" />

      </div>

      <div className="relative mx-auto min-h-screen max-w-[1500px] px-5 py-5 sm:px-8 lg:px-12">

        {/* Top bar */}
        <header className="flex items-center justify-between border-b-2 border-black pb-5">

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center bg-black text-white">

              <span className="text-lg font-black">
                T
              </span>

            </div>

            <div>

              <p className="text-sm font-black tracking-[0.18em]">
                TALENTRONAUT
              </p>

              <p className="mt-1 text-[9px] font-bold tracking-[0.28em] text-black/45">
                PVT LTD
              </p>

            </div>

          </div>

          <div className="hidden items-center gap-4 sm:flex">

            <span className="text-[9px] font-bold tracking-[0.3em] text-black/40">
              WORKFORCE PLATFORM
            </span>

            <span className="h-3 w-3 rounded-full bg-[#b8e600]" />

          </div>

        </header>

        {/* Main */}
        <section className="py-10 sm:py-14 lg:py-16">

          {/* Intro */}
          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">

            <div>

              <div className="flex items-center gap-3">

                <span className="h-3 w-3 bg-[#b8e600]" />

                <span className="text-[10px] font-black tracking-[0.35em]">
                  ATTENDANCE / CONTROL
                </span>

              </div>

              <h1 className="mt-8 max-w-5xl text-[58px] font-black leading-[0.82] tracking-[-0.075em] sm:text-[90px] lg:text-[125px]">

                MAKE
                <br />

                <span className="text-black/15">
                  YOUR
                </span>

                <br />

                MOVE.

              </h1>

            </div>

            {/* Right information */}
            <div className="flex flex-col justify-end">

              <div className="border-l-2 border-black pl-5">

                <p className="text-[9px] font-black tracking-[0.3em] text-black/40">
                  SMART ATTENDANCE
                </p>

                <p className="mt-4 text-sm font-medium leading-7 text-black/60">
                  Choose how you want to begin or finish
                  your workday.
                </p>

              </div>

              <div className="mt-8 flex items-center gap-3">

                <span className="h-2 w-2 rounded-full bg-[#b8e600]" />

                <span className="text-[9px] font-black tracking-[0.25em]">
                  SYSTEM READY
                </span>

              </div>

            </div>

          </div>

          {/* Main action board */}
          <div className="mt-12 grid gap-4 lg:grid-cols-12">

            {/* Check In */}
            <button
              type="button"
              onClick={() =>
                router.push("/attendance/check-in")
              }
              className="group relative overflow-hidden border-2 border-black bg-black p-7 text-left text-white transition duration-500 hover:-translate-y-2 sm:p-10 lg:col-span-7"
            >

              {/* Large number */}
              <span className="pointer-events-none absolute right-[-15px] top-[-45px] text-[190px] font-black leading-none tracking-[-0.12em] text-white/[0.045]">
                01
              </span>

              {/* Accent block */}
              <div className="absolute bottom-0 right-0 h-28 w-28 bg-[#b8e600] transition duration-500 group-hover:h-36 group-hover:w-36" />

              <div className="relative flex min-h-[430px] flex-col justify-between">

                <div>

                  <div className="flex items-center justify-between">

                    <div className="flex h-14 w-14 items-center justify-center border border-white/20 bg-white/5">

                      <span className="text-2xl font-light">
                        ↗
                      </span>

                    </div>

                    <span className="text-[9px] font-bold tracking-[0.3em] text-white/30">
                      START
                    </span>

                  </div>

                  <div className="mt-20">

                    <p className="text-[10px] font-black tracking-[0.35em] text-[#b8e600]">
                      BEGIN WORKDAY
                    </p>

                    <h2 className="mt-4 text-5xl font-black tracking-[-0.06em] sm:text-7xl">
                      CHECK
                      <br />
                      IN
                    </h2>

                  </div>

                </div>

                <div className="flex items-end justify-between">

                  <p className="max-w-xs text-xs leading-6 text-white/45">
                    Verify your identity and record
                    the beginning of your workday.
                  </p>

                  <span className="relative z-10 flex h-14 w-14 items-center justify-center text-2xl font-black text-black transition duration-300 group-hover:rotate-45">
                    →
                  </span>

                </div>

              </div>

            </button>

            {/* Check Out */}
            <button
              type="button"
              onClick={() =>
                router.push("/attendance")
              }
              className="group relative overflow-hidden border-2 border-black bg-[#e9e6dd] p-7 text-left transition duration-500 hover:-translate-y-2 sm:p-10 lg:col-span-5"
            >

              <span className="pointer-events-none absolute right-[-10px] top-[-40px] text-[170px] font-black leading-none tracking-[-0.12em] text-black/[0.045]">
                02
              </span>

              <div className="relative flex min-h-[430px] flex-col justify-between">

                <div>

                  <div className="flex items-center justify-between">

                    <div className="flex h-14 w-14 items-center justify-center border-2 border-black bg-transparent">

                      <span className="text-2xl font-light">
                        ↙
                      </span>

                    </div>

                    <span className="text-[9px] font-bold tracking-[0.3em] text-black/30">
                      FINISH
                    </span>

                  </div>

                  <div className="mt-20">

                    <p className="text-[10px] font-black tracking-[0.35em] text-black/40">
                      END WORKDAY
                    </p>

                    <h2 className="mt-4 text-5xl font-black tracking-[-0.06em] sm:text-6xl">
                      CHECK
                      <br />
                      OUT
                    </h2>

                  </div>

                </div>

                <div className="flex items-end justify-between">

                  <p className="max-w-xs text-xs leading-6 text-black/45">
                    Complete your attendance session
                    and record your departure.
                  </p>

                  <span className="flex h-14 w-14 items-center justify-center text-2xl font-black transition duration-300 group-hover:translate-x-2">
                    →
                  </span>

                </div>

              </div>

            </button>

          </div>

          {/* Secondary operations */}
          <div className="mt-4 grid gap-4 md:grid-cols-2">

            {/* Register */}
            <button
              type="button"
              onClick={() =>
                router.push("/employees")
              }
              className="group flex min-h-[150px] items-center justify-between border-2 border-black bg-white p-6 text-left transition duration-300 hover:bg-[#b8e600] sm:p-8"
            >

              <div className="flex items-center gap-5">

                <div className="flex h-14 w-14 items-center justify-center border-2 border-black">

                  <span className="text-2xl font-light">
                    +
                  </span>

                </div>

                <div>

                  <p className="text-[9px] font-black tracking-[0.3em] text-black/40">
                    WORKFORCE
                  </p>

                  <h3 className="mt-2 text-2xl font-black tracking-[-0.04em]">
                    REGISTER EMPLOYEE
                  </h3>

                  <p className="mt-1 text-xs text-black/45">
                    Add a new employee to the platform.
                  </p>

                </div>

              </div>

              <span className="text-2xl font-black transition duration-300 group-hover:translate-x-2">
                →
              </span>

            </button>

            {/* Admin */}
            <button
              type="button"
              onClick={() =>
                router.push("/admin-login")
              }
              className="group flex min-h-[150px] items-center justify-between border-2 border-black bg-[#d8ff32] p-6 text-left transition duration-300 hover:bg-black hover:text-white sm:p-8"
            >

              <div className="flex items-center gap-5">

                <div className="flex h-14 w-14 items-center justify-center border-2 border-black bg-black text-white group-hover:border-white">

                  <span className="text-xl">
                    ◉
                  </span>

                </div>

                <div>

                  <p className="text-[9px] font-black tracking-[0.3em] opacity-50">
                    MANAGEMENT
                  </p>

                  <h3 className="mt-2 text-2xl font-black tracking-[-0.04em]">
                    ADMIN CENTER
                  </h3>

                  <p className="mt-1 text-xs opacity-50">
                    Employees • Attendance • Analytics
                  </p>

                </div>

              </div>

              <span className="text-2xl font-black transition duration-300 group-hover:translate-x-2">
                →
              </span>

            </button>

          </div>

          {/* Bottom status */}
          <div className="mt-10 grid gap-4 border-t-2 border-black pt-5 sm:grid-cols-3">

            <div>

              <p className="text-[9px] font-black tracking-[0.3em] text-black/35">
                PLATFORM
              </p>

              <p className="mt-2 text-xs font-black">
                SMART ATTENDANCE
              </p>

            </div>

            <div>

              <p className="text-[9px] font-black tracking-[0.3em] text-black/35">
                STATUS
              </p>

              <div className="mt-2 flex items-center gap-2">

                <span className="h-2 w-2 rounded-full bg-[#8db500]" />

                <p className="text-xs font-black">
                  OPERATIONAL
                </p>

              </div>

            </div>

            <div className="sm:text-right">

              <p className="text-[9px] font-black tracking-[0.3em] text-black/35">
                ORGANIZATION
              </p>

              <p className="mt-2 text-xs font-black">
                TALENTRONAUT PVT LTD
              </p>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}