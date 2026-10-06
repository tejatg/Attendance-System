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
  latitude?: number | null;
  longitude?: number | null;
  employee?: {
    employeeId?: string;
    name?: string;
    email?: string;
    department?: string;
    photoUrl?: string | null;
  };
};

type AdminUser = {
  id: number;
  username: string;
  name?: string | null;
  role: string;
  isActive?: boolean;
  lastLoginAt?: string | null;
};

const API_BASE =
  "https://attendance-backend-2nky.onrender.com";

function formatTime(value?: string | null) {
  if (!value) return "--:--";

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDateKey(value: string) {
  const date = new Date(value);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getToday() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function AdminPage() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const [error, setError] = useState("");

  const [fromDate, setFromDate] = useState(getToday());
  const [toDate, setToDate] = useState(getToday());

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("ALL");

  const [activeView, setActiveView] = useState<
    "overview" | "attendance" | "employees"
  >("overview");

  const [selectedEmployee, setSelectedEmployee] =
    useState<Employee | null>(null);

  /*
   * SECURITY
   *
   * Read the JWT issued by:
   * POST /api/admin/login
   *
   * The token is stored in localStorage by the Admin Login page.
   */
  function getAdminToken() {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem("adminToken");
  }

  function redirectToLogin() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      sessionStorage.removeItem("adminAuthenticated");
      window.location.href = "/admin-login";
    }
  }

  async function authenticatedFetch(
    url: string,
    options: RequestInit = {}
  ) {
    const token = getAdminToken();

    if (!token) {
      redirectToLogin();
      throw new Error("Administrator authentication is required.");
    }

    const headers = new Headers(options.headers);

    headers.set("Authorization", `Bearer ${token}`);

    if (!headers.has("Content-Type") && options.body) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
      ...options,
      headers,
      cache: "no-store",
    });

    if (response.status === 401 || response.status === 403) {
      redirectToLogin();
      throw new Error(
        "Administrator session has expired. Please login again."
      );
    }

    return response;
  }

  async function verifyAdminSession() {
    try {
      const token = getAdminToken();

      if (!token) {
        redirectToLogin();
        return false;
      }

      const response = await authenticatedFetch(
        `${API_BASE}/api/admin/me`
      );

      if (!response.ok) {
        redirectToLogin();
        return false;
      }

      const data = await response.json();

      if (!data?.success || !data?.admin) {
        redirectToLogin();
        return false;
      }

      if (
        data.admin.role !== "ADMIN" ||
        data.admin.isActive === false
      ) {
        redirectToLogin();
        return false;
      }

      setAdmin(data.admin);
      setAuthenticated(true);

      return true;
    } catch (error) {
      console.error(
        "[ADMIN] Session verification failed:",
        error
      );

      return false;
    }
  }

  async function loadData(showFullLoader = false) {
    try {
      if (showFullLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const [employeeResponse, attendanceResponse] =
        await Promise.all([
          authenticatedFetch(
            `${API_BASE}/api/employees`
          ),
          authenticatedFetch(
            `${API_BASE}/api/attendance`
          ),
        ]);

      if (!employeeResponse.ok) {
        throw new Error(
          "Unable to load employee data."
        );
      }

      if (!attendanceResponse.ok) {
        throw new Error(
          "Unable to load attendance data."
        );
      }

      const employeeData =
        await employeeResponse.json();

      const attendanceData =
        await attendanceResponse.json();

      const employeeList =
        Array.isArray(employeeData)
          ? employeeData
          : Array.isArray(
                employeeData?.employees
              )
            ? employeeData.employees
            : [];

      const attendanceList =
        Array.isArray(attendanceData)
          ? attendanceData
          : Array.isArray(
                attendanceData?.attendance
              )
            ? attendanceData.attendance
            : [];

      setEmployees(employeeList);
      setAttendance(attendanceList);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  /*
   * INITIAL SECURITY CHECK
   */
  useEffect(() => {
    let active = true;

    async function initializeAdmin() {
      const valid = await verifyAdminSession();

      if (!active) return;

      if (valid) {
        await loadData(true);
      } else {
        setLoading(false);
      }
    }

    initializeAdmin();

    return () => {
      active = false;
    };
  }, []);

  const departments = useMemo(() => {
    const values = employees
      .map((employee) => employee.department)
      .filter(Boolean);

    return [
      "ALL",
      ...Array.from(new Set(values)),
    ];
  }, [employees]);

  const filteredAttendance = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return attendance.filter((record) => {
      const recordDate = getDateKey(record.date);

      const withinDateRange =
        recordDate >= fromDate &&
        recordDate <= toDate;

      const employeeName =
        record.employee?.name?.toLowerCase() || "";

      const employeeId =
        record.employee?.employeeId?.toLowerCase() ||
        record.employeeId?.toLowerCase() ||
        "";

      const employeeDepartment =
        record.employee?.department?.toLowerCase() ||
        "";

      const matchesSearch =
        !normalizedSearch ||
        employeeName.includes(normalizedSearch) ||
        employeeId.includes(normalizedSearch) ||
        employeeDepartment.includes(
          normalizedSearch
        );

      const matchesDepartment =
        department === "ALL" ||
        employeeDepartment ===
          department.toLowerCase();

      return (
        withinDateRange &&
        matchesSearch &&
        matchesDepartment
      );
    });
  }, [
    attendance,
    fromDate,
    toDate,
    search,
    department,
  ]);

  const todayAttendance = useMemo(() => {
    const today = getToday();

    return attendance.filter(
      (record) =>
        getDateKey(record.date) === today
    );
  }, [attendance]);

  const checkedInToday =
    todayAttendance.filter(
      (record) => record.checkIn
    ).length;

  const checkedOutToday =
    todayAttendance.filter(
      (record) => record.checkOut
    ).length;

  const currentlyWorking =
    todayAttendance.filter(
      (record) =>
        record.checkIn &&
        !record.checkOut
    ).length;

  const absentToday = Math.max(
    employees.length -
      new Set(
        todayAttendance
          .filter((record) => record.checkIn)
          .map(
            (record) => record.employeeId
          )
      ).size,
    0
  );

  const filteredEmployees = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesSearch =
        !normalizedSearch ||
        employee.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        employee.employeeId
          .toLowerCase()
          .includes(normalizedSearch) ||
        employee.department
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesDepartment =
        department === "ALL" ||
        employee.department.toLowerCase() ===
          department.toLowerCase();

      return (
        matchesSearch &&
        matchesDepartment
      );
    });
  }, [
    employees,
    search,
    department,
  ]);

  const departmentStats = useMemo(() => {
    const map = new Map<
      string,
      {
        total: number;
        present: number;
        working: number;
      }
    >();

    employees.forEach((employee) => {
      const existing =
        map.get(employee.department) || {
          total: 0,
          present: 0,
          working: 0,
        };

      existing.total += 1;

      map.set(
        employee.department,
        existing
      );
    });

    todayAttendance.forEach((record) => {
      const dept =
        record.employee?.department ||
        "Unknown";

      const existing =
        map.get(dept) || {
          total: 0,
          present: 0,
          working: 0,
        };

      if (record.checkIn) {
        existing.present += 1;
      }

      if (
        record.checkIn &&
        !record.checkOut
      ) {
        existing.working += 1;
      }

      map.set(dept, existing);
    });

    return Array.from(
      map.entries()
    ).map(([name, values]) => ({
      name,
      ...values,
    }));
  }, [
    employees,
    todayAttendance,
  ]);

  function logout() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    sessionStorage.removeItem(
      "adminAuthenticated"
    );

    window.location.href =
      "/admin-login";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07111f] text-white">
        <div className="mx-auto flex min-h-screen max-w-[1500px] items-center justify-center px-6">
          <div className="text-center">
            <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border border-[#72d6ff]/20 border-t-[#72d6ff]" />

            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#72d6ff]">
              Verifying Administrator
            </p>

            <p className="mt-3 text-xs text-white/30">
              Establishing secure control session...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07111f] px-6 text-white">
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#ff6577]">
            Administrator access required
          </p>

          <button
            type="button"
            onClick={() =>
              (window.location.href =
                "/admin-login")
            }
            className="mt-6 border border-[#72d6ff]/30 px-6 py-3 text-[9px] font-black uppercase tracking-[0.25em] text-[#72d6ff]"
          >
            Return to Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#07111f] text-[#eef7ff]">

      {/* ATMOSPHERE */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div className="absolute left-[-180px] top-[-180px] h-[520px] w-[520px] rounded-full border border-[#72d6ff]/10" />

        <div className="absolute left-[-110px] top-[-110px] h-[380px] w-[380px] rounded-full border border-[#72d6ff]/10" />

        <div className="absolute right-[-200px] top-[35%] h-[600px] w-[600px] rounded-full border border-white/[0.035]" />

        <div className="absolute inset-x-0 top-[112px] h-px bg-white/[0.055]" />

      </div>

      <div className="relative mx-auto max-w-[1500px] px-5 py-5 sm:px-8 lg:px-10">

        {/* TOP BAR */}
        <header className="flex flex-col gap-5 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-center gap-5">

            <div className="flex h-12 w-12 items-center justify-center border border-[#72d6ff]/30 bg-[#0b1b2c]">
              <span className="text-sm font-black text-[#72d6ff]">
                TA
              </span>
            </div>

            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.35em]">
                TALENTRONAUT PVT LTD
              </p>

              <p className="mt-1 text-[8px] uppercase tracking-[0.28em] text-white/30">
                Workforce intelligence / command layer
              </p>

              {admin && (
                <p className="mt-1 text-[8px] uppercase tracking-[0.18em] text-[#79f2a4]">
                  AUTHENTICATED / {admin.username}
                </p>
              )}
            </div>

          </div>

          <div className="flex flex-wrap items-center gap-3">

            <div className="flex items-center gap-2 border border-white/10 px-4 py-3">

              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#79f2a4]" />

              <span className="text-[8px] font-black uppercase tracking-[0.22em] text-white/50">
                Secure data link online
              </span>

            </div>

            <button
              type="button"
              onClick={() =>
                loadData(false)
              }
              className="border border-white/10 px-4 py-3 text-[8px] font-black uppercase tracking-[0.22em] transition hover:border-[#72d6ff]/40 hover:text-[#72d6ff]"
            >
              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <button
              type="button"
              onClick={logout}
              className="border border-[#ff6577]/20 px-4 py-3 text-[8px] font-black uppercase tracking-[0.22em] text-[#ff8b98] transition hover:bg-[#ff6577]/10"
            >
              Exit
            </button>

          </div>
        </header>

        {/* HERO */}
        <section className="grid gap-8 py-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">

          <div>

            <div className="mb-5 flex items-center gap-3">

              <span className="h-px w-10 bg-[#72d6ff]" />

              <span className="text-[8px] font-black uppercase tracking-[0.35em] text-[#72d6ff]">
                Control Atlas / Secure Live
              </span>

            </div>

            <h1 className="max-w-5xl text-[clamp(3.4rem,8vw,8.5rem)] font-black leading-[0.78] tracking-[-0.08em]">
              KNOW
              <br />
              YOUR
              <br />
              <span className="text-white/15">
                WORKFORCE.
              </span>
            </h1>

          </div>

          <div className="border-l border-[#72d6ff]/30 pl-6">

            <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/25">
              Administrator
            </p>

            <p className="mt-3 text-2xl font-black">
              {admin?.name ||
                admin?.username ||
                "Administrator"}
            </p>

            <p className="mt-3 max-w-sm text-xs leading-6 text-white/35">
              Authenticated administrator session
              with protected workforce and attendance
              data access.
            </p>

          </div>

        </section>

        {/* ERROR */}
        {error && (
          <div className="mb-6 border border-[#ff6577]/30 bg-[#ff6577]/5 px-5 py-4">

            <p className="text-xs font-semibold text-[#ff9aa6]">
              {error}
            </p>

          </div>
        )}

        {/* METRIC STRIP */}
        <section className="grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2 xl:grid-cols-5">

          <div className="bg-[#0a1727] p-6">
            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-white/25">
              Workforce
            </p>

            <p className="mt-5 text-4xl font-black">
              {employees.length}
            </p>

            <p className="mt-2 text-[9px] uppercase tracking-[0.15em] text-white/25">
              Registered identities
            </p>
          </div>

          <div className="bg-[#0a1727] p-6">
            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-white/25">
              Present
            </p>

            <p className="mt-5 text-4xl font-black text-[#72d6ff]">
              {checkedInToday}
            </p>

            <p className="mt-2 text-[9px] uppercase tracking-[0.15em] text-white/25">
              Today
            </p>
          </div>

          <div className="bg-[#0a1727] p-6">
            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-white/25">
              Active
            </p>

            <p className="mt-5 text-4xl font-black text-[#79f2a4]">
              {currentlyWorking}
            </p>

            <p className="mt-2 text-[9px] uppercase tracking-[0.15em] text-white/25">
              Currently working
            </p>
          </div>

          <div className="bg-[#0a1727] p-6">
            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-white/25">
              Closed
            </p>

            <p className="mt-5 text-4xl font-black">
              {checkedOutToday}
            </p>

            <p className="mt-2 text-[9px] uppercase tracking-[0.15em] text-white/25">
              Completed shifts
            </p>
          </div>

          <div className="bg-[#0a1727] p-6">
            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-white/25">
              Unmarked
            </p>

            <p className="mt-5 text-4xl font-black text-[#ffca70]">
              {absentToday}
            </p>

            <p className="mt-2 text-[9px] uppercase tracking-[0.15em] text-white/25">
              No check-in today
            </p>
          </div>

        </section>

        {/* NAVIGATION */}
        <section className="mt-8 flex flex-wrap gap-2 border-b border-white/10 pb-4">

          {[
            ["overview", "Overview"],
            [
              "attendance",
              "Attendance Ledger",
            ],
            [
              "employees",
              "Employee Registry",
            ],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                setActiveView(
                  value as
                    | "overview"
                    | "attendance"
                    | "employees"
                )
              }
              className={`px-5 py-3 text-[8px] font-black uppercase tracking-[0.22em] transition ${
                activeView === value
                  ? "bg-[#72d6ff] text-[#07111f]"
                  : "border border-white/10 text-white/40 hover:border-white/25 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}

        </section>

        {/* FILTER BAR */}
        <section className="mt-6 grid gap-3 border border-white/10 bg-[#0a1727] p-4 md:grid-cols-2 lg:grid-cols-5">

          <div className="lg:col-span-2">

            <label className="mb-2 block text-[8px] font-black uppercase tracking-[0.2em] text-white/25">
              Search
            </label>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Name / employee ID / department"
              className="w-full border border-white/10 bg-[#07111f] px-4 py-3 text-xs text-white outline-none placeholder:text-white/20 focus:border-[#72d6ff]/50"
            />

          </div>

          <div>

            <label className="mb-2 block text-[8px] font-black uppercase tracking-[0.2em] text-white/25">
              Department
            </label>

            <select
              value={department}
              onChange={(event) =>
                setDepartment(
                  event.target.value
                )
              }
              className="w-full border border-white/10 bg-[#07111f] px-4 py-3 text-xs text-white outline-none focus:border-[#72d6ff]/50"
            >
              {departments.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>

          </div>

          <div>

            <label className="mb-2 block text-[8px] font-black uppercase tracking-[0.2em] text-white/25">
              From
            </label>

            <input
              type="date"
              value={fromDate}
              onChange={(event) =>
                setFromDate(
                  event.target.value
                )
              }
              className="w-full border border-white/10 bg-[#07111f] px-4 py-3 text-xs text-white outline-none focus:border-[#72d6ff]/50"
            />

          </div>

          <div>

            <label className="mb-2 block text-[8px] font-black uppercase tracking-[0.2em] text-white/25">
              To
            </label>

            <input
              type="date"
              value={toDate}
              onChange={(event) =>
                setToDate(
                  event.target.value
                )
              }
              className="w-full border border-white/10 bg-[#07111f] px-4 py-3 text-xs text-white outline-none focus:border-[#72d6ff]/50"
            />

          </div>

        </section>

        {/* OVERVIEW */}
        {activeView === "overview" && (
          <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">

            <div className="border border-white/10 bg-[#0a1727]">

              <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.25em] text-[#72d6ff]">
                    Workforce map
                  </p>

                  <h2 className="mt-2 text-lg font-black">
                    Department activity
                  </h2>
                </div>

                <span className="text-[9px] text-white/25">
                  TODAY
                </span>

              </div>

              <div className="p-6">

                {departmentStats.length === 0 ? (
                  <p className="py-12 text-center text-xs text-white/30">
                    No department data available.
                  </p>
                ) : (
                  <div className="space-y-5">

                    {departmentStats.map(
                      (item) => {
                        const percentage =
                          item.total > 0
                            ? Math.round(
                                (item.present /
                                  item.total) *
                                  100
                              )
                            : 0;

                        return (
                          <div
                            key={item.name}
                          >

                            <div className="mb-2 flex items-end justify-between gap-4">

                              <div>
                                <p className="text-xs font-bold">
                                  {item.name}
                                </p>

                                <p className="mt-1 text-[8px] uppercase tracking-[0.16em] text-white/25">
                                  {item.total} registered
                                </p>
                              </div>

                              <div className="text-right">
                                <span className="text-sm font-black text-[#72d6ff]">
                                  {percentage}%
                                </span>

                                <p className="text-[8px] text-white/25">
                                  present
                                </p>
                              </div>

                            </div>

                            <div className="h-2 overflow-hidden bg-white/5">

                              <div
                                className="h-full bg-[#72d6ff] transition-all"
                                style={{
                                  width: `${Math.min(
                                    percentage,
                                    100
                                  )}%`,
                                }}
                              />

                            </div>

                          </div>
                        );
                      }
                    )}

                  </div>
                )}

              </div>

            </div>

            <div className="border border-white/10 bg-[#0a1727]">

              <div className="border-b border-white/10 px-6 py-5">

                <p className="text-[8px] font-black uppercase tracking-[0.25em] text-[#72d6ff]">
                  Signal board
                </p>

                <h2 className="mt-2 text-lg font-black">
                  Operational intelligence
                </h2>

              </div>

              <div className="divide-y divide-white/10">

                <div className="flex items-center justify-between px-6 py-6">

                  <div>
                    <p className="text-xs font-bold">
                      Check-in coverage
                    </p>

                    <p className="mt-1 text-[8px] uppercase tracking-[0.15em] text-white/25">
                      Workforce presence
                    </p>
                  </div>

                  <p className="text-2xl font-black text-[#72d6ff]">
                    {employees.length
                      ? Math.round(
                          (checkedInToday /
                            employees.length) *
                            100
                        )
                      : 0}
                    %
                  </p>

                </div>

                <div className="flex items-center justify-between px-6 py-6">

                  <div>
                    <p className="text-xs font-bold">
                      Shift completion
                    </p>

                    <p className="mt-1 text-[8px] uppercase tracking-[0.15em] text-white/25">
                      Closed workdays
                    </p>
                  </div>

                  <p className="text-2xl font-black text-[#79f2a4]">
                    {checkedInToday
                      ? Math.round(
                          (checkedOutToday /
                            checkedInToday) *
                            100
                        )
                      : 0}
                    %
                  </p>

                </div>

                <div className="flex items-center justify-between px-6 py-6">

                  <div>
                    <p className="text-xs font-bold">
                      Active workforce
                    </p>

                    <p className="mt-1 text-[8px] uppercase tracking-[0.15em] text-white/25">
                      Open attendance sessions
                    </p>
                  </div>

                  <p className="text-2xl font-black text-[#ffca70]">
                    {currentlyWorking}
                  </p>

                </div>

              </div>

            </div>

          </section>
        )}

        {/* ATTENDANCE */}
        {activeView === "attendance" && (
          <section className="mt-8 border border-white/10 bg-[#0a1727]">

            <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-6 sm:flex-row sm:items-end sm:justify-between">

              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.25em] text-[#72d6ff]">
                  Event stream
                </p>

                <h2 className="mt-2 text-xl font-black">
                  Attendance ledger
                </h2>
              </div>

              <p className="text-[9px] uppercase tracking-[0.15em] text-white/25">
                {filteredAttendance.length} records matched
              </p>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full min-w-[900px] text-left">

                <thead>
                  <tr className="border-b border-white/10 text-[8px] font-black uppercase tracking-[0.2em] text-white/25">

                    <th className="px-6 py-4">
                      Employee
                    </th>

                    <th className="px-6 py-4">
                      Department
                    </th>

                    <th className="px-6 py-4">
                      Date
                    </th>

                    <th className="px-6 py-4">
                      Check In
                    </th>

                    <th className="px-6 py-4">
                      Check Out
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">

                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-16 text-center text-xs text-white/30"
                      >
                        No attendance records match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map(
                      (record) => (
                        <tr
                          key={record.id}
                          className="transition hover:bg-white/[0.025]"
                        >

                          <td className="px-6 py-5">

                            <div className="flex items-center gap-3">

                              {record.employee?.photoUrl ? (
                                <img
                                  src={
                                    record.employee.photoUrl
                                  }
                                  alt={
                                    record.employee?.name ||
                                    "Employee"
                                  }
                                  className="h-9 w-9 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#12253a] text-[9px] font-black text-[#72d6ff]">
                                  {(
                                    record.employee?.name ||
                                    "E"
                                  )
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                              )}

                              <div>
                                <p className="text-xs font-bold">
                                  {record.employee?.name ||
                                    "Unknown"}
                                </p>

                                <p className="mt-1 text-[8px] text-white/25">
                                  {record.employee?.employeeId ||
                                    record.employeeId}
                                </p>
                              </div>

                            </div>

                          </td>

                          <td className="px-6 py-5 text-xs text-white/50">
                            {record.employee?.department ||
                              "—"}
                          </td>

                          <td className="px-6 py-5 text-xs text-white/50">
                            {formatDate(
                              record.date
                            )}
                          </td>

                          <td className="px-6 py-5 text-xs font-bold text-[#72d6ff]">
                            {formatTime(
                              record.checkIn
                            )}
                          </td>

                          <td className="px-6 py-5 text-xs font-bold text-[#79f2a4]">
                            {formatTime(
                              record.checkOut
                            )}
                          </td>

                          <td className="px-6 py-5">

                            <span
                              className={`inline-flex px-3 py-1 text-[8px] font-black uppercase tracking-[0.16em] ${
                                record.checkIn &&
                                !record.checkOut
                                  ? "bg-[#ffca70]/10 text-[#ffca70]"
                                  : "bg-[#79f2a4]/10 text-[#79f2a4]"
                              }`}
                            >
                              {record.checkIn &&
                              !record.checkOut
                                ? "Active"
                                : record.status ||
                                  "Present"}
                            </span>

                          </td>

                        </tr>
                      )
                    )
                  )}

                </tbody>

              </table>

            </div>

          </section>
        )}

        {/* EMPLOYEES */}
        {activeView === "employees" && (
          <section className="mt-8">

            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.25em] text-[#72d6ff]">
                  Identity registry
                </p>

                <h2 className="mt-2 text-xl font-black">
                  Employee registry
                </h2>
              </div>

              <p className="text-[9px] uppercase tracking-[0.15em] text-white/25">
                {filteredEmployees.length} identities
              </p>

            </div>

            <div className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-3">

              {filteredEmployees.length === 0 ? (
                <div className="bg-[#0a1727] px-6 py-16 text-center text-xs text-white/30 md:col-span-2 xl:col-span-3">
                  No employee identities match the selected filters.
                </div>
              ) : (
                filteredEmployees.map(
                  (employee) => (
                    <button
                      key={employee.id}
                      type="button"
                      onClick={() =>
                        setSelectedEmployee(
                          employee
                        )
                      }
                      className="group bg-[#0a1727] p-6 text-left transition hover:bg-[#0d1d30]"
                    >

                      <div className="flex items-start justify-between gap-5">

                        <div className="flex items-center gap-4">

                          {employee.photoUrl ? (
                            <img
                              src={
                                employee.photoUrl
                              }
                              alt={
                                employee.name
                              }
                              className="h-14 w-14 rounded-full object-cover ring-1 ring-white/10"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#12253a] text-lg font-black text-[#72d6ff]">
                              {employee.name
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}

                          <div>
                            <p className="text-sm font-black">
                              {employee.name}
                            </p>

                            <p className="mt-1 text-[8px] uppercase tracking-[0.16em] text-[#72d6ff]">
                              {employee.employeeId}
                            </p>
                          </div>

                        </div>

                        <span className="text-xl text-white/15 transition group-hover:text-[#72d6ff]">
                          ↗
                        </span>

                      </div>

                      <div className="mt-6 border-t border-white/10 pt-5">

                        <div className="flex items-center justify-between">

                          <span className="text-[8px] uppercase tracking-[0.16em] text-white/25">
                            Department
                          </span>

                          <span className="text-xs font-bold">
                            {employee.department}
                          </span>

                        </div>

                        <div className="mt-3 flex items-center justify-between">

                          <span className="text-[8px] uppercase tracking-[0.16em] text-white/25">
                            Email
                          </span>

                          <span className="max-w-[180px] truncate text-[9px] text-white/45">
                            {employee.email}
                          </span>

                        </div>

                      </div>

                    </button>
                  )
                )
              )}

            </div>

          </section>
        )}

        {/* SELECTED EMPLOYEE */}
        {selectedEmployee && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
            onClick={() =>
              setSelectedEmployee(null)
            }
          >

            <div
              className="w-full max-w-xl border border-white/10 bg-[#0a1727]"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.25em] text-[#72d6ff]">
                    Identity profile
                  </p>

                  <h3 className="mt-2 text-lg font-black">
                    {selectedEmployee.name}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedEmployee(null)
                  }
                  className="h-9 w-9 border border-white/10 text-sm text-white/40 hover:text-white"
                >
                  ×
                </button>

              </div>

              <div className="p-6">

                <div className="flex items-center gap-5">

                  {selectedEmployee.photoUrl ? (
                    <img
                      src={
                        selectedEmployee.photoUrl
                      }
                      alt={
                        selectedEmployee.name
                      }
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#12253a] text-2xl font-black text-[#72d6ff]">
                      {selectedEmployee.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}

                  <div>

                    <p className="text-xl font-black">
                      {selectedEmployee.name}
                    </p>

                    <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-[#72d6ff]">
                      {selectedEmployee.employeeId}
                    </p>

                  </div>

                </div>

                <div className="mt-8 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">

                  <div className="bg-[#07111f] p-5">
                    <p className="text-[8px] uppercase tracking-[0.18em] text-white/25">
                      Department
                    </p>

                    <p className="mt-2 text-sm font-bold">
                      {selectedEmployee.department}
                    </p>
                  </div>

                  <div className="bg-[#07111f] p-5">
                    <p className="text-[8px] uppercase tracking-[0.18em] text-white/25">
                      Email
                    </p>

                    <p className="mt-2 break-all text-xs text-white/60">
                      {selectedEmployee.email}
                    </p>
                  </div>

                  <div className="bg-[#07111f] p-5">
                    <p className="text-[8px] uppercase tracking-[0.18em] text-white/25">
                      Registered
                    </p>

                    <p className="mt-2 text-sm font-bold">
                      {formatDate(
                        selectedEmployee.createdAt
                      )}
                    </p>
                  </div>

                  <div className="bg-[#07111f] p-5">
                    <p className="text-[8px] uppercase tracking-[0.18em] text-white/25">
                      Location
                    </p>

                    <p className="mt-2 text-xs text-white/60">
                      {selectedEmployee.location ||
                        "Not provided"}
                    </p>
                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

        {/* FOOTER */}
        <footer className="mt-12 flex flex-col justify-between gap-3 border-t border-white/10 py-6 text-[8px] font-black uppercase tracking-[0.2em] text-white/20 sm:flex-row">

          <span>
            CONTROL ATLAS / TALENTRONAUT
          </span>

          <span>
            Secure attendance intelligence layer
          </span>

          <span>
            Administrator authenticated
          </span>

        </footer>

      </div>
    </main>
  );
}