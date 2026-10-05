"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL = "https://attendance-backend-2nky.onrender.com";

type Employee = {
  id: number;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  photoUrl?: string | null;
  location?: string | null;
};

type Attendance = {
  id: number;
  employeeId: string;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status?: string;
  latitude?: number | null;
  longitude?: number | null;
};

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getDateOnly(value: string) {
  return new Date(value).toISOString().split("T")[0];
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminDashboardPage() {
  const today = getToday();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [employeesResponse, attendanceResponse] =
        await Promise.all([
          fetch(`${API_URL}/api/employees`),
          fetch(`${API_URL}/api/attendance`),
        ]);

      if (!employeesResponse.ok) {
        throw new Error("Failed to load employees.");
      }

      if (!attendanceResponse.ok) {
        throw new Error("Failed to load attendance.");
      }

      const employeesData = await employeesResponse.json();
      const attendanceData = await attendanceResponse.json();

      setEmployees(employeesData.employees || []);
      setAttendance(attendanceData.attendance || []);
    } catch (error) {
      console.error("Dashboard error:", error);
      setError("Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  const filteredAttendance = useMemo(() => {
    return attendance.filter((record) => {
      const recordDate = getDateOnly(record.date);

      return (
        recordDate >= startDate &&
        recordDate <= endDate
      );
    });
  }, [attendance, startDate, endDate]);

  const presentEmployeeIds = useMemo(() => {
    return new Set(
      filteredAttendance.map(
        (record) => record.employeeId
      )
    );
  }, [filteredAttendance]);

  const totalEmployees = employees.length;

  const presentCount = presentEmployeeIds.size;

  const absentCount = Math.max(
    totalEmployees - presentCount,
    0
  );

  const checkedInCount = filteredAttendance.filter(
    (record) =>
      record.checkIn && !record.checkOut
  ).length;

  const checkedOutCount = filteredAttendance.filter(
    (record) =>
      record.checkIn && record.checkOut
  ).length;

  function getEmployee(employeeId: string) {
    return employees.find(
      (employee) =>
        employee.employeeId === employeeId
    );
  }

  function getEmployeeStatus(employeeId: string) {
    const records = filteredAttendance.filter(
      (record) =>
        record.employeeId === employeeId
    );

    if (records.length === 0) {
      return "Absent";
    }

    const checkedIn = records.some(
      (record) =>
        record.checkIn && !record.checkOut
    );

    if (checkedIn) {
      return "Checked In";
    }

    const checkedOut = records.some(
      (record) =>
        record.checkIn && record.checkOut
    );

    if (checkedOut) {
      return "Checked Out";
    }

    return "Present";
  }

  function getStatusClass(status: string) {
    if (status === "Absent") {
      return "bg-red-100 text-red-700";
    }

    if (status === "Checked In") {
      return "bg-yellow-100 text-yellow-700";
    }

    if (status === "Checked Out") {
      return "bg-green-100 text-green-700";
    }

    return "bg-blue-100 text-blue-700";
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              ADMIN DASHBOARD
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Employee and attendance management
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            className="rounded-xl bg-black px-5 py-3 text-sm font-bold text-white hover:opacity-90"
          >
            REFRESH DATA
          </button>
        </div>

        {/* Date Range */}
        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Date Range Select
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Start Date
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(event) =>
                  setStartDate(event.target.value)
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                End Date
              </label>

              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(event) =>
                  setEndDate(event.target.value)
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-black"
              />
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Statistics */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

          {/* Total Employees */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-sm font-semibold text-gray-500">
              Total Employees
            </p>

            <p className="mt-3 text-4xl font-bold text-gray-900">
              {totalEmployees}
            </p>
          </div>

          {/* Present */}
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
            <p className="text-sm font-semibold text-green-700">
              Present
            </p>

            <p className="mt-3 text-4xl font-bold text-green-800">
              {presentCount}
            </p>
          </div>

          {/* Absent */}
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-semibold text-red-700">
              Absent
            </p>

            <p className="mt-3 text-4xl font-bold text-red-800">
              {absentCount}
            </p>
          </div>

          {/* Checked In */}
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
            <p className="text-sm font-semibold text-yellow-700">
              Checked In
            </p>

            <p className="mt-3 text-4xl font-bold text-yellow-800">
              {checkedInCount}
            </p>
          </div>

          {/* Checked Out */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
            <p className="text-sm font-semibold text-blue-700">
              Checked Out
            </p>

            <p className="mt-3 text-4xl font-bold text-blue-800">
              {checkedOutCount}
            </p>
          </div>

        </section>

        {/* Employee List */}
        <section className="mb-8 rounded-2xl border border-gray-200 bg-white">

          <div className="border-b border-gray-200 px-5 py-5">
            <h2 className="text-xl font-bold text-gray-900">
              Employee List
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading employees...
            </div>
          ) : employees.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No employees found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px]">

                <thead>
                  <tr className="border-b bg-gray-50 text-left text-sm text-gray-600">

                    <th className="px-5 py-4 font-semibold">
                      Photo
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Name
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Department
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Status
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Employee ID
                    </th>

                  </tr>
                </thead>

                <tbody>
                  {employees.map((employee) => {
                    const status =
                      getEmployeeStatus(
                        employee.employeeId
                      );

                    return (
                      <tr
                        key={employee.id}
                        className="border-b last:border-b-0"
                      >

                        <td className="px-5 py-4">
                          {employee.photoUrl ? (
                            <img
                              src={employee.photoUrl}
                              alt={employee.name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-600">
                              {employee.name
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 font-semibold text-gray-900">
                          {employee.name}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {employee.department}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {employee.employeeId}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>

              </table>
            </div>
          )}

        </section>

        {/* Attendance Records */}
        <section className="rounded-2xl border border-gray-200 bg-white">

          <div className="border-b border-gray-200 px-5 py-5">
            <h2 className="text-xl font-bold text-gray-900">
              Attendance Records
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {startDate} to {endDate}
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading attendance...
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No attendance records found for the selected date range.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">

                <thead>
                  <tr className="border-b bg-gray-50 text-left text-sm text-gray-600">

                    <th className="px-5 py-4 font-semibold">
                      Employee
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Department
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Check-In
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Check-Out
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Date
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Status
                    </th>

                  </tr>
                </thead>

                <tbody>
                  {filteredAttendance.map((record) => {
                    const employee =
                      getEmployee(
                        record.employeeId
                      );

                    const status =
                      record.checkIn &&
                      record.checkOut
                        ? "Checked Out"
                        : record.checkIn
                        ? "Checked In"
                        : "Absent";

                    return (
                      <tr
                        key={record.id}
                        className="border-b last:border-b-0"
                      >

                        <td className="px-5 py-4 font-semibold text-gray-900">
                          {employee?.name ||
                            "Unknown Employee"}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {employee?.department || "-"}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {formatDateTime(
                            record.checkIn
                          )}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {formatDateTime(
                            record.checkOut
                          )}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {getDateOnly(
                            record.date
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>

              </table>
            </div>
          )}

        </section>

      </div>
    </main>
  );
}