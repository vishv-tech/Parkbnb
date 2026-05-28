"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProtectedPage } from "@/components/ProtectedPage";

function LocationPermission() {
  const router = useRouter();
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const locationCaptured = latitude !== "" && longitude !== "";

  async function saveLocation(nextLatitude: number, nextLongitude: number) {
    setLoading(true);
    setError("");

    const response = await fetch("/api/seeker-profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentLatitude: nextLatitude,
        currentLongitude: nextLongitude,
      }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error || "Could not save location");
      return;
    }

    router.push("/seeker/results");
  }

  function requestLocation() {
    setError("");
    setMessage("To find parking spots near you, please allow location access.");
    setLoading(true);

    if (!navigator.geolocation) {
      setError("Location is not available in this browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(String(position.coords.latitude));
        setLongitude(String(position.coords.longitude));
        setMessage("Location captured. Continue to see nearby parking.");
        setLoading(false);
      },
      () => {
        setError("Location permission was not granted. Please allow location access to continue.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  async function continueToResults() {
    await saveLocation(Number(latitude), Number(longitude));
  }

  return (
    <section className="card mx-auto grid w-full max-w-lg gap-5 p-5 sm:p-7">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#28a58b]">Location permission</p>
        <h1 className="mt-2 text-3xl font-black">Find Parking Near You</h1>
        <p className="mt-3 text-sm font-bold leading-6 text-[#6b7772]">
          To find parking spots near you, please allow location access.
        </p>
      </div>

      <button className="btn-primary h-14 w-full" disabled={loading} onClick={requestLocation} type="button">
        {loading ? "Capturing location..." : "Allow Location Access"}
      </button>

      {locationCaptured && (
        <button className="btn-ghost w-full" disabled={loading} onClick={continueToResults} type="button">
          {loading ? "Saving location..." : "Continue"}
        </button>
      )}

      {message && <p className="text-sm font-bold text-[#11614f]">{message}</p>}
      {error && <p className="rounded-lg bg-[#fff0ec] p-3 text-sm font-bold text-[#a93c22]">{error}</p>}
    </section>
  );
}

export default function SeekerLocationPage() {
  return (
    <ProtectedPage requiredType="SEEKER">
      {() => (
        <main className="app-shell safe-bottom grid min-h-[calc(100svh-64px)] items-center py-8">
          <LocationPermission />
        </main>
      )}
    </ProtectedPage>
  );
}
