"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Html5Qrcode } from "html5-qrcode";

const API_URL = "https://discovery-office-regulation-motherboard.trycloudflare.com";

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
      } catch (err) {
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
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold">
              Smart Attendance
            </h1>

            <p className="text-sm text-slate-300">
              Employee QR Scanner
            </p>
          </div>

          <Link
            href="/"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-6 py-8">
        <div className="rounded-2xl bg-white p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-slate-900">
            Scan Attendance QR
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Scan the official company attendance QR code.
          </p>

          {error && (
            <div className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-5 rounded-lg bg-green-50 p-4 text-sm text-green-700">
              {message}
            </div>
          )}

          <div className="mt-6 overflow-hidden rounded-xl border bg-slate-50">
            <div
              id="qr-reader"
              className="w-full"
            />
          </div>

          <div className="mt-6 grid gap-3">
            {!scanning ? (
              <button
                onClick={startScanner}
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Start QR Scanner
              </button>
            ) : (
              <button
                onClick={stopScanner}
                className="rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700"
              >
                Stop Scanner
              </button>
            )}
          </div>

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

          <div className="mt-6 rounded-xl bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-900">
              Next security step
            </p>

            <p className="mt-1 text-sm text-blue-800">
              After QR scanning works, we will connect the scan
              to employee verification and geofencing before
              creating the attendance record.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}