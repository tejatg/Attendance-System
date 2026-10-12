"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = "https://attendance-backend-2nky.onrender.com";

type AttendanceStatus = "Present" | "Absent" | "Late";

interface Employee {
  id?: number | string;
  employeeId?: string;
  name?: string;
  email?: string;
  department?: string;
}

interface AttendanceRecord {
  id: number | string;
  employeeId: string;
  name: string;
  date: string;
  arrivalTime: string;
  departureTime: string;
  status: AttendanceStatus;
}

function getArray(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload as Record<string, unknown>[];
  }

  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;

    for (const key of ["data", "employees", "attendance", "records", "results"]) {
      if (Array.isArray(obj[key])) {
        return obj[key] as Record<string, unknown>[];
      }
    }
  }

  return [];
}

function getText(...values: unknown[]): string {
  for (const value of values) {
    if (value !== null && value !== undefined && String(value).trim()) {
      return String(value);
    }
  }

  return "";
}

function getDate(value: unknown): string {
  if (!value) return "";

  const str = String(value);

  // Preserve date-only values without timezone conversion.
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  const date = new Date(str);

  if (Number.isNaN(date.getTime())) return "";

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getTime(value: unknown): string {
  if (!value) return "--";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    const text = String(value);

    // Also accept an existing time string such as "09:05 AM".
    if (/\b(am|pm)\b/i.test(text)) return text;

    const match = text.match(/^(\d{1,2}):(\d{2})/);

    if (match) {
      const hours = Number(match[1]);
      const minutes = match[2];
      const suffix = hours >= 12 ? "PM" : "AM";
      return `${hours % 12 || 12}:${minutes} ${suffix}`;
    }

    return text;
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function normalizeStatus(value: unknown): AttendanceStatus {
  const status = String(value ?? "").toLowerCase();

  if (status.includes("late")) return "Late";
  if (status.includes("absent")) return "Absent";

  return "Present";
}

function formatDate(date: string): string {
  if (!date) return "—";

  const [year, month, day] = date.split("-");

  return year && month && day ? `${day}-${month}-${year}` : date;
}

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "EM"
  );
}

function normalizeAttendance(
  record: Record<string, unknown>,
  index: number,
  employees: Employee[]
): AttendanceRecord | null {
  const nestedEmployee =
    record.employee && typeof record.employee === "object"
      ? (record.employee as Record<string, unknown>)
      : {};

  const employeeId = getText(
    record.employeeId,
    record.employeeCode,
    nestedEmployee.employeeId,
    nestedEmployee.employeeCode
  );

  const employee = employees.find(
    (item) => item.employeeId === employeeId
  );

  const name = getText(
    record.name,
    record.employeeName,
    nestedEmployee.name,
    employee?.name,
    employeeId,
    "Employee"
  );

  const rawDate = getText(
    record.date,
    record.attendanceDate,
    record.checkIn,
    record.checkInTime,
    record.createdAt
  );

  const date = getDate(rawDate);

  if (!date) return null;

  const checkIn = getText(
    record.checkIn,
    record.checkInTime,
    record.arrivalTime,
    record.inTime
  );

  const checkOut = getText(
    record.checkOut,
    record.checkOutTime,
    record.departureTime,
    record.outTime
  );

  return {
    id: getText(record.id, `${employeeId}-${date}-${index}`),
    employeeId: employeeId || "—",
    name,
    date,
    arrivalTime: getTime(checkIn),
    departureTime: getTime(checkOut),
    status: normalizeStatus(record.status),
  };
}

