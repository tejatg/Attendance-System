"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!username.trim() || !password) {
      setError("Enter administrator credentials.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      if (
        username.trim().toLowerCase() === "admin" &&
        password === "Admin@123"
      ) {
        sessionStorage.setItem("adminAuthenticated", "true");
        router.push("/admin");
      } else {
        setLoading(false);
        setError("Access denied. Invalid administrator credentials.");
      }
    }, 700);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#0b0b0c] text-[#f2f0ea]">
      <div className="relative mx-auto flex min-h-screen max-w-[1500px] flex-col px-5 py-5 sm:px-8 lg:px-12">

        {/* BACKGROUND */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-32 top-20 h-[520px] w-[520px] rounded-full border border-[#ff4d4d]/10" />

          <div className="absolute -right-20 top-32 h-[360px] w-[360px] rounded-full border border-[#ff4d4d]/10" />

          <div className="absolute bottom-[-220px] left-[-120px] h-[500px] w-[500px] rounded-full border border-white/[0.04]" />

          <div className="absolute left-0 top-1/3 h-px w-full bg-white/[0.035]" />

          <div className="absolute left-1/2 top-0 h-full w-px bg-white/[0.025]" />
        </div>

        {/* HEADER */}
        <header className="relative z-10 flex items-center justify-between border-b border-white/10 pb-5">

          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.38em]">
              TALENTRONAUT PVT LTD
            </p>

            <p className="mt-1 text-[9px] uppercase tracking-[0.28em] text-white/35">
              Workforce Control Infrastructure
            </p>
          </div>

          <div className="flex items-center gap-4">

            <div className="hidden items-center gap-2 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff4d4d]" />

              <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/45">
                Restricted
              </span>
            </div>

            <div className="flex h-9 w-9 items-center justify-center border border-white/15 text-[9px] font-black">
              07
            </div>

          </div>
        </header>

        {/* MAIN */}
        <section className="relative z-10 flex flex-1 items-center py-12 lg:py-16">

          <div className="grid w-full gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">

            {/* LEFT */}
            <div>

              <div className="mb-8 flex items-center gap-3">

                <span className="h-px w-12 bg-[#ff4d4d]" />

                <span className="text-[9px] font-black uppercase tracking-[0.35em] text-[#ff4d4d]">
                  Control Room / 07
                </span>

              </div>

              <h1 className="text-[clamp(4rem,9vw,10rem)] font-black leading-[0.78] tracking-[-0.085em]">
                ACCESS
                <br />
                <span className="text-white/15">THE</span>
                <br />
                CORE.
              </h1>

              <div className="mt-10 max-w-xl border-l border-[#ff4d4d]/40 pl-5">

                <p className="text-sm leading-7 text-white/45">
                  Administrator access opens the operational
                  command layer of the TALENTRONAUT attendance
                  network.
                </p>

                <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.24em] text-white/25">
                  Authorized personnel only
                </p>

              </div>

              {/* SYSTEM READOUT */}
              <div className="mt-12 grid max-w-2xl grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-4">

                <div className="bg-[#0b0b0c] p-4">
                  <p className="text-[8px] uppercase tracking-[0.2em] text-white/25">
                    Node
                  </p>

                  <p className="mt-2 text-xs font-bold">
                    TAL / 07
                  </p>
                </div>

                <div className="bg-[#0b0b0c] p-4">
                  <p className="text-[8px] uppercase tracking-[0.2em] text-white/25">
                    Layer
                  </p>

                  <p className="mt-2 text-xs font-bold">
                    ADMIN
                  </p>
                </div>

                <div className="bg-[#0b0b0c] p-4">
                  <p className="text-[8px] uppercase tracking-[0.2em] text-white/25">
                    Network
                  </p>

                  <p className="mt-2 text-xs font-bold text-[#9dff75]">
                    ONLINE
                  </p>
                </div>

                <div className="bg-[#0b0b0c] p-4">
                  <p className="text-[8px] uppercase tracking-[0.2em] text-white/25">
                    Threat
                  </p>

                  <p className="mt-2 text-xs font-bold text-[#ff4d4d]">
                    LOCKED
                  </p>
                </div>

              </div>
            </div>

            {/* LOGIN PANEL */}
            <div className="relative">

              <div className="absolute -inset-3 border border-white/[0.04]" />

              <div className="relative border border-white/10 bg-[#111113]">

                {/* PANEL HEADER */}
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/35">
                      Administrator
                    </p>

                    <p className="mt-1 text-sm font-bold">
                      Identity verification
                    </p>
                  </div>

                  <div className="flex items-center gap-2">

                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff4d4d]" />

                    <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/30">
                      Secure
                    </span>

                  </div>
                </div>

                {/* FORM */}
                <form
                  onSubmit={handleLogin}
                  className="p-6 sm:p-8"
                >

                  <div className="mb-8">

                    <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-white/25">
                      Authentication sequence
                    </p>

                    <div className="mt-4 flex gap-1">
                      <span className="h-1 w-8 bg-[#ff4d4d]" />
                      <span className="h-1 w-8 bg-[#ff4d4d]/50" />
                      <span className="h-1 w-8 bg-white/10" />
                      <span className="h-1 w-8 bg-white/10" />
                      <span className="h-1 w-8 bg-white/10" />
                    </div>

                  </div>

                  {/* USERNAME */}
                  <div className="mb-7">

                    <label
                      htmlFor="admin-username"
                      className="mb-2 block text-[9px] font-black uppercase tracking-[0.23em] text-white/35"
                    >
                      Administrator ID
                    </label>

                    <div className="relative">

                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-wider text-white/20">
                        ID
                      </span>

                      <input
                        id="admin-username"
                        type="text"
                        autoComplete="username"
                        value={username}
                        onChange={(event) =>
                          setUsername(event.target.value)
                        }
                        placeholder="Enter administrator ID"
                        className="w-full border border-white/10 bg-[#0b0b0c] px-12 py-4 text-sm font-semibold text-white outline-none transition placeholder:text-white/20 focus:border-[#ff4d4d]/60"
                      />

                    </div>

                  </div>

                  {/* PASSWORD */}
                  <div className="mb-7">

                    <label
                      htmlFor="admin-password"
                      className="mb-2 block text-[9px] font-black uppercase tracking-[0.23em] text-white/35"
                    >
                      Access key
                    </label>

                    <div className="relative">

                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-wider text-white/20">
                        KEY
                      </span>

                      <input
                        id="admin-password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) =>
                          setPassword(event.target.value)
                        }
                        placeholder="Enter access key"
                        className="w-full border border-white/10 bg-[#0b0b0c] px-12 py-4 text-sm font-semibold text-white outline-none transition placeholder:text-white/20 focus:border-[#ff4d4d]/60"
                      />

                    </div>

                  </div>

                  {/* ERROR */}
                  {error && (
                    <div className="mb-6 border border-[#ff4d4d]/30 bg-[#ff4d4d]/5 px-4 py-4">

                      <div className="flex gap-3">

                        <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#ff4d4d]" />

                        <p className="text-xs font-semibold leading-5 text-[#ff8a8a]">
                          {error}
                        </p>

                      </div>

                    </div>
                  )}

                  {/* LOGIN BUTTON */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full overflow-hidden bg-[#f2f0ea] px-5 py-5 text-left text-[#0b0b0c] transition hover:bg-[#ff4d4d] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    <div className="relative z-10 flex items-center justify-between">

                      <div>

                        <p className="text-[8px] font-black uppercase tracking-[0.25em] opacity-50">
                          {loading
                            ? "Verifying identity"
                            : "Authorize session"}
                        </p>

                        <p className="mt-1 text-lg font-black">
                          {loading
                            ? "Checking..."
                            : "Enter Control Room"}
                        </p>

                      </div>

                      <span className="text-2xl transition-transform group-hover:translate-x-1">
                        →
                      </span>

                    </div>

                  </button>

                </form>

                {/* PANEL FOOTER */}
                <div className="border-t border-white/10 px-6 py-5">

                  <div className="flex items-center justify-between gap-4">

                    <div>
                      <p className="text-[8px] uppercase tracking-[0.2em] text-white/20">
                        Session policy
                      </p>

                      <p className="mt-1 text-[9px] text-white/35">
                        Restricted administrator session
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[8px] uppercase tracking-[0.2em] text-white/20">
                        Protocol
                      </p>

                      <p className="mt-1 text-[9px] font-bold text-[#9dff75]">
                        AUTH / READY
                      </p>
                    </div>

                  </div>

                </div>

              </div>
            </div>

          </div>
        </section>

        {/* FOOTER */}
        <footer className="relative z-10 flex flex-col justify-between gap-3 border-t border-white/10 pt-5 text-[8px] font-bold uppercase tracking-[0.22em] text-white/20 sm:flex-row">

          <span>
            TALENTRONAUT / WORKFORCE CONTROL
          </span>

          <span>
            Restricted Access / Node 07
          </span>

          <span>
            System Ready
          </span>

        </footer>

      </div>
    </main>
  );
}