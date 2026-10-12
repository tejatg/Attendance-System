"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Html5Qrcode } from "html5-qrcode";

const OFFICIAL_ORIGIN =
  "https://attendance-system-omega-beryl-95.vercel.app";

const ATTENDANCE_PATH = "/attendance/check-in";
const SCANNER_ID = "qr-reader";

export default function ScanPage() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);
  const mountedRef = useRef(false);

  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;

    if (!scanner) {
      if (mountedRef.current) setScanning(false);
      return;
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch (err) {
      console.warn("Unable to stop scanner:", err);
    }

    try {
      await scanner.clear();
    } catch (err) {
      console.warn("Unable to clear scanner:", err);
    }

    if (scannerRef.current === scanner) {
      scannerRef.current = null;
    }

    if (mountedRef.current) {
      setScanning(false);
    }
  }, []);

  const startScanner = async () => {
    if (scannerRef.current || processingRef.current) return;

    setError("");
    setMessage("");
    setResult("");

    try {
      const element = document.getElementById(SCANNER_ID);

      if (!element) {
        throw new Error("Scanner element was not found.");
      }

      if (!window.isSecureContext) {
        throw new Error(
          "Camera access requires HTTPS or localhost. Open the deployed HTTPS website."
        );
      }

      processingRef.current = false;

      const scanner = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        async (decodedText) => {
          if (processingRef.current) return;
          processingRef.current = true;

          setResult(decodedText);
          setError("");
          setMessage("QR code detected. Validating...");

          await stopScanner();

          try {
            const scannedUrl = new URL(decodedText);

            const isOfficialQr =
              scannedUrl.origin === OFFICIAL_ORIGIN &&
              scannedUrl.pathname === ATTENDANCE_PATH &&
              scannedUrl.username === "" &&
              scannedUrl.password === "";

            if (!isOfficialQr) {
              setMessage("");
              setError(
                "Invalid QR code. Please scan the official company attendance QR code."
              );
              processingRef.current = false;
              return;
            }

            setMessage("Official QR verified. Opening attendance page...");

            window.location.assign(scannedUrl.href);
          } catch {
            setMessage("");
            setError(
              "Invalid QR code. Please scan a valid company attendance URL."
            );
            processingRef.current = false;
          }
        },
        () => {
          // Ignore repeated errors while the camera searches for a QR code.
        }
      );

      if (mountedRef.current) {
        setScanning(true);
      } else {
        try {
          await scanner.stop();
          await scanner.clear();
        } catch {
          // Scanner may already have stopped.
        }

        if (scannerRef.current === scanner) {
          scannerRef.current = null;
        }
      }
    } catch (err) {
      console.error("QR scanner error:", err);

      const scanner = scannerRef.current;

      if (scanner) {
        try {
          if (scanner.isScanning) await scanner.stop();
        } catch {
          // Ignore cleanup errors.
        }

        try {
          await scanner.clear();
        } catch {
          // Ignore cleanup errors.
        }

        if (scannerRef.current === scanner) {
          scannerRef.current = null;
        }
      }

      setScanning(false);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to access the camera. Allow camera permission and try again."
      );
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      const scanner = scannerRef.current;
      scannerRef.current = null;

      if (scanner) {
        void (async () => {
          try {
            if (scanner.isScanning) await scanner.stop();
          } catch {
            // Ignore cleanup errors.
          }

          try {
            await scanner.clear();
          } catch {
            // Ignore cleanup errors.
          }
        })();
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-5">
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
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl bg-white p-5 shadow-lg sm:p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold">
              Employee QR Scanner
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Scan the official company QR code to open attendance.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {message && (
            <div
              role="status"
              aria-live="polite"
              className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
            >
              {message}
            </div>
          )}

          <div className="mt-6 min-h-64 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <div id={SCANNER_ID} className="w-full" />
          </div>

          <div className="mt-6 grid gap-3">
            {!scanning ? (
              <button
                type="button"
                onClick={startScanner}
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Start QR Scanner
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void stopScanner()}
                className="rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Stop Scanner
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setError("");
                setMessage("");
                setResult("");
                processingRef.current = false;
              }}
              className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Clear Result
            </button>
          </div>

          {result && (
            <div className="mt-6 rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">
                Scanned QR Result
              </p>
              <p className="mt-2 break-all text-sm text-slate-600">
                {result}
              </p>
            </div>
          )}

          <div className="mt-6 rounded-xl bg-blue-50 p-5">
            <p className="font-semibold text-blue-900">
              Attendance Flow
            </p>
            <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-blue-800">
              <li>Start the scanner and allow camera access.</li>
              <li>Scan the official company attendance QR code.</li>
              <li>The attendance page opens after URL validation.</li>
              <li>Complete the verification requested by the page.</li>
              <li>Check that the backend confirms the attendance action.</li>
            </ol>
          </div>

          <p className="mt-5 text-center text-xs text-slate-500">
            Use the deployed HTTPS website or localhost when testing
            camera access.
          </p>
        </div>
      </section>
    </main>
  );
}
