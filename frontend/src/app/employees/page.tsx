"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://attendance-backend-2nky.onrender.com";

export default function RegisterEmployeePage() {
  const router = useRouter();

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

  /*
   * Camera does NOT start automatically.
   */
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  /*
   * BACK TO DASHBOARD
   */
  function goToDashboard() {
    stopCamera();
    router.push("/dashboard");
  }

  /*
   * START CAMERA
   */
  async function startCamera() {
    try {
      setCameraError("");
      setError("");

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          "Camera access is not supported by this browser."
        );
        return;
      }

      stopCamera();

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

      streamRef.current = stream;

      const video = videoRef.current;

      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        setCameraError(
          "Camera preview is not available. Please try again."
        );
        return;
      }

      video.srcObject = stream;

      await new Promise<void>((resolve) => {
        if (video.readyState >= 1) {
          resolve();
          return;
        }

        video.onloadedmetadata = () => {
          resolve();
        };
      });

      await video.play();

      setCameraReady(true);
    } catch (err) {
      console.error("Camera error:", err);

      setCameraReady(false);

      setCameraError(
        "Camera permission is required. Please allow camera access and try again."
      );
    }
  }

  /*
   * STOP CAMERA
   */
  function stopCamera() {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
  }

  /*
   * CAPTURE PHOTO
   */
  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      setError("Camera is not ready.");
      return;
    }

    if (!video.videoWidth || !video.videoHeight) {
      setError(
        "Camera image is not ready. Please wait a moment."
      );
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setError("Unable to capture camera image.");
      return;
    }

    context.save();

    context.translate(canvas.width, 0);
    context.scale(-1, 1);

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    context.restore();

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

        stopCamera();
      },
      "image/jpeg",
      0.9
    );
  }

  /*
   * RETAKE PHOTO
   */
  function retakePhoto() {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoBlob(null);
    setPhotoPreview("");

    setError("");
    setSuccess("");

    stopCamera();
  }

  /*
   * GET LOCATION
   */
  function enableLocation() {
    setError("");
    setSuccess("");

    if (!navigator.geolocation) {
      setError(
        "Location is not supported by this browser."
      );
      return;
    }

    setLocationEnabled(false);
    setLatitude("");
    setLongitude("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setLatitude(String(lat));
        setLongitude(String(lng));

        setLocationEnabled(true);

        setError("");
      },
      (locationError) => {
        console.error(
          "Location error:",
          locationError
        );

        setLocationEnabled(false);
        setLatitude("");
        setLongitude("");

        if (locationError.code === 1) {
          setError(
            "Location permission was denied. Please allow Location permission in your browser and click Get Location again."
          );
        } else if (locationError.code === 2) {
          setError(
            "Your location could not be determined. Please try again."
          );
        } else if (locationError.code === 3) {
          setError(
            "Location request timed out. Please try again."
          );
        } else {
          setError(
            "Unable to get your location. Please try again."
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  /*
   * REMOVE LOCATION
   */
  function disableLocation() {
    setLocationEnabled(false);
    setLatitude("");
    setLongitude("");
  }

  /*
   * GENERATE EMPLOYEE ID
   */
  function generateEmployeeId() {
    return `EMP${Date.now()
      .toString()
      .slice(-8)}`;
  }

  /*
   * GENERATE EMAIL
   */
  function generateEmail(employeeName: string) {
    const cleanName = employeeName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "");

    return `${
      cleanName || "employee"
    }.${Date.now()}@talentronaut.local`;
  }

  /*
   * REGISTER EMPLOYEE
   */
  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
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
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Password and confirmation password do not match."
      );
      return;
    }

    if (!photoBlob) {
      setError(
        "Employee identity photo is compulsory."
      );
      return;
    }

    /*
     * LOCATION REQUIRED
     */
    if (
      !locationEnabled ||
      !latitude ||
      !longitude
    ) {
      setError(
        "Employee Location is required. Please click Get Location and allow location permission."
      );
      return;
    }

    try {
      setLoading(true);

      const employeeId = generateEmployeeId();
      const email = generateEmail(cleanName);

      const formData = new FormData();

      formData.append(
        "employeeId",
        employeeId
      );

      formData.append(
        "name",
        cleanName
      );

      formData.append(
        "email",
        email
      );

      formData.append(
        "department",
        cleanDepartment
      );

      formData.append(
        "password",
        password
      );

      formData.append(
        "confirmPassword",
        confirmPassword
      );

      /*
       * IMPORTANT:
       * Backend expects "location"
       * as "latitude, longitude"
       */
      const locationValue =
        `${latitude}, ${longitude}`;

      formData.append(
        "location",
        locationValue
      );

      formData.append(
        "photo",
        photoBlob,
        `${employeeId}.jpg`
      );

      console.log(
        "Submitting employee location:",
        locationValue
      );

      const response = await fetch(
        `${API_BASE}/api/employees`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data =
        await response
          .json()
          .catch(() => ({}));

      console.log(
        "Employee registration response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Employee registration failed."
        );
      }

      setSuccess(
        `Employee profile created successfully. Employee ID: ${
          data?.employee?.employeeId ||
          employeeId
        }`
      );

      setName("");
      setDepartment("");
      setPassword("");
      setConfirmPassword("");

      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }

      setPhotoBlob(null);
      setPhotoPreview("");

      disableLocation();

      stopCamera();
    } catch (err) {
      console.error(
        "Employee registration error:",
        err
      );

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
    <main className="min-h-screen bg-slate-100 text-slate-900">

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* HEADER */}

        <header className="mb-8 flex items-center justify-between border-b border-slate-200 pb-5">

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Employee Registration
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Register a new employee for attendance
              management.
            </p>
          </div>

          {/* BACK TO DASHBOARD BUTTON */}

          <button
            type="button"
            onClick={goToDashboard}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            <span className="text-base">
              ←
            </span>

            <span>
              Back to Dashboard
            </span>
          </button>

        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* EMPLOYEE INFORMATION */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-6">

              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                01 / Employee Information
              </p>

              <h2 className="mt-1 text-xl font-bold">
                Basic Details
              </h2>

            </div>

            <div className="grid gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Employee Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Enter employee name"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Department
                </label>

                <input
                  type="text"
                  value={department}
                  onChange={(e) =>
                    setDepartment(e.target.value)
                  }
                  placeholder="Enter department"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Confirm Password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  placeholder="Confirm password"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

            </div>
          </section>

          {/* PHOTO + LOCATION */}

          <section className="grid gap-6 lg:grid-cols-2">

            {/* PHOTO */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="mb-5">

                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  02 / Identity Photo
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  Employee Photo
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Camera starts only when you click
                  Start Camera.
                </p>

              </div>

              <div className="overflow-hidden rounded-2xl bg-slate-900">

                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`aspect-video w-full object-cover ${
                    cameraReady
                      ? "block"
                      : "hidden"
                  }`}
                />

                {!cameraReady &&
                  !photoPreview && (
                    <div className="flex aspect-video items-center justify-center p-6 text-center text-slate-400">

                      <div>

                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-2xl">
                          📷
                        </div>

                        <p className="font-semibold text-white">
                          Camera is off
                        </p>

                        <p className="mt-1 text-xs">
                          Click Start Camera
                          below.
                        </p>

                      </div>

                    </div>
                  )}

                {photoPreview && (
                  <img
                    src={photoPreview}
                    alt="Employee preview"
                    className="aspect-video w-full object-cover"
                  />
                )}

              </div>

              {cameraError && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {cameraError}
                </div>
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">

                {!cameraReady &&
                  !photoPreview && (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                    >
                      Start Camera
                    </button>
                  )}

                {cameraReady && (
                  <>
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-700"
                    >
                      Capture Photo
                    </button>

                    <button
                      type="button"
                      onClick={stopCamera}
                      className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      Stop Camera
                    </button>
                  </>
                )}

                {photoPreview && (
                  <button
                    type="button"
                    onClick={retakePhoto}
                    className="rounded-xl border border-blue-300 px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50 sm:col-span-2"
                  >
                    Retake Photo
                  </button>
                )}

              </div>

              <p className="mt-4 text-xs text-slate-500">
                Identity photo is required for
                attendance verification.
              </p>

              <canvas
                ref={canvasRef}
                className="hidden"
              />

            </div>

            {/* LOCATION */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="mb-5">

                <div className="flex items-center gap-2">

                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    03 / Required Location
                  </p>

                  <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-bold text-red-600">
                    REQUIRED
                  </span>

                </div>

                <h2 className="mt-1 text-xl font-bold">
                  Employee Location
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Current location is required to
                  register the employee.
                </p>

              </div>

              {!locationEnabled ? (

                <div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

                    <p className="text-sm font-semibold text-blue-900">
                      Location permission required
                    </p>

                    <p className="mt-1 text-xs leading-5 text-blue-700">
                      Click Get Location and select
                      Allow when your browser asks
                      for location permission.
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={enableLocation}
                    className="mt-4 w-full rounded-xl bg-blue-600 px-5 py-4 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    📍 Get Location
                  </button>

                </div>

              ) : (

                <div>

                  <div className="rounded-xl border border-green-200 bg-green-50 p-5">

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <p className="text-sm font-bold text-green-800">
                          ✓ Location Captured
                        </p>

                        <p className="mt-3 text-xs text-green-700">
                          Latitude
                        </p>

                        <p className="mt-1 font-mono text-sm font-bold text-green-900">
                          {latitude}
                        </p>

                        <p className="mt-3 text-xs text-green-700">
                          Longitude
                        </p>

                        <p className="mt-1 font-mono text-sm font-bold text-green-900">
                          {longitude}
                        </p>

                      </div>

                      <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white">
                        READY
                      </span>

                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={enableLocation}
                    className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Refresh Location
                  </button>

                  <button
                    type="button"
                    onClick={disableLocation}
                    className="mt-2 w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50"
                  >
                    Remove Location
                  </button>

                </div>
              )}

              <div className="mt-5 rounded-xl bg-slate-50 p-4">

                <p className="text-xs font-semibold text-slate-700">
                  Data sent to backend:
                </p>

                <p className="mt-2 break-all font-mono text-xs text-slate-500">
                  location ={" "}
                  {locationEnabled &&
                  latitude &&
                  longitude
                    ? `${latitude}, ${longitude}`
                    : "Not captured"}
                </p>

              </div>

            </div>

          </section>

          {/* ERROR */}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">

              <div className="flex items-start gap-3">
                <span>⚠️</span>
                <span>{error}</span>
              </div>

            </div>
          )}

          {/* SUCCESS */}

          {success && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-semibold text-green-700">

              <div className="flex items-start gap-3">
                <span>✓</span>
                <span>{success}</span>
              </div>

            </div>
          )}

          {/* FINALIZE */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-5">

              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                04 / Finalize
              </p>

              <h2 className="mt-1 text-xl font-bold">
                Register Employee
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Make sure the photo and location
                have been captured before registering.
              </p>

            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-3">

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-xs text-slate-500">
                  Employee
                </p>

                <p className="mt-1 text-sm font-bold">
                  {name || "Not entered"}
                </p>

              </div>

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-xs text-slate-500">
                  Photo
                </p>

                <p className="mt-1 text-sm font-bold">
                  {photoBlob
                    ? "Captured ✓"
                    : "Required"}
                </p>

              </div>

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-xs text-slate-500">
                  Location
                </p>

                <p className="mt-1 text-sm font-bold">
                  {locationEnabled
                    ? "Captured ✓"
                    : "Required"}
                </p>

              </div>

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-6 py-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Registering Employee..."
                : "Register Employee"}
            </button>

          </section>

        </form>
      </div>
    </main>
  );
}