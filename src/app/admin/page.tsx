"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { money } from "@/lib/format";
import type { Booking, ParkingListing, SafeUser, SeekerProfile } from "@/lib/types";

type AdminOverview = {
  users: SafeUser[];
  listings: ParkingListing[];
  bookings: Booking[];
  seekerProfiles: SeekerProfile[];
};

function AdminStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4">
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-sm font-bold text-[#6b7772]">{label}</p>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/overview", { cache: "no-store" });
    const data = (await response.json()) as AdminOverview & { error?: string };

    if (response.status === 401) {
      router.replace("/admin/login");
      return;
    }

    setLoading(false);

    if (!response.ok) {
      setError(data.error || "Could not load admin panel");
      return;
    }

    setOverview(data);
  }, [router]);

  useEffect(() => {
    load().catch(() => {
      setError("Could not load admin panel");
      setLoading(false);
    });
  }, [load]);

  const userById = useMemo(() => {
    const map = new Map<string, SafeUser>();
    overview?.users.forEach((user) => map.set(user.id, user));
    return map;
  }, [overview]);

  const profileById = useMemo(() => {
    const map = new Map<string, SeekerProfile>();
    overview?.seekerProfiles.forEach((profile) => map.set(profile.id, profile));
    return map;
  }, [overview]);

  async function toggleBlock(user: SafeUser) {
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBlocked: !user.isBlocked }),
    });
    await load();
  }

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

  if (loading) {
    return (
      <main className="app-shell py-6">
        <div className="card p-5 text-sm font-bold text-[#6b7772]">Loading admin panel...</div>
      </main>
    );
  }

  return (
    <main className="app-shell safe-bottom py-6">
      <section>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#28a58b]">Admin panel</p>
        <h1 className="mt-2 text-3xl font-black">Park2bnb Operations</h1>
      </section>

      {error && <p className="mt-5 rounded-lg bg-[#fff0ec] p-3 text-sm font-bold text-[#a93c22]">{error}</p>}

      {overview && (
        <>
          <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <AdminStat label="Users" value={overview.users.length} />
            <AdminStat label="Listings" value={overview.listings.length} />
            <AdminStat label="Bookings" value={overview.bookings.length} />
            <AdminStat label="Paid" value={overview.bookings.filter((booking) => booking.paymentStatus === "PAID").length} />
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-black">All Users</h2>
            <div className="mt-4 grid gap-3">
              {overview.users.map((user) => (
                <article className="card grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center" key={user.id}>
                  <div>
                    <h3 className="font-black">{user.fullName}</h3>
                    <p className="mt-1 text-sm font-bold text-[#6b7772]">
                      {user.email} - {user.contactNumber}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusBadge value={user.userType} />
                      {user.isBlocked && <StatusBadge value="BLOCKED" />}
                    </div>
                  </div>
                  <button className={user.isBlocked ? "btn-ghost" : "btn-danger"} onClick={() => toggleBlock(user)} type="button">
                    {user.isBlocked ? "Unblock User" : "Block User"}
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-black">All Parking Listings</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {overview.listings.map((listing) => (
                <article className="card overflow-hidden" key={listing.id}>
                  <img alt={listing.buildingAddress} className="h-40 w-full object-cover" src={listing.imageUrl || "/parking-placeholder.svg"} />
                  <div className="grid gap-3 p-4">
                    <div>
                      <h3 className="font-black">{listing.buildingAddress}</h3>
                      <p className="mt-1 text-sm font-bold text-[#6b7772]">
                        Owner: {listing.ownerFullName} - {listing.ownerContactNumber}
                      </p>
                      <p className="mt-1 text-sm font-bold text-[#6b7772]">
                        {money(listing.priceOneHour)}/hour
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge value={listing.availabilityStatus} />
                      <StatusBadge value={listing.listingStatus} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button className="btn-ghost min-h-10 px-2 text-sm" onClick={() => listingAction(listing.id, "APPROVE")} type="button">
                        Approve
                      </button>
                      <button className="btn-ghost min-h-10 px-2 text-sm" onClick={() => listingAction(listing.id, "REJECT")} type="button">
                        Reject
                      </button>
                      <button className="btn-danger min-h-10 px-2 text-sm" onClick={() => deleteListing(listing.id)} type="button">
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-black">All Bookings</h2>
            <div className="mt-4 grid gap-3">
              {overview.bookings.map((booking) => {
                const owner = userById.get(booking.ownerId);
                const seekerProfile = profileById.get(booking.seekerId);
                return (
                  <article className="card grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center" key={booking.id}>
                    <div>
                      <h3 className="font-black">{booking.seekerName}</h3>
                      <p className="mt-1 text-sm font-bold text-[#6b7772]">
                        Owner: {owner?.fullName || booking.ownerId}
                      </p>
                      <p className="mt-1 text-sm font-bold text-[#6b7772]">
                        Seeker: {seekerProfile?.name || booking.seekerName} - {booking.carModel} - {booking.carNumber}
                      </p>
                      <p className="mt-1 text-sm font-bold text-[#6b7772]">
                        {booking.selectedDuration} - {money(booking.selectedPrice)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <StatusBadge value={booking.paymentStatus} />
                      <StatusBadge value={booking.bookingStatus} />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
