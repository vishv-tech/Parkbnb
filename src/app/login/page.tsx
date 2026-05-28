"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import type { UserType } from "@/lib/types";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedType = useMemo<UserType>(() => {
    return searchParams.get("type") === "OWNER" ? "OWNER" : "SEEKER";
  }, [searchParams]);
  const intent = searchParams.get("intent") || "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || "Could not login");
        return;
      }

      const userType = data.user.userType as UserType;
      router.push(userType === "OWNER" && intent === "list" ? "/owner/list" : userType === "OWNER" ? "/owner/dashboard" : "/seeker/profile");
    } catch {
      setError("Could not login. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card mx-auto grid w-full max-w-md gap-4 p-5 sm:p-7" onSubmit={submit}>
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#28a58b]">
          {selectedType === "OWNER" ? "Parking owner" : "Parking seeker"}
        </p>
        <h1 className="mt-2 text-3xl font-black">Welcome back</h1>
      </div>

      <label>
        <span className="label">Email</span>
        <input
          className="field"
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>

      <label>
        <span className="label">Password</span>
        <input
          className="field"
          required
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      {error && <p className="rounded-lg bg-[#fff0ec] p-3 text-sm font-bold text-[#a93c22]">{error}</p>}

      <button className="btn-primary w-full" disabled={loading} type="submit">
        {loading ? "Signing in..." : "Login"}
      </button>

      <p className="text-center text-sm font-bold text-[#6b7772]">
        New here?{" "}
        <Link className="text-[#11312c] underline" href={`/signup?type=${selectedType}${intent ? `&intent=${intent}` : ""}`}>
          Create an account
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="app-shell safe-bottom grid min-h-[calc(100svh-64px)] items-center py-8">
      <Suspense fallback={<div className="card p-6">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
