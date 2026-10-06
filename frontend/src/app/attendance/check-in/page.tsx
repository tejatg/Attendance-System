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

export default function CheckInPage() {
  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const [name, setName] =
    useState("");

  const [department, setDepartment] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [photoBlob, setPhotoBlob] =
    useState<Blob | null>(null);

  const [photoPreview, setPhotoPreview] =
    useState<string | null>(null);

  const [locationEnabled, setLocationEnabled] =
    useState(false);

  const [location, setLocation] =
    useState<{
      latitude: number;
      longitude: number;
    } | null>(null);

  const [cameraStarted, setCameraStarted] =
    useState(false);

  const [cameraLoading, setCameraLoading] =
    useState(false);

  const [cameraError, setCameraError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  /*
  ========================================
  STOP CAMERA
  ========================================
  */

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      streamRef.current = null;
    }

    const video = videoRef.current;

    if (video) {
      video.pause();
      video.srcObject = null;
    }

    setCameraStarted(false);
    setCameraLoading(false);
  };

  /*
  ========================================
  CAMERA CLEANUP
  ========================================
  */

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });

        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  /*
  ========================================
  START CAMERA
  ========================================
  */

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

      /*
      Stop any previous camera stream.
      */

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });

        streamRef.current = null;
      }

      /*
      Request the front-facing camera.
      */

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

      /*
      IMPORTANT:
      The video element is permanently mounted
      in the JSX below.

      Wait until React has a usable video element.
      */

      const attachVideo = async () => {
        const video =
          videoRef.current;

        if (!video) {
          setCameraError(
            "Camera display is not ready. Please try again."
          );

          stream
            .getTracks()
            .forEach((track) => track.stop());

          streamRef.current = null;

          setCameraStarted(false);
          setCameraLoading(false);

          return;
        }

        try {
          video.srcObject = stream;

          video.muted = true;

          video.autoplay = true;

          video.playsInline = true;

          /*
          Wait for camera metadata.
          */

          await new Promise<void>(
            (resolve) => {
              if (
                video.readyState >= 1
              ) {
                resolve();
                return;
              }

              const handleMetadata =
                () => {
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
            }
          );

          /*
          Explicitly start playback.
          */

          await video.play();

          /*
          Verify that the camera
          actually produced video frames.
          */

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
        } catch (videoError) {
          console.error(
            "VIDEO PLAY ERROR:",
            videoError
          );

          stream
            .getTracks()
            .forEach((track) => {
              track.stop();
            });

          streamRef.current = null;

          setCameraStarted(false);
          setCameraLoading(false);

          setCameraError(
            "The camera opened but the live video could not be displayed. Please allow camera access and try again."
          );
        }
      };

      /*
      Run after the current React render cycle.
      */

      requestAnimationFrame(() => {
        void attachVideo();
      });
    } catch (err) {
      console.error(
        "CAMERA ERROR:",
        err
      );

      setCameraStarted(false);
      setCameraLoading(false);

      if (
        err instanceof DOMException
      ) {
        if (
          err.name ===
          "NotAllowedError"
        ) {
          setCameraError(
            "Camera permission was denied. Please allow camera access in your browser and try again."
          );
        } else if (
          err.name ===
          "NotFoundError"
        ) {
          setCameraError(
            "No camera was found on this device."
          );
        } else if (
          err.name ===
          "NotReadableError"
        ) {
          setCameraError(
            "The camera is already being used by another application."
          );
        } else if (
          err.name ===
          "SecurityError"
        ) {
          setCameraError(
            "Camera access was blocked by browser security settings."
          );
        } else {
          setCameraError(
            "Unable to access the camera. Please check your camera permissions."
          );
        }
      } else {
        setCameraError(
          err instanceof Error
            ? err.message
            : "Unable to access the camera."
        );
      }
    }
  };

  /*
  ========================================
  CAPTURE PHOTO
  ========================================
  */

  const capturePhoto = () => {
    setError("");

    const video =
      videoRef.current;

    const canvas =
      canvasRef.current;

    if (!video || !canvas) {
      setError(
        "Camera is not ready."
      );

      return;
    }

    if (
      !streamRef.current ||
      streamRef.current
        .getVideoTracks()
        .length === 0
    ) {
      setError(
        "Camera stream is not active."
      );

      return;
    }

    if (
      video.readyState <
      HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      setError(
        "Camera is still starting. Please wait a moment and try again."
      );

      return;
    }

    if (
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      setError(
        "No camera frame is available. Please wait a moment and try again."
      );

      return;
    }

    canvas.width =
      video.videoWidth;

    canvas.height =
      video.videoHeight;

    const context =
      canvas.getContext("2d");

    if (!context) {
      setError(
        "Unable to capture the photo."
      );

      return;
    }

    /*
    Mirror the front-camera image
    so the captured image looks natural.
    */

    context.save();

    context.translate(
      canvas.width,
      0
    );

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
            "Unable to create attendance photo."
          );

          return;
        }

        setPhotoBlob(blob);

        const previewUrl =
          URL.createObjectURL(blob);

        if (photoPreview) {
          URL.revokeObjectURL(
            photoPreview
          );
        }

        setPhotoPreview(
          previewUrl
        );
      },
      "image/jpeg",
      0.9
    );
  };

  /*
  ========================================
  RETAKE PHOTO
  ========================================
  */

  const retakePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(
        photoPreview
      );
    }

    setPhotoBlob(null);
    setPhotoPreview(null);
    setError("");

    /*
    Restart camera display if necessary.
    */

    if (
      streamRef.current &&
      videoRef.current
    ) {
      videoRef.current.srcObject =
        streamRef.current;

      void videoRef.current.play();

      setCameraStarted(true);
    }
  };

  /*
  ========================================
  LOCATION
  ========================================
  */

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
          latitude:
            position.coords.latitude,

          longitude:
            position.coords.longitude,
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

  /*
  ========================================
  SUBMIT CHECK-IN
  ========================================
  */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!name.trim()) {
      setError(
        "Employee Name is required."
      );

      return;
    }

    if (!department.trim()) {
      setError(
        "Department is required."
      );

      return;
    }

    if (!password) {
      setError(
        "Password is required."
      );

      return;
    }

    if (!photoBlob) {
      setError(
        "Attendance photo is compulsory."
      );

      return;
    }

    setLoading(true);

    try {
      const formData =
        new FormData();

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
          "latitude",
          String(
            location.latitude
          )
        );

        formData.append(
          "longitude",
          String(
            location.longitude
          )
        );
      }

      const response =
        await fetch(
          `${API_BASE}/api/attendance`,
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to complete check-in."
        );
      }

      setMessage(
        data?.message ||
          "Check-In marked successfully."
      );

      setPassword("");

      /*
      Keep the successful
      attendance photo visible.
      */
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while marking attendance."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  ========================================
  UI
  ========================================
  */

  return (
    <main className="min-h-screen bg-[#11110f] text-[#f5f2e9]">
      <style jsx>{`
        .passport-grid {
          background-image:
            linear-gradient(
              rgba(255, 255, 255, 0.035) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.035) 1px,
              transparent 1px
            );
          background-size: 48px 48px;
        }

        .input-line {
          transition:
            border-color 180ms ease,
            background 180ms ease,
            transform 180ms ease;
        }

        .input-line:focus {
          outline: none;
          border-color: #d8ff32;
          background: #181815;
          transform: translateY(-1px);
        }

        .lime-button {
          transition:
            transform 180ms ease,
            box-shadow 180ms ease;
        }

        .lime-button:hover {
          transform: translateY(-2px);
          box-shadow:
            0 12px 35px
            rgba(216, 255, 50, 0.15);
        }

        .photo-frame {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(
              circle at center,
              rgba(216, 255, 50, 0.08),
              transparent 48%
            ),
            #080807;
        }

        .photo-frame::before,
        .photo-frame::after {
          content: "";
          position: absolute;
          width: 26px;
          height: 26px;
          border-color: #d8ff32;
          z-index: 5;
          pointer-events: none;
        }

        .photo-frame::before {
          top: 18px;
          left: 18px;
          border-top: 2px solid;
          border-left: 2px solid;
        }

        .photo-frame::after {
          right: 18px;
          bottom: 18px;
          border-right: 2px solid;
          border-bottom: 2px solid;
        }

        .face-frame {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 180px;
          height: 230px;
          transform: translate(
            -50%,
            -50%
          );
          border: 1px solid
            rgba(216, 255, 50, 0.55);
          border-radius: 48% 48% 45% 45%;
          pointer-events: none;
          z-index: 4;
        }

        .face-frame::before,
        .face-frame::after {
          content: "";
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 50px;
          height: 1px;
          background: #d8ff32;
          opacity: 0.65;
        }

        .face-frame::before {
          top: -10px;
        }

        .face-frame::after {
          bottom: -10px;
        }

        .camera-video {
          transform: scaleX(-1);
          background: #080807;
        }

        @media (max-width: 700px) {
          .passport-grid {
            background-size: 32px 32px;
          }

          .face-frame {
            width: 135px;
            height: 185px;
          }
        }
      `}</style>

      <div className="passport-grid min-h-screen">
        <header className="border-b border-white/10">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-10">
            <div>
              <p className="text-[10px] font-bold tracking-[0.35em] text-[#d8ff32]">
                TALENTRONAUT
              </p>

              <p className="mt-1 text-[9px] tracking-[0.28em] text-white/40">
                PVT LTD / WORKFORCE SYSTEM
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#d8ff32] shadow-[0_0_14px_#d8ff32]" />

              <span className="text-[10px] tracking-[0.25em] text-white/50">
                SECURE SESSION
              </span>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-5 pb-10 pt-12 md:px-10 md:pt-16">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="mb-5 text-xs font-bold tracking-[0.3em] text-[#d8ff32]">
                WORKDAY / 01
              </p>

              <h1 className="max-w-xl text-6xl font-black uppercase leading-[0.82] tracking-[-0.07em] sm:text-7xl md:text-8xl">
                Check
                <br />
                <span className="text-[#d8ff32]">
                  In.
                </span>
              </h1>

              <p className="mt-7 max-w-md text-sm leading-7 text-white/45">
                Establish your official workday session.
                Complete your identity details and capture
                one live attendance image.
              </p>
            </div>

            <div className="border-l border-white/10 pl-6 lg:pl-10">
              <p className="text-[10px] uppercase tracking-[0.28em] text-white/35">
                Attendance protocol
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="border border-[#d8ff32]/40 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-[#d8ff32]">
                  Identity
                </span>

                <span className="border border-white/10 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-white/50">
                  Live Photo
                </span>

                <span className="border border-white/10 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-white/50">
                  Location Optional
                </span>
              </div>
            </div>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-7xl px-5 pb-20 md:px-10"
        >
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            {/* IDENTITY PANEL */}

            <section className="border border-white/10 bg-[#0d0d0b]/80">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                <div>
                  <p className="text-[9px] tracking-[0.25em] text-white/30">
                    SECTION 01
                  </p>

                  <h2 className="mt-1 text-lg font-bold uppercase tracking-tight">
                    Identity
                  </h2>
                </div>

                <span className="text-2xl text-[#d8ff32]">
                  01
                </span>
              </div>

              <div className="space-y-7 p-6 md:p-8">
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                    Employee Name *
                  </label>

                  <input
                    value={name}
                    onChange={(e) =>
                      setName(
                        e.target.value
                      )
                    }
                    placeholder="Enter your full name"
                    className="input-line w-full border-b border-white/20 bg-transparent px-0 py-4 text-lg text-white placeholder:text-white/20"
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                    Department *
                  </label>

                  <input
                    value={department}
                    onChange={(e) =>
                      setDepartment(
                        e.target.value
                      )
                    }
                    placeholder="e.g. IT / HR / Operations"
                    className="input-line w-full border-b border-white/20 bg-transparent px-0 py-4 text-lg text-white placeholder:text-white/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                    Password *
                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    placeholder="Enter employee password"
                    className="input-line w-full border-b border-white/20 bg-transparent px-0 py-4 text-lg text-white placeholder:text-white/20"
                    autoComplete="current-password"
                  />
                </div>

                <div className="border border-white/10 bg-white/[0.02] p-5">
                  <div className="flex gap-4">
                    <div className="text-[#d8ff32]">
                      ✦
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em]">
                        Required to continue
                      </p>

                      <p className="mt-2 text-xs leading-6 text-white/40">
                        Name, department, password and a live
                        attendance photo are mandatory.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* CAMERA PANEL */}

            <section className="border border-white/10 bg-[#0d0d0b]/80">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                <div>
                  <p className="text-[9px] tracking-[0.25em] text-white/30">
                    SECTION 02
                  </p>

                  <h2 className="mt-1 text-lg font-bold uppercase tracking-tight">
                    Attendance Capture
                  </h2>
                </div>

                <span className="text-2xl text-[#d8ff32]">
                  02
                </span>
              </div>

              <div className="p-6 md:p-8">
                <div className="photo-frame aspect-video w-full border border-white/10">
                  {/* 
                  IMPORTANT:
                  VIDEO IS ALWAYS MOUNTED.
                  This fixes the previous black-screen issue.
                  */}

                  <video
                    ref={videoRef}
                    muted
                    autoPlay
                    playsInline
                    className={`camera-video h-full w-full object-cover ${
                      photoPreview ||
                      !cameraStarted
                        ? "opacity-0"
                        : "opacity-100"
                    }`}
                  />

                  {photoPreview && (
                    <img
                      src={photoPreview}
                      alt="Attendance preview"
                      className="absolute inset-0 z-[2] h-full w-full object-cover"
                    />
                  )}

                  {!cameraStarted &&
                    !photoPreview && (
                      <div className="absolute inset-0 z-[2] flex h-full flex-col items-center justify-center px-8 text-center">
                        <div className="mb-5 flex h-16 w-16 items-center justify-center border border-[#d8ff32]/40 text-2xl text-[#d8ff32]">
                          ◉
                        </div>

                        <p className="text-xs font-bold uppercase tracking-[0.2em]">
                          {cameraLoading
                            ? "Starting camera..."
                            : "Camera standby"}
                        </p>

                        <p className="mt-3 max-w-xs text-xs leading-6 text-white/35">
                          {cameraLoading
                            ? "Please allow camera access and wait for the live preview."
                            : "Your camera activates only when you choose to create the attendance image."}
                        </p>
                      </div>
                    )}

                  {cameraStarted &&
                    !photoPreview && (
                      <>
                        <div className="face-frame" />

                        <div className="absolute bottom-4 left-4 right-4 z-[6] flex items-center justify-between">
                          <span className="bg-black/70 px-3 py-2 text-[9px] font-bold tracking-[0.2em] text-[#d8ff32]">
                            ● LIVE CAMERA
                          </span>

                          <span className="bg-black/70 px-3 py-2 text-[9px] tracking-[0.15em] text-white/60">
                            FACE FRAME
                          </span>
                        </div>
                      </>
                    )}

                  {photoPreview && (
                    <div className="absolute bottom-4 left-4 z-[6]">
                      <span className="bg-[#d8ff32] px-3 py-2 text-[9px] font-black tracking-[0.2em] text-black">
                        PHOTO CAPTURED
                      </span>
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
                  {!cameraStarted &&
                    !photoPreview && (
                      <button
                        type="button"
                        onClick={startCamera}
                        disabled={
                          cameraLoading
                        }
                        className="lime-button bg-[#d8ff32] px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-black disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {cameraLoading
                          ? "Starting Camera..."
                          : "Activate Camera"}
                      </button>
                    )}

                  {cameraStarted &&
                    !photoPreview && (
                      <>
                        <button
                          type="button"
                          onClick={
                            capturePhoto
                          }
                          className="lime-button bg-[#d8ff32] px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-black"
                        >
                          Capture Attendance Photo
                        </button>

                        <button
                          type="button"
                          onClick={
                            stopCamera
                          }
                          className="border border-white/15 px-5 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white/70 hover:border-red-400/40 hover:text-white"
                        >
                          Stop Camera
                        </button>
                      </>
                    )}

                  {photoPreview && (
                    <button
                      type="button"
                      onClick={
                        retakePhoto
                      }
                      className="border border-white/15 px-5 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white/70 hover:border-[#d8ff32]/50 hover:text-white"
                    >
                      Retake Photo
                    </button>
                  )}
                </div>

                {!photoPreview && (
                  <p className="mt-4 text-[10px] uppercase tracking-[0.16em] text-white/30">
                    * Live photo required for check-in
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* LOCATION */}

          <section className="mt-6 border border-white/10 bg-[#0d0d0b]/80">
            <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
              <div>
                <p className="text-[9px] tracking-[0.25em] text-white/30">
                  SECTION 03 / OPTIONAL
                </p>

                <h2 className="mt-2 text-lg font-bold uppercase">
                  Mobile Location
                </h2>

                <p className="mt-2 max-w-xl text-xs leading-6 text-white/35">
                  Add your current device location to strengthen
                  attendance verification. Location is optional.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  enableLocation
                }
                className={`px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] ${
                  locationEnabled
                    ? "bg-[#d8ff32] text-black"
                    : "border border-white/15 text-white/70 hover:border-[#d8ff32]/50"
                }`}
              >
                {locationEnabled
                  ? "Location Attached ✓"
                  : "Add Location"}
              </button>
            </div>
          </section>

          {/* ERROR */}

          {error && (
            <div className="mt-6 border border-red-400/20 bg-red-400/5 px-6 py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-300">
                Check-In Blocked
              </p>

              <p className="mt-2 text-sm text-red-200/80">
                {error}
              </p>
            </div>
          )}

          {/* SUCCESS */}

          {message && (
            <div className="mt-6 border border-[#d8ff32]/30 bg-[#d8ff32]/5 px-6 py-6">
              <div className="flex items-start gap-4">
                <div className="text-2xl text-[#d8ff32]">
                  ✓
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d8ff32]">
                    Workday Activated
                  </p>

                  <p className="mt-2 text-lg font-bold">
                    {message}
                  </p>

                  <p className="mt-2 text-xs text-white/40">
                    Your attendance record has been submitted
                    successfully.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* FINAL ACTION */}

          <div className="mt-8 flex flex-col gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[9px] tracking-[0.25em] text-white/30">
                FINAL STEP
              </p>

              <p className="mt-2 text-xs text-white/40">
                Verify your details before activating your workday.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="lime-button min-w-[240px] bg-[#d8ff32] px-8 py-5 text-sm font-black uppercase tracking-[0.16em] text-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading
                ? "Verifying..."
                : "Confirm Check-In →"}
            </button>
          </div>
        </form>

        <footer className="border-t border-white/10 px-5 py-6 md:px-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 text-[9px] uppercase tracking-[0.2em] text-white/25 sm:flex-row sm:items-center sm:justify-between">
            <span>
              TALENTRONAUT PVT LTD
            </span>

            <span>
              SMART ATTENDANCE / WORKDAY CONTROL
            </span>

            <span>
              SYSTEM READY
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}