"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://attendance-backend-2nky.onrender.com";

export default function RegisterEmployeePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const [locationEnabled, setLocationEnabled] = useState(false);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();

      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, []);

  async function startCamera() {
    try {
      setCameraError("");

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera access is not supported by this browser.");
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

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraReady(true);
    } catch {
      setCameraError(
        "Camera permission is required to capture the employee identity photo."
      );
      setCameraReady(false);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      setError("Camera is not ready.");
      return;
    }

    if (!video.videoWidth || !video.videoHeight) {
      setError("Camera image is not ready. Please wait a moment.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setError("Unable to capture the camera image.");
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
          setError("Unable to create employee photo.");
          return;
        }

        if (photoPreview) {
          URL.revokeObjectURL(photoPreview);
        }

        const preview = URL.createObjectURL(blob);

        setPhotoBlob(blob);
        setPhotoPreview(preview);
        setError("");
      },
      "image/jpeg",
      0.9
    );
  }

  function retakePhoto() {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoBlob(null);
    setPhotoPreview("");
    setError("");
  }

  function enableLocation() {
    if (!navigator.geolocation) {
      setError("Location is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(String(position.coords.latitude));
        setLongitude(String(position.coords.longitude));
        setLocationEnabled(true);
        setError("");
      },
      () => {
        setError(
          "Location permission was not granted. You can continue without location."
        );
        setLocationEnabled(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  function disableLocation() {
    setLocationEnabled(false);
    setLatitude("");
    setLongitude("");
  }

  function generateEmployeeId() {
    return `EMP${Date.now().toString().slice(-8)}`;
  }

  function generateEmail(employeeName: string) {
    const cleanName = employeeName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "");

    return `${cleanName || "employee"}.${Date.now()}@talentronaut.local`;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanName = name.trim();
    const cleanDepartment = department.trim();

    if (!cleanName) {
      setError("Employee name is required.");
      return;
    }

    if (!cleanDepartment) {
      setError("Department is required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirmation password do not match.");
      return;
    }

    if (!photoBlob) {
      setError("Employee identity photo is compulsory.");
      return;
    }

    try {
      setLoading(true);

      const employeeId = generateEmployeeId();
      const email = generateEmail(cleanName);

      const formData = new FormData();

      formData.append("employeeId", employeeId);
      formData.append("name", cleanName);
      formData.append("email", email);
      formData.append("department", cleanDepartment);
      formData.append("password", password);
      formData.append("confirmPassword", confirmPassword);

      if (locationEnabled && latitude && longitude) {
        formData.append(
          "location",
          `${latitude}, ${longitude}`
        );
      }

      formData.append(
        "photo",
        photoBlob,
        `${employeeId}.jpg`
      );

      const response = await fetch(
        `${API_BASE}/api/employees`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Employee registration failed."
        );
      }

      setSuccess(
        `Employee profile created successfully. Employee ID: ${
          data?.employee?.employeeId || employeeId
        }`
      );

      setName("");
      setDepartment("");
      setPassword("");
      setConfirmPassword("");

      retakePhoto();
      disableLocation();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Employee registration failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#eee9df] text-[#17131c]">
      <div className="mx-auto max-w-[1500px] px-5 py-6 sm:px-8 lg:px-12">

        {/* TOP BAR */}
        <header className="flex items-center justify-between border-b border-[#17131c]/15 pb-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#6b6270]">
              TALENTRONAUT PVT LTD
            </p>

            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8a818d]">
              People Identity Registry
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.25em] text-[#6b6270] sm:block">
              Registry / 01
            </span>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#17131c] text-xs font-black text-[#e8c96b]">
              TR
            </div>
          </div>
        </header>

        {/* HERO */}
        <section className="grid gap-8 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:py-14">

          <div>
            <div className="mb-7 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#7351d8]" />

              <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[#7351d8]">
                New identity
              </span>

              <span className="h-px w-16 bg-[#7351d8]/40" />
            </div>

            <h1 className="max-w-[850px] text-[clamp(4rem,9vw,9.5rem)] font-black leading-[0.78] tracking-[-0.075em]">
              MAKE
              <br />
              YOUR
              <br />
              <span className="text-[#7351d8]">MARK.</span>
            </h1>

            <p className="mt-8 max-w-xl text-sm leading-7 text-[#655d69] sm:text-base">
              Create a verified employee identity for the
              TALENTRONAUT attendance network. Every profile
              receives a unique employee identity and can be
              used for secure Check-In and Check-Out.
            </p>
          </div>

          {/* IDENTITY CARD */}
          <div className="relative overflow-hidden rounded-[32px] bg-[#17131c] p-7 text-[#f4efe6] shadow-[0_30px_80px_rgba(23,19,28,0.18)] sm:p-9">

            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full border border-[#e8c96b]/30" />
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full border border-[#e8c96b]/20" />

            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.32em] text-[#a79fae]">
                    Employee identity
                  </p>

                  <p className="mt-2 text-2xl font-black tracking-tight">
                    TALENTRON
                  </p>
                </div>

                <div className="rounded-full border border-[#e8c96b]/40 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.22em] text-[#e8c96b]">
                  NEW
                </div>
              </div>

              <div className="mt-14 grid grid-cols-[90px_1fr] gap-5">
                <div className="flex h-[90px] items-center justify-center rounded-2xl border border-dashed border-[#aaa1ad]/40 bg-white/[0.03]">
                  <span className="text-[9px] uppercase tracking-widest text-[#8f8791]">
                    Photo
                  </span>
                </div>

                <div>
                  <p className="text-[9px] uppercase tracking-[0.25em] text-[#8f8791]">
                    Profile status
                  </p>

                  <p className="mt-2 text-lg font-bold">
                    Awaiting registration
                  </p>

                  <div className="mt-5 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#e8c96b]" />
                    <span className="text-[9px] uppercase tracking-[0.2em] text-[#a79fae]">
                      Identity verification required
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-white/10 pt-5">
                <div className="flex justify-between text-[9px] uppercase tracking-[0.2em]">
                  <span className="text-[#77707a]">
                    Registry
                  </span>
                  <span className="text-[#e8c96b]">
                    TALENTRON / PEOPLE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="grid gap-7 pb-16 lg:grid-cols-[1fr_0.78fr]"
        >

          {/* LEFT — IDENTITY */}
          <section className="rounded-[30px] border border-[#17131c]/10 bg-[#f7f4ed] p-6 sm:p-9">

            <div className="mb-9 flex items-end justify-between border-b border-[#17131c]/10 pb-6">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#7351d8]">
                  01 / Identity
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                  Who are we registering?
                </h2>
              </div>

              <span className="hidden text-4xl font-black text-[#17131c]/10 sm:block">
                01
              </span>
            </div>

            <div className="space-y-7">

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-[#716873]">
                  Employee name
                </label>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full border-b-2 border-[#17131c]/15 bg-transparent px-0 py-4 text-2xl font-bold outline-none transition placeholder:text-[#aaa3aa] focus:border-[#7351d8]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-[#716873]">
                  Department
                </label>

                <input
                  value={department}
                  onChange={(e) =>
                    setDepartment(e.target.value)
                  }
                  placeholder="IT / HR / Finance / Operations"
                  className="w-full border-b-2 border-[#17131c]/15 bg-transparent px-0 py-4 text-xl font-semibold outline-none transition placeholder:text-[#aaa3aa] focus:border-[#7351d8]"
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-[#716873]">
                    Access password
                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Minimum 6 characters"
                    className="w-full border-b-2 border-[#17131c]/15 bg-transparent px-0 py-4 text-lg font-semibold outline-none transition placeholder:text-[#aaa3aa] focus:border-[#7351d8]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-[#716873]">
                    Confirm password
                  </label>

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    placeholder="Repeat password"
                    className="w-full border-b-2 border-[#17131c]/15 bg-transparent px-0 py-4 text-lg font-semibold outline-none transition placeholder:text-[#aaa3aa] focus:border-[#7351d8]"
                  />
                </div>

              </div>

              <div className="rounded-2xl bg-[#ece7dd] p-5">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#17131c] text-[#e8c96b]">
                    +
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.15em]">
                      Automatic identity assignment
                    </p>

                    <p className="mt-2 text-xs leading-5 text-[#77707a]">
                      Employee ID and internal registry email
                      will be generated automatically after
                      registration.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* RIGHT — PHOTO + LOCATION */}
          <section className="space-y-7">

            <div className="rounded-[30px] bg-[#7351d8] p-5 text-white sm:p-7">

              <div className="mb-6 flex items-end justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">
                    02 / Identity capture
                  </p>

                  <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                    Show your face.
                  </h2>
                </div>

                <span className="text-4xl font-black text-white/20">
                  02
                </span>
              </div>

              <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] bg-[#18131f]">

                {!photoPreview ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="h-full w-full object-cover"
                    />

                    <div className="pointer-events-none absolute inset-5">
                      <div className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-[#e8c96b]" />
                      <div className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-[#e8c96b]" />
                      <div className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-[#e8c96b]" />
                      <div className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-[#e8c96b]" />
                    </div>

                    <div className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-2 text-[8px] font-bold uppercase tracking-[0.2em]">
                      {cameraReady
                        ? "Camera live"
                        : "Connecting"}
                    </div>
                  </>
                ) : (
                  <img
                    src={photoPreview}
                    alt="Employee identity preview"
                    className="h-full w-full object-cover"
                  />
                )}

                {!cameraReady && !photoPreview && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#18131f]/80 p-6 text-center">
                    <div>
                      <p className="text-sm font-bold">
                        Camera unavailable
                      </p>

                      <p className="mt-2 text-xs leading-5 text-white/60">
                        Allow camera permission and try again.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {cameraError && (
                <p className="mt-3 text-xs text-[#ffe2cf]">
                  {cameraError}
                </p>
              )}

              <div className="mt-5 flex gap-3">

                {!photoPreview ? (
                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={!cameraReady}
                    className="flex-1 rounded-2xl bg-[#e8c96b] px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-[#17131c] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Capture identity
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={retakePhoto}
                    className="flex-1 rounded-2xl bg-white px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-[#17131c] transition hover:bg-[#e8c96b]"
                  >
                    Retake photo
                  </button>
                )}

              </div>

              <p className="mt-4 text-[9px] uppercase tracking-[0.18em] text-white/50">
                Identity photo required for attendance verification
              </p>

              <canvas
                ref={canvasRef}
                className="hidden"
              />
            </div>

            {/* LOCATION */}
            <div className="rounded-[30px] border border-[#17131c]/10 bg-[#f7f4ed] p-6 sm:p-7">

              <div className="flex items-start justify-between gap-5">

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#7351d8]">
                    03 / Optional signal
                  </p>

                  <h3 className="mt-2 text-xl font-black">
                    Registration location
                  </h3>

                  <p className="mt-2 max-w-sm text-xs leading-5 text-[#77707a]">
                    Add the current device location to the
                    employee profile. This is optional.
                  </p>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ece7dd] text-lg">
                  ◎
                </div>
              </div>

              <div className="mt-6">

                {!locationEnabled ? (
                  <button
                    type="button"
                    onClick={enableLocation}
                    className="w-full rounded-2xl border border-[#17131c]/15 px-5 py-4 text-xs font-black uppercase tracking-[0.18em] transition hover:border-[#7351d8] hover:bg-[#7351d8]/5"
                  >
                    Add current location
                  </button>
                ) : (
                  <div className="rounded-2xl bg-[#17131c] p-4 text-white">
                    <div className="flex items-center justify-between">

                      <div>
                        <p className="text-[9px] uppercase tracking-[0.2em] text-[#a79fae]">
                          Location captured
                        </p>

                        <p className="mt-2 text-xs font-bold text-[#e8c96b]">
                          {latitude}, {longitude}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={disableLocation}
                        className="rounded-xl border border-white/15 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.15em] text-white/70 hover:text-white"
                      >
                        Remove
                      </button>

                    </div>
                  </div>
                )}

              </div>
            </div>

          </section>

          {/* SUBMIT */}
          <div className="lg:col-span-2">

            {error && (
              <div className="mb-5 rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-5 rounded-2xl border border-green-300 bg-green-50 px-5 py-4 text-sm font-semibold text-green-700">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-[28px] bg-[#17131c] px-7 py-7 text-left text-white transition hover:bg-[#241d2b] disabled:cursor-not-allowed disabled:opacity-60 sm:px-10"
            >
              <div className="relative z-10 flex items-center justify-between gap-5">

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#a79fae]">
                    Finalize identity
                  </p>

                  <p className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                    {loading
                      ? "Creating profile..."
                      : "Register Employee"}
                  </p>
                </div>

                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#e8c96b] text-2xl font-black text-[#17131c] transition group-hover:translate-x-1">
                  →
                </div>

              </div>

              <div className="absolute bottom-0 left-0 h-1 w-full bg-[#e8c96b]" />
            </button>

            <div className="mt-5 flex flex-col justify-between gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#817983] sm:flex-row">
              <span>
                TALENTRONAUT PVT LTD / PEOPLE REGISTRY
              </span>

              <span>
                Secure identity creation
              </span>
            </div>

          </div>

        </form>
      </div>
    </main>
  );
}