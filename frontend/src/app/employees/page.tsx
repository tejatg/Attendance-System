"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://attendance-backend-2nky.onrender.com"
).replace(/\/+$/, "");

export default function EmployeeRegistrationPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [location, setLocation] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOpen(false);
  }

  async function openCamera() {
    setError("");
    setMessage("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is unavailable. Use HTTPS or localhost.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      streamRef.current = stream;
      setCameraOpen(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch {
      setError("Unable to open the camera. Please allow camera permission.");
    }
  }

  function capturePhoto() {
    const video = videoRef.current;

    if (!video || !video.videoWidth || !video.videoHeight) {
      setError("Camera preview is not ready. Please try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setError("Unable to capture the photo.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Unable to create the photo file.");
          return;
        }

        setPhoto(
          new File([blob], "employee-photo.jpg", {
            type: "image/jpeg",
          })
        );

        setMessage("Photo captured successfully.");
        stopCamera();
      },
      "image/jpeg",
      0.9
    );
  }

  function getLocation() {
    setError("");
    setMessage("");

    if (!navigator.geolocation) {
      setError("Location services are unavailable in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates = `${position.coords.latitude},${position.coords.longitude}`;
        setLocation(coordinates);
        setMessage("Location captured successfully.");
      },
      (locationError) => {
        setError(
          locationError.code === locationError.PERMISSION_DENIED
            ? "Location permission was denied. Allow location access and try again."
            : "Unable to retrieve location. Check your device location settings and try again."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!name.trim() || !email.trim() || !department.trim()) {
      setError("Please fill in your name, email, and department.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    if (!location.trim()) {
      setError("Please capture your location before registering.");
      return;
    }

    // Send the employee ID explicitly because the backend requires it.
    const employeeId = `EMP${Date.now().toString().slice(-8)}`;
    const formData = new FormData();

    formData.append("employeeId", employeeId);
    formData.append("name", name.trim());
    formData.append("email", email.trim());
    formData.append("department", department.trim());
    formData.append("password", password);
    formData.append("confirmPassword", confirmPassword);
    formData.append("location", location.trim());

    if (photo) {
      formData.append("photo", photo);
    }

    const token = localStorage.getItem("adminToken");

    if (!token) {
      setError("Administrator session not found. Please log in again.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/employees`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        cache: "no-store",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Employee registration failed (HTTP ${response.status}).`
        );
      }

      setMessage(
        `Employee registered successfully. Employee ID: ${
          data?.employee?.employeeId || data?.employeeId || employeeId
        }`
      );

      setName("");
      setEmail("");
      setDepartment("");
      setPassword("");
      setConfirmPassword("");
      setLocation("");
      setPhoto(null);
    } catch (registrationError) {
      console.error("Employee registration failed:", registrationError);

      setError(
        registrationError instanceof TypeError
          ? "Cannot connect to the backend. Check the server and CORS configuration."
          : registrationError instanceof Error
            ? registrationError.message
            : "Unable to register employee."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
              TALENTRONAUT PVT LTD
            </p>
            <h1 className="mt-3 text-3xl font-black">
              Register New Employee
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Create an employee record from the administrator dashboard.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="rounded-lg border border-white/15 px-4 py-3 text-sm font-semibold hover:bg-white/5"
          >
            Back to Dashboard
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-white/10 bg-slate-900 p-5 sm:p-8"
        >
          <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-4">
            <p className="text-sm font-semibold text-cyan-300">
              Employee ID
            </p>
            <p className="mt-1 text-sm text-slate-300">
              An employee ID will be generated automatically when you submit
              the registration form.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm text-slate-300">
                Full Name *
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                autoComplete="name"
                className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm text-slate-300">
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
                className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                placeholder="employee@company.com"
              />
            </div>

            <div>
              <label htmlFor="department" className="mb-2 block text-sm text-slate-300">
                Department *
              </label>
              <input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                disabled={loading}
                className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                placeholder="e.g. Engineering"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm text-slate-300">
                Password *
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
                autoComplete="new-password"
                className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                placeholder="At least 8 characters"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="confirmPassword" className="mb-2 block text-sm text-slate-300">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
                autoComplete="new-password"
                className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                placeholder="Re-enter password"
              />
            </div>
          </div>

          <div className="rounded-xl border border-white/10 p-4">
            <h2 className="font-bold">Employee Location *</h2>
            <p className="mt-1 text-sm text-slate-400">
              Capture the device&apos;s current coordinates for this registration.
            </p>
            <p className="mt-3 break-all text-sm text-cyan-300">
              {location || "Location not captured"}
            </p>
            <button
              type="button"
              onClick={getLocation}
              disabled={loading}
              className="mt-4 rounded-lg border border-cyan-400/40 px-4 py-3 text-sm font-semibold text-cyan-300 hover:bg-cyan-400/10 disabled:opacity-50"
            >
              Capture Location
            </button>
          </div>

          <div className="rounded-xl border border-white/10 p-4">
            <h2 className="font-bold">Employee Photo</h2>
            <p className="mt-1 text-sm text-slate-400">
              Optional unless your backend requires a photo.
            </p>

            {cameraOpen && (
              <div className="mt-4 space-y-3">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full max-w-md rounded-lg bg-black"
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="rounded-lg bg-cyan-400 px-4 py-3 font-bold text-slate-950"
                  >
                    Capture Photo
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="rounded-lg border border-white/15 px-4 py-3"
                  >
                    Cancel Camera
                  </button>
                </div>
              </div>
            )}

            {!cameraOpen && (
              <button
                type="button"
                onClick={openCamera}
                disabled={loading}
                className="mt-4 rounded-lg border border-white/15 px-4 py-3 text-sm font-semibold hover:bg-white/5 disabled:opacity-50"
              >
                {photo ? "Retake Photo" : "Open Camera"}
              </button>
            )}

            {photo && (
              <p className="mt-3 text-sm text-emerald-300">
                Photo ready: {photo.name}
              </p>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="break-words rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200"
            >
              {error}
            </div>
          )}

          {message && (
            <div
              role="status"
              className="break-words rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200"
            >
              {message}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-cyan-400 px-5 py-4 font-bold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Registering Employee..." : "Register Employee"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin")}
              disabled={loading}
              className="rounded-lg border border-white/15 px-5 py-4 font-semibold hover:bg-white/5 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}