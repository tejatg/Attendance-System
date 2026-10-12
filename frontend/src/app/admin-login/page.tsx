"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://attendance-backend-2nky.onrender.com"
).replace(/\/+$/, "");

type AdminUser = {
  id?: number;
  username?: string;
  name?: string | null;
  role?: string;
  isActive?: boolean;
};

export default function AdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function verifyExistingSession() {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        if (!cancelled) setCheckingSession(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        const data = await response.json().catch(() => ({}));

        if (cancelled) return;

        if (
          response.ok &&
          data?.success &&
          data?.admin &&
          data.admin.role === "ADMIN" &&
          data.admin.isActive !== false
        ) {
          localStorage.setItem("adminUser", JSON.stringify(data.admin));
          router.replace("/admin");
          return;
        }

        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        setCheckingSession(false);
      } catch (err) {
        console.error("Admin session verification failed:", err);

        if (!cancelled) {
          setError(
            "Cannot connect to the backend. Please check the backend URL and server status."
          );
          setCheckingSession(false);
        }
      }
    }

    verifyExistingSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const cleanUsername = username.trim();

    if (!cleanUsername || !password) {
      setError("Please enter your administrator username and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: cleanUsername,
          password,
        }),
        cache: "no-store",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Login failed (HTTP ${response.status}).`
        );
      }

      if (!data.token) {
        throw new Error(
          "The backend did not return an authentication token."
        );
      }

      const admin: AdminUser | undefined = data.admin;

      if (
        admin &&
        (admin.role !== "ADMIN" || admin.isActive === false)
      ) {
        throw new Error("This account is not an active administrator.");
      }

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminUser", JSON.stringify(admin || {}));

      sessionStorage.removeItem("adminAuthenticated");
      sessionStorage.removeItem("adminToken");
      sessionStorage.removeItem("adminUser");

      router.replace("/admin");
    } catch (err) {
      console.error("Admin login failed:", err);

      if (err instanceof TypeError) {
        setError(
          `Unable to reach the backend at ${API_BASE_URL}. Check server availability and CORS configuration.`
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Admin login failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070707] px-6 text-white">
        <p className="text-sm text-zinc-400">
          Verifying administrator session...
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070707] px-6 py-12 text-white">
      <section className="w-full max-w-md">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-red-500">
            TALENTRONAUT PVT LTD
          </p>

          <h1 className="mt-4 text-5xl font-black leading-none tracking-tight sm:text-6xl">
            ACCESS
            <br />
            THE CORE
          </h1>

          <p className="mt-5 text-sm text-zinc-400">
            Administrator authentication
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400"
            >
              Username
            </label>

            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
              disabled={loading}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-white outline-none transition focus:border-red-500 disabled:opacity-50"
              placeholder="Administrator username"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-white outline-none transition focus:border-red-500 disabled:opacity-50"
              placeholder="Administrator password"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="break-words rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-red-600 px-5 py-4 font-bold uppercase tracking-[0.15em] text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Enter Admin Center"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-zinc-600">
            Secure administrator session {" • "} JWT authentication
          </p>

          <p className="mt-2 text-[9px] uppercase tracking-[0.2em] text-zinc-700">
            TALENTRONAUT ATTENDANCE CONTROL CORE
          </p>
        </div>
      </section>
    </main>
  );
}