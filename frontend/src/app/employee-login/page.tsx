
"use client";

import { Suspense, FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest } from "@/util/api";
import { saveEmployeeSession, safeNextPath } from "@/util/auth";

type LoginResponse = {
  success?: boolean;
  message?: string;
  token?: string;
  employee?: {
    employeeId: string;
    name?: string;
    email?: string;
    department?: string;
  };
};

function EmployeeLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const cleanEmployeeId = employeeId.trim();

    if (!cleanEmployeeId || !password) {
      setError("Please enter your Employee ID and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiRequest("/api/employees/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: cleanEmployeeId,
          password,
        }),
        cache: "no-store",
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok || !data.success) {
        setError(
          data.message || "Login failed. Please check your credentials."
        );
        return;
      }

      if (!data.token || !data.employee?.employeeId) {
        setError(
          "The server returned an incomplete login response. Please try again."
        );
        return;
      }

      saveEmployeeSession(data.token, {
        employeeId: data.employee.employeeId,
        name: data.employee.name || "",
      });

      router.replace(safeNextPath(searchParams.get("next")));
    } catch (err) {
      console.error("Employee login error:", err);
      setError(
        err instanceof Error && err.message.includes("storage")
          ? err.message
          : "Unable to sign in. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-900">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-slate-900 px-7 py-8 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            TALENTRONAUT
          </p>
          <h1 className="mt-3 text-3xl font-bold">Employee Login</h1>
          <p className="mt-2 text-sm text-slate-300">
            Sign in to access your attendance dashboard.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 p-7">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="employeeId"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Employee ID
            </label>
            <input
              id="employeeId"
              name="employeeId"
              type="text"
              autoComplete="username"
              required
              maxLength={50}
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
              placeholder="Enter your Employee ID"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            />

            <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(event) => setShowPassword(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Show password
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-cyan-700 px-4 py-3 font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-center text-xs leading-5 text-slate-500">
            Use the Employee ID and password assigned by your administrator.
          </p>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Back to Home
          </button>
        </form>
      </div>
    </main>
  );
}

export default function EmployeeLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
          <p className="text-white">Loading employee login...</p>
        </main>
      }
    >
      <EmployeeLoginForm />
    </Suspense>
  );
}
