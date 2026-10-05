"use client";

import { useEffect, useRef, useState } from "react";

const API_URL = "https://attendance-backend-2nky.onrender.com";

export default function EmployeesPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] =
    useState<MediaStream | null>(null);

  const [photoCaptured, setPhotoCaptured] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
    if (registered) {
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

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Unable to create employee photo.");
          return;
        }

        const image = canvas.toDataURL("image/jpeg", 0.9);

        setPhotoPreview(image);
        setPhotoBlob(blob);
        setPhotoCaptured(true);

        stopCamera();

        setMessage("Employee photo captured successfully.");
      },
      "image/jpeg",
      0.9
    );
  };

  const retakePhoto = () => {
    if (registered) {
      return;
    }

    setPhotoPreview("");
    setPhotoBlob(null);
    setPhotoCaptured(false);
    setError("");
    setMessage("");

    openCamera();
  };

  const getCurrentLocation = () => {
    if (registered) {
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

        setMessage("Location captured successfully.");
      },
      (err) => {
        console.error("Location error:", err);

        if (err.code === 1) {
          setError(
            "Location permission was denied. You can continue registration without location."
          );
        } else if (err.code === 2) {
          setError(
            "Your location could not be determined. You can continue registration without location."
          );
        } else if (err.code === 3) {
          setError(
            "Location request timed out. You can continue registration without location."
          );
        } else {
          setError(
            "Unable to get your current location. You can continue registration without location."
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

    if (!confirmPassword.trim()) {
      setError("Confirm Employee Password is required.");
      return false;
    }

    if (password !== confirmPassword) {
      setError(
        "Employee Password and Confirm Employee Password do not match."
      );
      return false;
    }

    if (!photoCaptured || !photoBlob) {
      setError(
        "Employee photo is compulsory. Please capture your photo."
      );
      return false;
    }

    return true;
  };

  const registerEmployee = async () => {
    if (registered) {
      return;
    }

    setError("");
    setMessage("");

    if (!validateForm()) {
      return;
    }

    if (!photoBlob) {
      setError("Employee photo is compulsory.");
      return;
    }

    try {
      setLoading(true);

      setMessage("Registering employee...");

      const timestamp = Date.now();

      const employeeId =
        "EMP" + timestamp.toString().slice(-8);

      const safeName = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ".");

      const email =
        safeName +
        "." +
        timestamp +
        "@talentronaut.local";

      const formData = new FormData();

      formData.append("employeeId", employeeId);
      formData.append("name", name.trim());
      formData.append("email", email);
      formData.append("department", department.trim());
      formData.append("password", password);
      formData.append("confirmPassword", confirmPassword);

      if (latitude !== null) {
        formData.append("latitude", String(latitude));
      }

      if (longitude !== null) {
        formData.append("longitude", String(longitude));
      }

      formData.append(
        "location",
        latitude !== null && longitude !== null
          ? `${latitude},${longitude}`
          : ""
      );

      formData.append(
        "photo",
        photoBlob,
        "employee-photo.jpg"
      );

      const response = await fetch(
        `${API_URL}/api/employees`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Employee registration failed."
        );

        setMessage("");
        return;
      }

      setRegistered(true);

      setMessage(
        "Employee Registered Successfully."
      );

      setPassword("");
      setConfirmPassword("");

      stopCamera();
    } catch (err) {
      console.error(
        "Employee registration error:",
        err
      );

      setMessage("");

      setError(
        "Unable to connect to the employee registration server."
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
            Register New Employee
          </p>
        </div>

        {error && (
          <div className="mt-5 rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
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
            disabled={loading || registered}
            autoComplete="name"
            className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-slate-100"
          />

          <label className="mt-4 block text-sm font-semibold">
            Employee Department *
          </label>

          <input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Enter Employee Department"
            disabled={loading || registered}
            autoComplete="organization"
            className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-slate-100"
          />

          <label className="mt-4 block text-sm font-semibold">
            Employee Password *
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter Employee Password"
            minLength={6}
            disabled={loading || registered}
            autoComplete="new-password"
            className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-slate-100"
          />

          <label className="mt-4 block text-sm font-semibold">
            Confirm Employee Password *
          </label>

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            placeholder="Confirm Employee Password"
            minLength={6}
            disabled={loading || registered}
            autoComplete="new-password"
            className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
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
              disabled={loading || registered}
              className="mt-4 w-full rounded-lg bg-purple-600 px-4 py-3 font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                disabled={registered}
                className="mt-4 w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                Capture Photo
              </button>

              <button
                type="button"
                onClick={stopCamera}
                disabled={registered}
                className="mt-3 w-full rounded-lg border px-4 py-3 disabled:opacity-50"
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
                Photo Captured
              </p>

              <button
                type="button"
                onClick={retakePhoto}
                disabled={loading || registered}
                className="mt-3 w-full rounded-lg border px-4 py-3 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Retake Photo
              </button>
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">
            3. Mobile Location (Optional)
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Mobile location is optional.
          </p>

          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={loading || registered}
            className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Get My Location
          </button>

          {latitude !== null && longitude !== null && (
            <div className="mt-4 rounded-lg bg-green-50 p-4 text-sm">
              <p>Latitude: {latitude}</p>
              <p>Longitude: {longitude}</p>

              <p className="mt-2 font-semibold text-green-600">
                Location Captured
              </p>
            </div>
          )}

          {latitude === null &&
            longitude === null && (
              <p className="mt-3 text-xs text-slate-500">
                You can register the employee without
                providing mobile location.
              </p>
            )}
        </section>

        <section className="mt-8">
          <button
            type="button"
            onClick={registerEmployee}
            disabled={loading || registered}
            className={
              "w-full rounded-lg px-4 py-4 text-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 " +
              (registered
                ? "bg-green-700"
                : "bg-green-600 hover:bg-green-700")
            }
          >
            {registered
              ? "REGISTER EMPLOYEE - COMPLETED"
              : loading
              ? "REGISTERING EMPLOYEE..."
              : "REGISTER EMPLOYEE"}
          </button>
        </section>

        <div className="mt-6 rounded-xl bg-slate-50 p-4">
          <p className="font-semibold text-slate-900">
            Registration Requirements
          </p>

          <ul className="mt-3 space-y-2 text-sm">
            <li>
              {name.trim()
                ? "Complete"
                : "Pending"} Employee Name
            </li>

            <li>
              {department.trim()
                ? "Complete"
                : "Pending"} Employee Department
            </li>

            <li>
              {password.trim()
                ? "Complete"
                : "Pending"} Employee Password
            </li>

            <li>
              {confirmPassword.trim()
                ? "Complete"
                : "Pending"} Confirm Employee Password
            </li>

            <li>
              {photoCaptured
                ? "Complete"
                : "Pending"} Employee Photo
            </li>

            <li>
              Mobile Location (Optional)
            </li>
          </ul>
        </div>

        <div className="mt-5 rounded-xl border border-green-100 bg-green-50 p-4 text-xs text-green-800">
          <p className="font-semibold">
            Registration Information
          </p>

          <p className="mt-2">
            Employee ID and Email are generated automatically
            during registration.
          </p>

          <p className="mt-2">
            Employee Password is securely stored by the backend.
          </p>

          <p className="mt-2">
            Employee photo is compulsory.
          </p>

          <p className="mt-2">
            Mobile location is optional.
          </p>
        </div>

      </div>
    </main>
  );
}