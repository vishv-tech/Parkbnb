"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ProtectedPage } from "@/components/ProtectedPage";
import { StatusBadge } from "@/components/StatusBadge";
import {
  availabilityNowLabel,
  durationLabelToHours,
  formatHourDuration,
  getMaxBookableHours,
} from "@/lib/availability";
import { formatDistance } from "@/lib/distance";
import { listingDurationOptions, money } from "@/lib/format";
import type { PublicListing, SeekerProfile } from "@/lib/types";

function rupees(amount: number) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function ParkingDetailsContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<PublicListing | null>(null);
  const [selectedDuration, setSelectedDuration] = useState("HOURLY");
  const [selectedHours, setSelectedHours] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const options = useMemo(() => (listing ? listingDurationOptions(listing) : []), [listing]);

  useEffect(() => {
    async function load() {
      const profileResponse = await fetch("/api/seeker-profile", { cache: "no-store" });
      const profileData = (await profileResponse.json()) as { profile: SeekerProfile | null };

      if (!profileData.profile) {
        router.replace("/seeker/profile");
        return;
      }

      const query =
        profileData.profile.currentLatitude !== null && profileData.profile.currentLongitude !== null
          ? `?lat=${profileData.profile.currentLatitude}&lng=${profileData.profile.currentLongitude}`
          : "";
      const response = await fetch(`/api/listings/${params.id}${query}`, { cache: "no-store" });
      const data = (await response.json()) as { listing?: PublicListing; error?: string };

      setLoading(false);

      if (!response.ok || !data.listing) {
        setError(data.error || "Parking spot not found");
        return;
      }

      setListing(data.listing);
      setSelectedDuration("HOURLY");
      setSelectedHours(1);
    }

    load().catch(() => {
      setError("Could not load parking spot");
      setLoading(false);
    });
  }, [params.id, router]);

  async function bookNow() {
    if (!listing) {
      return;
    }

    const maxHours = getMaxBookableHours(listing);
    const selectedOption = options.find((option) => option.label === selectedDuration);
    const optionHours = selectedOption ? durationLabelToHours(selectedOption.label) : null;
    const optionOutsideSchedule =
      selectedOption &&
      listing.availabilityType !== "ALWAYS" &&
      (optionHours === null || optionHours > maxHours);
    const selectedDurationLabel =
      selectedDuration === "HOURLY" ? formatHourDuration(selectedHours) : selectedDuration;

    if (
      listing.listingStatus !== "LIVE" ||
      listing.availabilityStatus !== "VACANT" ||
      maxHours < 1 ||
      (selectedDuration === "HOURLY" && selectedHours > maxHours) ||
      optionOutsideSchedule
    ) {
      setError("Selected duration is outside the owner’s available schedule.");
      return;
    }

    setBooking(true);
    setError("");
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parkingListingId: listing.id,
        selectedDuration: selectedDurationLabel,
        ...(selectedDuration === "HOURLY" ? { selectedHours } : {}),
      }),
    });
    const data = await response.json();
    setBooking(false);

    if (!response.ok) {
      setError(data.error || "Could not create booking");
      return;
    }

    router.push(`/payment/${data.booking.id}`);
  }

  if (loading) {
    return (
      <main className="app-shell py-6">
        <div className="card p-5 text-sm font-bold text-[#6b7772]">Loading parking details...</div>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="app-shell py-6">
        <div className="card p-5 text-sm font-bold text-[#a93c22]">{error}</div>
      </main>
    );
  }

  const currentListing = listing;
  const maxHours = getMaxBookableHours(currentListing);
  const hourlyTotal = selectedHours * currentListing.priceOneHour;
  const hourlyDurationLabel = formatHourDuration(selectedHours);
  const otherOptions = options.filter((option) => option.label !== "1 Hour");
  const selectedOption = options.find((option) => option.label === selectedDuration);
  const selectedPrice = selectedDuration === "HOURLY" ? hourlyTotal : selectedOption?.price ?? 0;
  const maxDurationReached = maxHours > 0 && selectedHours >= maxHours;
  const hourlyOutsideSchedule = selectedDuration === "HOURLY" && selectedHours > maxHours;
  const selectedOptionOutsideSchedule =
    selectedDuration !== "HOURLY" && selectedOption ? isOptionDisabled(selectedOption) : false;
  const canBook =
    currentListing.listingStatus === "LIVE" &&
    currentListing.availabilityStatus === "VACANT" &&
    maxHours >= 1 &&
    selectedPrice > 0 &&
    !hourlyOutsideSchedule &&
    !selectedOptionOutsideSchedule;

  function isOptionDisabled(option: { label: string; price: number }) {
    if (currentListing.availabilityType === "ALWAYS") {
      return false;
    }

    const hours = durationLabelToHours(option.label);
    return hours === null || hours > maxHours;
  }

  return (
    <main className="app-shell safe-bottom py-6">
      <article className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <section className="card overflow-hidden">
          <img alt={listing.generalArea} className="h-72 w-full object-cover" src={listing.imageUrl || "/parking-placeholder.svg"} />
          <div className="grid gap-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#28a58b]">Parking details</p>
                <h1 className="mt-2 text-3xl font-black">{listing.ownerFullName}&apos;s Parking Spot</h1>
              </div>
              <StatusBadge value={listing.availabilityStatus} />
            </div>
            <p className="font-bold text-[#6b7772]">{listing.generalArea}</p>
            <p className="font-bold text-[#6b7772]">
              {formatDistance(listing.distanceKm, listing.estimatedMinutes)}
            </p>
            <div className="rounded-lg border border-[#dbe3df] bg-[#f8fbfa] p-4 text-sm font-bold text-[#6b7772]">
              {listing.directionsPreview}
            </div>
          </div>
        </section>

        <aside className="card h-fit p-5">
          <h2 className="text-xl font-black">Select Duration</h2>
          <p className="mt-2 text-sm font-bold text-[#28a58b]">{availabilityNowLabel(listing)}</p>

          <div
            className={`mt-4 rounded-lg border p-4 ${
              selectedDuration === "HOURLY"
                ? "border-[#28a58b] bg-[#e9f7f2]"
                : "border-[#dbe3df] bg-white"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <label className="min-w-0 flex-1">
                <input
                  checked={selectedDuration === "HOURLY"}
                  className="sr-only"
                  name="duration"
                  type="radio"
                  onChange={() => setSelectedDuration("HOURLY")}
                />
                <span className="block font-black">
                  {hourlyDurationLabel} - {rupees(hourlyTotal)}
                </span>
                <span className="mt-1 block text-sm font-bold text-[#6b7772]">
                  {rupees(listing.priceOneHour)} / hour
                </span>
              </label>
              <span className="grid grid-cols-[44px_44px_44px] items-center overflow-hidden rounded-lg border border-[#dbe3df] bg-white text-center">
                <button
                  className="h-11 font-black disabled:text-[#b7c2bd]"
                  disabled={selectedHours <= 1}
                  type="button"
                  onClick={() => {
                    setSelectedDuration("HOURLY");
                    setSelectedHours((hours) => Math.max(1, hours - 1));
                  }}
                >
                  -
                </button>
                <span className="border-x border-[#dbe3df] py-3 font-black">{selectedHours}</span>
                <button
                  className="h-11 font-black disabled:text-[#b7c2bd]"
                  disabled={maxHours < 1 || selectedHours >= maxHours}
                  type="button"
                  onClick={() => {
                    setSelectedDuration("HOURLY");
                    setSelectedHours((hours) => Math.min(maxHours, hours + 1));
                  }}
                >
                  +
                </button>
              </span>
            </div>
            <p className="mt-3 text-sm font-black text-[#11312c]">Total: {rupees(hourlyTotal)}</p>
            {maxDurationReached && (
              <p className="mt-2 text-sm font-bold text-[#a93c22]">
                Maximum available duration reached for this parking spot.
              </p>
            )}
          </div>

          {otherOptions.length > 0 && (
            <div className="mt-4 grid gap-3">
              {otherOptions.map((option) => {
                const disabled = isOptionDisabled(option);

                return (
                  <label
                    className={`flex items-center justify-between rounded-lg border p-4 ${
                      selectedDuration === option.label
                        ? "border-[#28a58b] bg-[#e9f7f2]"
                        : "border-[#dbe3df] bg-white"
                    } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                    key={option.label}
                  >
                    <span className="font-black">{option.label}</span>
                    <span className="font-black">{money(option.price)}</span>
                    <input
                      checked={selectedDuration === option.label}
                      className="sr-only"
                      disabled={disabled}
                      name="duration"
                      type="radio"
                      onChange={() => setSelectedDuration(option.label)}
                    />
                  </label>
                );
              })}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between border-t border-[#edf1ef] pt-5 font-black">
            <span>Total</span>
            <span>{selectedPrice ? rupees(selectedPrice) : "Select duration"}</span>
          </div>

          {error && <p className="mt-4 rounded-lg bg-[#fff0ec] p-3 text-sm font-bold text-[#a93c22]">{error}</p>}

          <button className="btn-primary mt-5 h-14 w-full" disabled={booking || !canBook} onClick={bookNow} type="button">
            {booking ? "Creating booking..." : "Book Now"}
          </button>
        </aside>
      </article>
    </main>
  );
}

export default function ParkingDetailsPage() {
  return (
    <ProtectedPage requiredType="SEEKER">
      {() => <ParkingDetailsContent />}
    </ProtectedPage>
  );
}
