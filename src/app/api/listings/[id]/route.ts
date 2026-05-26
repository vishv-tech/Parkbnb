import { NextRequest } from "next/server";
import {
  apiError,
  apiOk,
  optionalString,
  parseJson,
  requireNumber,
} from "@/lib/api";
import { estimateMinutes, haversineKm } from "@/lib/distance";
import { toPublicListing } from "@/lib/format";
import { getAdminSession, getSessionUser } from "@/lib/session";
import { db } from "@/lib/store";
import type { ParkingListing } from "@/lib/types";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const listing = await db.listings.findById(id);

  if (!listing) {
    return apiError("Listing not found", 404);
  }

  const user = await getSessionUser(request);
  const admin = getAdminSession(request);

  if (admin || (user?.userType === "OWNER" && user.id === listing.ownerId)) {
    return apiOk({ listing });
  }

  const searchParams = request.nextUrl.searchParams;
  const originLatitude = Number(searchParams.get("lat"));
  const originLongitude = Number(searchParams.get("lng"));
  const hasOrigin = Number.isFinite(originLatitude) && Number.isFinite(originLongitude);

  if (!hasOrigin) {
    return apiOk({ listing: toPublicListing(listing) });
  }

  const distanceKm = haversineKm(originLatitude, originLongitude, listing.latitude, listing.longitude);
  return apiOk({ listing: toPublicListing(listing, distanceKm, estimateMinutes(distanceKm)) });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await getSessionUser(request);
    const admin = getAdminSession(request);
    const listing = await db.listings.findById(id);

    if (!listing) {
      return apiError("Listing not found", 404);
    }

    if (!admin && (!user || user.id !== listing.ownerId)) {
      return apiError("You can only update your own listing", 403);
    }

    const body = await parseJson(request);
    const action = optionalString(body.action);
    const patch: Partial<ParkingListing> = {};

    if (action === "MARK_VACANT") {
      patch.availabilityStatus = "VACANT";
    } else if (action === "MARK_OCCUPIED") {
      patch.availabilityStatus = "OCCUPIED";
    } else if (action === "TAKE_DOWN" || action === "REJECT") {
      patch.listingStatus = "TAKEN_DOWN";
    } else if (action === "MAKE_LIVE" || action === "APPROVE") {
      patch.listingStatus = "LIVE";
    } else {
      if (typeof body.ownerFullName === "string") patch.ownerFullName = body.ownerFullName.trim();
      if (typeof body.ownerContactNumber === "string") patch.ownerContactNumber = body.ownerContactNumber.trim();
      if (typeof body.buildingAddress === "string") patch.buildingAddress = body.buildingAddress.trim();
      if (typeof body.parkingAddressDetails === "string") {
        patch.parkingAddressDetails = body.parkingAddressDetails.trim();
      }
      if (typeof body.parkingFloor === "string") patch.parkingFloor = body.parkingFloor.trim();
      if (typeof body.parkingDirections === "string") patch.parkingDirections = body.parkingDirections.trim();
      if (body.latitude !== undefined) patch.latitude = requireNumber(body.latitude, "Latitude");
      if (body.longitude !== undefined) patch.longitude = requireNumber(body.longitude, "Longitude");
      if (body.priceOneHour !== undefined) patch.priceOneHour = requireNumber(body.priceOneHour, "1 Hour price");
      if (body.priceTwentyFourHours !== undefined) {
        patch.priceTwentyFourHours = requireNumber(body.priceTwentyFourHours, "24 Hour price");
      }
      if (typeof body.customDurationLabel === "string") {
        patch.customDurationLabel = body.customDurationLabel.trim();
      }
      if (body.customDurationPrice !== undefined) {
        patch.customDurationPrice = requireNumber(body.customDurationPrice, "Custom price");
      }
    }

    const updated = await db.listings.update(id, patch);
    return apiOk({ listing: updated });
  } catch (error) {
    return apiError((error as Error).message, 400);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const user = await getSessionUser(request);
  const admin = getAdminSession(request);
  const listing = await db.listings.findById(id);

  if (!listing) {
    return apiError("Listing not found", 404);
  }

  if (!admin && (!user || user.id !== listing.ownerId)) {
    return apiError("You can only delete your own listing", 403);
  }

  await db.listings.delete(id);
  return apiOk({ ok: true });
}
