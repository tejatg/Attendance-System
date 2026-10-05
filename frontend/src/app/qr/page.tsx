"use client";

import { QRCodeCanvas } from "qrcode.react";

const ATTENDANCE_URL =
  "https://attendance-system-omega-beryl-95.vercel.app/attendance/options";

export default function QRPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020b1c] text-white">

      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-40 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -right-40 top-20 h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[500px] rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,180,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(0,180,255,0.18) 1px, transparent 1px)",
          backgroundSize: "45px 45px",
          maskImage:
            "linear-gradient(to top, black, transparent 85%)",
          WebkitMaskImage:
            "linear-gradient(to top, black, transparent 85%)",
        }}
      />

      {/* Decorative curves */}
      <div className="pointer-events-none absolute -left-32 top-52 h-[500px] w-[500px] rounded-full border border-blue-500/20" />
      <div className="pointer-events-none absolute -right-32 top-36 h-[550px] w-[550px] rounded-full border border-blue-500/20" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-12">

        {/* Header */}
        <header className="flex items-center justify-between">

          <div className="flex items-center gap-3">

            {/* Company Logo Mark */}
            <div className="relative flex h-12 w-12 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-md" />

              <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/60 bg-[#071a35]">
                <span className="text-2xl">🚀</span>
              </div>
            </div>

            <div>
              <h1 className="text-lg font-extrabold tracking-[0.12em] text-white sm:text-2xl">
                TALENTRONAUT
              </h1>

              <p className="text-[10px] font-medium tracking-[0.38em] text-blue-200 sm:text-xs">
                PVT LTD
              </p>
            </div>
          </div>

          {/* Live Badge */}
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-400/5 px-4 py-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
            </span>

            <span className="text-xs font-bold tracking-[0.18em] text-emerald-300">
              LIVE
            </span>
          </div>

        </header>

        {/* Main content */}
        <section className="flex flex-1 flex-col items-center justify-center py-8 text-center">

          {/* Smart Attendance */}
          <div className="mb-5 flex items-center gap-4">

            <div className="h-px w-10 bg-cyan-400 sm:w-20" />

            <p className="text-sm font-medium tracking-[0.35em] text-blue-100 sm:text-lg">
              SMART ATTENDANCE
            </p>

            <div className="h-px w-10 bg-cyan-400 sm:w-20" />

          </div>

          {/* Main heading */}
          <h2 className="max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            YOUR WORKDAY.
            <br />

            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-300 bg-clip-text text-transparent">
              SIMPLIFIED.
            </span>
          </h2>

          {/* QR Container */}
          <div className="relative mt-9">

            {/* Outer glow */}
            <div className="absolute -inset-5 rounded-[35px] bg-cyan-400/20 blur-2xl" />

            {/* QR frame */}
            <div className="relative rounded-[30px] border border-cyan-300/80 bg-[#06172f]/90 p-5 shadow-[0_0_50px_rgba(0,190,255,0.25)] sm:p-7">

              {/* Corner brackets */}
              <div className="pointer-events-none absolute left-5 top-5 h-8 w-8 border-l-4 border-t-4 border-cyan-300 rounded-tl-lg" />
              <div className="pointer-events-none absolute right-5 top-5 h-8 w-8 border-r-4 border-t-4 border-cyan-300 rounded-tr-lg" />
              <div className="pointer-events-none absolute bottom-5 left-5 h-8 w-8 border-b-4 border-l-4 border-cyan-300 rounded-bl-lg" />
              <div className="pointer-events-none absolute bottom-5 right-5 h-8 w-8 border-b-4 border-r-4 border-cyan-300 rounded-br-lg" />

              {/* QR */}
              <div className="rounded-2xl bg-white p-4 sm:p-5">

                <QRCodeCanvas
                  value={ATTENDANCE_URL}
                  size={260}
                  level="H"
                  includeMargin
                  bgColor="#ffffff"
                  fgColor="#050505"
                />

              </div>

            </div>
          </div>

          {/* Scan text */}
          <div className="mt-8">

            <h3 className="text-2xl font-black tracking-[0.18em] text-white sm:text-3xl">
              SCAN TO START
            </h3>

            <p className="mt-2 text-sm text-blue-200 sm:text-base">
              Touchless attendance • Secure • Fast
            </p>

          </div>

          {/* Feature icons */}
          <div className="mt-8 grid w-full max-w-xl grid-cols-3">

            {/* Attendance */}
            <div className="flex flex-col items-center px-3">

              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-blue-400/70 bg-blue-500/10 text-2xl">
                👤
              </div>

              <p className="mt-3 text-sm font-semibold text-blue-100 sm:text-base">
                Attendance
              </p>

            </div>

            {/* Secure */}
            <div className="flex flex-col items-center border-x border-blue-400/30 px-3">

              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-cyan-400/70 bg-cyan-500/10 text-2xl">
                🛡️
              </div>

              <p className="mt-3 text-sm font-semibold text-blue-100 sm:text-base">
                Secure
              </p>

            </div>

            {/* Fast */}
            <div className="flex flex-col items-center px-3">

              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-cyan-300/70 bg-cyan-500/10 text-2xl">
                ⚡
              </div>

              <p className="mt-3 text-sm font-semibold text-blue-100 sm:text-base">
                Fast
              </p>

            </div>

          </div>

          {/* Touchless attendance */}
          <div className="mt-9 flex w-full max-w-xl items-center gap-4">

            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-400" />

            <div className="flex flex-col items-center">

              <div className="text-3xl">
                🖐️
              </div>

              <p className="mt-2 text-[10px] font-medium tracking-[0.32em] text-blue-200 sm:text-xs">
                TOUCHLESS ATTENDANCE SYSTEM
              </p>

            </div>

            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-400" />

          </div>

        </section>

        {/* Footer */}
        <footer className="rounded-2xl border border-blue-400/20 bg-[#06172f]/80 px-5 py-4 backdrop-blur-md sm:px-8">

          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">

            <div className="flex items-center gap-3">

              <span className="relative flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.8)]" />
              </span>

              <span className="text-sm font-bold tracking-[0.2em] text-emerald-300">
                SYSTEM ONLINE
              </span>

            </div>

            <div className="hidden h-6 w-px bg-blue-400/30 sm:block" />

            <p className="text-xs font-semibold tracking-[0.15em] text-blue-100 sm:text-sm">
              TALENTRONAUT PVT LTD
            </p>

          </div>

        </footer>

      </div>
    </main>
  );
}