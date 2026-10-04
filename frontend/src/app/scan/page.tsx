"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Html5Qrcode } from "html5-qrcode";

const ATTENDANCE_URL =
  "https://attendance-system-omega-beryl-95.vercel.app/attendance/check-in";

export default function ScanPage() {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch {
        console.log("Scanner already stopped.");
      }

      scannerRef.current = null;
    }

    setScanning(false);
  };

  const startScanner = async () => {
    setError("");
    setMessage("");
    setResult("");

    try {
      const scanner = new Html5Qrcode("qr-reader");

      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250,
          },
        },
        async (decodedText) => {
          setResult(decodedText);
          setMessage("QR code detected.");

          await stopScanner();

          if (
            decodedText === ATTENDANCE_URL ||
            decodedText.includes("/attendance/check-in")
          ) {
            setMessage(
              "Official attendance QR detected. Opening attendance page..."
            );

            window.location.href = decodedText;
          } else {
            setError(
              "This QR code is not the official TALENTRONAUT attendance QR code."
            );
          }
        },
        () => {
          // Ignore continuous QR scanning errors.
        }
      );

      setScanning(true);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to access the camera. Please allow camera permission and try again."
      );
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current = null;
          });
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-100">

      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">

          <div>
            <h1 className="text-2xl font-bold">
              TALENTRONAUT PVT LTD
            </h1>

            <p className="text-sm text-slate-300">
              Smart Employee Attendance Management System
            </p>
          </div>

          <Link
            href="/"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Dashboard
          </Link>

        </div>
      </header>

      {/* Scanner */}
      <div className="mx-auto max-w-xl px-6 py-8">

        <div className="rounded-2xl bg-white p-6 shadow-lg">

          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900">
              Employee QR Scanner
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Scan the official TALENTRONAUT attendance QR code
              to start employee attendance.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Success */}
          {message && (
            <div className="mt-5 rounded-lg bg-green-50 p-4 text-sm text-green-700">
              {message}
            </div>
          )}

          {/* QR Reader */}
          <div className="mt-6 overflow-hidden rounded-xl border bg-slate-50">
            <div
              id="qr-reader"
              className="w-full"
            />
          </div>

          {/* Scanner Controls */}
          <div className="mt-6 grid gap-3">

            {!scanning ? (
              <button
                onClick={startScanner}
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Start QR Scanner
              </button>
            ) : (
              <button
                onClick={stopScanner}
                className="rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
              >
                Stop Scanner
              </button>
            )}

          </div>

          {/* QR Result */}
          {result && (
            <div className="mt-6 rounded-xl bg-slate-50 p-5">

              <p className="text-sm font-semibold text-slate-700">
                QR Result
              </p>

              <p className="mt-2 break-all text-sm text-slate-600">
                {result}
              </p>

            </div>
          )}

          {/* Production Flow */}
          <div className="mt-6 rounded-xl bg-blue-50 p-5">

            <p className="text-sm font-semibold text-blue-900">
              Attendance Flow
            </p>

            <div className="mt-3 space-y-2 text-sm text-blue-800">
              <p>1. Start the QR scanner.</p>
              <p>2. Scan the company attendance QR code.</p>
              <p>3. Attendance page opens automatically.</p>
              <p>4. Employee completes verification.</p>
              <p>5. Attendance is submitted to the production backend.</p>
            </div>

          </div>

        </div>

      </div>
    </main>
  );
}