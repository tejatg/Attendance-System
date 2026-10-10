"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AttendanceStatus = "Present" | "Absent" | "Late";

interface EmployeeAttendance {
  id: string;
  name: string;
  employeeId: string;
  date: string;
  arrivalTime: string;
  departureTime: string;
  status: AttendanceStatus;
}

const attendanceData: EmployeeAttendance[] = [
  {
    id: "1",
    name: "Rahul Sharma",
    employeeId: "EMP001",
    date: "2026-10-01",
    arrivalTime: "09:02 AM",
    departureTime: "06:05 PM",
    status: "Present",
  },
  {
    id: "2",
    name: "Priya Patil",
    employeeId: "EMP002",
    date: "2026-10-01",
    arrivalTime: "09:18 AM",
    departureTime: "06:10 PM",
    status: "Late",
  },
  {
    id: "3",
    name: "Amit Joshi",
    employeeId: "EMP003",
    date: "2026-10-01",
    arrivalTime: "08:55 AM",
    departureTime: "05:58 PM",
    status: "Present",
  },
  {
    id: "4",
    name: "Sneha Kulkarni",
    employeeId: "EMP004",
    date: "2026-10-01",
    arrivalTime: "--",
    departureTime: "--",
    status: "Absent",
  },
  {
    id: "5",
    name: "Vikram Singh",
    employeeId: "EMP005",
    date: "2026-10-01",
    arrivalTime: "09:25 AM",
    departureTime: "06:20 PM",
    status: "Late",
  },

  {
    id: "6",
    name: "Rahul Sharma",
    employeeId: "EMP001",
    date: "2026-10-02",
    arrivalTime: "08:58 AM",
    departureTime: "06:02 PM",
    status: "Present",
  },
  {
    id: "7",
    name: "Priya Patil",
    employeeId: "EMP002",
    date: "2026-10-02",
    arrivalTime: "09:05 AM",
    departureTime: "06:00 PM",
    status: "Present",
  },
  {
    id: "8",
    name: "Amit Joshi",
    employeeId: "EMP003",
    date: "2026-10-02",
    arrivalTime: "09:21 AM",
    departureTime: "06:15 PM",
    status: "Late",
  },
  {
    id: "9",
    name: "Sneha Kulkarni",
    employeeId: "EMP004",
    date: "2026-10-02",
    arrivalTime: "09:00 AM",
    departureTime: "06:01 PM",
    status: "Present",
  },
  {
    id: "10",
    name: "Vikram Singh",
    employeeId: "EMP005",
    date: "2026-10-02",
    arrivalTime: "--",
    departureTime: "--",
    status: "Absent",
  },

  {
    id: "11",
    name: "Rahul Sharma",
    employeeId: "EMP001",
    date: "2026-10-03",
    arrivalTime: "09:10 AM",
    departureTime: "06:05 PM",
    status: "Late",
  },
  {
    id: "12",
    name: "Priya Patil",
    employeeId: "EMP002",
    date: "2026-10-03",
    arrivalTime: "08:55 AM",
    departureTime: "06:00 PM",
    status: "Present",
  },
  {
    id: "13",
    name: "Amit Joshi",
    employeeId: "EMP003",
    date: "2026-10-03",
    arrivalTime: "09:01 AM",
    departureTime: "06:03 PM",
    status: "Present",
  },
  {
    id: "14",
    name: "Sneha Kulkarni",
    employeeId: "EMP004",
    date: "2026-10-03",
    arrivalTime: "09:14 AM",
    departureTime: "06:10 PM",
    status: "Late",
  },
  {
    id: "15",
    name: "Vikram Singh",
    employeeId: "EMP005",
    date: "2026-10-03",
    arrivalTime: "08:57 AM",
    departureTime: "06:00 PM",
    status: "Present",
  },

  {
    id: "16",
    name: "Rahul Sharma",
    employeeId: "EMP001",
    date: "2026-10-06",
    arrivalTime: "09:03 AM",
    departureTime: "06:05 PM",
    status: "Present",
  },
  {
    id: "17",
    name: "Priya Patil",
    employeeId: "EMP002",
    date: "2026-10-06",
    arrivalTime: "09:20 AM",
    departureTime: "06:10 PM",
    status: "Late",
  },
  {
    id: "18",
    name: "Amit Joshi",
    employeeId: "EMP003",
    date: "2026-10-06",
    arrivalTime: "08:52 AM",
    departureTime: "05:55 PM",
    status: "Present",
  },
  {
    id: "19",
    name: "Sneha Kulkarni",
    employeeId: "EMP004",
    date: "2026-10-06",
    arrivalTime: "--",
    departureTime: "--",
    status: "Absent",
  },
  {
    id: "20",
    name: "Vikram Singh",
    employeeId: "EMP005",
    date: "2026-10-06",
    arrivalTime: "09:00 AM",
    departureTime: "06:02 PM",
    status: "Present",
  },

  {
    id: "21",
    name: "Rahul Sharma",
    employeeId: "EMP001",
    date: "2026-10-07",
    arrivalTime: "08:59 AM",
    departureTime: "06:00 PM",
    status: "Present",
  },
  {
    id: "22",
    name: "Priya Patil",
    employeeId: "EMP002",
    date: "2026-10-07",
    arrivalTime: "09:17 AM",
    departureTime: "06:08 PM",
    status: "Late",
  },
  {
    id: "23",
    name: "Amit Joshi",
    employeeId: "EMP003",
    date: "2026-10-07",
    arrivalTime: "09:00 AM",
    departureTime: "06:02 PM",
    status: "Present",
  },
  {
    id: "24",
    name: "Sneha Kulkarni",
    employeeId: "EMP004",
    date: "2026-10-07",
    arrivalTime: "09:04 AM",
    departureTime: "06:01 PM",
    status: "Present",
  },
  {
    id: "25",
    name: "Vikram Singh",
    employeeId: "EMP005",
    date: "2026-10-07",
    arrivalTime: "09:26 AM",
    departureTime: "06:15 PM",
    status: "Late",
  },
];

