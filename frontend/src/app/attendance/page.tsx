"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://attendance-backend-2nky.onrender.com";

export default function AttendancePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");

  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [cameraStarted, setCameraStarted] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [locationEnabled, setLocationEnabled] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    const video = videoRef.current;

    if (video) {
      video.pause();
      video.srcObject = null;
    }

    setCameraStarted(false);
  };

  const startCamera = async () => {
    setCameraError("");
    setError("");
    setCameraLoading(true);

    try {
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          "Camera access is not supported by this browser."
        );
      }

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        streamRef.current = null;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: "user",
            },
            width: {
              ideal: 1280,
            },
            height: {
              ideal: 720,
            },
            aspectRatio: {
              ideal: 16 / 9,
            },
          },
          audio: false,
        });

      streamRef.current = stream;

      const attachVideo = async () => {
        const video = videoRef.current;

        if (!video) {
          throw new Error(
            "Camera preview is not ready. Please try again."
          );
        }

        video.srcObject = stream;
        video.muted = true;
        video.autoplay = true;
        video.playsInline = true;

        await new Promise<void>((resolve) => {
          if (video.readyState >= 1) {
            resolve();
            return;
          }

          const handleMetadata = () => {
            video.removeEventListener(
              "loadedmetadata",
              handleMetadata
            );

            resolve();
          };

          video.addEventListener(
            "loadedmetadata",
            handleMetadata
          );
        });

        await video.play();

        if (
          video.videoWidth === 0 ||
          video.videoHeight === 0
        ) {
          throw new Error(
            "Camera started but no video frames are available."
          );
        }

        setCameraStarted(true);
        setCameraLoading(false);
      };

      requestAnimationFrame(() => {
        void attachVideo().catch((cameraAttachError) => {
          console.error(cameraAttachError);

          if (streamRef.current) {
            streamRef.current
              .getTracks()
              .forEach((track) => track.stop());

            streamRef.current = null;
          }

          setCameraStarted(false);
          setCameraLoading(false);

          setCameraError(
            cameraAttachError instanceof Error
              ? cameraAttachError.message
              : "Unable to start the camera preview."
          );
        });
      });
    } catch (err) {
      console.error(err);

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        streamRef.current = null;
      }

      setCameraStarted(false);
      setCameraLoading(false);

      if (
        err instanceof DOMException &&
        err.name === "NotAllowedError"
      ) {
        setCameraError(
          "Camera permission was denied. Please allow camera access in your browser settings."
        );
      } else if (
        err instanceof DOMException &&
        err.name === "NotFoundError"
      ) {
        setCameraError(
          "No camera was found on this device."
        );
      } else if (
        err instanceof DOMException &&
        err.name === "NotReadableError"
      ) {
        setCameraError(
          "The camera is currently being used by another application."
        );
      } else {
        setCameraError(
          err instanceof Error
            ? err.message
            : "Unable to start the camera."
        );
      }
    }
  };

  const capturePhoto = () => {
    setError("");

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      setError("Camera is not ready.");
      return;
    }

    if (
      video.readyState < 2 ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      setError(
        "Camera is still starting. Please wait a moment and try again."
      );
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setError("Unable to capture the photo.");
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
          setError(
            "Unable to create check-out photo."
          );
          return;
        }

        if (photoPreview) {
          URL.revokeObjectURL(photoPreview);
        }

        setPhotoBlob(blob);
        setPhotoPreview(
          URL.createObjectURL(blob)
        );

        stopCamera();
      },
      "image/jpeg",
      0.9
    );
  };

  const retakePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoBlob(null);
    setPhotoPreview(null);
    setError("");
    setCameraError("");

    void startCamera();
  };

  const enableLocation = () => {
    setError("");

    if (!navigator.geolocation) {
      setError(
        "Location is not supported on this device."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        setLocationEnabled(true);
      },
      () => {
        setLocationEnabled(false);

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
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!name.trim()) {
      setError("Employee Name is required.");
      return;
    }

    if (!department.trim()) {
      setError("Department is required.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    if (!photoBlob) {
      setError(
        "Check-Out photo is compulsory."
      );
      return;
    }

    setLoading(true);

    try {
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
        "check-out-photo.jpg"
      );

      if (location) {
        formData.append(
          "latitude",
          String(location.latitude)
        );

        formData.append(
          "longitude",
          String(location.longitude)
        );
      }

      const response = await fetch(
        `${API_BASE}/api/attendance/checkout`,
        {
          method: "PUT",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to complete check-out."
        );
      }

      setMessage(
        data?.message ||
          "Check-Out marked successfully."
      );

      setPassword("");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while marking check-out."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#17120e] text-[#f4eadc]">
      <style jsx>{`
        .exit-grid {
          background-image:
            linear-gradient(
              rgba(255, 255, 255, 0.025) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.025) 1px,
              transparent 1px
            );
          background-size: 54px 54px;
        }

        .field {
          transition:
            border-color 180ms ease,
            background 180ms ease,
            box-shadow 180ms ease;
        }

        .field:focus {
          outline: none;
          border-color: #ff8a3d;
          background: #211914;
          box-shadow:
            0 8px 30px rgba(255, 138, 61, 0.06);
        }

        .exit-button {
          transition:
            transform 180ms ease,
            box-shadow 180ms ease;
        }

        .exit-button:hover {
          transform: translateY(-2px);
          box-shadow:
            0 14px 40px rgba(255, 138, 61, 0.18);
        }

        .camera-stage {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 50% 50%,
              rgba(255, 138, 61, 0.08),
              transparent 48%
            ),
            #0e0b09;
        }

        .camera-stage::before,
        .camera-stage::after {
          content: "";
          position: absolute;
          width: 34px;
          height: 34px;
          z-index: 10;
        }

        .camera-stage::before {
          top: 18px;
          left: 18px;
          border-top: 2px solid #ff8a3d;
          border-left: 2px solid #ff8a3d;
        }

        .camera-stage::after {
          right: 18px;
          bottom: 18px;
          border-right: 2px solid #ff8a3d;
          border-bottom: 2px solid #ff8a3d;
        }

        .exit-line {
          height: 2px;
          background: linear-gradient(
            90deg,
            #ff8a3d 0%,
            #ff8a3d 38%,
            rgba(255, 138, 61, 0.12) 38%,
            rgba(255, 138, 61, 0.12) 100%
          );
        }

        .face-frame {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 180px;
          height: 230px;
          transform: translate(-50%, -50%);
          border: 1px solid rgba(255, 138, 61, 0.55);
          border-radius: 48% 48% 45% 45%;
          pointer-events: none;
          z-index: 4;
          box-shadow:
            0 0 30px rgba(255, 138, 61, 0.08);
        }

        @media (max-width: 700px) {
          .exit-grid {
            background-size: 34px 34px;
          }

          .face-frame {
            width: 145px;
            height: 190px;
          }
        }
      `}</style>

      <div className="exit-grid min-h-screen">
        <header className="border-b border-white/10">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-10">
            <div>
              <p className="text-[10px] font-black tracking-[0.35em] text-[#ff8a3d]">
                TALENTRONAUT
              </p>

              <p className="mt-1 text-[9px] tracking-[0.28em] text-white/30">
                PVT LTD / WORKFORCE SYSTEM
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[9px] tracking-[0.25em] text-white/30">
                SESSION CLOSE
              </span>

              <span className="h-2 w-2 rounded-full bg-[#ff8a3d] shadow-[0_0_14px_#ff8a3d]" />
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-5 pb-12 pt-12 md:px-10 md:pt-16">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="mb-5 text-[10px] font-bold tracking-[0.32em] text-[#ff8a3d]">
                WORKDAY / 02 / EXIT PROTOCOL
              </p>

              <h1 className="text-6xl font-black uppercase leading-[0.78] tracking-[-0.075em] sm:text-7xl md:text-8xl lg:text-9xl">
                Sign
                <br />
                <span className="text-[#ff8a3d]">
                  Out.
                </span>
              </h1>

              <p className="mt-8 max-w-xl text-sm leading-7 text-white/40">
                Close your active workday session.
                Verify your identity, create a final
                attendance image and securely submit
                your departure record.
              </p>
            </div>

            <div className="flex flex-col justify-end lg:pb-2">
              <div className="border border-white/10 bg-[#100d0a]/80 p-6">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-[0.25em] text-white/30">
                    Shift state
                  </span>

                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#ff8a3d]">
                    ACTIVE
                  </span>
                </div>

                <div className="mt-6 exit-line" />

                <div className="mt-5 flex justify-between text-[9px] uppercase tracking-[0.2em] text-white/25">
                  <span>START</span>
                  <span>END</span>
                </div>

                <p className="mt-6 text-3xl font-black uppercase tracking-[-0.04em]">
                  Close session
                </p>

                <p className="mt-2 text-xs leading-6 text-white/30">
                  Your active attendance record will be
                  completed after verification.
                </p>
              </div>
            </div>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-7xl px-5 pb-20 md:px-10"
        >
          <section className="border border-white/10 bg-[#100d0a]/90">
            <div className="border-b border-white/10 px-6 py-5 md:px-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] tracking-[0.25em] text-white/25">
                    VERIFY / 01
                  </p>

                  <h2 className="mt-1 text-lg font-black uppercase">
                    Who is leaving?
                  </h2>
                </div>

                <span className="text-3xl font-black text-[#ff8a3d]">
                  A
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-3">
              <div className="border-b border-white/10 p-6 md:border-b-0 md:border-r">
                <label className="mb-3 block text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">
                  Employee Name *
                </label>

                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Full name"
                  className="field w-full border-b border-white/15 bg-transparent px-0 py-4 text-base text-white placeholder:text-white/15"
                  autoComplete="name"
                />
              </div>

              <div className="border-b border-white/10 p-6 md:border-b-0 md:border-r">
                <label className="mb-3 block text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">
                  Department *
                </label>

                <input
                  value={department}
                  onChange={(e) =>
                    setDepartment(e.target.value)
                  }
                  placeholder="Department"
                  className="field w-full border-b border-white/15 bg-transparent px-0 py-4 text-base text-white placeholder:text-white/15"
                />
              </div>

              <div className="p-6">
                <label className="mb-3 block text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">
                  Password *
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Employee password"
                  className="field w-full border-b border-white/15 bg-transparent px-0 py-4 text-base text-white placeholder:text-white/15"
                  autoComplete="current-password"
                />
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="border border-white/10 bg-[#100d0a]/90">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                <div>
                  <p className="text-[9px] tracking-[0.25em] text-white/25">
                    VERIFY / 02
                  </p>

                  <h2 className="mt-1 text-lg font-black uppercase">
                    Departure Capture
                  </h2>
                </div>

                <span className="text-3xl font-black text-[#ff8a3d]">
                  B
                </span>
              </div>

              <div className="p-6 md:p-8">
                <div className="camera-stage aspect-video w-full border border-white/10">
                  <video
                    ref={videoRef}
                    muted
                    autoPlay
                    playsInline
                    className={`h-full w-full object-cover ${
                      photoPreview || !cameraStarted
                        ? "opacity-0"
                        : "opacity-100"
                    }`}
                  />

                  {photoPreview && (
                    <img
                      src={photoPreview}
                      alt="Check-out attendance preview"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}

                  {!photoPreview &&
                    !cameraStarted && (
                      <div className="absolute inset-0 flex h-full flex-col items-center justify-center px-8 text-center">
                        <div className="mb-5 flex h-16 w-16 items-center justify-center border border-[#ff8a3d]/40 text-2xl text-[#ff8a3d]">
                          ↘
                        </div>

                        <p className="text-xs font-black uppercase tracking-[0.2em]">
                          Departure image
                        </p>

                        <p className="mt-3 max-w-sm text-xs leading-6 text-white/30">
                          Capture one final live image before
                          closing the workday session.
                        </p>
                      </div>
                    )}

                  {cameraStarted &&
                    !photoPreview && (
                      <>
                        <div className="face-frame" />

                        <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between">
                          <span className="bg-black/70 px-3 py-2 text-[9px] font-bold tracking-[0.2em] text-[#ff8a3d]">
                            ● LIVE CAMERA
                          </span>

                          <span className="bg-black/70 px-3 py-2 text-[9px] tracking-[0.15em] text-white/40">
                            FACE FRAME
                          </span>
                        </div>
                      </>
                    )}

                  {cameraLoading && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60">
                      <div className="text-center">
                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#ff8a3d]" />

                        <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.2em] text-[#ff8a3d]">
                          Starting Camera...
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <canvas
                  ref={canvasRef}
                  className="hidden"
                />

                {cameraError && (
                  <p className="mt-4 border border-red-400/20 bg-red-400/5 px-4 py-3 text-xs text-red-300">
                    {cameraError}
                  </p>
                )}

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {!cameraStarted ? (
                    <button
                      type="button"
                      onClick={startCamera}
                      disabled={cameraLoading}
                      className="exit-button bg-[#ff8a3d] px-5 py-4 text-xs font-black uppercase tracking-[0.15em] text-black disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {cameraLoading
                        ? "Starting Camera..."
                        : "Start Departure Camera"}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="exit-button bg-[#ff8a3d] px-5 py-4 text-xs font-black uppercase tracking-[0.15em] text-black"
                      >
                        Capture Exit Photo
                      </button>

                      <button
                        type="button"
                        onClick={stopCamera}
                        className="border border-white/15 px-5 py-4 text-xs font-bold uppercase tracking-[0.15em] text-white/65 hover:border-[#ff8a3d]/50 hover:text-white"
                      >
                        Stop Camera
                      </button>
                    </>
                  )}

                  {photoPreview && (
                    <button
                      type="button"
                      onClick={retakePhoto}
                      className="border border-white/15 px-5 py-4 text-xs font-bold uppercase tracking-[0.15em] text-white/65 hover:border-[#ff8a3d]/50 hover:text-white sm:col-span-2"
                    >
                      Retake Image
                    </button>
                  )}
                </div>

                {!photoPreview && (
                  <p className="mt-4 text-[9px] uppercase tracking-[0.18em] text-white/25">
                    * Departure photo required
                  </p>
                )}
              </div>
            </div>

            <aside className="border border-white/10 bg-[#100d0a]/90">
              <div className="border-b border-white/10 px-6 py-5">
                <p className="text-[9px] tracking-[0.25em] text-white/25">
                  VERIFY / 03
                </p>

                <h2 className="mt-1 text-lg font-black uppercase">
                  Exit Signal
                </h2>
              </div>

              <div className="flex h-full flex-col p-6">
                <div className="flex-1">
                  <div className="flex h-28 items-center justify-center border border-[#ff8a3d]/20 bg-[#ff8a3d]/[0.03]">
                    <span className="text-6xl font-black text-[#ff8a3d]">
                      →
                    </span>
                  </div>

                  <p className="mt-7 text-xs font-bold uppercase tracking-[0.16em]">
                    Mobile Location
                  </p>

                  <p className="mt-3 text-xs leading-6 text-white/30">
                    Optional location information can be
                    attached to your departure record.
                  </p>

                  <button
                    type="button"
                    onClick={enableLocation}
                    className={`mt-6 w-full px-5 py-4 text-xs font-black uppercase tracking-[0.15em] ${
                      locationEnabled
                        ? "bg-[#ff8a3d] text-black"
                        : "border border-white/15 text-white/60 hover:border-[#ff8a3d]/50"
                    }`}
                  >
                    {locationEnabled
                      ? "Location Attached ✓"
                      : "Attach Location"}
                  </button>
                </div>

                <div className="mt-10 border-t border-white/10 pt-5">
                  <div className="flex justify-between text-[9px] uppercase tracking-[0.18em] text-white/25">
                    <span>Required</span>

                    <span className="text-[#ff8a3d]">
                      Identity + Photo
                    </span>
                  </div>

                  <div className="mt-3 flex justify-between text-[9px] uppercase tracking-[0.18em] text-white/25">
                    <span>Optional</span>
                    <span>Location</span>
                  </div>
                </div>
              </div>
            </aside>
          </section>

          {error && (
            <div className="mt-6 border border-red-400/20 bg-red-400/5 px-6 py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-300">
                Exit Protocol Blocked
              </p>

              <p className="mt-2 text-sm text-red-200/80">
                {error}
              </p>
            </div>
          )}

          {message && (
            <div className="mt-6 border border-[#ff8a3d]/30 bg-[#ff8a3d]/5 px-6 py-7">
              <div className="flex items-start gap-5">
                <div className="text-3xl text-[#ff8a3d]">
                  ✓
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff8a3d]">
                    Workday Closed
                  </p>

                  <p className="mt-2 text-xl font-black uppercase">
                    {message}
                  </p>

                  <p className="mt-2 text-xs leading-6 text-white/35">
                    Your active attendance session has been
                    completed successfully.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[9px] font-bold tracking-[0.25em] text-white/25">
                FINALIZE WORKDAY
              </p>

              <p className="mt-2 text-xs text-white/35">
                Verify all required information before closing
                your attendance session.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="exit-button min-w-[250px] bg-[#ff8a3d] px-8 py-5 text-sm font-black uppercase tracking-[0.16em] text-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading
                ? "Closing Session..."
                : "Close Workday →"}
            </button>
          </div>
        </form>

        <footer className="border-t border-white/10 px-5 py-6 md:px-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 text-[9px] uppercase tracking-[0.2em] text-white/20 sm:flex-row sm:items-center sm:justify-between">
            <span>TALENTRONAUT PVT LTD</span>

            <span>
              SMART ATTENDANCE / SESSION CLOSURE
            </span>

            <span>EXIT PROTOCOL READY</span>
          </div>
        </footer>
      </div>
    </main>
  );
}