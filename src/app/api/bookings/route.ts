import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { apiError, apiOk, parseJson, requireString } from "@/lib/api";
import { listingDurationOptions, nowIso, toPublicListing } from "@/lib/format";
import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/store";
import type { Booking, BookingWithListing } from "@/lib/types";

export const runtime = "nodejs";

async function attachListing(booking: Booking, revealExact: boolean): Promise<BookingWithListing> {
  const listing = await db.listings.findById(booking.parkingListingId);

  return {
    ...booking,
    listing: listing ? (revealExact ? listing : toPublicListing(listing)) : null,
  };
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);

  if (!user) {
    return apiError("Login required", 401);
  }

  if (user.userType === "OWNER") {
    const bookings = await db.bookings.listByOwner(user.id);
    return apiOk({
      bookings: await Promise.all(bookings.map((booking) => attachListing(booking, true))),
    });
  }

  const profile = await db.seekerProfiles.findByUserId(user.id);

  if (!profile) {
    return apiOk({ bookings: [] });
  }

  const bookings = await db.bookings.listBySeeker(profile.id);
  return apiOk({
    bookings: await Promise.all(
      bookings.map((booking) => attachListing(booking, booking.exactLocationUnlocked)),
    ),
  });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);

    if (!user) {
      return apiError("Login required", 401);
    }

    if (user.userType !== "SEEKER") {
      return apiError("Seeker account required", 403);
    }

    const profile = await db.seekerProfiles.findByUserId(user.id);

    if (!profile) {
      return apiError("Add your vehicle details before booking", 400);
    }

    const body = await parseJson(request);
    const listingId = requireString(body.parkingListingId, "Parking listing");
    const selectedDuration = requireString(body.selectedDuration, "Selected duration");
    const listing = await db.listings.findById(listingId);

    if (!listing || listing.listingStatus !== "LIVE" || listing.availabilityStatus !== "VACANT") {
      return apiError("This parking spot is no longer available", 409);
    }

    const selectedOption = listingDurationOptions(listing).find(
      (option) => option.label === selectedDuration,
    );

    if (!selectedOption) {
      return apiError("Invalid duration selected", 400);
    }

    const now = nowIso();
    const booking: Booking = {
      id: randomUUID(),
      seekerId: profile.id,
      ownerId: listing.ownerId,
      parkingListingId: listing.id,
      seekerName: profile.name,
      seekerContact: profile.contactNumber,
      carModel: profile.carModel,
      carNumber: profile.carNumber,
      selectedDuration,
      selectedPrice: selectedOption.price,
      paymentStatus: "PENDING",
      bookingStatus: "ACTIVE",
      exactLocationUnlocked: false,
      razorpayOrderId: null,
      razorpayPaymentId: null,
      createdAt: now,
      updatedAt: now,
    };

    const created = await db.bookings.create(booking);
    return apiOk({ booking: await attachListing(created, false) }, 201);
  } catch (error) {
    return apiError((error as Error).message, 400);
  }
}
