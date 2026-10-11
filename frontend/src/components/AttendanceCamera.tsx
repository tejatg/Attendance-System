
"use client";

import type { RefObject } from "react";

type AttendanceCameraProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  preview: string;
};

export default function AttendanceCamera({
  videoRef,
  preview,
}: AttendanceCameraProps) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-300 bg-gray-100">
      {preview ? (
        <img
          src={preview}
          alt="Attendance photo preview"
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
  );
}
