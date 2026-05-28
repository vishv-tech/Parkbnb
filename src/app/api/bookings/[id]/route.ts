import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api";
import { expireCompletedBookings } from "@/lib/bookingExpiry";
import { toPublicListing } from "@/lib/format";
import { getAdminSession, getSessionUser } from "@/lib/session";
import { db } from "@/lib/store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  await expireCompletedBookings();

  const { id } = await context.params;
  const user = await getSessionUser(request);
  const admin = getAdminSession(request);

  if (!user && !admin) {
    return apiError("Login required", 401);
  }

  const booking = await db.bookings.findById(id);

  if (!booking) {
    return apiError("Booking not found", 404);
  }

  const profile = user?.userType === "SEEKER" ? await db.seekerProfiles.findByUserId(user.id) : null;
  const canViewAsSeeker = Boolean(profile && profile.id === booking.seekerId);
  const canViewAsOwner = Boolean(user?.userType === "OWNER" && user.id === booking.ownerId);

  if (!admin && !canViewAsOwner && !canViewAsSeeker) {
    return apiError("You cannot view this booking", 403);
  }

  const listing = await db.listings.findById(booking.parkingListingId);
  const revealExact = Boolean(admin || canViewAsOwner || booking.exactLocationUnlocked);

  return apiOk({
    booking: {
      ...booking,
      listing: listing ? (revealExact ? listing : toPublicListing(listing)) : null,
    },
  });
}
