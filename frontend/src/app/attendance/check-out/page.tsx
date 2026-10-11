
"use client";

import { useEffect, useRef, useState } from "react";
import AttendanceCamera from "@/components/AttendanceCamera";
import Button from "@/components/Button";
import ErrorMessage from "@/components/ErrorMessage";
import Loading from "@/components/Loading";
import { apiRequest } from "@/util/api";
import {
  getApiErrorMessage,
  getErrorMessage,
} from "@/util/error";

export default function CheckOutPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState("");
  const [cameraLoading, setCameraLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

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

  async function startCamera() {
    setError("");
    setMessage("");
    setCameraLoading(true);

    try {
      stopCamera();

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Camera is unavailable. Use HTTPS or localhost and allow camera access."
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      streamRef.current = stream;

      if (!videoRef.current) {
        stopCamera();
        throw new Error("Camera preview is unavailable.");
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    } catch (err) {
      stopCamera();
      setError(getErrorMessage(err));
    } finally {
      setCameraLoading(false);
    }
  }

  function capturePhoto() {
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
      setError("Unable to capture the check-out photo.");
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
        setError("");
        stopCamera();
      },
      "image/jpeg",
      0.9
    );
  }

  function retakePhoto() {
    setPhoto(null);
    setPreview("");
    setError("");
    setMessage("");
    void startCamera();
  }

  async function handleSubmit() {
    if (!photo) {
      setError("Please capture a photo before checking out.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("photo", photo, "check-out-photo.jpg");

      const response = await apiRequest(
        "/api/attendance/checkout",
        {
          method: "PUT",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response));
      }

      const data = await response.json().catch(() => ({}));
      setMessage(data?.message || "Check-out completed successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-5 p-6 text-center text-gray-900">
      <h1 className="text-2xl font-bold">Attendance Check-Out</h1>
      <p>Capture your photo to close your attendance session.</p>

      <AttendanceCamera videoRef={videoRef} preview={preview} />
      <canvas ref={canvasRef} className="hidden" />

      {cameraLoading && (
        <Loading message="Opening camera..." />
      )}

      {!preview ? (
        <>
          <Button
            onClick={startCamera}
            loading={cameraLoading}
            loadingText="Opening Camera..."
            className="bg-orange-500 text-black"
          >
            Start Camera
          </Button>

          <Button
            onClick={capturePhoto}
            className="border border-gray-300"
          >
            Capture Photo
          </Button>
        </>
      ) : (
        <>
          <Button
            onClick={retakePhoto}
            className="border border-gray-300"
          >
            Retake Photo
          </Button>

          <Button
            onClick={handleSubmit}
            loading={loading}
            loadingText="Checking Out..."
            className="bg-green-600 text-white"
          >
            Confirm Check-Out
          </Button>
        </>
      )}

      {loading && <Loading message="Submitting check-out..." />}
      <ErrorMessage message={error} />

      {message && (
        <p role="status" className="text-sm text-green-700">
          {message}
        </p>
      )}
    </main>
  );
}
