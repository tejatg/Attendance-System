"use client";

import { useEffect, useRef, useState } from "react";

const API_URL = "https://attendance-backend-2nky.onrender.com";

export default function CheckInPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] =
    useState<MediaStream | null>(null);

  const [photoCaptured, setPhotoCaptured] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkInCompleted, setCheckInCompleted] = useState(false);

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }

    setCameraStream(null);
    setCameraOpen(false);
  };

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  const openCamera = async () => {
    if (checkInCompleted) {
      return;
    }

    setError("");
    setMessage("");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera is not supported by this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
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

  const capturePhoto = () => {
    if (checkInCompleted) {
      return;
    }

    setError("");
    setMessage("");

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      setError("Camera is not ready.");
      return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setError("Camera is not ready. Please wait a moment.");
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

    const image = canvas.toDataURL("image/jpeg", 0.9);

    setPhotoPreview(image);
    setPhotoCaptured(true);

    stopCamera();

    setMessage("✓ Employee photo captured successfully.");
  };

  const retakePhoto = () => {
    if (checkInCompleted) {
      return;
    }

    setPhotoPreview("");
    setPhotoCaptured(false);
    setError("");
    setMessage("");

    openCamera();
  };

  const getCurrentLocation = () => {
    if (checkInCompleted) {
      return;
    }

    setError("");
    setMessage("");

    if (!navigator.geolocation) {
      setError("GPS is not supported by this browser.");
      return;
    }

    setMessage("Requesting your current location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);

        setMessage("✓ Location captured successfully.");
      },
      (err) => {
        console.error("Location error:", err);

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

  const validateForm = () => {
    if (checkInCompleted) {
      setError("Check-In has already been completed.");
      return false;
    }

    if (!name.trim()) {
      setError("Employee Name is required.");
      return false;
    }

    if (!department.trim()) {
      setError("Employee Department is required.");
      return false;
    }

    if (!password.trim()) {
      setError("Employee Password is required.");
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

    return true;
  };

  const markCheckIn = async () => {
    if (checkInCompleted) {
      return;
    }

    setError("");
    setMessage("");

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      setMessage(
        "Verifying Employee Name, Department and Password..."
      );

      const response = await fetch(
        API_URL + "/api/attendance",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            department: department.trim(),
            password: password,
            latitude: latitude,
            longitude: longitude,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Check-In failed.");
        setMessage("");
        return;
      }

      setCheckInCompleted(true);

      setMessage(
        "✓ Attendance saved successfully. Check-In completed."
      );

      setPassword("");

      stopCamera();
    } catch (err) {
      console.error("Check-In error:", err);

      setMessage("");

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

        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            TALENTRONAUT PVT LTD
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Employee Check-In
          </p>
        </div>

        {error && (
          <div className="mt-5 rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700">
            ❌ {error}
          </div>
        )}

        {message && (
          <div className="mt-5 rounded-lg bg-green-50 p-4 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        <section className="mt-6">
          <h2 className="text-lg font-semibold text-slate-900">
            1. Employee Information
          </h2>

          <label className="mt-4 block text-sm font-semibold">
            Employee Name *
          </label>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter Employee Name"
            required
            disabled={checkInCompleted}
            autoComplete="name"
            className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
          />

          <label className="mt-4 block text-sm font-semibold">
            Employee Department *
          </label>

          <input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Enter Employee Department"
            required
            disabled={checkInCompleted}
            className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
          />

          <label className="mt-4 block text-sm font-semibold">
            Employee Password *
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter Employee Password"
            required
            minLength={6}
            disabled={checkInCompleted}
            autoComplete="current-password"
            className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
          />

          <p className="mt-2 text-xs text-slate-500">
            Password is securely verified by the attendance server.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">
            2. Employee Photo *
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Employee photo is compulsory.
          </p>

          {!cameraOpen && !photoCaptured && (
            <button
              type="button"
              onClick={openCamera}
              disabled={loading || checkInCompleted}
              className="mt-4 w-full rounded-lg bg-purple-600 px-4 py-3 font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
            >
              Open Camera
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
                disabled={checkInCompleted}
                className="mt-4 w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                Capture Photo
              </button>

              <button
                type="button"
                onClick={stopCamera}
                disabled={checkInCompleted}
                className="mt-3 w-full rounded-lg border px-4 py-3 disabled:opacity-50"
              >
                Cancel Camera
              </button>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />

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
                disabled={loading || checkInCompleted}
                className="mt-3 w-full rounded-lg border px-4 py-3 disabled:opacity-50"
              >
                Retake Photo
              </button>
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">
            3. Mobile Location
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Mobile location is optional.
          </p>

          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={loading || checkInCompleted}
            className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Get My Location
          </button>

          {latitude !== null && longitude !== null && (
            <div className="mt-4 rounded-lg bg-green-50 p-4 text-sm">
              <p>Latitude: {latitude}</p>
              <p>Longitude: {longitude}</p>

              <p className="mt-2 font-semibold text-green-600">
                ✓ Location Captured
              </p>
            </div>
          )}

          {latitude === null && longitude === null && (
            <p className="mt-3 text-xs text-slate-500">
              You can Check In without providing your location.
            </p>
          )}
        </section>

        <section className="mt-8">
          <button
            type="button"
            onClick={markCheckIn}
            disabled={loading || checkInCompleted}
            className={
              "w-full rounded-lg px-4 py-4 text-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 " +
              (checkInCompleted
                ? "bg-green-700"
                : "bg-blue-600 hover:bg-blue-700")
            }
          >
            {checkInCompleted
              ? "✓ CHECKED IN"
              : loading
              ? "Saving Attendance..."
              : "CHECK IN"}
          </button>
        </section>

        {checkInCompleted && (
          <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
            <p className="font-semibold text-green-700">
              ✓ Check-In completed successfully
            </p>

            <p className="mt-2 text-sm text-green-700">
              You cannot Check In again today.
            </p>
          </div>
        )}

        <div className="mt-6 rounded-xl bg-slate-50 p-4">
          <p className="font-semibold text-slate-900">
            Check-In Requirements
          </p>

          <ul className="mt-3 space-y-2 text-sm">
            <li>
              {name.trim() ? "✓" : "○"} Employee Name
            </li>

            <li>
              {department.trim() ? "✓" : "○"} Employee Department
            </li>

            <li>
              {password.trim() || checkInCompleted
                ? "✓"
                : "○"}{" "}
              Employee Password
            </li>

            <li>
              {photoCaptured ? "✓" : "○"} Employee Photo
            </li>

            <li>✓ Mobile Location (Optional)</li>
          </ul>
        </div>

      </div>
    </main>
  );
}

