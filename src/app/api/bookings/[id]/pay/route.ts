import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const user = await getSessionUser(request);

  if (!user || user.userType !== "SEEKER") {
    return apiError("Seeker login required", 401);
  }

  const profile = await db.seekerProfiles.findByUserId(user.id);
  const booking = await db.bookings.findById(id);

  if (!profile || !booking || booking.seekerId !== profile.id) {
    return apiError("Booking not found", 404);
  }

  const listing = await db.listings.findById(booking.parkingListingId);

  if (!listing) {
    return apiError("Parking listing not found", 404);
  }

  if (booking.paymentStatus === "PAID") {
    return apiOk({ booking });
  }

  if (listing.availabilityStatus !== "VACANT") {
    return apiError("This parking spot is no longer vacant", 409);
  }

  const body = await parseJson(request);
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const configuredSecret = keySecret && !keySecret.startsWith("your-") ? keySecret : "";
  const mockPaymentsEnabled = process.env.NEXT_PUBLIC_ENABLE_MOCK_PAYMENTS !== "false";
  const mockPayment = (Boolean(body.mock) && mockPaymentsEnabled) || !configuredSecret;

  if (!mockPayment) {
    const razorpayOrderId = String(body.razorpayOrderId || booking.razorpayOrderId || "");
    const razorpayPaymentId = String(body.razorpayPaymentId || "");
    const razorpaySignature = String(body.razorpaySignature || "");
    const expected = createHmac("sha256", configuredSecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (!safeEqual(expected, razorpaySignature)) {
      await db.bookings.update(booking.id, { paymentStatus: "FAILED" });
      return apiError("Payment signature verification failed", 400);
    }
  }

  const nextOrderId =
    typeof body.razorpayOrderId === "string"
      ? body.razorpayOrderId
      : booking.razorpayOrderId;
  const nextPaymentId =
    typeof body.razorpayPaymentId === "string"
      ? body.razorpayPaymentId
      : mockPayment
        ? `mock_${Date.now()}`
        : null;

  const paidBooking = await db.bookings.update(booking.id, {
    paymentStatus: "PAID",
    exactLocationUnlocked: true,
    razorpayOrderId: nextOrderId || null,
    razorpayPaymentId: nextPaymentId,
  });

  await db.listings.update(listing.id, { availabilityStatus: "OCCUPIED" });

  return apiOk({ booking: paidBooking });
}
