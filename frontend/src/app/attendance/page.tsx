"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function AttendancePage() {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const photoVideoRef = useRef<HTMLVideoElement | null>(null);
  const photoStreamRef = useRef<MediaStream | null>(null);

  const [step, setStep] = useState("qr");

  const [qrResult, setQrResult] = useState("");

  const [error, setError] = useState("");

  const [scannerStarted, setScannerStarted] = useState(false);

  const [photoCameraStarted, setPhotoCameraStarted] = useState(false);

  const [photoTaken, setPhotoTaken] = useState(false);

  const [photoData, setPhotoData] = useState("");

  // =========================================================
  // QR SCANNER
  // =========================================================

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.log("QR scanner already stopped.");
      }

      scannerRef.current = null;
    }

    setScannerStarted(false);
  };

  const startScanner = async () => {
    setError("");

    try {
      if (scannerRef.current) {
        return;
      }

      const scanner = new Html5Qrcode("attendance-qr-reader");

      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250,
          },
          aspectRatio: 1,
        },
        async (decodedText) => {
          console.log("QR CODE:", decodedText);

          setQrResult(decodedText);

          await stopScanner();

          setStep("verification");
        },
        () => {
          // Ignore normal QR scan failures.
        }
      );

      setScannerStarted(true);
    } catch (err) {
      console.error("QR CAMERA ERROR:", err);

      setError(
        "Unable to open QR camera. Please allow camera permission."
      );

      scannerRef.current = null;
      setScannerStarted(false);
    }
  };

  // =========================================================
  // PHOTO CAMERA
  // =========================================================

  const startPhotoCamera = async () => {
    setError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: {
            ideal: 1280,
          },
          height: {
            ideal: 720,
          },
        },
        audio: false,
      });

      photoStreamRef.current = stream;

      if (photoVideoRef.current) {
        photoVideoRef.current.srcObject = stream;

        await photoVideoRef.current.play();
      }

      setPhotoCameraStarted(true);
      setPhotoTaken(false);
    } catch (err) {
      console.error("PHOTO CAMERA ERROR:", err);

      setError(
        "Unable to open photo camera. Please allow camera permission."
      );
    }
  };

  // =========================================================
  // STOP PHOTO CAMERA
  // =========================================================

  const stopPhotoCamera = () => {
    if (photoStreamRef.current) {
      photoStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      photoStreamRef.current = null;
    }

    if (photoVideoRef.current) {
      photoVideoRef.current.srcObject = null;
    }

    setPhotoCameraStarted(false);
  };

  // =========================================================
  // TAKE PHOTO
  // =========================================================

  const takePhoto = () => {
    const video = photoVideoRef.current;

    if (!video) {
      return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setError("Unable to capture photo.");
      return;
    }

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const imageData = canvas.toDataURL(
      "image/jpeg",
      0.9
    );

    setPhotoData(imageData);

    setPhotoTaken(true);

    stopPhotoCamera();
  };

  // =========================================================
  // RETAKE PHOTO
  // =========================================================

  const retakePhoto = () => {
    setPhotoData("");
    setPhotoTaken(false);

    startPhotoCamera();
  };

  // =========================================================
  // CLEANUP
  // =========================================================

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

      if (photoStreamRef.current) {
        photoStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="min-h-screen bg-slate-100">

      {/* HEADER */}

      <header className="bg-slate-900 px-6 py-5 text-white shadow-lg">

        <div className="mx-auto max-w-5xl">

          <h1 className="text-2xl font-bold">
            Smart Attendance
          </h1>

          <p className="text-sm text-slate-300">
            Employee Attendance
          </p>

        </div>

      </header>

      {/* MAIN */}

      <div className="mx-auto max-w-2xl px-6 py-8">

        <div className="rounded-2xl bg-white p-6 shadow-lg">

          <h2 className="text-2xl font-bold text-slate-900">
            Employee Attendance
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Complete the attendance verification process.
          </p>

          {/* ERROR */}

          {error && (
            <div className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">

              <strong>Error:</strong> {error}

            </div>
          )}

          {/* ================================================= */}
          {/* STEP 1 - QR */}
          {/* ================================================= */}

          {step === "qr" && (

            <div className="mt-8">

              <div className="text-sm font-semibold text-blue-600">
                STEP 1
              </div>

              <h3 className="mt-1 text-xl font-bold">
                Scan Company QR
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Scan the official company attendance QR code.
              </p>

              <div
                id="attendance-qr-reader"
                className="mt-6 w-full overflow-hidden rounded-xl border bg-black"
              />

              {!scannerStarted && (

                <button
                  onClick={startScanner}
                  className="mt-5 w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                >
                  Start QR Scanner
                </button>

              )}

              {scannerStarted && (

                <button
                  onClick={stopScanner}
                  className="mt-5 w-full rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"
                >
                  Stop Scanner
                </button>

              )}

            </div>

          )}

          {/* ================================================= */}
          {/* STEP 2 - QR VERIFIED */}
          {/* ================================================= */}

          {step === "verification" && (

            <div className="mt-8">

              <div className="rounded-xl bg-green-50 p-5">

                <div className="text-sm font-semibold text-green-600">
                  STEP 2
                </div>

                <h3 className="mt-1 text-xl font-bold text-green-800">
                  QR Code Verified
                </h3>

                <p className="mt-3 text-sm text-green-700">
                  QR code detected successfully.
                </p>

                <div className="mt-4 rounded-lg bg-white p-4">

                  <p className="text-xs font-semibold text-slate-500">
                    QR RESULT
                  </p>

                  <p className="mt-2 break-all text-sm text-slate-700">
                    {qrResult}
                  </p>

                </div>

              </div>

              <button
                onClick={() => setStep("photo")}
                className="mt-6 w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Continue to Photo
              </button>

            </div>

          )}

          {/* ================================================= */}
          {/* STEP 3 - PHOTO */}
          {/* ================================================= */}

          {step === "photo" && (

            <div className="mt-8">

              <div className="text-sm font-semibold text-blue-600">
                STEP 3
              </div>

              <h3 className="mt-1 text-xl font-bold">
                Take Employee Photo
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Capture a photo of the employee.
              </p>

              {/* CAMERA */}

              {!photoTaken && (

                <div className="mt-6">

                  <div className="overflow-hidden rounded-xl bg-black">

                    <video
                      ref={photoVideoRef}
                      className="h-auto w-full"
                      autoPlay
                      playsInline
                      muted
                    />

                  </div>

                  {!photoCameraStarted && (

                    <button
                      onClick={startPhotoCamera}
                      className="mt-5 w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                    >
                      Open Camera
                    </button>

                  )}

                  {photoCameraStarted && (

                    <button
                      onClick={takePhoto}
                      className="mt-5 w-full rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
                    >
                      📷 Take Photo
                    </button>

                  )}

                </div>

              )}

              {/* PHOTO PREVIEW */}

              {photoTaken && photoData && (

                <div className="mt-6">

                  <p className="mb-3 text-sm font-semibold text-slate-700">
                    Photo Preview
                  </p>

                  <img
                    src={photoData}
                    alt="Employee captured"
                    className="w-full rounded-xl border"
                  />

                  <div className="mt-5 grid gap-3">

                    <button
                      onClick={retakePhoto}
                      className="w-full rounded-lg bg-slate-600 px-5 py-3 font-semibold text-white"
                    >
                      Retake Photo
                    </button>

                    <button
                      onClick={() => setStep("biometric")}
                      className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white"
                    >
                      Continue to Biometric
                    </button>

                  </div>

                </div>

              )}

            </div>

          )}

          {/* ================================================= */}
          {/* STEP 4 - BIOMETRIC */}
          {/* ================================================= */}

          {step === "biometric" && (

            <div className="mt-8">

              <div className="text-sm font-semibold text-blue-600">
                STEP 4
              </div>

              <h3 className="mt-1 text-xl font-bold">
                Biometric Verification
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Verify the employee using device biometric authentication.
              </p>

              <div className="mt-6 rounded-xl bg-slate-50 p-8 text-center">

                <div className="text-5xl">
                  👆
                </div>

                <p className="mt-4 font-semibold">
                  Fingerprint / Device Biometric
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  WebAuthn verification will be connected next.
                </p>

              </div>

              <button
                onClick={() => setStep("location")}
                className="mt-6 w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white"
              >
                Verify Biometric
              </button>

            </div>

          )}

          {/* ================================================= */}
          {/* STEP 5 - LOCATION */}
          {/* ================================================= */}

          {step === "location" && (

            <div className="mt-8">

              <div className="text-sm font-semibold text-blue-600">
                STEP 5
              </div>

              <h3 className="mt-1 text-xl font-bold">
                Location Verification
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Your location will be checked against the company
                attendance geofence.
              </p>

              <button
                onClick={() => setStep("employee")}
                className="mt-6 w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white"
              >
                Get My Location
              </button>

            </div>

          )}

          {/* ================================================= */}
          {/* STEP 6 - EMPLOYEE */}
          {/* ================================================= */}

          {step === "employee" && (

            <div className="mt-8">

              <div className="text-sm font-semibold text-blue-600">
                STEP 6
              </div>

              <h3 className="mt-1 text-xl font-bold">
                Employee Details
              </h3>

              <div className="mt-6 space-y-5">

                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Employee ID
                  </label>

                  <input
                    type="text"
                    placeholder="Enter Employee ID"
                    className="w-full rounded-lg border px-4 py-3"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Employee Name
                  </label>

                  <input
                    type="text"
                    placeholder="Enter Employee Name"
                    className="w-full rounded-lg border px-4 py-3"
                  />

                </div>

                <button
                  onClick={() => setStep("checkin")}
                  className="w-full rounded-lg bg-green-600 px-5 py-3 font-semibold text-white"
                >
                  CHECK IN
                </button>

              </div>

            </div>

          )}

          {/* ================================================= */}
          {/* STEP 7 - CHECK IN */}
          {/* ================================================= */}

          {step === "checkin" && (

            <div className="mt-8">

              <div className="rounded-xl bg-green-50 p-6">

                <div className="text-sm font-semibold text-green-600">
                  STEP 7
                </div>

                <h3 className="mt-1 text-xl font-bold text-green-800">
                  Ready for Check-In
                </h3>

                <p className="mt-2 text-sm text-green-700">
                  Verification process completed.
                </p>

              </div>

              <button
                onClick={() => setStep("checkout")}
                className="mt-6 w-full rounded-lg bg-green-600 px-5 py-3 font-semibold text-white"
              >
                CONFIRM CHECK IN
              </button>

            </div>

          )}

          {/* ================================================= */}
          {/* STEP 8 - CHECK OUT */}
          {/* ================================================= */}

          {step === "checkout" && (

            <div className="mt-8">

              <div className="rounded-xl bg-green-50 p-6">

                <h3 className="text-xl font-bold text-green-800">
                  Check-In Successful
                </h3>

                <p className="mt-2 text-green-700">
                  Employee is currently checked in.
                </p>

              </div>

              <button
                onClick={() => setStep("completed")}
                className="mt-6 w-full rounded-lg bg-red-600 px-5 py-3 font-semibold text-white"
              >
                CHECK OUT
              </button>

            </div>

          )}

          {/* ================================================= */}
          {/* STEP 9 - COMPLETE */}
          {/* ================================================= */}

          {step === "completed" && (

            <div className="mt-8 rounded-xl bg-green-50 p-6 text-center">

              <div className="text-5xl">
                ✅
              </div>

              <h3 className="mt-4 text-2xl font-bold text-green-800">
                Attendance Completed
              </h3>

              <p className="mt-2 text-green-700">
                Check-in and check-out completed.
              </p>

            </div>

          )}

        </div>

      </div>

    </main>
  );
}