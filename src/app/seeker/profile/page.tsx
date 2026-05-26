"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProtectedPage } from "@/components/ProtectedPage";
import type { SeekerProfile } from "@/lib/types";

function SeekerProfileForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/seeker-profile", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { profile: SeekerProfile | null }) => {
        if (!data.profile) {
          return;
        }

        setName(data.profile.name);
        setContactNumber(data.profile.contactNumber);
        setCarModel(data.profile.carModel);
        setCarNumber(data.profile.carNumber);
      })
      .catch(() => undefined);
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/seeker-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, contactNumber, carModel, carNumber }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error || "Could not save your profile");
      return;
    }

    router.push("/seeker/location");
  }

  return (
    <form className="card mx-auto grid w-full max-w-lg gap-4 p-5 sm:p-7" onSubmit={submit}>
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#28a58b]">Find parking</p>
        <h1 className="mt-2 text-3xl font-black">Vehicle Details</h1>
      </div>

      <label>
        <span className="label">Name</span>
        <input className="field" required value={name} onChange={(event) => setName(event.target.value)} />
      </label>

      <label>
        <span className="label">Contact Number</span>
        <input className="field" required inputMode="tel" value={contactNumber} onChange={(event) => setContactNumber(event.target.value)} />
      </label>

      <label>
        <span className="label">Car Model</span>
        <input className="field" required value={carModel} onChange={(event) => setCarModel(event.target.value)} placeholder="Hyundai i20" />
      </label>

      <label>
        <span className="label">Car Number</span>
        <input className="field" required value={carNumber} onChange={(event) => setCarNumber(event.target.value.toUpperCase())} placeholder="KA 01 AB 1234" />
      </label>

      {error && <p className="rounded-lg bg-[#fff0ec] p-3 text-sm font-bold text-[#a93c22]">{error}</p>}

      <button className="btn-primary w-full" disabled={loading} type="submit">
        {loading ? "Saving..." : "Continue"}
      </button>
    </form>
  );
}

export default function SeekerProfilePage() {
  return (
    <ProtectedPage requiredType="SEEKER">
      {() => (
        <main className="app-shell safe-bottom grid min-h-[calc(100svh-64px)] items-center py-8">
          <SeekerProfileForm />
        </main>
      )}
    </ProtectedPage>
  );
}
