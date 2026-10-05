"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [adminUserName, setAdminUserName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!adminUserName.trim()) {
      setError("Please enter Admin User Name.");
      return;
    }

    if (!adminPassword) {
      setError("Please enter Admin Password.");
      return;
    }

    setLoading(true);

    /*
      Temporary admin credentials for local testing.

      IMPORTANT:
      These should be moved to secure backend authentication
      before production use.
    */
    const validUserName = "Admin";
    const validPassword = "Admin@1234";

    if (
      adminUserName.trim() === validUserName &&
      adminPassword === validPassword
    ) {
      router.push("/admin");
      return;
    }

    setLoading(false);
    setError("Invalid Admin User Name or Admin Password.");
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col justify-center">

        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            ADMIN LOGIN
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            Enter admin credentials to continue
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-6"
        >

          {/* Admin User Name */}
          <div>
            <label
              htmlFor="adminUserName"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Admin User Name
            </label>

            <input
              id="adminUserName"
              type="text"
              value={adminUserName}
              onChange={(event) =>
                setAdminUserName(event.target.value)
              }
              placeholder="Enter Admin User Name"
              autoComplete="username"
              disabled={loading}
              className="w-full rounded-xl border border-gray-300 px-4 py-4 text-gray-900 outline-none focus:border-black"
            />
          </div>

          {/* Admin Password */}
          <div>
            <label
              htmlFor="adminPassword"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Admin Password
            </label>

            <input
              id="adminPassword"
              type="password"
              value={adminPassword}
              onChange={(event) =>
                setAdminPassword(event.target.value)
              }
              placeholder="Enter Admin Password"
              autoComplete="current-password"
              disabled={loading}
              className="w-full rounded-xl border border-gray-300 px-4 py-4 text-gray-900 outline-none focus:border-black"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {/* Redirect Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black px-6 py-4 text-lg font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "REDIRECTING..."
              : "REDIRECT TO ADMIN DASHBOARD"}
          </button>

        </form>

      </div>
    </main>
  );
}