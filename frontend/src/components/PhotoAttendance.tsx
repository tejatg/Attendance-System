
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AuthError,
  authedRequest,
  clearEmployeeSession,
  getEmployeeName,
  getEmployeeToken,
} from "@/util/auth";
import { getApiErrorMessage } from "@/util/error";
import ErrorMessage from "@/components/ErrorMessage";

type Mode = "check-in" | "check-out";

const COPY: Record<
  Mode,
  {
    title: string;
    intro: string;
    submit: string;
    submitting: string;
    path: string;
    method: "POST" | "PUT";
    endpoint: string;
    accent: string;
  }
> = {
  "check-in": {
    title: "Check In",
    intro: "Take a photo to start your workday.",
    submit: "Submit Check-In",
    submitting: "Checking in...",
    path: "/attendance/check-in",
    method: "POST",
    endpoint: "/api/attendance",
    accent: "bg-blue-600",
  },
  "check-out": {
    title: "Check Out",
    intro: "Take a photo to finish your workday.",
    submit: "Submit Check-Out",
    submitting: "Checking out...",
    path: "/attendance/check-out",
    method: "PUT",
    endpoint: "/api/attendance/checkout",
    accent: "bg-orange-600",
  },
};

function cameraErrorMessage(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";

  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Camera access was denied. Allow camera permission for this site in your browser settings (the lock icon beside the address), then tap Start Camera again.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "No camera was found on this device.";
    case "NotReadableError":
    case "AbortError":
      return "The camera is in use by another app. Close it and try again.";
    default:
      return "Unable to start the camera. Please try again.";
  }
}

/** Best-effort location. Never blocks attendance if unavailable. */
function getLocation(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  });
}

