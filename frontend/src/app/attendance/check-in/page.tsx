"use client";

import { useEffect, useRef, useState } from "react";

const API_URL = "https://discovery-office-regulation-motherboard.trycloudflare.com";

export default function CheckInPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [employeeId, setEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [department, setDepartment] = useState("");
  const [email, setEmail] = useState("");

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] =
    useState<MediaStream | null>(null);

  const [photoCaptured, setPhotoCaptured] =
    useState(false);
  const [photoPreview, setPhotoPreview] =
    useState("");

  const [biometricVerified, setBiometricVerified] =
    useState(false);

  const [latitude, setLatitude] =
    useState<number | null>(null);
  const [longitude, setLongitude] =
    useState<number | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --------------------------------
  // STOP CAMERA
  // --------------------------------

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => {
        track.stop();
      });
    }

    setCameraStream(null);
    setCameraOpen(false);
  };

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, [cameraStream]);

  // --------------------------------
  // OPEN CAMERA
  // --------------------------------

  const openCamera = async () => {
    setError("");
    setMessage("");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          "Camera is not supported by this browser."
        );
        return;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

      setCameraStream(stream);
      setCameraOpen(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          videoRef.current
            .play()
            .catch((err) =>
              console.error(
                "Video play error:",
                err
              )
            );
        }
      }, 100);
    } catch (err) {
      console.error("Camera error:", err);

      setError(
        "Unable to open camera. Please allow camera permission."
      );
    }
  };

  // --------------------------------
  // CAPTURE PHOTO
  // --------------------------------

  const capturePhoto = () => {
    setError("");
    setMessage("");

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      setError("Camera is not ready.");
      return;
    }

    if (
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      setError(
        "Camera is not ready. Please wait a moment."
      );
      return;
    }

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

    const image =
      canvas.toDataURL("image/jpeg", 0.9);

    setPhotoPreview(image);
    setPhotoCaptured(true);

    stopCamera();

    setMessage(
      "✓ Employee photo captured successfully."
    );
  };

  // --------------------------------
  // RETAKE PHOTO
  // --------------------------------

  const retakePhoto = () => {
    setPhotoPreview("");
    setPhotoCaptured(false);
    setError("");
    setMessage("");

    openCamera();
  };

  // --------------------------------
  // REGISTER FINGERPRINT / BIOMETRIC
  // --------------------------------

  const registerBiometric = async () => {
    setError("");
    setMessage("");

    if (!employeeId.trim()) {
      setError(
        "Please enter Employee ID before registering biometric."
      );
      return;
    }

    if (!employeeName.trim()) {
      setError(
        "Please enter Employee Name before registering biometric."
      );
      return;
    }

    if (!email.trim()) {
      setError(
        "Please enter Email before registering biometric."
      );
      return;
    }

    try {
      if (
        typeof window === "undefined" ||
        !window.PublicKeyCredential
      ) {
        setError(
          "WebAuthn biometric authentication is not supported by this browser."
        );
        return;
      }

      if (!window.isSecureContext) {
        setError(
          "Biometric registration requires a secure HTTPS connection."
        );
        return;
      }

      setMessage(
        "Please use your fingerprint, Windows Hello, PIN, or device biometric when prompted."
      );

      const challenge =
        crypto.getRandomValues(
          new Uint8Array(32)
        );

      const userId =
        crypto.getRandomValues(
          new Uint8Array(16)
        );

      const credential =
        await navigator.credentials.create({
          publicKey: {
            challenge,

            rp: {
              name: "Smart Attendance System",
            },

            user: {
              id: userId,
              name: email.trim(),
              displayName:
                employeeName.trim(),
            },

            pubKeyCredParams: [
              {
                type: "public-key",
                alg: -7,
              },
              {
                type: "public-key",
                alg: -257,
              },
            ],

            authenticatorSelection: {
              authenticatorAttachment:
                "platform",
              residentKey: "preferred",
              userVerification:
                "required",
            },

            timeout: 60000,

            attestation: "none",
          },
        });

      if (!credential) {
        setError(
          "Biometric registration was cancelled."
        );
        return;
      }

      setBiometricVerified(true);

      setMessage(
        "✓ Fingerprint / Biometric registered successfully."
      );
    } catch (err) {
      console.error(
        "Biometric registration error:",
        err
      );

      setBiometricVerified(false);

      setError(
        "Fingerprint / biometric registration was cancelled or failed."
      );
    }
  };

  // --------------------------------
  // GET LOCATION
  // --------------------------------

  const getLocation = () => {
    setError("");
    setMessage("");

    if (!navigator.geolocation) {
      setError(
        "GPS is not supported by this browser."
      );
      return;
    }

    setMessage(
      "Requesting location permission..."
    );

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(
          position.coords.latitude
        );

        setLongitude(
          position.coords.longitude
        );

        setMessage(
          "✓ Location captured successfully."
        );
      },

      (err) => {
        console.error(
          "Location error:",
          err
        );

        setError(
          "Unable to get location. Please allow location permission."
        );
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // --------------------------------
  // CHECK REQUIRED FIELDS
  // --------------------------------

  const validateForm = () => {
    if (!employeeId.trim()) {
      setError(
        "Employee ID is required."
      );
      return false;
    }

    if (!employeeName.trim()) {
      setError(
        "Employee Name is required."
      );
      return false;
    }

    if (!department.trim()) {
      setError(
        "Department is required."
      );
      return false;
    }

    if (!email.trim()) {
      setError(
        "Email is required."
      );
      return false;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.trim())) {
      setError(
        "Please enter a valid email address."
      );
      return false;
    }

    if (!photoCaptured) {
      setError(
        "Employee photo is compulsory."
      );
      return false;
    }

    if (!biometricVerified) {
      setError(
        "Fingerprint / biometric registration is compulsory."
      );
      return false;
    }

    if (
      latitude === null ||
      longitude === null
    ) {
      setError(
        "Employee location is compulsory."
      );
      return false;
    }

    return true;
  };

  // --------------------------------
  // REGISTER AND CHECK-IN
  // --------------------------------

  const markAttendance = async () => {
    setError("");
    setMessage("");

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/attendance`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            employeeId:
              employeeId.trim(),

            employeeName:
              employeeName.trim(),

            department:
              department.trim(),

            email:
              email.trim(),

            latitude,
            longitude,

            status: "Present",

            photoCaptured: true,

            biometricVerified: true,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Registration / Check-In failed."
        );
        return;
      }

      setMessage(
        "✓ Employee registered and CHECK-IN completed successfully."
      );
    } catch (err) {
      console.error(
        "Attendance error:",
        err
      );

      setError(
        "Unable to connect to the attendance server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-6">

      <div className="mx-auto max-w-lg rounded-2xl bg-white p-6 shadow-xl">

        {/* HEADER */}

        <div className="text-center">

          <h1 className="text-2xl font-bold text-slate-900">
            Smart Attendance System
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Employee Registration & Check-In
          </p>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-5 rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700">
            ❌ {error}
          </div>
        )}

        {/* SUCCESS */}

        {message && (
          <div className="mt-5 rounded-lg bg-green-50 p-4 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {/* -------------------------------- */}
        {/* EMPLOYEE INFORMATION */}
        {/* -------------------------------- */}

        <section className="mt-6">

          <h2 className="text-lg font-semibold text-slate-900">
            1. Employee Information *
          </h2>

          {/* EMPLOYEE ID */}

          <label className="mt-4 block text-sm font-semibold">
            Employee ID *
          </label>

          <input
            type="text"
            value={employeeId}
            onChange={(e) =>
              setEmployeeId(e.target.value)
            }
            placeholder="Enter Employee ID"
            required
            className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* NAME */}

          <label className="mt-4 block text-sm font-semibold">
            Employee Name *
          </label>

          <input
            type="text"
            value={employeeName}
            onChange={(e) =>
              setEmployeeName(e.target.value)
            }
            placeholder="Enter Employee Name"
            required
            className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* DEPARTMENT */}

          <label className="mt-4 block text-sm font-semibold">
            Department *
          </label>

          <input
            type="text"
            value={department}
            onChange={(e) =>
              setDepartment(e.target.value)
            }
            placeholder="Enter Department"
            required
            className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* EMAIL */}

          <label className="mt-4 block text-sm font-semibold">
            Email *
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="employee@example.com"
            required
            className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

        </section>

        {/* -------------------------------- */}
        {/* PHOTO */}
        {/* -------------------------------- */}

        <section className="mt-8">

          <h2 className="text-lg font-semibold text-slate-900">
            2. Employee Photo *
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Employee photo is compulsory.
          </p>

          {!cameraOpen &&
            !photoCaptured && (
              <button
                type="button"
                onClick={openCamera}
                className="mt-4 w-full rounded-lg bg-purple-600 px-4 py-3 font-semibold text-white hover:bg-purple-700"
              >
                📷 Open Camera
              </button>
            )}

          {cameraOpen && (
            <div className="mt-4">

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-xl bg-black"
              />

              <button
                type="button"
                onClick={capturePhoto}
                className="mt-4 w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white"
              >
                📸 Capture Photo
              </button>

              <button
                type="button"
                onClick={stopCamera}
                className="mt-3 w-full rounded-lg border px-4 py-3"
              >
                Cancel Camera
              </button>

            </div>
          )}

          <canvas
            ref={canvasRef}
            className="hidden"
          />

          {photoPreview && (
            <div className="mt-4">

              <img
                src={photoPreview}
                alt="Employee captured photo"
                className="mx-auto h-56 w-56 rounded-xl object-cover"
              />

              <p className="mt-2 text-center font-semibold text-green-600">
                ✓ Photo Captured
              </p>

              <button
                type="button"
                onClick={retakePhoto}
                className="mt-3 w-full rounded-lg border px-4 py-3"
              >
                🔄 Retake Photo
              </button>

            </div>
          )}

        </section>

        {/* -------------------------------- */}
        {/* FINGERPRINT / BIOMETRIC */}
        {/* -------------------------------- */}

        <section className="mt-8">

          <h2 className="text-lg font-semibold text-slate-900">
            3. Employee Fingerprint / Biometric *
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Employee must complete device biometric verification.
          </p>

          <button
            type="button"
            onClick={registerBiometric}
            disabled={biometricVerified}
            className={`mt-4 w-full rounded-lg px-4 py-4 font-semibold text-white ${
              biometricVerified
                ? "bg-green-600"
                : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {biometricVerified
              ? "✓ Fingerprint / Biometric Registered"
              : "👆 Register Fingerprint / Biometric"}
          </button>

          {biometricVerified && (
            <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              ✓ Employee biometric verification completed.
            </div>
          )}

        </section>

        {/* -------------------------------- */}
        {/* LOCATION */}
        {/* -------------------------------- */}

        <section className="mt-8">

          <h2 className="text-lg font-semibold text-slate-900">
            4. Employee Location *
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Location is compulsory for attendance.
          </p>

          <button
            type="button"
            onClick={getLocation}
            className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
          >
            📍 Get My Location
          </button>

          {latitude !== null &&
            longitude !== null && (
              <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">

                <p>
                  Latitude: {latitude}
                </p>

                <p>
                  Longitude: {longitude}
                </p>

                <p className="mt-2 font-semibold text-green-600">
                  ✓ Location Captured
                </p>

              </div>
            )}

        </section>

        {/* -------------------------------- */}
        {/* REGISTER & CHECK-IN */}
        {/* -------------------------------- */}

        <section className="mt-8">

          <button
            type="button"
            onClick={markAttendance}
            disabled={loading}
            className="w-full rounded-lg bg-green-600 px-4 py-4 text-lg font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Processing..."
              : "✓ REGISTER & CHECK IN"}
          </button>

        </section>

        {/* -------------------------------- */}
        {/* CHECKLIST */}
        {/* -------------------------------- */}

        <div className="mt-6 rounded-xl bg-slate-50 p-4">

          <p className="font-semibold text-slate-900">
            Check-In Requirements
          </p>

          <ul className="mt-3 space-y-2 text-sm">

            <li>
              {employeeId.trim()
                ? "✓"
                : "○"} Employee ID
            </li>

            <li>
              {employeeName.trim()
                ? "✓"
                : "○"} Employee Name
            </li>

            <li>
              {department.trim()
                ? "✓"
                : "○"} Department
            </li>

            <li>
              {email.trim()
                ? "✓"
                : "○"} Email
            </li>

            <li>
              {photoCaptured
                ? "✓"
                : "○"} Employee Photo
            </li>

            <li>
              {biometricVerified
                ? "✓"
                : "○"} Fingerprint / Biometric
            </li>

            <li>
              {latitude !== null &&
              longitude !== null
                ? "✓"
                : "○"} Employee Location
            </li>

          </ul>

        </div>

      </div>

    </main>
  );
}