export const USER_TYPES = ["OWNER", "SEEKER"] as const;
export type UserType = (typeof USER_TYPES)[number];

export const AVAILABILITY_STATUSES = ["VACANT", "OCCUPIED"] as const;
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];

export const LISTING_STATUSES = ["LIVE", "TAKEN_DOWN"] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const AVAILABILITY_TYPES = ["ALWAYS", "DAILY", "ONE_TIME"] as const;
export type AvailabilityType = (typeof AVAILABILITY_TYPES)[number];

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const BOOKING_STATUSES = ["ACTIVE", "COMPLETED", "CANCELLED"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const ISSUE_TYPES = [
  "Seeker did not remove car on time",
  "Wrong car parked",
  "Car caused damage",
  "Rule violation",
  "Payment or booking issue",
  "Other",
] as const;
export type IssueType = (typeof ISSUE_TYPES)[number];

export const ISSUE_REPORT_STATUSES = ["PENDING", "REVIEWING", "RESOLVED", "REJECTED"] as const;
export type IssueReportStatus = (typeof ISSUE_REPORT_STATUSES)[number];

export const NOTIFICATION_TYPES = ["OVERSTAY_WARNING"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

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
  availabilityType: AvailabilityType;
  availableDays: string[];
  dailyStartTime: string | null;
  dailyEndTime: string | null;
  oneTimeStartDate: string | null;
  oneTimeStartTime: string | null;
  oneTimeEndDate: string | null;
  oneTimeEndTime: string | null;
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
  bookingStartTime: string | null;
  bookingEndTime: string | null;
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
  exactLocationUnlocked: boolean;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type IssueReport = {
  id: string;
  bookingId: string;
  listingId: string;
  ownerId: string;
  seekerId: string;
  issueType: IssueType;
  message: string;
  status: IssueReportStatus;
  ownerName: string;
  ownerContact: string;
  seekerName: string;
  seekerContact: string;
  carModel: string;
  carNumber: string;
  listingAddress: string;
  bookingStartTime: string | null;
  bookingEndTime: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Notification = {
  id: string;
  userId: string;
  bookingId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
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
  availabilityType: AvailabilityType;
  availableDays: string[];
  dailyStartTime: string | null;
  dailyEndTime: string | null;
  oneTimeStartDate: string | null;
  oneTimeStartTime: string | null;
  oneTimeEndDate: string | null;
  oneTimeEndTime: string | null;
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
  issueReports: IssueReport[];
  notifications: Notification[];
};
