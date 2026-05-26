"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapPicker } from "@/components/MapPicker";
import { ProtectedPage } from "@/components/ProtectedPage";
import type { SafeUser } from "@/lib/types";

type Coordinates = {
  latitude: number | null;
  longitude: number | null;
};

function OwnerListingForm({ user }: { user: SafeUser }) {
  const router = useRouter();
  const [ownerFullName, setOwnerFullName] = useState(user.fullName);
  const [ownerContactNumber, setOwnerContactNumber] = useState(user.contactNumber);
  const [buildingAddress, setBuildingAddress] = useState("");
  const [parkingAddressDetails, setParkingAddressDetails] = useState("");
  const [parkingFloor, setParkingFloor] = useState("");
  const [parkingDirections, setParkingDirections] = useState("");
  const [priceOneHour, setPriceOneHour] = useState("");
  const [priceTwentyFourHours, setPriceTwentyFourHours] = useState("");
  const [customDurationLabel, setCustomDurationLabel] = useState("Weekend");
  const [customDurationPrice, setCustomDurationPrice] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates>({ latitude: null, longitude: null });
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function onImageChange(file: File | null) {
    setImage(file);
    setPreview(file ? URL.createObjectURL(file) : "");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (coordinates.latitude === null || coordinates.longitude === null) {
      setError("Add exact coordinates using current location, address conversion, or the map.");
      return;
    }

    if (!image) {
      setError("Upload an image of the parking space.");
      return;
    }

    const formData = new FormData();
    formData.append("ownerFullName", ownerFullName);
    formData.append("ownerContactNumber", ownerContactNumber);
    formData.append("buildingAddress", buildingAddress);
    formData.append("parkingAddressDetails", parkingAddressDetails);
    formData.append("parkingFloor", parkingFloor);
    formData.append("parkingDirections", parkingDirections);
    formData.append("priceOneHour", priceOneHour);
    formData.append("priceTwentyFourHours", priceTwentyFourHours);
    formData.append("customDurationLabel", customDurationLabel);
    formData.append("customDurationPrice", customDurationPrice);
    formData.append("latitude", String(coordinates.latitude));
    formData.append("longitude", String(coordinates.longitude));
    formData.append("image", image);
    setLoading(true);

    const response = await fetch("/api/listings", { method: "POST", body: formData });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error || "Could not publish listing");
      return;
    }

    setSuccess(data.message || "Your parking spot is now live.");
    setTimeout(() => router.push("/owner/dashboard"), 700);
  }

  return (
    <form className="grid gap-5" onSubmit={submit}>
      <section className="card overflow-hidden">
        <div className="grid gap-3 p-5 sm:grid-cols-[1fr_220px] sm:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#28a58b]">Owner listing</p>
            <h1 className="mt-2 text-3xl font-black">List Your Parking Spot</h1>
          </div>
          <label className="btn-secondary">
            Upload Image
            <input
              accept="image/*"
              className="sr-only"
              required
              type="file"
              onChange={(event) => onImageChange(event.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        <img
          alt="Parking preview"
          className="h-52 w-full object-cover sm:h-72"
          src={preview || "/parking-placeholder.svg"}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">Full Name</span>
          <input className="field" required value={ownerFullName} onChange={(event) => setOwnerFullName(event.target.value)} />
        </label>
        <label>
          <span className="label">Contact Number</span>
          <input className="field" required inputMode="tel" value={ownerContactNumber} onChange={(event) => setOwnerContactNumber(event.target.value)} />
        </label>
      </section>

      <label>
        <span className="label">Building Address</span>
        <input
          className="field"
          required
          value={buildingAddress}
          onChange={(event) => setBuildingAddress(event.target.value)}
          placeholder="Tower A, Indiranagar, Bengaluru"
        />
      </label>

      <section className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">Parking Floor</span>
          <input
            className="field"
            required
            value={parkingFloor}
            onChange={(event) => setParkingFloor(event.target.value)}
            placeholder="Basement B1, slot 27"
          />
        </label>
        <label>
          <span className="label">Parking Address Details</span>
          <input
            className="field"
            required
            value={parkingAddressDetails}
            onChange={(event) => setParkingAddressDetails(event.target.value)}
            placeholder="Gate 2, covered 4 wheeler slot"
          />
        </label>
      </section>

      <label>
        <span className="label">Parking Directions</span>
        <textarea
          className="field min-h-28"
          required
          value={parkingDirections}
          onChange={(event) => setParkingDirections(event.target.value)}
          placeholder="Enter from Gate 2, take left, basement B1, slot number 27."
        />
      </label>

      <section className="card p-5">
        <h2 className="text-xl font-black">Time Duration and Pricing</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label>
            <span className="label">1 Hour price</span>
            <input className="field" required inputMode="numeric" value={priceOneHour} onChange={(event) => setPriceOneHour(event.target.value)} />
          </label>
          <label>
            <span className="label">24 Hour price</span>
            <input className="field" required inputMode="numeric" value={priceTwentyFourHours} onChange={(event) => setPriceTwentyFourHours(event.target.value)} />
          </label>
          <label>
            <span className="label">Custom duration label</span>
            <input className="field" required value={customDurationLabel} onChange={(event) => setCustomDurationLabel(event.target.value)} />
          </label>
          <label>
            <span className="label">Custom duration price</span>
            <input className="field" required inputMode="numeric" value={customDurationPrice} onChange={(event) => setCustomDurationPrice(event.target.value)} />
          </label>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-xl font-black">Exact Map Location</h2>
        <div className="mt-4">
          <MapPicker address={buildingAddress} value={coordinates} onChange={setCoordinates} />
        </div>
      </section>

      {error && <p className="rounded-lg bg-[#fff0ec] p-3 text-sm font-bold text-[#a93c22]">{error}</p>}
      {success && <p className="rounded-lg bg-[#e9f7f2] p-3 text-sm font-bold text-[#11614f]">{success}</p>}

      <button className="btn-primary h-14 w-full" disabled={loading} type="submit">
        {loading ? "Publishing..." : "Publish Parking Spot"}
      </button>
    </form>
  );
}

export default function OwnerListPage() {
  return (
    <ProtectedPage requiredType="OWNER">
      {(user) => (
        <main className="app-shell safe-bottom py-6">
          <OwnerListingForm user={user} />
        </main>
      )}
    </ProtectedPage>
  );
}
