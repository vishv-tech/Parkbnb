import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { apiError, apiOk, parseJson, requireString } from "@/lib/api";
import {
  durationLabelToHours,
  formatHourDuration,
  getMaxBookableHours,
  parseHourlyDuration,
} from "@/lib/availability";
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

function parseSelectedHours(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(number) || number < 1) {
    return null;
  }

  return number;
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
    const requestedHourlyHours =
      body.selectedHours !== undefined
        ? parseSelectedHours(body.selectedHours)
        : parseHourlyDuration(selectedDuration) === 24
          ? null
          : parseHourlyDuration(selectedDuration);
    const listing = await db.listings.findById(listingId);

    if (!listing || listing.listingStatus !== "LIVE" || listing.availabilityStatus !== "VACANT") {
      return apiError("This parking spot is no longer available", 409);
    }

    const maxHours = getMaxBookableHours(listing);

    if (maxHours < 1) {
      return apiError("Selected duration is outside the owner’s available schedule.", 409);
    }

    let finalDuration = selectedDuration;
    let finalPrice = 0;

    if (body.selectedHours !== undefined || requestedHourlyHours !== null) {
      const selectedHours = requestedHourlyHours ?? parseSelectedHours(body.selectedHours);

      if (!selectedHours) {
        return apiError("Invalid duration selected", 400);
      }

      if (selectedHours > maxHours) {
        return apiError("Selected duration is outside the owner’s available schedule.", 409);
      }

      finalDuration = formatHourDuration(selectedHours);
      finalPrice = selectedHours * listing.priceOneHour;
    } else {
      const selectedOption = listingDurationOptions(listing).find(
        (option) => option.label === selectedDuration,
      );

      if (!selectedOption) {
        return apiError("Invalid duration selected", 400);
      }

      const optionHours = durationLabelToHours(selectedOption.label);

      if (
        listing.availabilityType !== "ALWAYS" &&
        (optionHours === null || optionHours > maxHours)
      ) {
        return apiError("Selected duration is outside the owner’s available schedule.", 409);
      }

      finalPrice = selectedOption.price;
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
      selectedDuration: finalDuration,
      selectedPrice: finalPrice,
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
