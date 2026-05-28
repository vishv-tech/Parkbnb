import { durationLabelToHours } from "./availability";
import { db } from "./store";
import type { Booking } from "./types";

const MS_PER_HOUR = 60 * 60 * 1000;

function parseDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getBookingStartDate(booking: Booking) {
  return parseDate(booking.bookingStartTime) ?? parseDate(booking.createdAt);
}

export function getBookingEndDate(booking: Booking) {
  const explicitEnd = parseDate(booking.bookingEndTime);

  if (explicitEnd) {
    return explicitEnd;
  }

  const start = getBookingStartDate(booking);
  const hours = durationLabelToHours(booking.selectedDuration);

  if (!start || hours === null) {
    return null;
  }

  return new Date(start.getTime() + hours * MS_PER_HOUR);
}

export function getBookingStartIso(booking: Booking) {
  return getBookingStartDate(booking)?.toISOString() ?? null;
}

export function getBookingEndIso(booking: Booking) {
  return getBookingEndDate(booking)?.toISOString() ?? null;
}

export function calculateBookingWindow(selectedDuration: string, start = new Date()) {
  const hours = durationLabelToHours(selectedDuration);

  return {
    bookingStartTime: start.toISOString(),
    bookingEndTime: hours === null ? null : new Date(start.getTime() + hours * MS_PER_HOUR).toISOString(),
  };
}

function hasActiveOccupyingBooking(booking: Booking, now: Date) {
  if (booking.bookingStatus !== "ACTIVE" || booking.paymentStatus !== "PAID") {
    return false;
  }

  const end = getBookingEndDate(booking);
  return !end || end > now;
}

export async function expireCompletedBookings(now = new Date()) {
  const bookings = await db.bookings.listAll();
  const expiredBookings = bookings.filter((booking) => {
    const end = getBookingEndDate(booking);
    return booking.bookingStatus === "ACTIVE" && Boolean(end && end <= now);
  });

  for (const booking of expiredBookings) {
    await db.bookings.update(booking.id, { bookingStatus: "COMPLETED" });
  }

  const affectedListingIds = [...new Set(expiredBookings.map((booking) => booking.parkingListingId))];
  const refreshedBookings = await db.bookings.listAll();
  let updatedListingCount = 0;

  for (const listingId of affectedListingIds) {
    const listing = await db.listings.findById(listingId);

    if (!listing || listing.listingStatus === "TAKEN_DOWN") {
      continue;
    }

    const stillOccupied = refreshedBookings.some(
      (booking) =>
        booking.parkingListingId === listingId && hasActiveOccupyingBooking(booking, now),
    );

    if (!stillOccupied && listing.availabilityStatus !== "VACANT") {
      await db.listings.update(listingId, { availabilityStatus: "VACANT" });
      updatedListingCount += 1;
    }
  }

  return {
    expiredBookingCount: expiredBookings.length,
    updatedListingCount,
  };
}