export default function PhotoAttendance({ mode }: { mode: Mode }) {
  const copy = COPY[mode];

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewRef = useRef("");
  const submittingRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [supported, setSupported] = useState(true);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) videoRef.current.srcObject = null;

    setCameraOn(false);
  }, []);

  const setPreviewUrl = useCallback((url: string) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = url;
    setPreview(url);
  }, []);

  // Require sign-in; send the employee to the login page otherwise.
  useEffect(() => {
    if (!getEmployeeToken()) {
      window.location.replace(
        `/employee-login?next=${encodeURIComponent(copy.path)}`
      );
      return;
    }

    setName(getEmployeeName());
    setSupported(!!navigator.mediaDevices?.getUserMedia);
    setReady(true);
  }, [copy.path]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  async function startCamera() {
    if (cameraLoading || loading) return;

    setError("");
    setCameraLoading(true);

    try {
      stopCamera();

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          window.isSecureContext
            ? "This browser does not support camera access."
            : "Camera access needs a secure (HTTPS) connection."
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      streamRef.current = stream;

      const video = videoRef.current;

      if (!video) {
        stopCamera();
        throw new Error("Camera preview is unavailable.");
      }

      video.srcObject = stream;
      await video.play();
      setCameraOn(true);
    } catch (err) {
      stopCamera();
      setError(
        err instanceof DOMException
          ? cameraErrorMessage(err)
          : err instanceof Error
          ? err.message
          : "Unable to start the camera."
      );
    } finally {
      setCameraLoading(false);
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.videoWidth === 0) {
      setError("The camera is not ready yet. Wait for the preview, then try again.");
      return;
    }

    const scale = Math.min(1, 1024 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);

    const context = canvas.getContext("2d");

    if (!context) {
      setError("Unable to capture the photo.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Unable to create the photo. Please try again.");
          return;
        }

        setPhoto(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        setError("");
        stopCamera();
      },
      "image/jpeg",
      0.85
    );
  }

  function retake() {
    if (loading) return;

    setPhoto(null);
    setPreviewUrl("");
    setError("");
    void startCamera();
  }

  async function submit() {
    if (submittingRef.current || !photo) return;

    submittingRef.current = true;
    setLoading(true);
    setError("");

    try {
      setStep("Getting location...");
      const location = await getLocation();

      setStep("Submitting...");

      const formData = new FormData();
      formData.append("photo", photo, `${mode}.jpg`);

      if (location) {
        formData.append("latitude", String(location.latitude));
        formData.append("longitude", String(location.longitude));
      }

      // Generous timeout: a sleeping Render server can take ~50s to wake.
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 75000);

      let response: Response;

      try {
        response = await authedRequest(copy.endpoint, {
          method: copy.method,
          body: formData,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response));
      }

      const data = await response.json().catch(() => ({}));

      setSuccess(data?.message || `${copy.title} recorded successfully.`);
      setPhoto(null);
      setPreviewUrl("");
    } catch (err) {
      if (err instanceof AuthError) {
        window.location.replace(
          `/employee-login?next=${encodeURIComponent(copy.path)}`
        );
        return;
      }

      if (err instanceof DOMException && err.name === "AbortError") {
        setError(
          "The server took too long to respond. Open My Attendance to check whether it was recorded before trying again."
        );
      } else if (err instanceof TypeError) {
        setError(
          "Cannot reach the server. Check your connection and try again. If the server was idle, wait 30 seconds first."
        );
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    } finally {
      setLoading(false);
      setStep("");
      submittingRef.current = false;
    }
  }

  function signOut() {
    clearEmployeeSession();
    window.location.replace("/employee-login");
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center text-gray-600">
        Loading...
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-4 px-4 py-6 text-gray-900 sm:py-10">
      <header className="text-center">
        <h1 className="text-2xl font-bold">{copy.title}</h1>
        <p className="mt-1 text-sm text-gray-600">{copy.intro}</p>
        {name && (
          <p className="mt-2 text-xs text-gray-500">
            Signed in as <span className="font-medium">{name}</span> ·{" "}
            <button type="button" onClick={signOut} className="underline">
              Sign out
            </button>
          </p>
        )}
      </header>

      {success ? (
        <section
          role="status"
          className="flex flex-col items-center gap-4 rounded-xl border border-green-200 bg-green-50 p-6 text-center"
        >
          <p className="text-lg font-semibold text-green-800">{success}</p>
          <p className="text-sm text-green-700">
            {new Date().toLocaleString()}
          </p>
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <Link
              href="/my-attendance"
              className="w-full rounded-lg bg-green-700 px-4 py-3 text-center font-semibold text-white"
            >
              View My Attendance
            </Link>
            <Link
              href="/attendance"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-center font-semibold"
            >
              Back
            </Link>
          </div>
        </section>
      ) : (
        <>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-gray-300 bg-gray-900">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`h-full w-full -scale-x-100 object-cover ${
                cameraOn && !preview ? "" : "hidden"
              }`}
            />

            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Your captured photo"
                className="h-full w-full -scale-x-100 object-cover"
              />
            )}

            {!cameraOn && !preview && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-gray-300">
                {cameraLoading
                  ? "Opening camera..."
                  : "Tap Start Camera, then allow camera access."}
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {!supported && (
            <ErrorMessage
              message={
                window.isSecureContext
                  ? "This browser does not support camera access. Try a current version of Chrome, Edge, Safari or Firefox."
                  : "Camera access needs a secure (HTTPS) connection."
              }
            />
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            {!preview && !cameraOn && (
              <button
                type="button"
                onClick={startCamera}
                disabled={cameraLoading || loading || !supported}
                className={`w-full rounded-lg ${copy.accent} px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {cameraLoading ? "Opening camera..." : "Start Camera"}
              </button>
            )}

            {!preview && cameraOn && (
              <button
                type="button"
                onClick={capturePhoto}
                disabled={loading}
                className={`w-full rounded-lg ${copy.accent} px-4 py-3 font-semibold text-white disabled:opacity-50`}
              >
                Capture Photo
              </button>
            )}

            {preview && (
              <>
                <button
                  type="button"
                  onClick={retake}
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Retake
                </button>

                <button
                  type="button"
                  onClick={submit}
                  disabled={loading}
                  className="w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? step || copy.submitting : copy.submit}
                </button>
              </>
            )}
          </div>

          {loading && (
            <p role="status" className="text-center text-sm text-gray-600">
              Please keep this page open. The first request after a quiet period can take up to a minute.
            </p>
          )}

          <ErrorMessage message={error} />

          <Link
            href="/attendance"
            className="text-center text-sm text-gray-500 underline"
          >
            Back to attendance menu
          </Link>
        </>
      )}
    </main>
  );
}
