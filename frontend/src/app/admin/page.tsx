
"use client";

import { useEffect, useMemo, useState } from "react";

type Employee = {
  id: number;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  photoUrl?: string | null;
  location?: string | null;
  createdAt?: string;
};

type Attendance = {
  id: number;
  employeeId: string;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status?: string;
  employee?: {
    employeeId?: string;
    name?: string;
    email?: string;
    department?: string;
  };
};

type AdminUser = {
  id: number;
  username: string;
  name?: string | null;
  role: string;
  isActive?: boolean;
};

const API_BASE = "https://attendance-backend-2nky.onrender.com";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dateKey(value: string) {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function formatTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPage() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"overview" | "attendance" | "employees" | "settings">("overview");
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("ALL");
  const [fromDate, setFromDate] = useState(todayKey());
  const [toDate, setToDate] = useState(todayKey());
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  function logout() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    sessionStorage.removeItem("adminAuthenticated");
    window.location.href = "/admin-login";
  }

  async function apiFetch(path: string, options: RequestInit = {}) {
    const token = localStorage.getItem("adminToken");

    if (!token) {
      logout();
      throw new Error("Please log in as administrator.");
    }

    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${token}`);

    if (options.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      cache: "no-store",
    });

    if (response.status === 401 || response.status === 403) {
      logout();
      throw new Error("Your administrator session has expired.");
    }

    return response;
  }

  async function loadData(showLoader = false) {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    setError("");

    try {
      const [meResponse, employeeResponse, attendanceResponse] = await Promise.all([
        apiFetch("/api/admin/me"),
        apiFetch("/api/employees"),
        apiFetch("/api/attendance"),
      ]);

      if (!meResponse.ok) throw new Error("Could not verify administrator session.");
      if (!employeeResponse.ok) throw new Error("Could not load employees.");
      if (!attendanceResponse.ok) throw new Error("Could not load attendance.");

      const meData = await meResponse.json();
      if (!meData?.success || !meData?.admin ||
          meData.admin.role !== "ADMIN" ||
          meData.admin.isActive === false) {
        logout();
        return;
      }

      setAdmin(meData.admin);

      const employeeData = await employeeResponse.json();
      const attendanceData = await attendanceResponse.json();

      setEmployees(
        Array.isArray(employeeData) ? employeeData :
        Array.isArray(employeeData?.employees) ? employeeData.employees : []
      );

      setAttendance(
        Array.isArray(attendanceData) ? attendanceData :
        Array.isArray(attendanceData?.attendance) ? attendanceData.attendance : []
      );

      setAuthenticated(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData(true);
    // Load dashboard data once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const departments = useMemo(() => [
    "ALL",
    ...Array.from(new Set(employees.map(e => e.department).filter(Boolean))),
  ], [employees]);

  const filteredEmployees = useMemo(() => {
    const q = search.toLowerCase().trim();
    return employees.filter(e =>
      (!q || `${e.name} ${e.employeeId} ${e.email} ${e.department}`.toLowerCase().includes(q)) &&
      (department === "ALL" || e.department.toLowerCase() === department.toLowerCase())
    );
  }, [employees, search, department]);

  const filteredAttendance = useMemo(() => {
    const q = search.toLowerCase().trim();
    return attendance.filter(a => {
      const recordDate = dateKey(a.date);
      const name = a.employee?.name || "";
      const id = a.employee?.employeeId || a.employeeId || "";
      const dept = a.employee?.department || "";

      return recordDate >= fromDate && recordDate <= toDate &&
        (!q || `${name} ${id} ${dept}`.toLowerCase().includes(q)) &&
        (department === "ALL" || dept.toLowerCase() === department.toLowerCase());
    });
  }, [attendance, fromDate, toDate, search, department]);

  const todayAttendance = attendance.filter(a => dateKey(a.date) === todayKey());
  const present = new Set(todayAttendance.filter(a => a.checkIn).map(a => a.employeeId)).size;
  const working = todayAttendance.filter(a => a.checkIn && !a.checkOut).length;
  const checkedOut = todayAttendance.filter(a => a.checkOut).length;
  const absent = Math.max(0, employees.length - present);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
        <p>Verifying administrator and loading dashboard…</p>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
        <div className="text-center">
          <p className="mb-4">{error || "Administrator authentication required."}</p>
          <button onClick={() => window.location.href = "/admin-login"}
            className="rounded-lg bg-cyan-500 px-5 py-3 font-bold text-slate-950">
            Return to Admin Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
              TALENTRONAUT PVT LTD
            </p>
            <h1 className="mt-2 text-3xl font-black">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-slate-400">
              Signed in as {admin?.name || admin?.username || "Administrator"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => window.location.href = "/qr"}
              className="rounded-lg border border-cyan-400/40 px-4 py-3 text-sm font-semibold text-cyan-300 hover:bg-cyan-400/10">
              View QR Code
            </button>
            <button onClick={() => window.location.href = "/employees"}
              className="rounded-lg bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-300">
              + Register a New Employee
            </button>
            <button onClick={() => loadData(false)}
              disabled={refreshing}
              className="rounded-lg border border-white/15 px-4 py-3 text-sm hover:bg-white/5 disabled:opacity-50">
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
            <button onClick={logout}
              className="rounded-lg border border-rose-400/30 px-4 py-3 text-sm text-rose-300 hover:bg-rose-400/10">
              Log Out
            </button>
          </div>
        </header>

        {error && (
          <div role="alert" className="mt-5 rounded-lg border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        <nav className="mt-6 flex flex-wrap gap-2">
          {([
            ["overview", "Overview"],
            ["attendance", "Attendance Logs"],
            ["employees", "Employees"],
            ["settings", "Attendance Setup"],
          ] as const).map(([key, label]) => (
            <button key={key} onClick={() => setView(key)}
              className={`rounded-lg px-4 py-3 text-sm font-semibold ${view === key ? "bg-cyan-400 text-slate-950" : "border border-white/10 text-slate-300 hover:bg-white/5"}`}>
              {label}
            </button>
          ))}
        </nav>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Total Employees", employees.length, "Registered employee records"],
            ["Present Today", present, "Employees checked in"],
            ["Currently Working", working, "Checked in, not checked out"],
            ["No Check-in", absent, "No attendance recorded today"],
          ].map(([label, value, description]) => (
            <div key={String(label)} className="rounded-xl border border-white/10 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-3 text-4xl font-black">{value}</p>
              <p className="mt-2 text-xs text-slate-500">{description}</p>
            </div>
          ))}
        </section>

        {view !== "settings" && (
          <section className="mt-6 grid gap-3 rounded-xl border border-white/10 bg-slate-900 p-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <label htmlFor="search" className="mb-2 block text-xs text-slate-400">Search records</label>
              <input id="search" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Name, employee ID, email, department"
                className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-cyan-400" />
            </div>
            <div>
              <label htmlFor="department" className="mb-2 block text-xs text-slate-400">Department</label>
              <select id="department" value={department} onChange={e => setDepartment(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-3 text-sm">
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            {view === "attendance" && (
              <>
                <div>
                  <label htmlFor="fromDate" className="mb-2 block text-xs text-slate-400">From date</label>
                  <input id="fromDate" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-3 text-sm" />
                </div>
                <div>
                  <label htmlFor="toDate" className="mb-2 block text-xs text-slate-400">To date</label>
                  <input id="toDate" type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-3 text-sm" />
                </div>
              </>
            )}
          </section>
        )}

        {view === "overview" && (
          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-slate-900 p-6">
              <h2 className="text-lg font-bold">Quick Actions</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button onClick={() => window.location.href = "/employees"}
                  className="rounded-lg bg-cyan-400 p-4 text-left font-bold text-slate-950">
                  Register a New Employee
                  <span className="mt-1 block text-xs font-normal">Create an employee invitation</span>
                </button>
                <button onClick={() => window.location.href = "/qr"}
                  className="rounded-lg border border-white/10 p-4 text-left font-bold hover:bg-white/5">
                  Office QR Code
                  <span className="mt-1 block text-xs font-normal text-slate-400">Open the QR display page</span>
                </button>
                <button onClick={() => setView("attendance")}
                  className="rounded-lg border border-white/10 p-4 text-left font-bold hover:bg-white/5">
                  Review Attendance
                  <span className="mt-1 block text-xs font-normal text-slate-400">View attendance logs and dates</span>
                </button>
                <button onClick={() => setView("employees")}
                  className="rounded-lg border border-white/10 p-4 text-left font-bold hover:bg-white/5">
                  Employee Registry
                  <span className="mt-1 block text-xs font-normal text-slate-400">Search employee records</span>
                </button>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900 p-6">
              <h2 className="text-lg font-bold">Today at a Glance</h2>
              <div className="mt-5 space-y-4">
                {[
                  ["Check-in coverage", employees.length ? `${Math.round(present / employees.length * 100)}%` : "0%"],
                  ["Completed check-outs", String(checkedOut)],
                  ["Currently working", String(working)],
                  ["Employees without check-in", String(absent)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between border-b border-white/5 pb-3">
                    <span className="text-sm text-slate-400">{label}</span>
                    <span className="font-bold">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {view === "attendance" && (
          <section className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-slate-900">
            <div className="border-b border-white/10 p-5">
              <h2 className="text-lg font-bold">Attendance Logs</h2>
              <p className="mt-1 text-sm text-slate-400">{filteredAttendance.length} matching records</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead className="bg-slate-950 text-xs uppercase text-slate-400">
                  <tr>{["Employee", "Department", "Date", "Check In", "Check Out", "Status"].map(h => <th key={h} className="px-5 py-4">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredAttendance.map(a => (
                    <tr key={a.id} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-4">
                        <p className="font-semibold">{a.employee?.name || "Unknown"}</p>
                        <p className="text-xs text-slate-500">{a.employee?.employeeId || a.employeeId}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-300">{a.employee?.department || "—"}</td>
                      <td className="px-5 py-4">{formatDate(a.date)}</td>
                      <td className="px-5 py-4 text-cyan-300">{formatTime(a.checkIn)}</td>
                      <td className="px-5 py-4 text-emerald-300">{formatTime(a.checkOut)}</td>
                      <td className="px-5 py-4">{a.checkIn && !a.checkOut ? "Working" : a.status || "Recorded"}</td>
                    </tr>
                  ))}
                  {filteredAttendance.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-slate-500">No matching attendance records.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {view === "employees" && (
          <section className="mt-6 rounded-xl border border-white/10 bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5">
              <div>
                <h2 className="text-lg font-bold">Employee Registry</h2>
                <p className="mt-1 text-sm text-slate-400">{filteredEmployees.length} employees</p>
              </div>
              <button onClick={() => window.location.href = "/employees"}
                className="rounded-lg bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950">
                + Register Employee
              </button>
            </div>
            <div className="grid gap-px bg-white/5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredEmployees.map(e => (
                <button key={e.id} onClick={() => setSelectedEmployee(e)}
                  className="bg-slate-900 p-5 text-left hover:bg-slate-800">
                  <p className="font-bold">{e.name}</p>
                  <p className="mt-1 text-xs text-cyan-300">{e.employeeId}</p>
                  <p className="mt-3 break-all text-sm text-slate-400">{e.email}</p>
                  <p className="mt-1 text-xs text-slate-500">{e.department}</p>
                </button>
              ))}
              {filteredEmployees.length === 0 && <p className="p-8 text-sm text-slate-400">No employees found.</p>}
            </div>
          </section>
        )}

        {view === "settings" && (
          <section className="mt-6 rounded-xl border border-white/10 bg-slate-900 p-6">
            <h2 className="text-xl font-bold">Attendance Setup</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Manage office QR codes from the QR page. Check-in, check-out,
              Wi-Fi restrictions, and verification rules must be enforced by
              your backend before attendance is accepted.
            </p>
            <button onClick={() => window.location.href = "/qr"}
              className="mt-5 rounded-lg bg-cyan-400 px-5 py-3 font-bold text-slate-950">
              Open QR Code Page
            </button>
          </section>
        )}

        {selectedEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setSelectedEmployee(null)}>
            <section className="w-full max-w-lg rounded-xl border border-white/10 bg-slate-900 p-6"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{selectedEmployee.name}</h2>
                <button onClick={() => setSelectedEmployee(null)} className="rounded-lg border border-white/10 px-3 py-2">Close</button>
              </div>
              <dl className="mt-5 space-y-4 text-sm">
                <div><dt className="text-slate-400">Employee ID</dt><dd>{selectedEmployee.employeeId}</dd></div>
                <div><dt className="text-slate-400">Email</dt><dd className="break-all">{selectedEmployee.email}</dd></div>
                <div><dt className="text-slate-400">Department</dt><dd>{selectedEmployee.department}</dd></div>
                <div><dt className="text-slate-400">Location</dt><dd>{selectedEmployee.location || "Not provided"}</dd></div>
                <div><dt className="text-slate-400">Registered</dt><dd>{formatDate(selectedEmployee.createdAt)}</dd></div>
              </dl>
            </section>
          </div>
        )}

        <footer className="mt-10 border-t border-white/10 py-5 text-xs text-slate-500">
          Talentronaut Attendance System · Administrator dashboard
        </footer>
      </div>
    </main>
  );
}
