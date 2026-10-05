"use client";

import { useRouter } from "next/navigation";

export default function AttendanceOptionsPage() {
  const router = useRouter();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020b1c] text-white">

      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -right-40 top-10 h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-[-180px] left-1/3 h-[500px] w-[600px] rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      {/* Futuristic grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,180,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(0,180,255,0.16) 1px, transparent 1px)",
          backgroundSize: "45px 45px",
          maskImage:
            "linear-gradient(to bottom, black, transparent 95%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black, transparent 95%)",
        }}
      />

      {/* Decorative circles */}
      <div className="pointer-events-none absolute -left-48 top-1/3 h-[550px] w-[550px] rounded-full border border-cyan-400/10" />
      <div className="pointer-events-none absolute -right-48 top-1/4 h-[600px] w-[600px] rounded-full border border-blue-400/10" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-12">

        {/* Header */}
        <header className="flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="relative flex h-12 w-12 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-md" />

              <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/60 bg-[#071a35] shadow-[0_0_25px_rgba(0,190,255,0.2)]">
                <span className="text-2xl">🚀</span>
              </div>
            </div>

            <div>
              <h1 className="text-lg font-extrabold tracking-[0.12em] sm:text-2xl">
                TALENTRONAUT
              </h1>

              <p className="text-[10px] font-medium tracking-[0.38em] text-blue-200 sm:text-xs">
                PVT LTD
              </p>
            </div>

          </div>

          {/* System status */}
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/5 px-4 py-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>

            <span className="text-[10px] font-bold tracking-[0.18em] text-emerald-300 sm:text-xs">
              SYSTEM ONLINE
            </span>
          </div>

        </header>

        {/* Main */}
        <section className="flex flex-1 flex-col items-center justify-center py-10">

          {/* Section label */}
          <div className="mb-5 flex items-center gap-4">

            <div className="h-px w-10 bg-cyan-400 sm:w-20" />

            <p className="text-xs font-semibold tracking-[0.35em] text-cyan-200 sm:text-sm">
              SMART ATTENDANCE
            </p>

            <div className="h-px w-10 bg-cyan-400 sm:w-20" />

          </div>

          {/* Main heading */}
          <h2 className="text-center text-4xl font-black tracking-tight sm:text-6xl">
            ATTENDANCE
            <br />

            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-300 bg-clip-text text-transparent">
              CONTROL CENTER
            </span>
          </h2>

          <p className="mt-5 max-w-xl text-center text-sm leading-6 text-blue-200 sm:text-base">
            Select an operation below to securely manage your
            attendance and employee services.
          </p>

          {/* Options */}
          <div className="mt-10 grid w-full max-w-4xl gap-5 sm:grid-cols-2">

            {/* CHECK IN */}
            <button
              type="button"
              onClick={() => router.push("/attendance/check-in")}
              className="group relative overflow-hidden rounded-3xl border border-cyan-400/40 bg-[#06172f]/90 p-6 text-left shadow-[0_0_30px_rgba(0,190,255,0.08)] transition duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-[0_0_40px_rgba(0,190,255,0.22)]"
            >
              <div className="absolute right-[-35px] top-[-35px] h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl transition group-hover:bg-cyan-400/20" />

              <div className="relative">

                <div className="mb-6 flex items-center justify-between">

                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/50 bg-cyan-400/10 text-3xl">
                    🟢
                  </div>

                  <span className="text-2xl text-cyan-300 transition group-hover:translate-x-1">
                    →
                  </span>

                </div>

                <p className="text-xs font-bold tracking-[0.25em] text-cyan-300">
                  ATTENDANCE
                </p>

                <h3 className="mt-2 text-2xl font-black tracking-wide">
                  CHECK IN
                </h3>

                <p className="mt-3 text-sm leading-6 text-blue-200">
                  Start your workday and record your attendance securely.
                </p>

                <div className="mt-6 h-px bg-gradient-to-r from-cyan-400/50 to-transparent" />

                <p className="mt-4 text-xs font-semibold tracking-[0.2em] text-cyan-200">
                  START SESSION
                </p>

              </div>
            </button>

            {/* CHECK OUT */}
            <button
              type="button"
              onClick={() => router.push("/attendance")}
              className="group relative overflow-hidden rounded-3xl border border-blue-400/40 bg-[#06172f]/90 p-6 text-left shadow-[0_0_30px_rgba(0,130,255,0.08)] transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_0_40px_rgba(0,130,255,0.22)]"
            >
              <div className="absolute right-[-35px] top-[-35px] h-32 w-32 rounded-full bg-blue-400/10 blur-2xl transition group-hover:bg-blue-400/20" />

              <div className="relative">

                <div className="mb-6 flex items-center justify-between">

                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-400/50 bg-blue-400/10 text-3xl">
                    🔵
                  </div>

                  <span className="text-2xl text-blue-300 transition group-hover:translate-x-1">
                    →
                  </span>

                </div>

                <p className="text-xs font-bold tracking-[0.25em] text-blue-300">
                  ATTENDANCE
                </p>

                <h3 className="mt-2 text-2xl font-black tracking-wide">
                  CHECK OUT
                </h3>

                <p className="mt-3 text-sm leading-6 text-blue-200">
                  Complete your workday and securely record your exit time.
                </p>

                <div className="mt-6 h-px bg-gradient-to-r from-blue-400/50 to-transparent" />

                <p className="mt-4 text-xs font-semibold tracking-[0.2em] text-blue-200">
                  END SESSION
                </p>

              </div>
            </button>

            {/* REGISTER */}
            <button
              type="button"
              onClick={() => router.push("/employees")}
              className="group relative overflow-hidden rounded-3xl border border-purple-400/30 bg-[#06172f]/90 p-6 text-left shadow-[0_0_30px_rgba(150,80,255,0.06)] transition duration-300 hover:-translate-y-1 hover:border-purple-300/70 hover:shadow-[0_0_40px_rgba(150,80,255,0.18)]"
            >
              <div className="absolute right-[-35px] top-[-35px] h-32 w-32 rounded-full bg-purple-400/10 blur-2xl transition group-hover:bg-purple-400/20" />

              <div className="relative">

                <div className="mb-6 flex items-center justify-between">

                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-400/40 bg-purple-400/10 text-3xl">
                    👤
                  </div>

                  <span className="text-2xl text-purple-300 transition group-hover:translate-x-1">
                    →
                  </span>

                </div>

                <p className="text-xs font-bold tracking-[0.25em] text-purple-300">
                  EMPLOYEE SERVICES
                </p>

                <h3 className="mt-2 text-2xl font-black tracking-wide">
                  REGISTER
                </h3>

                <p className="mt-3 text-sm leading-6 text-blue-200">
                  Register a new employee with secure identity information.
                </p>

                <div className="mt-6 h-px bg-gradient-to-r from-purple-400/50 to-transparent" />

                <p className="mt-4 text-xs font-semibold tracking-[0.2em] text-purple-200">
                  NEW EMPLOYEE
                </p>

              </div>
            </button>

            {/* ADMIN */}
            <button
              type="button"
              onClick={() => router.push("/admin-login")}
              className="group relative overflow-hidden rounded-3xl border border-amber-400/30 bg-[#06172f]/90 p-6 text-left shadow-[0_0_30px_rgba(255,180,0,0.05)] transition duration-300 hover:-translate-y-1 hover:border-amber-300/70 hover:shadow-[0_0_40px_rgba(255,180,0,0.16)]"
            >
              <div className="absolute right-[-35px] top-[-35px] h-32 w-32 rounded-full bg-amber-400/10 blur-2xl transition group-hover:bg-amber-400/20" />

              <div className="relative">

                <div className="mb-6 flex items-center justify-between">

                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-400/10 text-3xl">
                    🛡️
                  </div>

                  <span className="text-2xl text-amber-300 transition group-hover:translate-x-1">
                    →
                  </span>

                </div>

                <p className="text-xs font-bold tracking-[0.25em] text-amber-300">
                  MANAGEMENT
                </p>

                <h3 className="mt-2 text-2xl font-black tracking-wide">
                  ADMIN CENTER
                </h3>

                <p className="mt-3 text-sm leading-6 text-blue-200">
                  Access employee records and attendance analytics.
                </p>

                <div className="mt-6 h-px bg-gradient-to-r from-amber-400/50 to-transparent" />

                <p className="mt-4 text-xs font-semibold tracking-[0.2em] text-amber-200">
                  ADMIN ACCESS
                </p>

              </div>
            </button>

          </div>

          {/* Bottom system indicator */}
          <div className="mt-10 flex w-full max-w-4xl items-center gap-4">

            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-400/50" />

            <div className="flex items-center gap-3">

              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
              </span>

              <span className="text-[10px] font-bold tracking-[0.25em] text-emerald-300 sm:text-xs">
                SECURE SYSTEM READY
              </span>

            </div>

            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-400/50" />

          </div>

        </section>

        {/* Footer */}
        <footer className="border-t border-blue-400/10 py-5 text-center">

          <p className="text-[10px] font-semibold tracking-[0.3em] text-blue-300 sm:text-xs">
            TALENTRONAUT PVT LTD • SMART ATTENDANCE PLATFORM
          </p>

        </footer>

      </div>
    </main>
  );
}