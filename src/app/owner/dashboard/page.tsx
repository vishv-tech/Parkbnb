"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ProtectedPage } from "@/components/ProtectedPage";
import { StatusBadge } from "@/components/StatusBadge";
import { money } from "@/lib/format";
import { ISSUE_TYPES } from "@/lib/types";
import type { BookingWithListing, IssueType, ParkingListing } from "@/lib/types";

type ListingsResponse = {
  listings: ParkingListing[];
};

type BookingsResponse = {
  bookings: BookingWithListing[];
};

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4">
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-sm font-bold text-[#6b7772]">{label}</p>
    </div>
  );
}

function OwnerDashboardContent() {
  const [listings, setListings] = useState<ParkingListing[]>([]);
  const [bookings, setBookings] = useState<BookingWithListing[]>([]);
  const [reportBooking, setReportBooking] = useState<BookingWithListing | null>(null);
  const [issueType, setIssueType] = useState<IssueType>(ISSUE_TYPES[0]);
  const [issueMessage, setIssueMessage] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [reportError, setReportError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [listingsResponse, bookingsResponse] = await Promise.all([
      fetch("/api/listings?mine=true", { cache: "no-store" }),
      fetch("/api/bookings", { cache: "no-store" }),
    ]);
    const listingsData = (await listingsResponse.json()) as ListingsResponse & { error?: string };
    const bookingsData = (await bookingsResponse.json()) as BookingsResponse & { error?: string };
    setLoading(false);

    if (!listingsResponse.ok || !bookingsResponse.ok) {
      setError(listingsData.error || bookingsData.error || "Could not load dashboard");
      return;
    }

    setListings(listingsData.listings);
    setBookings(bookingsData.bookings);
  }, []);

  useEffect(() => {
    load().catch(() => {
      setError("Could not load dashboard");
      setLoading(false);
    });
  }, [load]);

  const stats = useMemo(
    () => ({
      total: listings.length,
      live: listings.filter((listing) => listing.listingStatus === "LIVE").length,
      occupied: listings.filter((listing) => listing.availabilityStatus === "OCCUPIED").length,
      vacant: listings.filter((listing) => listing.availabilityStatus === "VACANT").length,
    }),
    [listings],
  );

  async function listingAction(id: string, action: string) {
    await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await load();
  }

  async function deleteListing(id: string) {
    if (!window.confirm("Delete this listing?")) {
      return;
    }

    await fetch(`/api/listings/${id}`, { method: "DELETE" });
    await load();
  }

  async function submitIssueReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!reportBooking) {
      return;
    }

    setReporting(true);
    setReportError("");
    setReportMessage("");

    const response = await fetch("/api/issue-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: reportBooking.id,
        issueType,
        message: issueMessage,
      }),
    });
    const data = await response.json();
    setReporting(false);

    if (!response.ok) {
      setReportError(data.error || "Could not submit issue report");
      return;
    }

    setReportBooking(null);
    setIssueType(ISSUE_TYPES[0]);
    setIssueMessage("");
    setReportMessage(data.message || "Issue reported successfully. Our team will review it.");
  }

  return (
    <main className="app-shell safe-bottom py-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#28a58b]">Owner dashboard</p>
          <h1 className="mt-2 text-3xl font-black">Your parking business</h1>
        </div>
        <Link className="btn-primary" href="/owner/list">
          Add Listing
        </Link>
      </section>

      {error && <p className="mt-5 rounded-lg bg-[#fff0ec] p-3 text-sm font-bold text-[#a93c22]">{error}</p>}

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total spots" value={stats.total} />
        <Stat label="Live listings" value={stats.live} />
        <Stat label="Occupied" value={stats.occupied} />
        <Stat label="Vacant" value={stats.vacant} />
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-black">Parking Listings</h2>
        {loading && <p className="mt-3 text-sm font-bold text-[#6b7772]">Loading...</p>}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {listings.map((listing) => (
            <article className="card overflow-hidden" key={listing.id}>
              <img alt={listing.buildingAddress} className="h-44 w-full object-cover" src={listing.imageUrl || "/parking-placeholder.svg"} />
              <div className="grid gap-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black">{listing.buildingAddress}</h3>
                    <p className="mt-1 text-sm font-bold text-[#6b7772]">Starts {money(listing.priceOneHour)}/hour</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge value={listing.availabilityStatus} />
                    <StatusBadge value={listing.listingStatus} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <button className="btn-ghost min-h-10 px-2 text-sm" onClick={() => listingAction(listing.id, "MARK_VACANT")}>
                    Mark Vacant
                  </button>
                  <button className="btn-ghost min-h-10 px-2 text-sm" onClick={() => listingAction(listing.id, "MARK_OCCUPIED")}>
                    Mark Occupied
                  </button>
                  <button className="btn-ghost min-h-10 px-2 text-sm" onClick={() => listingAction(listing.id, "TAKE_DOWN")}>
                    Take Down
                  </button>
                  <button className="btn-ghost min-h-10 px-2 text-sm" onClick={() => listingAction(listing.id, "MAKE_LIVE")}>
                    Make Live
                  </button>
                  <Link className="btn-ghost min-h-10 px-2 text-sm" href={`/owner/listings/${listing.id}/edit`}>
                    Edit
                  </Link>
                  <button className="btn-danger min-h-10 px-2 text-sm" onClick={() => deleteListing(listing.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-black">Booking Requests and Active Bookings</h2>
        {reportMessage && (
          <p className="mt-4 rounded-lg bg-[#e9f7f2] p-3 text-sm font-bold text-[#11614f]">
            {reportMessage}
          </p>
        )}
        <div className="mt-4 grid gap-3">
          {bookings.length === 0 && (
            <div className="card p-5 text-sm font-bold text-[#6b7772]">No bookings yet.</div>
          )}
          {bookings.map((booking) => (
            <article className="card grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center" key={booking.id}>
              <div>
                <h3 className="font-black">{booking.seekerName}</h3>
                <p className="mt-1 text-sm font-bold text-[#6b7772]">
                  {booking.seekerContact} - {booking.carModel} - {booking.carNumber}
                </p>
                <p className="mt-1 text-sm font-bold text-[#6b7772]">
                  {booking.selectedDuration} - {money(booking.selectedPrice)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <StatusBadge value={booking.paymentStatus} />
                <StatusBadge value={booking.bookingStatus} />
                <button
                  className="btn-ghost min-h-10 px-3 text-sm"
                  type="button"
                  onClick={() => {
                    setReportBooking(booking);
                    setReportError("");
                    setReportMessage("");
                  }}
                >
                  Report Issue
                </button>
              </div>
            </article>
          ))}
        </div>

        {reportBooking && (
          <form className="card mt-4 grid gap-4 p-4" onSubmit={submitIssueReport}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black">Report Booking Issue</h3>
                <p className="mt-1 text-sm font-bold text-[#6b7772]">
                  {reportBooking.seekerName} - {reportBooking.carNumber}
                </p>
              </div>
              <button className="btn-ghost min-h-10 px-3 text-sm" type="button" onClick={() => setReportBooking(null)}>
                Cancel
              </button>
            </div>

            <label>
              <span className="label">Issue type</span>
              <select
                className="field"
                required
                value={issueType}
                onChange={(event) => setIssueType(event.target.value as IssueType)}
              >
                {ISSUE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="label">Message</span>
              <textarea
                className="field min-h-28"
                placeholder="Explain the issue briefly..."
                value={issueMessage}
                onChange={(event) => setIssueMessage(event.target.value)}
              />
            </label>

            {reportError && (
              <p className="rounded-lg bg-[#fff0ec] p-3 text-sm font-bold text-[#a93c22]">
                {reportError}
              </p>
            )}

            <button className="btn-primary h-12 w-full sm:w-auto" disabled={reporting} type="submit">
              {reporting ? "Submitting..." : "Submit Report"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

export default function OwnerDashboardPage() {
  return (
    <ProtectedPage requiredType="OWNER">
      {() => <OwnerDashboardContent />}
    </ProtectedPage>
  );
}
