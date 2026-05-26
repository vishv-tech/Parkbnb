import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api";
import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

  if (booking.paymentStatus === "PAID") {
    return apiOk({ order: null, alreadyPaid: true });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (
    !keyId ||
    !keySecret ||
    keyId.startsWith("rzp_test_xxx") ||
    keySecret.startsWith("your-")
  ) {
    return apiOk({
      order: {
        id: `mock_${booking.id}`,
        amount: booking.selectedPrice * 100,
        currency: "INR",
      },
      mock: true,
    });
  }

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(booking.selectedPrice * 100),
      currency: "INR",
      receipt: booking.id,
      notes: { bookingId: booking.id },
    }),
  });

  if (!response.ok) {
    return apiError(await response.text(), response.status);
  }

  const order = (await response.json()) as { id: string; amount: number; currency: string };
  await db.bookings.update(booking.id, { razorpayOrderId: order.id });
  return apiOk({ order, mock: false });
}
