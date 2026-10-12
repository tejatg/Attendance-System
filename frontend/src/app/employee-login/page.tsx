
"use client";

import { useState } from "react";
import { apiRequest } from "@/util/api";
import { saveEmployeeSession, safeNextPath } from "@/util/auth";
import { getApiErrorMessage, getErrorMessage } from "@/util/error";
import ErrorMessage from "@/components/ErrorMessage";

export default function EmployeeLoginPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    if (!employeeId.trim() || !password) {
      setError("Enter your employee ID and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 60000);

      let response: Response;

      try {
        response = await apiRequest("/api/employees/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: employeeId.trim(),
            password,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response));
      }

      const data = await response.json();

      if (!data?.token || !data?.employee?.employeeId) {
        throw new Error("Unexpected response from the server.");
      }

      saveEmployeeSession(data.token, data.employee);

      const next = safeNextPath(
        new URLSearchParams(window.location.search).get("next")
      );

      window.location.replace(next);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("The server is taking too long to respond. Please try again.");
      } else if (err instanceof TypeError) {
        setError(
          "Cannot reach the server. Check your connection. If the server was idle, wait 30 seconds and try again."
        );
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-5 px-5 py-10 text-gray-900">
      <header className="text-center">
        <h1 className="text-2xl font-bold">Employee Sign In</h1>
        <p className="mt-2 text-sm text-gray-600">
          Sign in once on this device. Check-in and check-out then only need a photo.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="employee-id" className="text-sm font-medium">
            Employee ID
          </label>
          <input
            id="employee-id"
            type="text"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            autoComplete="username"
            autoCapitalize="characters"
            required
            maxLength={50}
            className="rounded-lg border border-gray-300 px-3 py-3"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="employee-password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="employee-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="rounded-lg border border-gray-300 px-3 py-3"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <ErrorMessage message={error} />
    </main>
  );
}
