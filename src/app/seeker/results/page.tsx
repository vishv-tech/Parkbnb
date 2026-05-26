"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProtectedPage } from "@/components/ProtectedPage";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDistance } from "@/lib/distance";
import { money } from "@/lib/format";
import type { PublicListing, SeekerProfile } from "@/lib/types";

function ResultsContent() {
  const router = useRouter();
  const [listings, setListings] = useState<PublicListing[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const profileResponse = await fetch("/api/seeker-profile", { cache: "no-store" });
      const profileData = (await profileResponse.json()) as { profile: SeekerProfile | null; error?: string };

      if (!profileResponse.ok || !profileData.profile) {
        router.replace("/seeker/profile");
        return;
      }

      if (
        profileData.profile.currentLatitude === null ||
        profileData.profile.currentLongitude === null
      ) {
        router.replace("/seeker/location");
        return;
      }

      const response = await fetch(
        `/api/listings?nearby=true&lat=${profileData.profile.currentLatitude}&lng=${profileData.profile.currentLongitude}`,
        { cache: "no-store" },
      );
      const data = (await response.json()) as { listings: PublicListing[]; error?: string };

      if (!response.ok) {
        setError(data.error || "Could not load nearby parking");
        setLoading(false);
        return;
      }

      setListings(data.listings);
      setLoading(false);
    }

    load().catch(() => {
      setError("Could not load nearby parking");
      setLoading(false);
    });
  }, [router]);

  return (
    <main className="app-shell safe-bottom py-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#28a58b]">Nearby</p>
          <h1 className="mt-2 text-3xl font-black">Nearby Parking Spots</h1>
        </div>
        <Link className="btn-ghost" href="/seeker/location">
          Update Location
        </Link>
      </section>

      {error && <p className="mt-5 rounded-lg bg-[#fff0ec] p-3 text-sm font-bold text-[#a93c22]">{error}</p>}
      {loading && <div className="card mt-5 p-5 text-sm font-bold text-[#6b7772]">Finding the closest vacant spots...</div>}

      <section className="mt-5 grid gap-4">
        {!loading && listings.length === 0 && (
          <div className="card p-5 text-sm font-bold text-[#6b7772]">No live vacant parking spots nearby yet.</div>
        )}
        {listings.map((listing) => (
          <article className="card grid gap-4 overflow-hidden p-3 sm:grid-cols-[160px_1fr_auto] sm:items-center" key={listing.id}>
            <img alt={listing.generalArea} className="h-40 w-full rounded-lg object-cover sm:h-28" src={listing.imageUrl || "/parking-placeholder.svg"} />
            <div className="min-w-0">
              <h2 className="truncate text-xl font-black">{listing.ownerFullName}&apos;s Parking Spot</h2>
              <p className="mt-1 text-sm font-bold text-[#6b7772]">{listing.generalArea}</p>
              <p className="mt-1 text-sm font-bold text-[#6b7772]">
                {formatDistance(listing.distanceKm, listing.estimatedMinutes)}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge value={listing.availabilityStatus} />
                <span className="badge bg-[#eef5f1] text-[#11312c]">
                  Starting from {money(listing.priceOneHour)}/hour
                </span>
              </div>
            </div>
            <Link className="btn-primary w-full sm:w-auto" href={`/parking/${listing.id}`}>
              View Details
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}

export default function SeekerResultsPage() {
  return (
    <ProtectedPage requiredType="SEEKER">
      {() => <ResultsContent />}
    </ProtectedPage>
  );
}
