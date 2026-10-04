"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL = "https://attendance-backend-2nky.onrender.com";

type Employee = {
  id: number;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  photoUrl?: string | null;
};

type Attendance = {
  id: number;
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  employee?: Employee;
};

export default function Home() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [employeesResponse, attendanceResponse] = await Promise.all([
        fetch(`${API_URL}/api/employees`),
        fetch(`${API_URL}/api/attendance`),
      ]);

      if (!employeesResponse.ok || !attendanceResponse.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const employeesData = await employeesResponse.json();
      const attendanceData = await attendanceResponse.json();

      setEmployees(employeesData.employees || []);
      setAttendance(attendanceData.attendance || []);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to connect to the attendance server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const today = new Date().toDateString();

  const todayAttendance = attendance.filter(
    (record) => new Date(record.date).toDateString() === today
  );

  const presentToday = todayAttendance.filter(
    (record) => record.status.toLowerCase() === "present"
  ).length;

  const lateToday = todayAttendance.filter(
    (record) => record.status.toLowerCase() === "late"
  ).length;

  const absentToday = Math.max(
    employees.length - todayAttendance.length,
    0
  );

  const formatTime = (date: string | null) => {
    if (!date) return "-";

    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold">
              TALENTRONAUT PVT LTD
            </h1>

            <p className="text-sm text-slate-300">
              Smart Employee Attendance Management System
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-slate-300">Today</p>

            <p className="font-semibold">
              {new Date().toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">
            Attendance Dashboard
          </h2>

          <p className="mt-2 text-slate-600">
            Monitor employee attendance and daily activities.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="rounded-xl bg-white p-8 text-center shadow">
            Loading dashboard...
          </div>
        ) : (
          <>
            {/* Statistics */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-white p-6 shadow">
                <p className="text-sm font-medium text-slate-500">
                  Total Employees
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {employees.length}
                </p>
              </div>

              <div className="rounded-xl bg-white p-6 shadow">
                <p className="text-sm font-medium text-slate-500">
                  Present Today
                </p>

                <p className="mt-2 text-3xl font-bold text-green-600">
                  {presentToday}
                </p>
              </div>

              <div className="rounded-xl bg-white p-6 shadow">
                <p className="text-sm font-medium text-slate-500">
                  Absent Today
                </p>

                <p className="mt-2 text-3xl font-bold text-red-600">
                  {absentToday}
                </p>
              </div>

              <div className="rounded-xl bg-white p-6 shadow">
                <p className="text-sm font-medium text-slate-500">
                  Late Today
                </p>

                <p className="mt-2 text-3xl font-bold text-orange-500">
                  {lateToday}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Link
                href="/employees"
                className="rounded-xl bg-blue-600 px-6 py-4 text-center font-semibold text-white shadow transition hover:bg-blue-700"
              >
                Register Employee
              </Link>

              <Link
                href="/employees"
                className="rounded-xl bg-white px-6 py-4 text-center font-semibold text-slate-800 shadow transition hover:bg-slate-50"
              >
                Employee Management
              </Link>

              <button
                onClick={loadDashboard}
                className="rounded-xl bg-white px-6 py-4 font-semibold text-slate-800 shadow transition hover:bg-slate-50"
              >
                Refresh Attendance
              </button>
            </div>

            {/* Attendance Table */}
            <div className="mt-8 overflow-hidden rounded-xl bg-white shadow">
              <div className="border-b px-6 py-5">
                <h3 className="text-xl font-bold text-slate-900">
                  Today&apos;s Attendance
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Live attendance records from the production backend
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-sm text-slate-600">
                    <tr>
                      <th className="px-6 py-4">Employee ID</th>
                      <th className="px-6 py-4">Employee Name</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Check In</th>
                      <th className="px-6 py-4">Check Out</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {todayAttendance.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-8 text-center text-slate-500"
                        >
                          No attendance records for today.
                        </td>
                      </tr>
                    ) : (
                      todayAttendance.map((record) => (
                        <tr
                          key={record.id}
                          className="border-t hover:bg-slate-50"
                        >
                          <td className="px-6 py-4 font-medium">
                            {record.employeeId}
                          </td>

                          <td className="px-6 py-4">
                            {record.employee?.name || "-"}
                          </td>

                          <td className="px-6 py-4">
                            {record.employee?.department || "-"}
                          </td>

                          <td className="px-6 py-4">
                            {formatTime(record.checkIn)}
                          </td>

                          <td className="px-6 py-4">
                            {formatTime(record.checkOut)}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                record.status.toLowerCase() === "present"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-orange-100 text-orange-700"
                              }`}
                            >
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}