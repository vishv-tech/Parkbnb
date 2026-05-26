"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@park2bnb.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error || "Could not login as admin");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="app-shell safe-bottom grid min-h-[calc(100svh-64px)] items-center py-8">
      <form className="card mx-auto grid w-full max-w-md gap-4 p-5 sm:p-7" onSubmit={submit}>
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#28a58b]">Admin</p>
          <h1 className="mt-2 text-3xl font-black">Admin Login</h1>
        </div>

        <label>
          <span className="label">Email</span>
          <input className="field" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>

        <label>
          <span className="label">Password</span>
          <input className="field" required type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>

        {error && <p className="rounded-lg bg-[#fff0ec] p-3 text-sm font-bold text-[#a93c22]">{error}</p>}

        <button className="btn-primary w-full" disabled={loading} type="submit">
          {loading ? "Signing in..." : "Login as Admin"}
        </button>
      </form>
    </main>
  );
}
