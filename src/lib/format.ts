import type { ParkingListing, PublicListing, SafeUser, User } from "./types";

export function nowIso() {
  return new Date().toISOString();
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function toSafeUser(user: User): SafeUser {
  const safeUser = { ...user } as Partial<User>;
  delete safeUser.passwordHash;
  return safeUser as SafeUser;
}

export function money(amount: number) {
  return `Rs ${Number(amount || 0).toLocaleString("en-IN")}`;
}

export function getGeneralArea(address: string) {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 3) {
    return parts.slice(-3).join(", ");
  }

  if (parts.length >= 2) {
    return parts.slice(-2).join(", ");
  }

  return "Nearby parking area";
}

export function toPublicListing(
  listing: ParkingListing,
  distanceKm: number | null = null,
  estimatedMinutes: number | null = null,
): PublicListing {
  return {
    id: listing.id,
    ownerFullName: listing.ownerFullName,
    generalArea: getGeneralArea(listing.buildingAddress),
    imageUrl: listing.imageUrl || "/parking-placeholder.svg",
    priceOneHour: listing.priceOneHour,
    priceTwentyFourHours: listing.priceTwentyFourHours,
    customDurationLabel: listing.customDurationLabel,
    customDurationPrice: listing.customDurationPrice,
    availabilityStatus: listing.availabilityStatus,
    listingStatus: listing.listingStatus,
    distanceKm,
    estimatedMinutes,
    directionsPreview: "Exact floor, gate, slot, and route unlock after payment.",
  };
}

export function listingDurationOptions(listing: ParkingListing | PublicListing) {
  const options = [
    { label: "1 Hour", price: listing.priceOneHour },
    { label: "24 Hours", price: listing.priceTwentyFourHours },
  ];

  if (listing.customDurationLabel && listing.customDurationPrice > 0) {
    options.push({
      label: listing.customDurationLabel,
      price: listing.customDurationPrice,
    });
  }

  return options;
}
