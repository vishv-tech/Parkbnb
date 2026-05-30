"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { money } from "@/lib/format";
import { calculatePlatformFeeAmount, calculateTotalAmount } from "@/lib/platformFee";
import type {
  Booking,
  IssueReport,
  IssueReportStatus,
  OwnerMonthlyEarning,
  ParkingListing,
  PayoutStatus,
  SafeUser,
  SeekerProfile,
} from "@/lib/types";

type AdminOverview = {
  users: SafeUser[];
  listings: ParkingListing[];
  bookings: Booking[];
  seekerProfiles: SeekerProfile[];
  issueReports: IssueReport[];
  ownerMonthlyEarnings: OwnerMonthlyEarning[];
};

type AdminReadyContext = {
  overview: AdminOverview;
  userById: Map<string, SafeUser>;
  listingById: Map<string, ParkingListing>;
  profileById: Map<string, SeekerProfile>;
  toggleBlock: (user: SafeUser) => Promise<void>;
  listingAction: (id: string, action: string) => Promise<void>;
  deleteListing: (id: string) => Promise<void>;
  updateReportStatus: (id: string, status: IssueReportStatus) => Promise<void>;
  updateEarningStatus: (id: string, payoutStatus: PayoutStatus) => Promise<void>;
};

const adminLinks = [
  { href: "/admin/users", label: "All Users" },
  { href: "/admin/earnings", label: "Owner Monthly Earnings" },
  { href: "/admin/listings", label: "All Parking Listings" },
  { href: "/admin/bookings", label: "All Bookings" },
  { href: "/admin/issue-reports", label: "Issue Reports" },
];

function AdminStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4">
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-sm font-bold text-[#6b7772]">{label}</p>
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <div className="card p-5 text-sm font-bold text-[#6b7772]">{children}</div>;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatMonthYear(month: number, year: number) {
  return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1),
  );
}

function formatScheduleType(listing: ParkingListing) {
  return listing.availabilityType.replaceAll("_", " ");
}

function bookingPlatformFee(booking: Booking) {
  return booking.platformFeeAmount ?? calculatePlatformFeeAmount(booking.selectedPrice);
}

function bookingTotalAmount(booking: Booking) {
  return booking.totalAmount ?? calculateTotalAmount(booking.selectedPrice);
}

async function fetchAdminOverview() {
  const response = await fetch("/api/admin/overview", { cache: "no-store" });
  const data = (await response.json()) as AdminOverview & { error?: string };

  return { response, data };
}

function useAdminPageData() {
  const router = useRouter();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { response, data } = await fetchAdminOverview();

    if (response.status === 401) {
      router.replace("/admin/login");
      return;
    }

    setLoading(false);

    if (!response.ok) {
      setError(data.error || "Could not load admin panel");
      return;
    }

    setError("");
    setOverview(data);
  }, [router]);

  useEffect(() => {
    let active = true;

    fetchAdminOverview()
      .then(({ response, data }) => {
        if (!active) {
          return;
        }

        if (response.status === 401) {
          router.replace("/admin/login");
          return;
        }

        setLoading(false);

        if (!response.ok) {
          setError(data.error || "Could not load admin panel");
          return;
        }

        setError("");
        setOverview(data);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setError("Could not load admin panel");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  const userById = useMemo(() => {
    const map = new Map<string, SafeUser>();
    overview?.users.forEach((user) => map.set(user.id, user));
    return map;
  }, [overview]);

  const listingById = useMemo(() => {
    const map = new Map<string, ParkingListing>();
    overview?.listings.forEach((listing) => map.set(listing.id, listing));
    return map;
  }, [overview]);

  const profileById = useMemo(() => {
    const map = new Map<string, SeekerProfile>();
    overview?.seekerProfiles.forEach((profile) => map.set(profile.id, profile));
    return map;
  }, [overview]);

  const toggleBlock = useCallback(
    async (user: SafeUser) => {
      await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBlocked: !user.isBlocked }),
      });
      await load();
    },
    [load],
  );

  const listingAction = useCallback(
    async (id: string, action: string) => {
      await fetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await load();
    },
    [load],
  );

  const deleteListing = useCallback(
    async (id: string) => {
      if (!window.confirm("Delete this listing?")) {
        return;
      }

      await fetch(`/api/listings/${id}`, { method: "DELETE" });
      await load();
    },
    [load],
  );

  const updateReportStatus = useCallback(
    async (id: string, status: IssueReportStatus) => {
      await fetch(`/api/issue-reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await load();
    },
    [load],
  );

  const updateEarningStatus = useCallback(
    async (id: string, payoutStatus: PayoutStatus) => {
      await fetch(`/api/admin/earnings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutStatus }),
      });
      await load();
    },
    [load],
  );

  return {
    loading,
    error,
    ready: overview
      ? {
          overview,
          userById,
          listingById,
          profileById,
          toggleBlock,
          listingAction,
          deleteListing,
          updateReportStatus,
          updateEarningStatus,
        }
      : null,
  };
}

