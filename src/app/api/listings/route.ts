import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import {
  apiError,
  apiOk,
  optionalString,
  requireNumber,
  requireString,
} from "@/lib/api";
import {
  isListingBookableNow,
  normalizeAvailabilityFields,
  validateAvailabilitySchedule,
} from "@/lib/availability";
import { requireContactNumber } from "@/lib/contactNumber";
import { estimateMinutes, haversineKm } from "@/lib/distance";
import { nowIso, toPublicListing } from "@/lib/format";
import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/store";
import { uploadParkingImage } from "@/lib/uploads";
import type { ParkingListing } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);

  if (!user) {
    return apiError("Login required", 401);
  }

  const searchParams = request.nextUrl.searchParams;

  if (searchParams.get("mine") === "true") {
    if (user.userType !== "OWNER") {
      return apiError("Owner account required", 403);
    }

    const listings = await db.listings.listByOwner(user.id);
    return apiOk({ listings });
  }

  const originLatitude = Number(searchParams.get("lat"));
  const originLongitude = Number(searchParams.get("lng"));
  const hasOrigin = Number.isFinite(originLatitude) && Number.isFinite(originLongitude);
  const now = new Date();
  const listings = (await db.listings.listLiveVacant()).filter((listing) =>
    isListingBookableNow(listing, now),
  );

  const publicListings = listings
    .map((listing) => {
      if (!hasOrigin) {
        return toPublicListing(listing);
      }

      const distanceKm = haversineKm(
        originLatitude,
        originLongitude,
        listing.latitude,
        listing.longitude,
      );

      return toPublicListing(listing, distanceKm, estimateMinutes(distanceKm));
    })
    .sort((a, b) => (a.distanceKm ?? Number.MAX_SAFE_INTEGER) - (b.distanceKm ?? Number.MAX_SAFE_INTEGER));

  return apiOk({ listings: publicListings });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);

    if (!user) {
      return apiError("Login required", 401);
    }

    if (user.userType !== "OWNER") {
      return apiError("Only parking owners can create listings", 403);
    }

    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File) || image.size === 0) {
      return apiError("Parking image is required", 400);
    }

    if (!image.type.startsWith("image/")) {
      return apiError("Upload a valid image file", 400);
    }

    if (image.size > 5 * 1024 * 1024) {
      return apiError("Image must be 5 MB or smaller", 400);
    }

    const now = nowIso();
    const imageUrl = await uploadParkingImage(image, user.id);
    const availability = normalizeAvailabilityFields({
      availabilityType: formData.get("availabilityType"),
      availableDays: formData.getAll("availableDays"),
      dailyStartTime: formData.get("dailyStartTime"),
      dailyEndTime: formData.get("dailyEndTime"),
      oneTimeStartDate: formData.get("oneTimeStartDate"),
      oneTimeStartTime: formData.get("oneTimeStartTime"),
      oneTimeEndDate: formData.get("oneTimeEndDate"),
      oneTimeEndTime: formData.get("oneTimeEndTime"),
    });
    const availabilityError = validateAvailabilitySchedule(availability);

    if (availabilityError) {
      return apiError(availabilityError, 400);
    }

    const listing: ParkingListing = {
      id: randomUUID(),
      ownerId: user.id,
      ownerFullName: requireString(formData.get("ownerFullName"), "Full name"),
      ownerContactNumber: requireContactNumber(formData.get("ownerContactNumber")),
      buildingAddress: requireString(formData.get("buildingAddress"), "Building address"),
      parkingAddressDetails: requireString(
        formData.get("parkingAddressDetails"),
        "Parking address details",
      ),
      parkingFloor: requireString(formData.get("parkingFloor"), "Parking floor"),
      parkingDirections: requireString(formData.get("parkingDirections"), "Parking directions"),
      imageUrl,
      latitude: requireNumber(formData.get("latitude"), "Latitude"),
      longitude: requireNumber(formData.get("longitude"), "Longitude"),
      priceOneHour: requireNumber(formData.get("priceOneHour"), "1 Hour price"),
      priceTwentyFourHours: requireNumber(
        formData.get("priceTwentyFourHours"),
        "24 Hour price",
      ),
      customDurationLabel: optionalString(formData.get("customDurationLabel")) || "Custom",
      customDurationPrice: requireNumber(formData.get("customDurationPrice"), "Custom price"),
      availabilityStatus: "VACANT",
      listingStatus: "LIVE",
      ...availability,
      createdAt: now,
      updatedAt: now,
    };

    const created = await db.listings.create(listing);
    return apiOk({ listing: created, message: "Your parking spot is now live." }, 201);
  } catch (error) {
    return apiError((error as Error).message, 400);
  }
}
