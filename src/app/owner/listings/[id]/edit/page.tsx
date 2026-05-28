"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AvailabilityScheduleFields } from "@/components/AvailabilityScheduleFields";
import { MapPicker } from "@/components/MapPicker";
import { ProtectedPage } from "@/components/ProtectedPage";
import { normalizeAvailabilityFields, validateAvailabilitySchedule } from "@/lib/availability";
import { CONTACT_NUMBER_ERROR, isValidContactNumber, sanitizeContactNumber } from "@/lib/contactNumber";
import type { ParkingListing } from "@/lib/types";

export default function EditListingPage() {
  return (
    <ProtectedPage requiredType="OWNER">
      {() => <EditListingContent />}
    </ProtectedPage>
  );
}

function EditListingContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<ParkingListing | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/listings/${params.id}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { listing?: ParkingListing; error?: string }) => {
        setLoading(false);
        if (data.error || !data.listing) {
          setError(data.error || "Listing not found");
          return;
        }
        setListing({ ...data.listing, ...normalizeAvailabilityFields(data.listing) });
      })
      .catch(() => {
        setError("Could not load listing");
        setLoading(false);
      });
  }, [params.id]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!listing) {
      return;
    }

    setError("");

    if (!isValidContactNumber(listing.ownerContactNumber)) {
      setError(CONTACT_NUMBER_ERROR);
      return;
    }

    const availabilityError = validateAvailabilitySchedule(listing);

    if (availabilityError) {
      setError(availabilityError);
      return;
    }

    setSaving(true);
    const response = await fetch(`/api/listings/${listing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(listing),
    });
    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(data.error || "Could not save listing");
      return;
    }

    router.push("/owner/dashboard");
  }

  if (loading) {
    return (
      <main className="app-shell py-6">
        <div className="card p-5 text-sm font-bold text-[#6b7772]">Loading listing...</div>
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

  return (
    <main className="app-shell safe-bottom py-6">
      <form className="grid gap-5" onSubmit={submit}>
        <section className="card overflow-hidden">
          <img alt={listing.buildingAddress} className="h-56 w-full object-cover" src={listing.imageUrl || "/parking-placeholder.svg"} />
          <div className="p-5">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#28a58b]">Edit listing</p>
            <h1 className="mt-2 text-3xl font-black">Update Parking Spot</h1>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="label">Full Name</span>
            <input className="field" required value={listing.ownerFullName} onChange={(event) => setListing({ ...listing, ownerFullName: event.target.value })} />
          </label>
          <label>
            <span className="label">Contact Number</span>
            <input className="field" required type="tel" inputMode="numeric" maxLength={10} value={listing.ownerContactNumber} onChange={(event) => setListing({ ...listing, ownerContactNumber: sanitizeContactNumber(event.target.value) })} />
          </label>
        </section>

        <label>
          <span className="label">Building Address</span>
          <input className="field" required value={listing.buildingAddress} onChange={(event) => setListing({ ...listing, buildingAddress: event.target.value })} />
        </label>

        <section className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="label">Parking Floor</span>
            <input className="field" required value={listing.parkingFloor} onChange={(event) => setListing({ ...listing, parkingFloor: event.target.value })} />
          </label>
          <label>
            <span className="label">Parking Address Details</span>
            <input className="field" required value={listing.parkingAddressDetails} onChange={(event) => setListing({ ...listing, parkingAddressDetails: event.target.value })} />
          </label>
        </section>

        <label>
          <span className="label">Parking Directions</span>
          <textarea className="field min-h-28" required value={listing.parkingDirections} onChange={(event) => setListing({ ...listing, parkingDirections: event.target.value })} />
        </label>

        <section className="card p-5">
          <h2 className="text-xl font-black">Pricing</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label>
              <span className="label">1 Hour price</span>
              <input className="field" required inputMode="numeric" value={listing.priceOneHour} onChange={(event) => setListing({ ...listing, priceOneHour: Number(event.target.value) })} />
            </label>
            <label>
              <span className="label">24 Hour price</span>
              <input className="field" required inputMode="numeric" value={listing.priceTwentyFourHours} onChange={(event) => setListing({ ...listing, priceTwentyFourHours: Number(event.target.value) })} />
            </label>
            <label>
              <span className="label">Custom duration label</span>
              <input className="field" required value={listing.customDurationLabel} onChange={(event) => setListing({ ...listing, customDurationLabel: event.target.value })} />
            </label>
            <label>
              <span className="label">Custom duration price</span>
              <input className="field" required inputMode="numeric" value={listing.customDurationPrice} onChange={(event) => setListing({ ...listing, customDurationPrice: Number(event.target.value) })} />
            </label>
          </div>
        </section>

        <AvailabilityScheduleFields
          {...normalizeAvailabilityFields(listing)}
          onChange={(patch) => setListing({ ...listing, ...patch })}
        />

        <section className="card p-5">
          <h2 className="text-xl font-black">Exact Map Location</h2>
          <div className="mt-4">
            <MapPicker
              address={listing.buildingAddress}
              value={{ latitude: listing.latitude, longitude: listing.longitude }}
              onChange={(coordinates) =>
                setListing({
                  ...listing,
                  latitude: coordinates.latitude ?? listing.latitude,
                  longitude: coordinates.longitude ?? listing.longitude,
                })
              }
            />
          </div>
        </section>

        {error && <p className="rounded-lg bg-[#fff0ec] p-3 text-sm font-bold text-[#a93c22]">{error}</p>}

        <button className="btn-primary h-14 w-full" disabled={saving} type="submit">
          {saving ? "Saving..." : "Save Listing"}
        </button>
      </form>
    </main>
  );
}