export default function EmployeeDashboard() {
  const router = useRouter();

  const [startDate, setStartDate] = useState("2026-10-01");
  const [endDate, setEndDate] = useState("2026-10-07");

  const filteredAttendance = useMemo(() => {
    return attendanceData.filter((employee) => {
      return employee.date >= startDate && employee.date <= endDate;
    });
  }, [startDate, endDate]);

  const stats = useMemo(() => {
    const totalEmployees = new Set(
      filteredAttendance.map((employee) => employee.employeeId)
    ).size;

    const present = filteredAttendance.filter(
      (employee) => employee.status === "Present"
    ).length;

    const absent = filteredAttendance.filter(
      (employee) => employee.status === "Absent"
    ).length;

    const late = filteredAttendance.filter(
      (employee) => employee.status === "Late"
    ).length;

    return {
      total: totalEmployees,
      present,
      absent,
      late,
    };
  }, [filteredAttendance]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* ================= HEADER ================= */}
        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Employee Dashboard
            </h1>

            <p className="mt-1.5 text-sm text-slate-500">
              Monitor employee attendance and working hours.
            </p>
          </div>

          {/* ACTION BUTTON */}
          <button
            type="button"
            onClick={() => router.push("/employees")}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <span className="text-lg leading-none">+</span>
            Add Employee
          </button>
        </div>

        {/* ================= FILTER BAR ================= */}
        <div className="mb-7 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">

            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Attendance Period
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Select the date range you want to view.
              </p>
            </div>

            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:w-auto">
              <div className="min-w-[190px]">
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
                  max={endDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="min-w-[190px]">
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
                  min={startDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ================= STATISTICS ================= */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Total Employees"
            value={stats.total}
            icon="👥"
            description="Registered employees"
            iconBg="bg-blue-50"
          />

          <StatCard
            title="Present"
            value={stats.present}
            icon="✓"
            description="Present attendance"
            iconBg="bg-emerald-50"
          />

          <StatCard
            title="Absent"
            value={stats.absent}
            icon="×"
            description="Absent attendance"
            iconBg="bg-red-50"
          />

          <StatCard
            title="Late"
            value={stats.late}
            icon="⏰"
            description="Late arrivals"
            iconBg="bg-amber-50"
          />

        </div>

        {/* ================= ATTENDANCE TABLE ================= */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          {/* TABLE HEADER */}
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Employee Attendance
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {formatDate(startDate)} — {formatDate(endDate)}
                </p>
              </div>

              <div className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                {filteredAttendance.length} records
              </div>

            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px]">

              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">

                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Employee
                  </th>

                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Employee ID
                  </th>

                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Date
                  </th>

                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Arrival
                  </th>

                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Departure
                  </th>

                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredAttendance.length > 0 ? (
                  filteredAttendance.map((employee) => (

                    <tr
                      key={employee.id}
                      className="transition hover:bg-slate-50"
                    >

                      {/* EMPLOYEE */}
                      <td className="px-6 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                            {getInitials(employee.name)}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">
                              {employee.name}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              Employee
                            </p>
                          </div>

                        </div>

                      </td>

                      {/* ID */}
                      <td className="px-6 py-4">
                        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {employee.employeeId}
                        </span>
                      </td>

                      {/* DATE */}
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(employee.date)}
                      </td>

                      {/* ARRIVAL */}
                      <td className="px-6 py-4 text-sm font-medium text-slate-700">
                        {employee.arrivalTime}
                      </td>

                      {/* DEPARTURE */}
                      <td className="px-6 py-4 text-sm font-medium text-slate-700">
                        {employee.departureTime}
                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-4">
                        <StatusBadge status={employee.status} />
                      </td>

                    </tr>

                  ))
                ) : (

                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center"
                    >
                      <div className="text-4xl">📅</div>

                      <p className="mt-3 text-sm font-semibold text-slate-700">
                        No attendance records found
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Try selecting a different date range.
                      </p>
                    </td>
                  </tr>

                )}

              </tbody>
            </table>

          </div>
        </section>

      </div>
    </main>
  );
}

/* ================================================= */
/* STAT CARD */
/* ================================================= */

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

      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-lg text-lg ${iconBg}`}
        >
          {icon}
        </div>

      </div>

      <p className="mt-3 text-xs text-slate-500">
        {description}
      </p>

    </div>
  );
}

/* ================================================= */
/* STATUS BADGE */
/* ================================================= */

function StatusBadge({
  status,
}: {
  status: AttendanceStatus;
}) {
  const styles: Record<AttendanceStatus, string> = {
    Present:
      "border-emerald-200 bg-emerald-50 text-emerald-700",

    Absent:
      "border-red-200 bg-red-50 text-red-700",

    Late:
      "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <span
      className={`inline-flex min-w-[76px] justify-center rounded-full border px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

/* ================================================= */
/* HELPERS */
/* ================================================= */

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(date: string): string {
  const [year, month, day] = date.split("-");

  return `${day}-${month}-${year}`;
}