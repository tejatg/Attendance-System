"use client";

import { useEffect, useRef, useState } from "react";

const API_URL = "https://attendance-backend-2nky.onrender.com";

export default function CheckInPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] =
    useState<MediaStream | null>(null);

  const [photoCaptured, setPhotoCaptured] =
    useState(false);
  const [photoPreview, setPhotoPreview] =
    useState("");

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

          videoRef.current.play().catch((err) => {
            console.error("Video play error:", err);
          });
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
  // GET MY LOCATION - OPTIONAL
  // --------------------------------

  const getCurrentLocation = () => {
    setError("");
    setMessage("");

    if (!navigator.geolocation) {
      setError(
        "GPS is not supported by this browser."
      );
      return;
    }

    setMessage(
      "📍 Requesting your current location..."
    );

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentLatitude =
          position.coords.latitude;

        const currentLongitude =
          position.coords.longitude;

        setLatitude(currentLatitude);
        setLongitude(currentLongitude);

        setMessage(
          "✓ Location captured successfully."
        );
      },
      (err) => {
        console.error(
          "Location error:",
          err
        );

        if (err.code === 1) {
          setError(
            "Location permission was denied. You can continue Check-In without location."
          );
        } else if (err.code === 2) {
          setError(
            "Your location could not be determined. You can continue Check-In without location."
          );
        } else if (err.code === 3) {
          setError(
            "Location request timed out. You can continue Check-In without location."
          );
        } else {
          setError(
            "Unable to get your current location. You can continue Check-In without location."
          );
        }

        setMessage("");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // --------------------------------
  // CHECK-IN VALIDATION
  // --------------------------------

  const validateForm = () => {
    if (!employeeId.trim()) {
      setError("Employee ID is required.");
      return false;
    }

    if (!password.trim()) {
      setError(
        "Employee Password is required."
      );
      return false;
    }

    if (password.length < 6) {
      setError(
        "Employee Password must be at least 6 characters."
      );
      return false;
    }

    if (!photoCaptured) {
      setError(
        "Employee photo is compulsory. Please capture your photo."
      );
      return false;
    }

    // Mobile Location is OPTIONAL.
    // No location validation is performed here.

    return true;
  };

  // --------------------------------
  // CHECK-IN
  // --------------------------------

  const markAttendance = async () => {
    setError("");
    setMessage("");

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      setMessage(
        "Verifying Employee ID and Password..."
      );

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

            password,

            latitude,
            longitude,

            status: "Present",
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Check-In failed."
        );

        setMessage("");
        return;
      }

      setMessage(
        "✓ Attendance saved successfully. Check-In completed."
      );

      setPassword("");
    } catch (err) {
      console.error(
        "Attendance error:",
        err
      );

      setMessage("");

      setError(
        "Unable to connect to the attendance server."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------
  // PAGE
  // --------------------------------

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-6">

      <div className="mx-auto max-w-lg rounded-2xl bg-white p-6 shadow-xl">

        {/* HEADER */}

        <div className="text-center">

          <h1 className="text-2xl font-bold text-slate-900">
            Smart Attendance System
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Employee Check-In
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
            autoComplete="username"
            className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* PASSWORD */}

          <label className="mt-4 block text-sm font-semibold">
            Employee Password *
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder="Enter Employee Password"
            required
            minLength={6}
            autoComplete="current-password"
            className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <p className="mt-2 text-xs text-slate-500">
            Password is securely verified by the attendance server.
          </p>

        </section>

        {/* -------------------------------- */}
        {/* EMPLOYEE PHOTO */}
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
                disabled={loading}
                className="mt-4 w-full rounded-lg bg-purple-600 px-4 py-3 font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
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
                disabled={loading}
                className="mt-3 w-full rounded-lg border px-4 py-3 disabled:opacity-50"
              >
                🔄 Retake Photo
              </button>

            </div>
          )}

        </section>

        {/* -------------------------------- */}
        {/* MOBILE LOCATION - OPTIONAL */}
        {/* -------------------------------- */}

        <section className="mt-8">

          <h2 className="text-lg font-semibold text-slate-900">
            3. Mobile Location (Optional)
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            You may capture your current mobile location if you want to save it with your attendance.
          </p>

          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            📍 Get My Location
          </button>

          {latitude !== null &&
            longitude !== null && (
              <div className="mt-4 rounded-lg bg-green-50 p-4 text-sm">

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

          {latitude === null &&
            longitude === null && (
              <p className="mt-3 text-xs text-slate-500">
                Location is optional. You can Check In without providing your location.
              </p>
            )}

        </section>

        {/* -------------------------------- */}
        {/* CHECK IN */}
        {/* -------------------------------- */}

        <section className="mt-8">

          <button
            type="button"
            onClick={markAttendance}
            disabled={loading}
            className="w-full rounded-lg bg-green-600 px-4 py-4 text-lg font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Saving Attendance..."
              : "✓ CHECK IN"}
          </button>

        </section>

        {/* -------------------------------- */}
        {/* CHECK-IN REQUIREMENTS */}
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
              {password.trim()
                ? "✓"
                : "○"} Employee Password
            </li>

            <li>
              {photoCaptured
                ? "✓"
                : "○"} Employee Photo
            </li>

            <li>
              ✓ Mobile Location (Optional)
            </li>

          </ul>

        </div>

        {/* -------------------------------- */}
        {/* LOCATION NOTE */}
        {/* -------------------------------- */}

        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-800">

          <p className="font-semibold">
            📍 Location Information
          </p>

          <p className="mt-2">
            Mobile location is optional. Employees can Check In without allowing location access.
          </p>

          <p className="mt-2">
            If Get My Location is used, the captured latitude and longitude will be saved with the attendance record.
          </p>

          <p className="mt-2">
            No distance or radius restriction is applied.
          </p>

        </div>

      </div>

    </main>
  );
}