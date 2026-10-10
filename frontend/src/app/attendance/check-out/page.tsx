
"use client";

import { useEffect, useRef, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://attendance-backend-2nky.onrender.com";

export default function AttendancePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState("");
  const [cameraLoading, setCameraLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    setError("");
    setMessage("");
    setCameraLoading(true);

    try {
      stopCamera();

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera is not supported by this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      streamRef.current = stream;

      if (!videoRef.current) {
        throw new Error("Camera preview is unavailable. Please try again.");
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    } catch (err) {
      stopCamera();
      setError(
        err instanceof Error ? err.message : "Unable to start the camera."
      );
    } finally {
      setCameraLoading(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.videoWidth === 0) {
      setError("Start the camera and wait for the preview.");
      return;
    }

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
          setError("Unable to create the check-out photo.");
          return;
        }

        setPhoto(blob);
        setPreview(URL.createObjectURL(blob));
        stopCamera();
        setError("");
      },
      "image/jpeg",
      0.9
    );
  };

  const retakePhoto = () => {
    setPhoto(null);
    setPreview("");
    setError("");
    setMessage("");
    void startCamera();
  };

  const handleSubmit = async () => {
    setError("");
    setMessage("");

    if (!photo) {
      setError("Please capture a photo before checking out.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("photo", photo, "check-out-photo.jpg");

      const response = await fetch(
        `${API_BASE}/api/attendance/checkout`,
        {
          method: "PUT",
          body: formData,
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Unable to complete check-out.");
      }

      setMessage(data?.message || "Check-out completed successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-5 p-6 text-center">
      <h1 className="text-2xl font-bold">Attendance Check-Out</h1>

      <p>Capture your photo to close your attendance session.</p>

      <div className="w-full overflow-hidden rounded-lg border">
        {preview ? (
          <img
            src={preview}
            alt="Check-out photo preview"
            className="aspect-video w-full object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="aspect-video w-full object-cover"
          />
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {!preview ? (
        <>
          <button
            type="button"
            onClick={startCamera}
            disabled={cameraLoading}
            className="w-full rounded bg-orange-500 px-4 py-3 font-semibold text-black disabled:opacity-50"
          >
            {cameraLoading ? "Starting Camera..." : "Start Camera"}
          </button>

          <button
            type="button"
            onClick={capturePhoto}
            className="w-full rounded border px-4 py-3"
          >
            Capture Photo
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={retakePhoto}
            className="w-full rounded border px-4 py-3"
          >
            Retake Photo
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded bg-green-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Checking Out..." : "Confirm Check-Out"}
          </button>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}
    </main>
  );
}