function AdminDataPage({
  title,
  children,
}: {
  title: string;
  children: (context: AdminReadyContext) => ReactNode;
}) {
  const { loading, error, ready } = useAdminPageData();

  if (loading) {
    return (
      <main className="app-shell py-6">
        <EmptyState>Loading admin panel...</EmptyState>
      </main>
    );
  }

  return (
    <main className="app-shell safe-bottom py-6">
      <section>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#28a58b]">Admin panel</p>
        <h1 className="mt-2 text-3xl font-black">{title}</h1>
      </section>

      {error && <p className="mt-5 rounded-lg bg-[#fff0ec] p-3 text-sm font-bold text-[#a93c22]">{error}</p>}

      {ready && children(ready)}
    </main>
  );
}

export function AdminDashboardView() {
  return (
    <AdminDataPage title="Admin Dashboard">
      {({ overview }) => {
        const totalPaidBookings = overview.bookings.filter((booking) => booking.paymentStatus === "PAID").length;
        const totalPendingPayouts = overview.ownerMonthlyEarnings.filter(
          (earning) => earning.payoutStatus === "PENDING",
        ).length;

        return (
          <>
            <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
              <AdminStat label="Total users" value={overview.users.length} />
              <AdminStat label="Total listings" value={overview.listings.length} />
              <AdminStat label="Total bookings" value={overview.bookings.length} />
              <AdminStat label="Total paid bookings" value={totalPaidBookings} />
              <AdminStat label="Total issue reports" value={overview.issueReports.length} />
              <AdminStat label="Total pending payouts" value={totalPendingPayouts} />
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-black">Admin Sections</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {adminLinks.map((link) => (
                  <Link
                    className="card flex min-h-24 items-center justify-between gap-3 p-4 font-black text-[#14231f] transition hover:-translate-y-0.5"
                    href={link.href}
                    key={link.href}
                  >
                    <span>{link.label}</span>
                    <span className="text-[#28a58b]">Open</span>
                  </Link>
                ))}
              </div>
            </section>
          </>
        );
      }}
    </AdminDataPage>
  );
}

export function AdminUsersView() {
  return (
    <AdminDataPage title="All Users">
      {({ overview, toggleBlock }) => (
        <section className="mt-6 grid gap-3">
          {overview.users.length === 0 && <EmptyState>No users found.</EmptyState>}
          {overview.users.map((user) => (
            <article className="card grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center" key={user.id}>
              <div>
                <h2 className="font-black">{user.fullName}</h2>
                <div className="mt-2 grid gap-1 text-sm font-bold text-[#6b7772] sm:grid-cols-2">
                  <p>Email: {user.email}</p>
                  <p>Contact number: {user.contactNumber}</p>
                  <p>User type: {user.userType}</p>
                  <p>Block status: {user.isBlocked ? "Blocked" : "Not blocked"}</p>
                  {user.userType === "OWNER" && <p>Owner UPI ID: {user.upiId || "Not provided"}</p>}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge value={user.userType} />
                  <StatusBadge value={user.isBlocked ? "BLOCKED" : "ACTIVE"} />
                </div>
              </div>
              <button className={user.isBlocked ? "btn-ghost" : "btn-danger"} onClick={() => toggleBlock(user)} type="button">
                {user.isBlocked ? "Unblock" : "Block"}
              </button>
            </article>
          ))}
        </section>
      )}
    </AdminDataPage>
  );
}