export default function EmployeeDashboard() {
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("adminToken")
          : null;

      const headers: HeadersInit = {
        Accept: "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const [employeeResponse, attendanceResponse] = await Promise.all([
        fetch(`${API_BASE}/api/employees`, {
          method: "GET",
          headers,
          cache: "no-store",
        }),
        fetch(`${API_BASE}/api/attendance`, {
          method: "GET",
          headers,
          cache: "no-store",
        }),
      ]);

      if (!employeeResponse.ok || !attendanceResponse.ok) {
        const failedEndpoint = !employeeResponse.ok
          ? "employees"
          : "attendance";

        const failedResponse = !employeeResponse.ok
          ? employeeResponse
          : attendanceResponse;

        let details = "";

        try {
          const body = await failedResponse.json();
          details = getText(body.message, body.error);
        } catch {
          // The server did not return JSON.
        }

        if (
          failedResponse.status === 401 ||
          failedResponse.status === 403
        ) {
          throw new Error(
            "Your session may have expired or you do not have permission to view this data. Sign in again."
          );
        }

        throw new Error(
          `Unable to load ${failedEndpoint} data. ${details || `Server returned ${failedResponse.status}.`}`
        );
      }

      const [employeePayload, attendancePayload] = await Promise.all([
        employeeResponse.json(),
        attendanceResponse.json(),
      ]);

      const employeeRows = getArray(employeePayload) as Employee[];

      const attendanceRows = getArray(attendancePayload)
        .map((row, index) =>
          normalizeAttendance(
            row,
            index,
            employeeRows
          )
        )
        .filter(
          (row): row is AttendanceRecord => row !== null
        );

      setEmployees(employeeRows);
      setAttendance(attendanceRows);

      // Default the filters to the dates available in the returned records.
      if (attendanceRows.length > 0) {
        const dates = attendanceRows
          .map((row) => row.date)
          .filter(Boolean)
          .sort();

        setStartDate((previous) => previous || dates[0]);
        setEndDate((previous) => previous || dates[dates.length - 1]);
      } else {
        const today = new Date();
        const localToday = [
          today.getFullYear(),
          String(today.getMonth() + 1).padStart(2, "0"),
          String(today.getDate()).padStart(2, "0"),
        ].join("-");

        setStartDate((previous) => previous || localToday);
        setEndDate((previous) => previous || localToday);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading the dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const filteredAttendance = useMemo(() => {
    const query = search.trim().toLowerCase();

    return attendance
      .filter((row) => {
        const matchesDate =
          (!startDate || row.date >= startDate) &&
          (!endDate || row.date <= endDate);

        const matchesSearch =
          !query ||
          row.name.toLowerCase().includes(query) ||
          row.employeeId.toLowerCase().includes(query);

        return matchesDate && matchesSearch;
      })
      .sort((a, b) => {
        const dateOrder = b.date.localeCompare(a.date);

        if (dateOrder !== 0) return dateOrder;

        return a.name.localeCompare(b.name);
      });
  }, [attendance, startDate, endDate, search]);

  const stats = useMemo(() => {
    const present = filteredAttendance.filter(
      (row) => row.status === "Present"
    ).length;

    const absent = filteredAttendance.filter(
      (row) => row.status === "Absent"
    ).length;

    const late = filteredAttendance.filter(
      (row) => row.status === "Late"
    ).length;

    return {
      totalEmployees: employees.length,
      present,
      absent,
      late,
      records: filteredAttendance.length,
    };
  }, [filteredAttendance, employees.length]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              Attendance Management
            </p>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Employee Dashboard
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Review employee attendance and arrival/departure records.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push("/qr")}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              View QR Code
            </button>

            <button
              type="button"
              onClick={() => router.push("/employees")}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span className="text-lg leading-none">+</span>
              Add Employee
            </button>
          </div>
        </header>

        {error && (
          <section
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-red-800">
                  Unable to load dashboard data
                </h2>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>

              <button
                type="button"
                onClick={() => void loadDashboard()}
                className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                Try Again
              </button>
            </div>
          </section>
        )}

        <section className="mb-7 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Attendance Period
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Filter records by date or search for a particular employee.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div>
                <label
                  htmlFor="start-date"
                  className="mb-1.5 block text-xs font-medium text-slate-600"
                >
                  From
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="end-date"
                  className="mb-1.5 block text-xs font-medium text-slate-600"
                >
                  To
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="employee-search"
                  className="mb-1.5 block text-xs font-medium text-slate-600"
                >
                  Search Employee
                </label>
                <input
                  id="employee-search"
                  type="search"
                  placeholder="Name or employee ID"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Registered Employees"
            value={stats.totalEmployees}
            icon="👥"
            description="Employees returned by the API"
            iconBg="bg-blue-50"
          />

          <StatCard
            title="Present Records"
            value={stats.present}
            icon="✓"
            description="Present status in the selected period"
            iconBg="bg-emerald-50"
          />

          <StatCard
            title="Absent Records"
            value={stats.absent}
            icon="×"
            description="Absent status in the selected period"
            iconBg="bg-red-50"
          />

          <StatCard
            title="Late Records"
            value={stats.late}
            icon="⏰"
            description="Late status in the selected period"
            iconBg="bg-amber-50"
          />
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Employee Attendance
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {startDate && endDate
                    ? `${formatDate(startDate)} — ${formatDate(endDate)}`
                    : "All available dates"}
                </p>
              </div>

              <div className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                {stats.records} records
              </div>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
              <p className="mt-4 text-sm text-slate-500">
                Loading employees and attendance…
              </p>
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="text-4xl" aria-hidden="true">
                📅
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700">
                No attendance records found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try another date range or search term. If this is unexpected,
                check whether the backend contains attendance records.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {[
                      "Employee",
                      "Employee ID",
                      "Date",
                      "Arrival",
                      "Departure",
                      "Status",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredAttendance.map((row) => (
                    <tr
                      key={row.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                            {getInitials(row.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">
                              {row.name}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              Employee
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {row.employeeId}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {formatDate(row.date)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-700">
                        {row.arrivalTime}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-700">
                        {row.departureTime}
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="mt-5 flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Attendance Management System</p>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            disabled={loading}
            className="w-fit font-semibold text-blue-700 hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Refresh data
          </button>
        </footer>
      </div>
    </main>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  description: string;
  iconBg: string;
}

function StatCard({
  title,
  value,
  icon,
  description,
  iconBg,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-lg ${iconBg}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: AttendanceStatus }) {
  const styles: Record<AttendanceStatus, string> = {
    Present: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Absent: "border-red-200 bg-red-50 text-red-700",
    Late: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <span
      className={`inline-flex min-w-[76px] justify-center rounded-full border px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}
