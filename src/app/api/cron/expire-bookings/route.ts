import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api";
import { expireCompletedBookings } from "@/lib/bookingExpiry";

export const runtime = "nodejs";

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return true;
  }

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${secret}` || request.nextUrl.searchParams.get("secret") === secret;
}

async function handle(request: NextRequest) {
  if (!isAuthorized(request)) {
    return apiError("Cron secret required", 401);
  }

  const summary = await expireCompletedBookings();
  return apiOk({
    message: "Expired bookings processed successfully.",
    ...summary,
  });
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
