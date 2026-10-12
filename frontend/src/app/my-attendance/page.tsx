
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthError, authedRequest, getEmployeeToken } from "@/util/auth";
import { getApiErrorMessage } from "@/util/error";

type AttendanceRecord = {
  id: number;
  date?: string;
  status?: string;
  checkIn?: string | null;
  checkOut?: string | null;
  checkInPhotoUrl?: string | null;
  checkOutPhotoUrl?: string | null;
};

function formatTime(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatDay(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function duration(start?: string | null, end?: string | null): string {
  if (!start || !end) return "—";

  const ms = new Date(end).getTime() - new Date(start).getTime();

  if (!Number.isFinite(ms) || ms < 0) return "—";

  const minutes = Math.round(ms / 60000);

  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export default function MyAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    async function load() {
      if (!getEmployeeToken()) {
        setNeedsLogin(true);
        setLoading(false);
        return;
      }

      try {
        const response = await authedRequest("/api/attendance/my");

        if (!response.ok) {
          throw new Error(await getApiErrorMessage(response));
        }

        const data = await response.json();

        if (!Array.isArray(data?.attendance)) {
          throw new Error("The server returned an unexpected response.");
        }

        setRecords(data.attendance);
      } catch (err) {
        if (err instanceof AuthError) {
          setNeedsLogin(true);
        } else if (err instanceof TypeError) {
          setError(
            "Cannot reach the server. Check your connection and refresh. If the server was idle, wait 30 seconds first."
          );
        } else {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load attendance records."
          );
        }
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900 sm:py-10">
      <div className="mx-auto max-w-4xl rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
        <h1 className="mb-1 text-2xl font-bold">My Attendance</h1>

        <p className="mb-6 text-sm text-gray-600">
          Your recorded check-in and check-out history.
        </p>

        {loading && <p className="py-6 text-gray-600">Loading attendance records...</p>}

        {!loading && needsLogin && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
            Please sign in to view your attendance.{" "}
            <Link
              href="/employee-login?next=/my-attendance"
              className="font-semibold underline"
            >
              Sign in
            </Link>
          </div>
        )}

        {!loading && !needsLogin && error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {!loading && !needsLogin && !error && records.length === 0 && (
          <p className="rounded-lg bg-gray-50 p-4 text-gray-600">
            No attendance records yet.
          </p>
        )}

        {!loading && !needsLogin && !error && records.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3">Date</th>
                  <th className="p-3">Check-In</th>
                  <th className="p-3">Check-Out</th>
                  <th className="p-3">Hours</th>
                  <th className="p-3">Photos</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b">
                    <td className="p-3">{formatDay(record.checkIn || record.date)}</td>
                    <td className="p-3">{formatTime(record.checkIn)}</td>
                    <td className="p-3">
                      {record.checkOut ? formatTime(record.checkOut) : record.checkIn ? "In progress" : "—"}
                    </td>
                    <td className="p-3">{duration(record.checkIn, record.checkOut)}</td>
                    <td className="p-3 space-x-2">
                      {record.checkInPhotoUrl && (
                        <a href={record.checkInPhotoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
                          In
                        </a>
                      )}
                      {record.checkOutPhotoUrl && (
                        <a href={record.checkOutPhotoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
                          Out
                        </a>
                      )}
                      {!record.checkInPhotoUrl && !record.checkOutPhotoUrl && "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Link
          href="/attendance"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Back to Attendance
        </Link>
      </div>
    </main>
  );
}
