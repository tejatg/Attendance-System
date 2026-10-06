"use client";

import { useEffect, useRef, useState } from "react";

const API_URL = "https://attendance-backend-2nky.onrender.com";

export default function CheckInPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");

  const [photoPreview, setPhotoPreview] = useState("");
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);

  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [checkInCompleted, setCheckInCompleted] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraReady(true);
      setError("");
    } catch (cameraError) {
      console.error("Camera error:", cameraError);

      setCameraReady(false);

      setError(
        "Camera access is required. Please allow camera permission and try again."
      );
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) {
      setError("Camera is not ready.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setError("Camera is still loading. Please try again.");
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

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Unable to capture photo.");
          return;
        }

        setPhotoBlob(blob);
        setPhotoPreview(
          canvas.toDataURL("image/jpeg", 0.9)
        );
        setError("");
      },
      "image/jpeg",
      0.9
    );
  }

  function retakePhoto() {
    setPhotoBlob(null);
    setPhotoPreview("");
    setError("");
  }

  function getLocation() {
    if (!navigator.geolocation) {
      setError(
        "Location is not supported by this browser."
      );
      return;
    }

    setLocationLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setLatitude(lat);
        setLongitude(lng);

        setLocation(
          `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        );

        setLocationLoading(false);
      },
      (locationError) => {
        console.error(
          "Location error:",
          locationError
        );

        setLocationLoading(false);

        setError(
          "Location permission was not granted. You can continue without location."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  function validateForm() {
    if (!name.trim()) {
      setError("Please enter Employee Name.");
      return false;
    }

    if (!department.trim()) {
      setError("Please enter Department.");
      return false;
    }

    if (!password) {
      setError("Please enter Password.");
      return false;
    }

    if (!photoBlob) {
      setError("Employee photo is compulsory.");
      return false;
    }

    return true;
  }

  async function handleCheckIn(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (checkInCompleted) {
      return;
    }

    setMessage("");
    setError("");

    if (!validateForm()) {
      return;
    }

    /*
      Explicit null guard.

      This fixes the TypeScript error:
      Blob | null is not assignable to Blob.
    */
    if (!photoBlob) {
      setError("Employee photo is compulsory.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append(
        "name",
        name.trim()
      );

      formData.append(
        "department",
        department.trim()
      );

      formData.append(
        "password",
        password
      );

      formData.append(
        "photo",
        photoBlob,
        "check-in-photo.jpg"
      );

      if (location) {
        formData.append(
          "location",
          location
        );
      }

      if (latitude !== null) {
        formData.append(
          "latitude",
          String(latitude)
        );
      }

      if (longitude !== null) {
        formData.append(
          "longitude",
          String(longitude)
        );
      }

      const response = await fetch(
        `${API_URL}/api/attendance`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Check-In failed."
        );
      }

      setCheckInCompleted(true);

      setMessage(
        "Attendance saved successfully. Check-In completed."
      );

      setPassword("");

      stopCamera();
    } catch (checkInError) {
      console.error(
        "Check-In error:",
        checkInError
      );

      setError(
        checkInError instanceof Error
          ? checkInError.message
          : "Unable to complete Check-In."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#090909] text-white">

      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div className="absolute left-[-220px] top-[-220px] h-[600px] w-[600px] rounded-full bg-white/[0.035] blur-3xl" />

        <div className="absolute right-[-220px] top-[20%] h-[600px] w-[600px] rounded-full bg-white/[0.035] blur-3xl" />

        <div className="absolute bottom-[-250px] left-[30%] h-[550px] w-[550px] rounded-full bg-white/[0.025] blur-3xl" />

      </div>

      <div className="relative mx-auto min-h-screen w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-12">

        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/10 pb-5">

          <div className="flex items-center gap-4">

            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06]">

              <div className="absolute inset-2 rounded-xl border border-white/10" />

              <span className="relative text-xl font-black">
                T
              </span>

            </div>

            <div>

              <p className="text-sm font-black tracking-[0.25em]">
                TALENTRONAUT
              </p>

              <p className="mt-1 text-[9px] font-medium tracking-[0.35em] text-white/40">
                PVT LTD • WORKFORCE SYSTEM
              </p>

            </div>

          </div>

          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">

            <span
              className={`h-2 w-2 rounded-full ${
                checkInCompleted
                  ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]"
                  : "bg-white/50"
              }`}
            />

            <span className="text-[9px] font-bold tracking-[0.2em] text-white/50">
              {checkInCompleted
                ? "CHECK-IN COMPLETE"
                : "SECURE SESSION"}
            </span>

          </div>

        </header>

        {/* Main */}
        <section className="mx-auto max-w-6xl py-10 sm:py-14">

          {/* Page heading */}
          <div className="max-w-3xl">

            <div className="mb-6 flex items-center gap-3">

              <span className="h-px w-10 bg-white/40" />

              <span className="text-[10px] font-bold tracking-[0.35em] text-white/40">
                ATTENDANCE MODULE / 01
              </span>

            </div>

            <h1 className="text-5xl font-black leading-[0.92] tracking-[-0.055em] sm:text-7xl lg:text-8xl">

              CHECK

              <br />

              <span className="text-white/25">
                IN.
              </span>

            </h1>

            <p className="mt-7 max-w-xl text-sm leading-7 text-white/45 sm:text-base">
              Verify your identity, capture a live attendance
              photo and record the beginning of your workday.
            </p>

          </div>

          {/* Success */}
          {message && (
            <div className="mt-8 rounded-[28px] border border-emerald-400/20 bg-emerald-400/[0.06] p-6">

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-xl text-emerald-300">
                  ✓
                </div>

                <div>

                  <p className="text-xs font-bold tracking-[0.2em] text-emerald-300">
                    ATTENDANCE CONFIRMED
                  </p>

                  <p className="mt-1 text-sm text-white/50">
                    {message}
                  </p>

                </div>

              </div>

            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-8 rounded-[28px] border border-red-400/20 bg-red-400/[0.06] p-5">

              <p className="text-sm font-semibold text-red-300">
                {error}
              </p>

            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleCheckIn}
            className="mt-10 grid gap-5 lg:grid-cols-12"
          >

            {/* Employee Details */}
            <div className="rounded-[32px] border border-white/10 bg-white/[0.045] p-6 backdrop-blur-xl sm:p-8 lg:col-span-5">

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-[9px] font-bold tracking-[0.3em] text-white/30">
                    IDENTITY
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    Employee Details
                  </h2>

                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-xl">
                  01
                </div>

              </div>

              {/* Name */}
              <div className="mt-8">

                <label
                  htmlFor="name"
                  className="mb-2 block text-[9px] font-bold tracking-[0.2em] text-white/40"
                >
                  EMPLOYEE NAME
                </label>

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Enter Employee Name"
                  disabled={
                    loading ||
                    checkInCompleted
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/30 focus:bg-black/50 disabled:opacity-40"
                />

              </div>

              {/* Department */}
              <div className="mt-5">

                <label
                  htmlFor="department"
                  className="mb-2 block text-[9px] font-bold tracking-[0.2em] text-white/40"
                >
                  DEPARTMENT
                </label>

                <input
                  id="department"
                  type="text"
                  value={department}
                  onChange={(event) =>
                    setDepartment(
                      event.target.value
                    )
                  }
                  placeholder="Enter Department"
                  disabled={
                    loading ||
                    checkInCompleted
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/30 focus:bg-black/50 disabled:opacity-40"
                />

              </div>

              {/* Password */}
              <div className="mt-5">

                <label
                  htmlFor="password"
                  className="mb-2 block text-[9px] font-bold tracking-[0.2em] text-white/40"
                >
                  PASSWORD
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter Password"
                  autoComplete="current-password"
                  disabled={
                    loading ||
                    checkInCompleted
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/30 focus:bg-black/50 disabled:opacity-40"
                />

              </div>

              {/* Security */}
              <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-4">

                <div className="flex gap-3">

                  <span className="text-lg">
                    ◉
                  </span>

                  <div>

                    <p className="text-[9px] font-bold tracking-[0.2em] text-white/50">
                      SECURE VERIFICATION
                    </p>

                    <p className="mt-2 text-xs leading-5 text-white/30">
                      Employee identity is verified before
                      attendance is recorded.
                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* Camera */}
            <div className="rounded-[32px] border border-white/10 bg-white/[0.045] p-6 backdrop-blur-xl sm:p-8 lg:col-span-7">

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-[9px] font-bold tracking-[0.3em] text-white/30">
                    LIVE CAPTURE
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    Attendance Photo
                  </h2>

                </div>

                <div className="rounded-full border border-white/10 px-3 py-1 text-[9px] font-bold tracking-[0.2em] text-white/30">
                  REQUIRED
                </div>

              </div>

              {/* Camera frame */}
              <div className="relative mt-7 overflow-hidden rounded-[28px] border border-white/10 bg-black">

                {!photoPreview ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="aspect-[4/3] w-full object-cover"
                    />

                    {/* Face guide */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">

                      <div className="h-[62%] w-[45%] rounded-[45%] border border-white/20" />

                    </div>

                    {/* Camera corners */}
                    <div className="pointer-events-none absolute inset-5">

                      <div className="absolute left-0 top-0 h-8 w-8 rounded-tl-xl border-l-2 border-t-2 border-white/60" />

                      <div className="absolute right-0 top-0 h-8 w-8 rounded-tr-xl border-r-2 border-t-2 border-white/60" />

                      <div className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-xl border-b-2 border-l-2 border-white/60" />

                      <div className="absolute bottom-0 right-0 h-8 w-8 rounded-br-xl border-b-2 border-r-2 border-white/60" />

                    </div>

                    {/* Live */}
                    <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 backdrop-blur-md">

                      <span className="text-[9px] font-bold tracking-[0.2em] text-white/60">
                        ● LIVE CAMERA
                      </span>

                    </div>

                  </>
                ) : (
                  <div className="relative">

                    <img
                      src={photoPreview}
                      alt="Captured attendance photo"
                      className="aspect-[4/3] w-full object-cover"
                    />

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-emerald-400/20 bg-black/70 px-4 py-2 text-[9px] font-bold tracking-[0.2em] text-emerald-300 backdrop-blur-md">
                      PHOTO VERIFIED ✓
                    </div>

                  </div>
                )}

              </div>

              {/* Photo button */}
              <div className="mt-5">

                {!photoPreview ? (
                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={
                      !cameraReady ||
                      loading ||
                      checkInCompleted
                    }
                    className="w-full rounded-2xl border border-white/15 bg-white/[0.07] px-5 py-4 text-xs font-black tracking-[0.2em] text-white transition hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    CAPTURE ATTENDANCE PHOTO
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={retakePhoto}
                    disabled={
                      loading ||
                      checkInCompleted
                    }
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-xs font-black tracking-[0.2em] text-white/70 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    RETAKE PHOTO
                  </button>
                )}

              </div>

              {/* Location */}
              <div className="mt-6 border-t border-white/10 pt-5">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-[9px] font-bold tracking-[0.25em] text-white/30">
                      OPTIONAL
                    </p>

                    <p className="mt-1 text-sm font-bold">
                      Mobile Location
                    </p>

                  </div>

                  <span className="text-lg">
                    ◎
                  </span>

                </div>

                <button
                  type="button"
                  onClick={getLocation}
                  disabled={
                    locationLoading ||
                    loading ||
                    checkInCompleted
                  }
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-[9px] font-bold tracking-[0.15em] text-white/45 transition hover:border-white/20 hover:text-white/70 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {locationLoading
                    ? "DETECTING LOCATION..."
                    : location
                    ? `LOCATION CAPTURED • ${location}`
                    : "CAPTURE MOBILE LOCATION"}
                </button>

              </div>

            </div>

            {/* Hidden canvas */}
            <canvas
              ref={canvasRef}
              className="hidden"
            />

            {/* Submit */}
            <div className="lg:col-span-12">

              <button
                type="submit"
                disabled={
                  loading ||
                  checkInCompleted
                }
                className="group relative w-full overflow-hidden rounded-[28px] border border-white/15 bg-white px-6 py-5 text-black transition duration-300 hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/30 disabled:text-black/40"
              >

                <div className="flex items-center justify-center gap-4">

                  <span className="text-xl font-black">
                    {checkInCompleted
                      ? "✓"
                      : "→"}
                  </span>

                  <span className="text-sm font-black tracking-[0.25em] sm:text-base">
                    {loading
                      ? "PROCESSING CHECK-IN..."
                      : checkInCompleted
                      ? "CHECK-IN COMPLETED"
                      : "CONFIRM CHECK-IN"}
                  </span>

                </div>

              </button>

            </div>

          </form>

          {/* Bottom status */}
          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">

            <div className="flex items-center gap-3">

              <span
                className={`h-2 w-2 rounded-full ${
                  checkInCompleted
                    ? "bg-emerald-400"
                    : "bg-white/30"
                }`}
              />

              <span className="text-[9px] font-bold tracking-[0.25em] text-white/30">
                {checkInCompleted
                  ? "SESSION RECORDED"
                  : "READY FOR ATTENDANCE"}
              </span>

            </div>

            <p className="text-[9px] font-medium tracking-[0.2em] text-white/20">
              TALENTRONAUT PVT LTD
            </p>

          </div>

        </section>

      </div>

    </main>
  );
}