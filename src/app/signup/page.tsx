"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import type { UserType } from "@/lib/types";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedType = useMemo<UserType>(() => {
    return searchParams.get("type") === "OWNER" ? "OWNER" : "SEEKER";
  }, [searchParams]);
  const intent = searchParams.get("intent") || "";
  const [userType, setUserType] = useState<UserType>(selectedType);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, contactNumber, password, userType }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error || "Could not create your account");
      return;
    }

    router.push(userType === "OWNER" && intent === "list" ? "/owner/list" : userType === "OWNER" ? "/owner/dashboard" : "/seeker/profile");
    router.refresh();
  }

  return (
    <form className="card grid gap-4 p-5 sm:p-7" onSubmit={submit}>
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#28a58b]">Join Park2bnb</p>
        <h1 className="mt-2 text-3xl font-black">Create your account</h1>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#eef5f1] p-1">
        <button
          className={`rounded-lg px-3 py-3 text-sm font-black ${userType === "OWNER" ? "bg-white text-[#11312c] shadow-sm" : "text-[#6b7772]"}`}
          type="button"
          onClick={() => setUserType("OWNER")}
        >
          Parking Owner
        </button>
        <button
          className={`rounded-lg px-3 py-3 text-sm font-black ${userType === "SEEKER" ? "bg-white text-[#11312c] shadow-sm" : "text-[#6b7772]"}`}
          type="button"
          onClick={() => setUserType("SEEKER")}
        >
          Parking Seeker
        </button>
      </div>

      <label>
        <span className="label">Full Name</span>
        <input className="field" required value={fullName} onChange={(event) => setFullName(event.target.value)} />
      </label>

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
        <span className="label">Contact Number</span>
        <input
          className="field"
          required
          inputMode="tel"
          value={contactNumber}
          onChange={(event) => setContactNumber(event.target.value)}
        />
      </label>

      <label>
        <span className="label">Password</span>
        <input
          className="field"
          required
          minLength={6}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      {error && <p className="rounded-lg bg-[#fff0ec] p-3 text-sm font-bold text-[#a93c22]">{error}</p>}

      <button className="btn-primary w-full" disabled={loading} type="submit">
        {loading ? "Creating account..." : "Sign Up"}
      </button>

      <p className="text-center text-sm font-bold text-[#6b7772]">
        Already have an account?{" "}
        <Link className="text-[#11312c] underline" href={`/login?type=${userType}${intent ? `&intent=${intent}` : ""}`}>
          Login
        </Link>
      </p>
    </form>
  );
}

export default function SignupPage() {
  return (
    <main className="app-shell safe-bottom grid min-h-[calc(100svh-64px)] items-center py-8">
      <section className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_440px] lg:items-center">
        <div className="overflow-hidden rounded-lg">
          <img alt="Parking lane" className="h-60 w-full object-cover lg:h-[560px]" src="/parking-placeholder.svg" />
        </div>
        <Suspense fallback={<div className="card p-6">Loading...</div>}>
          <SignupForm />
        </Suspense>
      </section>
    </main>
  );
}
