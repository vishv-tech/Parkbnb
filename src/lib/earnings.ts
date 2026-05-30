import { randomUUID } from "crypto";
import { nowIso } from "./format";
import { calculatePlatformFeeAmount } from "./platformFee";
import { db } from "./store";
import type { Booking, OwnerMonthlyEarning } from "./types";

export function getCurrentMonthYear(date = new Date()) {
  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
}

function getMonthWindow(month: number, year: number) {
  return {
    start: new Date(year, month - 1, 1, 0, 0, 0, 0),
    end: new Date(year, month, 1, 0, 0, 0, 0),
  };
}

function isDateInWindow(value: string | null, start: Date, end: Date) {
  if (!value) {
    return false;
  }

  const date = new Date(value);

  return !Number.isNaN(date.getTime()) && date >= start && date < end;
}

export function calculatePlatformFeeIfApplicable(booking: Booking) {
  return booking.platformFeeAmount ?? calculatePlatformFeeAmount(booking.selectedPrice);
}

export async function calculateOwnerMonthlyEarnings(ownerId: string, month: number, year: number) {
  const owner = await db.users.findById(ownerId);
  const bookings = await db.bookings.listByOwner(ownerId);
  const { start, end } = getMonthWindow(month, year);
  const paidBookings = bookings.filter(
    (booking) =>
      booking.paymentStatus === "PAID" &&
      booking.bookingStatus !== "CANCELLED" &&
      (isDateInWindow(booking.bookingStartTime, start, end) ||
        isDateInWindow(booking.createdAt, start, end)),
  );
  const grossBookingAmount = paidBookings.reduce(
    (total, booking) => total + Number(booking.selectedPrice || 0),
    0,
  );
  const platformFeeAmount = paidBookings.reduce(
    (total, booking) => total + calculatePlatformFeeIfApplicable(booking),
    0,
  );

  return {
    ownerId,
    month,
    year,
    totalEarning: grossBookingAmount,
    grossBookingAmount,
    platformFeeAmount,
    paidBookingCount: paidBookings.length,
    upiId: owner?.upiId ?? null,
  };
}

export async function syncOwnerMonthlyEarnings(ownerId: string, month: number, year: number) {
  const [calculated, existing] = await Promise.all([
    calculateOwnerMonthlyEarnings(ownerId, month, year),
    db.ownerMonthlyEarnings.findByOwnerMonth(ownerId, month, year),
  ]);
  const now = nowIso();
  const earning: OwnerMonthlyEarning = {
    id: existing?.id ?? randomUUID(),
    ...calculated,
    payoutStatus: existing?.payoutStatus ?? "PENDING",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  return db.ownerMonthlyEarnings.upsert(earning);
}

export async function syncCurrentMonthOwnerEarnings(ownerId: string) {
  const { month, year } = getCurrentMonthYear();
  return syncOwnerMonthlyEarnings(ownerId, month, year);
}

export async function syncAllCurrentMonthOwnerEarnings() {
  const { month, year } = getCurrentMonthYear();
  const users = await db.users.list();
  const owners = users.filter((user) => user.userType === "OWNER");

  return Promise.all(owners.map((owner) => syncOwnerMonthlyEarnings(owner.id, month, year)));
}
