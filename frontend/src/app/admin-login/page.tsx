"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://attendance-backend-2nky.onrender.com";

export default function AdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const existingToken =
      localStorage.getItem("adminToken");

    if (!existingToken) {
      return;
    }

    async function verifyExistingSession() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/admin/me`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${existingToken}`,
            },
            cache: "no-store",
          }
        );

        if (!response.ok) {
          localStorage.removeItem(
            "adminToken"
          );

          localStorage.removeItem(
            "adminUser"
          );

          return;
        }

        const data = await response.json();

        if (
          data?.success &&
          data?.admin &&
          data.admin.role === "ADMIN" &&
          data.admin.isActive !== false
        ) {
          localStorage.setItem(
            "adminUser",
            JSON.stringify(data.admin)
          );

          router.replace("/admin");
        } else {
          localStorage.removeItem(
            "adminToken"
          );

          localStorage.removeItem(
            "adminUser"
          );
        }
      } catch (error) {
        console.error(
          "Existing administrator session verification failed:",
          error
        );
      }
    }

    verifyExistingSession();
  }, [router]);

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const cleanUsername =
      username.trim();

    if (!cleanUsername || !password) {
      setError(
        "Administrator username and password are required."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/admin/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: cleanUsername,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Administrator authentication failed."
        );
      }

      if (!data.token) {
        throw new Error(
          "Authentication succeeded but no session token was received."
        );
      }

      /*
       * Store the JWT in localStorage.
       *
       * The Admin Dashboard reads the token
       * from the same location.
       */
      localStorage.setItem(
        "adminToken",
        data.token
      );

      localStorage.setItem(
        "adminUser",
        JSON.stringify(
          data.admin || {}
        )
      );

      /*
       * Remove the old frontend-only
       * authentication flag.
       */
      sessionStorage.removeItem(
        "adminAuthenticated"
      );

      sessionStorage.removeItem(
        "adminToken"
      );

      sessionStorage.removeItem(
        "adminUser"
      );

      router.replace("/admin");
    } catch (loginError) {
      console.error(
        "Administrator login error:",
        loginError
      );

      setError(
        loginError instanceof Error
          ? loginError.message
          : "Unable to connect to the administrator authentication service."
      );
    } finally {
      setLoading(false);
    }
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

        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >

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
              onChange={(event) =>
                setUsername(
                  event.target.value
                )
              }
              autoComplete="username"
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
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              autoComplete="current-password"
              disabled={loading}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-white outline-none transition focus:border-red-500 disabled:opacity-50"
              placeholder="Administrator password"
            />

          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-red-600 px-5 py-4 font-bold uppercase tracking-[0.15em] text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Authenticating..."
              : "Enter Admin Center"}
          </button>

        </form>

        <div className="mt-8 text-center">

          <p className="text-xs text-zinc-600">
            Secure administrator session
            {" • "}
            JWT authentication
          </p>

          <p className="mt-2 text-[9px] uppercase tracking-[0.2em] text-zinc-700">
            TALENTRONAUT ATTENDANCE CONTROL CORE
          </p>

        </div>

      </section>

    </main>
  );
}