export function AdminEarningsView() {
  return (
    <AdminDataPage title="Owner Monthly Earnings">
      {({ overview, updateEarningStatus, userById }) => (
        <section className="mt-6 grid gap-3">
          {overview.ownerMonthlyEarnings.length === 0 && <EmptyState>No owner monthly earnings yet.</EmptyState>}
          {overview.ownerMonthlyEarnings.map((earning) => {
            const owner = userById.get(earning.ownerId);
            const seekerTotalAmount = earning.grossBookingAmount + earning.platformFeeAmount;

            return (
              <article className="card grid gap-4 p-4" key={earning.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge value={earning.payoutStatus} />
                  <span className="text-sm font-black text-[#14231f]">
                    {formatMonthYear(earning.month, earning.year)}
                  </span>
                </div>
                <div className="grid gap-2 text-sm font-bold text-[#6b7772] sm:grid-cols-2 lg:grid-cols-3">
                  <p>Owner name: {owner?.fullName || earning.ownerId}</p>
                  <p>Owner email: {owner?.email || "Not found"}</p>
                  <p>Owner contact number: {owner?.contactNumber || "Not found"}</p>
                  <p>Owner UPI ID: {earning.upiId || owner?.upiId || "Not provided"}</p>
                  <p>Month: {formatMonthYear(earning.month, earning.year)}</p>
                  <p>Year: {earning.year}</p>
                  <p>Paid booking count: {earning.paidBookingCount}</p>
                  <p>Parking price total / owner earning: {money(earning.totalEarning)}</p>
                  <p>Platform fee total: {money(earning.platformFeeAmount)}</p>
                  <p>Seeker total amount: {money(seekerTotalAmount)}</p>
                  <p>Payout status: {earning.payoutStatus}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn-ghost min-h-10 px-3 text-sm"
                    onClick={() => updateEarningStatus(earning.id, "PAID")}
                    type="button"
                  >
                    Mark as Paid
                  </button>
                  <button
                    className="btn-ghost min-h-10 px-3 text-sm"
                    onClick={() => updateEarningStatus(earning.id, "PENDING")}
                    type="button"
                  >
                    Mark as Pending
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </AdminDataPage>
  );
}

export function AdminListingsView() {
  return (
    <AdminDataPage title="All Parking Listings">
      {({ deleteListing, listingAction, overview, userById }) => (
        <section className="mt-6 grid gap-3">
          {overview.listings.length === 0 && <EmptyState>No parking listings found.</EmptyState>}
          {overview.listings.map((listing) => {
            const owner = userById.get(listing.ownerId);

            return (
              <article className="card grid gap-4 p-4" key={listing.id}>
                <div>
                  <h2 className="font-black">{listing.buildingAddress}</h2>
                  <p className="mt-1 text-sm font-bold text-[#6b7772]">
                    Parking address/general area: {listing.parkingAddressDetails || listing.buildingAddress}
                  </p>
                </div>
                <div className="grid gap-2 text-sm font-bold text-[#6b7772] sm:grid-cols-2 lg:grid-cols-3">
                  <p>Owner name: {owner?.fullName || listing.ownerFullName}</p>
                  <p>Owner contact: {owner?.contactNumber || listing.ownerContactNumber}</p>
                  <p>Owner UPI ID: {owner?.upiId || "Not provided"}</p>
                  <p>Listing status: {listing.listingStatus}</p>
                  <p>Availability status: {listing.availabilityStatus}</p>
                  <p>Availability schedule type: {formatScheduleType(listing)}</p>
                  <p>Price per hour: {money(listing.priceOneHour)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge value={listing.listingStatus} />
                  <StatusBadge value={listing.availabilityStatus} />
                  <StatusBadge value={listing.availabilityType} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn-ghost min-h-10 px-3 text-sm"
                    onClick={() => listingAction(listing.id, "APPROVE")}
                    type="button"
                  >
                    Approve
                  </button>
                  <button
                    className="btn-ghost min-h-10 px-3 text-sm"
                    onClick={() => listingAction(listing.id, "REJECT")}
                    type="button"
                  >
                    Reject
                  </button>
                  <button
                    className="btn-danger min-h-10 px-3 text-sm"
                    onClick={() => listingAction(listing.id, "TAKE_DOWN")}
                    type="button"
                  >
                    Take Down
                  </button>
                  <button
                    className="btn-danger min-h-10 px-3 text-sm"
                    onClick={() => deleteListing(listing.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </AdminDataPage>
  );
}

export function AdminBookingsView() {
  return (
    <AdminDataPage title="All Bookings">
      {({ listingById, overview, userById }) => (
        <section className="mt-6 grid gap-3">
          {overview.bookings.length === 0 && <EmptyState>No bookings found.</EmptyState>}
          {overview.bookings.map((booking) => {
            const owner = userById.get(booking.ownerId);
            const listing = listingById.get(booking.parkingListingId);

            return (
              <article className="card grid gap-4 p-4" key={booking.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge value={booking.paymentStatus} />
                  <StatusBadge value={booking.bookingStatus} />
                  <span className="text-sm font-black text-[#14231f]">Booking ID: {booking.id.slice(0, 8)}</span>
                </div>
                <div className="grid gap-2 text-sm font-bold text-[#6b7772] sm:grid-cols-2 lg:grid-cols-3">
                  <p>Seeker name/contact: {booking.seekerName} - {booking.seekerContact}</p>
                  <p>Owner name/contact: {owner?.fullName || booking.ownerId} - {owner?.contactNumber || "Not found"}</p>
                  <p>Parking listing/address: {listing?.buildingAddress || booking.parkingListingId}</p>
                  <p>Selected duration: {booking.selectedDuration}</p>
                  <p>Parking price: {money(booking.selectedPrice)}</p>
                  <p>Platform fee: {money(bookingPlatformFee(booking))}</p>
                  <p>Total paid by seeker: {money(bookingTotalAmount(booking))}</p>
                  <p>Payment status: {booking.paymentStatus}</p>
                  <p>Booking status: {booking.bookingStatus}</p>
                  <p>Booking start time: {formatDateTime(booking.bookingStartTime)}</p>
                  <p>Booking end time: {formatDateTime(booking.bookingEndTime)}</p>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </AdminDataPage>
  );
}

export function AdminIssueReportsView() {
  return (
    <AdminDataPage title="Issue Reports">
      {({ overview, updateReportStatus }) => (
        <section className="mt-6 grid gap-3">
          {overview.issueReports.length === 0 && <EmptyState>No issue reports yet.</EmptyState>}
          {overview.issueReports.map((report) => (
            <article className="card grid gap-4 p-4" key={report.id}>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge value={report.status} />
                <span className="text-sm font-black text-[#14231f]">{report.issueType}</span>
              </div>
              <div className="grid gap-2 text-sm font-bold text-[#6b7772] sm:grid-cols-2 lg:grid-cols-3">
                <p>Issue type: {report.issueType}</p>
                <p>Report status: {report.status}</p>
                <p>Owner name/contact: {report.ownerName} - {report.ownerContact}</p>
                <p>Seeker name/contact: {report.seekerName} - {report.seekerContact}</p>
                <p>Car model: {report.carModel}</p>
                <p>Car number: {report.carNumber}</p>
                <p>Listing address: {report.listingAddress}</p>
                <p>Booking start time: {formatDateTime(report.bookingStartTime)}</p>
                <p>Booking end time: {formatDateTime(report.bookingEndTime)}</p>
                <p>Created time: {formatDateTime(report.createdAt)}</p>
              </div>
              <p className="rounded-lg bg-[#f8fbfa] p-3 text-sm font-bold text-[#40514b]">
                Owner message: {report.message || "No message"}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn-ghost min-h-10 px-3 text-sm"
                  onClick={() => updateReportStatus(report.id, "REVIEWING")}
                  type="button"
                >
                  Mark Reviewing
                </button>
                <button
                  className="btn-ghost min-h-10 px-3 text-sm"
                  onClick={() => updateReportStatus(report.id, "RESOLVED")}
                  type="button"
                >
                  Mark Resolved
                </button>
                <button
                  className="btn-danger min-h-10 px-3 text-sm"
                  onClick={() => updateReportStatus(report.id, "REJECTED")}
                  type="button"
                >
                  Mark Rejected
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </AdminDataPage>
  );
}
