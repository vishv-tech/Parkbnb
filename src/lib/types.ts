export const USER_TYPES = ["OWNER", "SEEKER"] as const;
export type UserType = (typeof USER_TYPES)[number];

export const AVAILABILITY_STATUSES = ["VACANT", "OCCUPIED"] as const;
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];

export const LISTING_STATUSES = ["LIVE", "TAKEN_DOWN"] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const BOOKING_STATUSES = ["ACTIVE", "COMPLETED", "CANCELLED"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export type User = {
  id: string;
  fullName: string;
  email: string;
  contactNumber: string;
  passwordHash: string;
  userType: UserType;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SafeUser = Omit<User, "passwordHash">;

export type ParkingListing = {
  id: string;
  ownerId: string;
  ownerFullName: string;
  ownerContactNumber: string;
  buildingAddress: string;
  parkingAddressDetails: string;
  parkingFloor: string;
  parkingDirections: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  priceOneHour: number;
  priceTwentyFourHours: number;
  customDurationLabel: string;
  customDurationPrice: number;
  availabilityStatus: AvailabilityStatus;
  listingStatus: ListingStatus;
  createdAt: string;
  updatedAt: string;
};

export type SeekerProfile = {
  id: string;
  userId: string;
  name: string;
  contactNumber: string;
  carModel: string;
  carNumber: string;
  currentLatitude: number | null;
  currentLongitude: number | null;
  createdAt: string;
  updatedAt: string;
};

export type Booking = {
  id: string;
  seekerId: string;
  ownerId: string;
  parkingListingId: string;
  seekerName: string;
  seekerContact: string;
  carModel: string;
  carNumber: string;
  selectedDuration: string;
  selectedPrice: number;
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
  exactLocationUnlocked: boolean;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicListing = {
  id: string;
  ownerFullName: string;
  generalArea: string;
  imageUrl: string;
  priceOneHour: number;
  priceTwentyFourHours: number;
  customDurationLabel: string;
  customDurationPrice: number;
  availabilityStatus: AvailabilityStatus;
  listingStatus: ListingStatus;
  distanceKm: number | null;
  estimatedMinutes: number | null;
  directionsPreview: string;
};

export type BookingWithListing = Booking & {
  listing: ParkingListing | PublicListing | null;
};

export type LocalDatabase = {
  users: User[];
  parkingListings: ParkingListing[];
  seekerProfiles: SeekerProfile[];
  bookings: Booking[];
};
