import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api";
import { toSafeUser } from "@/lib/format";
import { getAdminSession } from "@/lib/session";
import { db } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const admin = getAdminSession(request);

  if (!admin) {
    return apiError("Admin login required", 401);
  }

  const [users, listings, bookings, seekerProfiles] = await Promise.all([
    db.users.list(),
    db.listings.listAll(),
    db.bookings.listAll(),
    db.seekerProfiles.listAll(),
  ]);

  return apiOk({
    users: users.map(toSafeUser),
    listings,
    bookings,
    seekerProfiles,
  });
}
