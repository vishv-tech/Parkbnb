import { promises as fs } from "fs";
import path from "path";
import type {
  Booking,
  IssueReport,
  LocalDatabase,
  Notification,
  OwnerMonthlyEarning,
  ParkingListing,
  SeekerProfile,
  User,
} from "./types";
import { normalizeAvailabilityFields } from "./availability";
import { nowIso } from "./format";
import { calculatePlatformFeeAmount, calculateTotalAmount } from "./platformFee";

type ColumnMap<T extends object> = Record<keyof T & string, string>;

const initialDatabase: LocalDatabase = {
  users: [],
  parkingListings: [],
  seekerProfiles: [],
  bookings: [],
  issueReports: [],
  notifications: [],
  ownerMonthlyEarnings: [],
};

const localDatabasePath = path.join(process.cwd(), ".data", "park2bnb.json");

function getSupabaseConfig() {
  return {
    url: (process.env.SUPABASE_URL || "").trim(),
    key: (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim(),
  };
}

function isSupabasePlaceholder(url: string, key: string) {
  return url.includes("your-project") || key.includes("your-service-role-key");
}

function getSupabaseBaseUrl() {
  const { url } = getSupabaseConfig();
  const trimmedUrl = url.replace(/\/+$/, "");

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    throw new Error("SUPABASE_URL must be a valid URL like https://PROJECT_REF.supabase.co");
  }

  if (parsedUrl.protocol !== "https:" || !/^[a-z0-9-]+\.supabase\.co$/i.test(parsedUrl.hostname)) {
    throw new Error("SUPABASE_URL must look like https://PROJECT_REF.supabase.co");
  }

  if ((parsedUrl.pathname && parsedUrl.pathname !== "/") || parsedUrl.search || parsedUrl.hash) {
    throw new Error(
      "SUPABASE_URL should be only your project URL, like https://PROJECT_REF.supabase.co. Remove extra paths such as /rest/v1, /dashboard, or /project.",
    );
  }

  return `${parsedUrl.protocol}//${parsedUrl.host}`;
}

function getSupabaseServiceRoleKey() {
  return getSupabaseConfig().key;
}

const userMap: ColumnMap<User> = {
  id: "id",
  fullName: "full_name",
  email: "email",
  contactNumber: "contact_number",
  passwordHash: "password_hash",
  userType: "user_type",
  upiId: "upi_id",
  isBlocked: "is_blocked",
  createdAt: "created_at",
  updatedAt: "updated_at",
};

const listingMap: ColumnMap<ParkingListing> = {
  id: "id",
  ownerId: "owner_id",
  ownerFullName: "owner_full_name",
  ownerContactNumber: "owner_contact_number",
  buildingAddress: "building_address",
  parkingAddressDetails: "parking_address_details",
  parkingFloor: "parking_floor",
  parkingDirections: "parking_directions",
  imageUrl: "image_url",
  latitude: "latitude",
  longitude: "longitude",
  priceOneHour: "price_one_hour",
  priceTwentyFourHours: "price_twenty_four_hours",
  customDurationLabel: "custom_duration_label",
  customDurationPrice: "custom_duration_price",
  availabilityStatus: "availability_status",
  listingStatus: "listing_status",
  availabilityType: "availability_type",
  availableDays: "available_days",
  dailyStartTime: "daily_start_time",
  dailyEndTime: "daily_end_time",
  oneTimeStartDate: "one_time_start_date",
  oneTimeStartTime: "one_time_start_time",
  oneTimeEndDate: "one_time_end_date",
  oneTimeEndTime: "one_time_end_time",
  createdAt: "created_at",
  updatedAt: "updated_at",
};

const profileMap: ColumnMap<SeekerProfile> = {
  id: "id",
  userId: "user_id",
  name: "name",
  contactNumber: "contact_number",
  carModel: "car_model",
  carNumber: "car_number",
  currentLatitude: "current_latitude",
  currentLongitude: "current_longitude",
  createdAt: "created_at",
  updatedAt: "updated_at",
};

const bookingMap: ColumnMap<Booking> = {
  id: "id",
  seekerId: "seeker_id",
  ownerId: "owner_id",
  parkingListingId: "parking_listing_id",
  seekerName: "seeker_name",
  seekerContact: "seeker_contact",
  carModel: "car_model",
  carNumber: "car_number",
  selectedDuration: "selected_duration",
  selectedPrice: "selected_price",
  platformFeeAmount: "platform_fee_amount",
  totalAmount: "total_amount",
  bookingStartTime: "booking_start_time",
  bookingEndTime: "booking_end_time",
  paymentStatus: "payment_status",
  bookingStatus: "booking_status",
  exactLocationUnlocked: "exact_location_unlocked",
  razorpayOrderId: "razorpay_order_id",
  razorpayPaymentId: "razorpay_payment_id",
  createdAt: "created_at",
  updatedAt: "updated_at",
};

const issueReportMap: ColumnMap<IssueReport> = {
  id: "id",
  bookingId: "booking_id",
  listingId: "listing_id",
  ownerId: "owner_id",
  seekerId: "seeker_id",
  issueType: "issue_type",
  message: "message",
  status: "status",
  ownerName: "owner_name",
  ownerContact: "owner_contact",
  seekerName: "seeker_name",
  seekerContact: "seeker_contact",
  carModel: "car_model",
  carNumber: "car_number",
  listingAddress: "listing_address",
  bookingStartTime: "booking_start_time",
  bookingEndTime: "booking_end_time",
  createdAt: "created_at",
  updatedAt: "updated_at",
};

const notificationMap: ColumnMap<Notification> = {
  id: "id",
  userId: "user_id",
  bookingId: "booking_id",
  type: "type",
  title: "title",
  message: "message",
  isRead: "is_read",
  createdAt: "created_at",
};

const ownerMonthlyEarningMap: ColumnMap<OwnerMonthlyEarning> = {
  id: "id",
  ownerId: "owner_id",
  month: "month",
  year: "year",
  totalEarning: "total_earning",
  grossBookingAmount: "gross_booking_amount",
  platformFeeAmount: "platform_fee_amount",
  paidBookingCount: "paid_booking_count",
  upiId: "upi_id",
  payoutStatus: "payout_status",
  createdAt: "created_at",
  updatedAt: "updated_at",
};

function hasSupabase() {
  const { url, key } = getSupabaseConfig();

  if (!url || !key || isSupabasePlaceholder(url, key)) {
    return false;
  }

  getSupabaseBaseUrl();
  return true;
}

function serviceHeaders(extraHeaders?: HeadersInit) {
  const serviceKey = getSupabaseServiceRoleKey();
  const headers = new Headers(extraHeaders);

  headers.set("apikey", serviceKey);
  headers.set("Authorization", `Bearer ${serviceKey}`);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

async function supabaseFetch<T>(pathName: string, init?: RequestInit) {
  const baseUrl = getSupabaseBaseUrl();

  const response = await fetch(`${baseUrl}/rest/v1/${pathName}`, {
    ...init,
    headers: serviceHeaders(init?.headers),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function toDbRow<T extends object>(
  record: Partial<T>,
  map: ColumnMap<T>,
) {
  const row: Record<string, unknown> = {};
  const source = record as Record<string, unknown>;

  for (const [appKey, columnName] of Object.entries(map) as [keyof T & string, string][]) {
    if (source[appKey] !== undefined) {
      row[columnName] = source[appKey];
    }
  }

  return row;
}

function fromDbRow<T extends object>(
  row: Record<string, unknown>,
  map: ColumnMap<T>,
) {
  const record: Record<string, unknown> = {};

  for (const [appKey, columnName] of Object.entries(map) as [keyof T & string, string][]) {
    record[appKey] = row[columnName];
  }

  return record as T;
}

function eq(value: string) {
  return encodeURIComponent(value);
}

function normalizeUser(user: User) {
  return {
    ...user,
    upiId: user.upiId ?? null,
  };
}

function normalizeListing(listing: ParkingListing) {
  return {
    ...listing,
    ...normalizeAvailabilityFields(listing),
  };
}

function normalizeBooking(booking: Booking) {
  const selectedPrice = Number(booking.selectedPrice || 0);
  const platformFeeAmount =
    booking.platformFeeAmount ?? calculatePlatformFeeAmount(selectedPrice);

  return {
    ...booking,
    selectedPrice,
    platformFeeAmount,
    totalAmount: booking.totalAmount ?? calculateTotalAmount(selectedPrice),
    bookingStartTime: booking.bookingStartTime ?? null,
    bookingEndTime: booking.bookingEndTime ?? null,
  };
}

function normalizeOwnerMonthlyEarning(earning: OwnerMonthlyEarning) {
  return {
    ...earning,
    month: Number(earning.month),
    year: Number(earning.year),
    totalEarning: Number(earning.totalEarning || 0),
    grossBookingAmount: Number(earning.grossBookingAmount || 0),
    platformFeeAmount: Number(earning.platformFeeAmount || 0),
    paidBookingCount: Number(earning.paidBookingCount || 0),
    upiId: earning.upiId ?? null,
    payoutStatus: earning.payoutStatus ?? "PENDING",
  };
}

function normalizeLocalDatabase(database: Partial<LocalDatabase>): LocalDatabase {
  return {
    users: (database.users ?? []).map(normalizeUser),
    parkingListings: (database.parkingListings ?? []).map(normalizeListing),
    seekerProfiles: database.seekerProfiles ?? [],
    bookings: (database.bookings ?? []).map(normalizeBooking),
    issueReports: database.issueReports ?? [],
    notifications: database.notifications ?? [],
    ownerMonthlyEarnings: (database.ownerMonthlyEarnings ?? []).map(normalizeOwnerMonthlyEarning),
  };
}

async function readLocalDatabase() {
  await fs.mkdir(path.dirname(localDatabasePath), { recursive: true });

  try {
    const raw = await fs.readFile(localDatabasePath, "utf8");
    return normalizeLocalDatabase(JSON.parse(raw) as Partial<LocalDatabase>);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;

    if (code !== "ENOENT") {
      throw error;
    }

    await writeLocalDatabase(initialDatabase);
    return normalizeLocalDatabase(structuredClone(initialDatabase));
  }
}

async function writeLocalDatabase(database: LocalDatabase) {
  await fs.mkdir(path.dirname(localDatabasePath), { recursive: true });
  await fs.writeFile(localDatabasePath, JSON.stringify(database, null, 2));
}

export const db = {
  users: {
    async list() {
      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>("users?select=*&order=created_at.desc");
        return rows.map((row) => normalizeUser(fromDbRow<User>(row, userMap)));
      }

      const database = await readLocalDatabase();
      return database.users.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async findById(id: string) {
      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>(
          `users?id=eq.${eq(id)}&select=*&limit=1`,
        );
        return rows[0] ? normalizeUser(fromDbRow<User>(rows[0], userMap)) : null;
      }

      const database = await readLocalDatabase();
      return database.users.find((user) => user.id === id) ?? null;
    },

    async findByEmail(email: string) {
      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>(
          `users?email=eq.${eq(email)}&select=*&limit=1`,
        );
        return rows[0] ? normalizeUser(fromDbRow<User>(rows[0], userMap)) : null;
      }

      const database = await readLocalDatabase();
      return database.users.find((user) => user.email === email) ?? null;
    },

    async create(user: User) {
      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>("users?select=*", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(toDbRow<User>(user, userMap)),
        });
        return normalizeUser(fromDbRow<User>(rows[0], userMap));
      }

      const database = await readLocalDatabase();
      database.users.push(user);
      await writeLocalDatabase(database);
      return user;
    },

    async update(id: string, patch: Partial<User>) {
      const updatedAt = nowIso();

      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>(
          `users?id=eq.${eq(id)}&select=*`,
          {
            method: "PATCH",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify(toDbRow<User>({ ...patch, updatedAt }, userMap)),
          },
        );
        return rows[0] ? normalizeUser(fromDbRow<User>(rows[0], userMap)) : null;
      }

      const database = await readLocalDatabase();
      const index = database.users.findIndex((user) => user.id === id);

      if (index === -1) {
        return null;
      }

      database.users[index] = { ...database.users[index], ...patch, updatedAt };
      await writeLocalDatabase(database);
      return database.users[index];
    },
  },

  listings: {
    async listAll() {
      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>(
          "parking_listings?select=*&order=created_at.desc",
        );
        return rows.map((row) => normalizeListing(fromDbRow<ParkingListing>(row, listingMap)));
      }

      const database = await readLocalDatabase();
      return database.parkingListings
        .map(normalizeListing)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async listByOwner(ownerId: string) {
      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>(
          `parking_listings?owner_id=eq.${eq(ownerId)}&select=*&order=created_at.desc`,
        );
        return rows.map((row) => normalizeListing(fromDbRow<ParkingListing>(row, listingMap)));
      }

      const database = await readLocalDatabase();
      return database.parkingListings
        .map(normalizeListing)
        .filter((listing) => listing.ownerId === ownerId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async listLiveVacant() {
      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>(
          "parking_listings?listing_status=eq.LIVE&availability_status=eq.VACANT&select=*",
        );
        return rows.map((row) => normalizeListing(fromDbRow<ParkingListing>(row, listingMap)));
      }

      const database = await readLocalDatabase();
      return database.parkingListings
        .map(normalizeListing)
        .filter(
          (listing) =>
            listing.listingStatus === "LIVE" && listing.availabilityStatus === "VACANT",
        );
    },

    async findById(id: string) {
      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>(
          `parking_listings?id=eq.${eq(id)}&select=*&limit=1`,
        );
        return rows[0] ? normalizeListing(fromDbRow<ParkingListing>(rows[0], listingMap)) : null;
      }

      const database = await readLocalDatabase();
      const listing = database.parkingListings.find((item) => item.id === id);
      return listing ? normalizeListing(listing) : null;
    },

    async create(listing: ParkingListing) {
      const normalizedListing = normalizeListing(listing);

      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>(
          "parking_listings?select=*",
          {
            method: "POST",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify(toDbRow<ParkingListing>(normalizedListing, listingMap)),
          },
        );
        return normalizeListing(fromDbRow<ParkingListing>(rows[0], listingMap));
      }

      const database = await readLocalDatabase();
      database.parkingListings.push(normalizedListing);
      await writeLocalDatabase(database);
      return normalizedListing;
    },

    async update(id: string, patch: Partial<ParkingListing>) {
      const updatedAt = nowIso();

      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>(
          `parking_listings?id=eq.${eq(id)}&select=*`,
          {
            method: "PATCH",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify(toDbRow<ParkingListing>({ ...patch, updatedAt }, listingMap)),
          },
        );
        return rows[0] ? normalizeListing(fromDbRow<ParkingListing>(rows[0], listingMap)) : null;
      }

      const database = await readLocalDatabase();
      const index = database.parkingListings.findIndex((listing) => listing.id === id);

      if (index === -1) {
        return null;
      }

      database.parkingListings[index] = normalizeListing({
        ...database.parkingListings[index],
        ...patch,
        updatedAt,
      });
      await writeLocalDatabase(database);
      return normalizeListing(database.parkingListings[index]);
    },

    async delete(id: string) {
      if (hasSupabase()) {
        await supabaseFetch<undefined>(`parking_listings?id=eq.${eq(id)}`, {
          method: "DELETE",
        });
        return true;
      }

      const database = await readLocalDatabase();
      const before = database.parkingListings.length;
      database.parkingListings = database.parkingListings.filter((listing) => listing.id !== id);
      await writeLocalDatabase(database);
      return database.parkingListings.length !== before;
    },
  },

  seekerProfiles: {
    async listAll() {
      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>(
          "seeker_profiles?select=*&order=created_at.desc",
        );
        return rows.map((row) => fromDbRow<SeekerProfile>(row, profileMap));
      }

      const database = await readLocalDatabase();
      return database.seekerProfiles.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async findByUserId(userId: string) {
      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>(
          `seeker_profiles?user_id=eq.${eq(userId)}&select=*&limit=1`,
        );
        return rows[0] ? fromDbRow<SeekerProfile>(rows[0], profileMap) : null;
      }

      const database = await readLocalDatabase();
      return database.seekerProfiles.find((profile) => profile.userId === userId) ?? null;
    },

    async findById(id: string) {
      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>(
          `seeker_profiles?id=eq.${eq(id)}&select=*&limit=1`,
        );
        return rows[0] ? fromDbRow<SeekerProfile>(rows[0], profileMap) : null;
      }

      const database = await readLocalDatabase();
      return database.seekerProfiles.find((profile) => profile.id === id) ?? null;
    },

    async upsert(profile: SeekerProfile) {
      const existing = await this.findByUserId(profile.userId);

      if (existing) {
        return this.update(existing.id, profile);
      }

      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>(
          "seeker_profiles?select=*",
          {
            method: "POST",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify(toDbRow<SeekerProfile>(profile, profileMap)),
          },
        );
        return fromDbRow<SeekerProfile>(rows[0], profileMap);
      }

      const database = await readLocalDatabase();
      database.seekerProfiles.push(profile);
      await writeLocalDatabase(database);
      return profile;
    },

    async update(id: string, patch: Partial<SeekerProfile>) {
      const updatedAt = nowIso();

      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>(
          `seeker_profiles?id=eq.${eq(id)}&select=*`,
          {
            method: "PATCH",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify(toDbRow<SeekerProfile>({ ...patch, updatedAt }, profileMap)),
          },
        );
        return rows[0] ? fromDbRow<SeekerProfile>(rows[0], profileMap) : null;
      }

      const database = await readLocalDatabase();
      const index = database.seekerProfiles.findIndex((profile) => profile.id === id);

      if (index === -1) {
        return null;
      }

      database.seekerProfiles[index] = { ...database.seekerProfiles[index], ...patch, updatedAt };
      await writeLocalDatabase(database);
      return database.seekerProfiles[index];
    },
  },

  bookings: {
    async listAll() {
      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>(
          "bookings?select=*&order=created_at.desc",
        );
        return rows.map((row) => normalizeBooking(fromDbRow<Booking>(row, bookingMap)));
      }

      const database = await readLocalDatabase();
      return database.bookings
        .map(normalizeBooking)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async listByOwner(ownerId: string) {
      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>(
          `bookings?owner_id=eq.${eq(ownerId)}&select=*&order=created_at.desc`,
        );
        return rows.map((row) => normalizeBooking(fromDbRow<Booking>(row, bookingMap)));
      }

      const database = await readLocalDatabase();
      return database.bookings
        .map(normalizeBooking)
        .filter((booking) => booking.ownerId === ownerId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async listBySeeker(seekerId: string) {
      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>(
          `bookings?seeker_id=eq.${eq(seekerId)}&select=*&order=created_at.desc`,
        );
        return rows.map((row) => normalizeBooking(fromDbRow<Booking>(row, bookingMap)));
      }

      const database = await readLocalDatabase();
      return database.bookings
        .map(normalizeBooking)
        .filter((booking) => booking.seekerId === seekerId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async findById(id: string) {
      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>(
          `bookings?id=eq.${eq(id)}&select=*&limit=1`,
        );
        return rows[0] ? normalizeBooking(fromDbRow<Booking>(rows[0], bookingMap)) : null;
      }

      const database = await readLocalDatabase();
      const booking = database.bookings.find((item) => item.id === id);
      return booking ? normalizeBooking(booking) : null;
    },

    async create(booking: Booking) {
      const normalizedBooking = normalizeBooking(booking);

      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>("bookings?select=*", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(toDbRow<Booking>(normalizedBooking, bookingMap)),
        });
        return normalizeBooking(fromDbRow<Booking>(rows[0], bookingMap));
      }

      const database = await readLocalDatabase();
      database.bookings.push(normalizedBooking);
      await writeLocalDatabase(database);
      return normalizedBooking;
    },

    async update(id: string, patch: Partial<Booking>) {
      const updatedAt = nowIso();

      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>(
          `bookings?id=eq.${eq(id)}&select=*`,
          {
            method: "PATCH",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify(toDbRow<Booking>({ ...patch, updatedAt }, bookingMap)),
          },
        );
        return rows[0] ? normalizeBooking(fromDbRow<Booking>(rows[0], bookingMap)) : null;
      }

      const database = await readLocalDatabase();
      const index = database.bookings.findIndex((booking) => booking.id === id);

      if (index === -1) {
        return null;
      }

      database.bookings[index] = normalizeBooking({ ...database.bookings[index], ...patch, updatedAt });
      await writeLocalDatabase(database);
      return normalizeBooking(database.bookings[index]);
    },
  },

  issueReports: {
    async listAll() {
      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>(
          "issue_reports?select=*&order=created_at.desc",
        );
        return rows.map((row) => fromDbRow<IssueReport>(row, issueReportMap));
      }

      const database = await readLocalDatabase();
      return database.issueReports.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async create(report: IssueReport) {
      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>("issue_reports?select=*", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(toDbRow<IssueReport>(report, issueReportMap)),
        });
        return fromDbRow<IssueReport>(rows[0], issueReportMap);
      }

      const database = await readLocalDatabase();
      database.issueReports.push(report);
      await writeLocalDatabase(database);
      return report;
    },

    async updateStatus(id: string, status: IssueReport["status"]) {
      const updatedAt = nowIso();

      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>(
          `issue_reports?id=eq.${eq(id)}&select=*`,
          {
            method: "PATCH",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify(toDbRow<IssueReport>({ status, updatedAt }, issueReportMap)),
          },
        );
        return rows[0] ? fromDbRow<IssueReport>(rows[0], issueReportMap) : null;
      }

      const database = await readLocalDatabase();
      const index = database.issueReports.findIndex((report) => report.id === id);

      if (index === -1) {
        return null;
      }

      database.issueReports[index] = { ...database.issueReports[index], status, updatedAt };
      await writeLocalDatabase(database);
      return database.issueReports[index];
    },
  },

  notifications: {
    async listByUserId(userId: string) {
      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>(
          `notifications?user_id=eq.${eq(userId)}&select=*&order=created_at.desc`,
        );
        return rows.map((row) => fromDbRow<Notification>(row, notificationMap));
      }

      const database = await readLocalDatabase();
      return database.notifications
        .filter((notification) => notification.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async create(notification: Notification) {
      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>("notifications?select=*", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(toDbRow<Notification>(notification, notificationMap)),
        });
        return fromDbRow<Notification>(rows[0], notificationMap);
      }

      const database = await readLocalDatabase();
      database.notifications.push(notification);
      await writeLocalDatabase(database);
      return notification;
    },
  },

  ownerMonthlyEarnings: {
    async listAll() {
      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>(
          "owner_monthly_earnings?select=*&order=year.desc,month.desc",
        );
        return rows.map((row) =>
          normalizeOwnerMonthlyEarning(fromDbRow<OwnerMonthlyEarning>(row, ownerMonthlyEarningMap)),
        );
      }

      const database = await readLocalDatabase();
      return database.ownerMonthlyEarnings.sort((a, b) => {
        if (a.year !== b.year) {
          return b.year - a.year;
        }

        return b.month - a.month;
      });
    },

    async listByOwner(ownerId: string) {
      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>(
          `owner_monthly_earnings?owner_id=eq.${eq(ownerId)}&select=*&order=year.desc,month.desc`,
        );
        return rows.map((row) =>
          normalizeOwnerMonthlyEarning(fromDbRow<OwnerMonthlyEarning>(row, ownerMonthlyEarningMap)),
        );
      }

      const database = await readLocalDatabase();
      return database.ownerMonthlyEarnings
        .filter((earning) => earning.ownerId === ownerId)
        .sort((a, b) => {
          if (a.year !== b.year) {
            return b.year - a.year;
          }

          return b.month - a.month;
        });
    },

    async findByOwnerMonth(ownerId: string, month: number, year: number) {
      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>(
          `owner_monthly_earnings?owner_id=eq.${eq(ownerId)}&month=eq.${month}&year=eq.${year}&select=*&limit=1`,
        );
        return rows[0]
          ? normalizeOwnerMonthlyEarning(fromDbRow<OwnerMonthlyEarning>(rows[0], ownerMonthlyEarningMap))
          : null;
      }

      const database = await readLocalDatabase();
      return (
        database.ownerMonthlyEarnings.find(
          (earning) => earning.ownerId === ownerId && earning.month === month && earning.year === year,
        ) ?? null
      );
    },

    async upsert(earning: OwnerMonthlyEarning) {
      const normalizedEarning = normalizeOwnerMonthlyEarning(earning);
      const existing = await this.findByOwnerMonth(
        normalizedEarning.ownerId,
        normalizedEarning.month,
        normalizedEarning.year,
      );

      if (existing) {
        return this.update(existing.id, {
          ...normalizedEarning,
          id: existing.id,
          createdAt: existing.createdAt,
        });
      }

      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>(
          "owner_monthly_earnings?select=*",
          {
            method: "POST",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify(toDbRow<OwnerMonthlyEarning>(normalizedEarning, ownerMonthlyEarningMap)),
          },
        );
        return normalizeOwnerMonthlyEarning(fromDbRow<OwnerMonthlyEarning>(rows[0], ownerMonthlyEarningMap));
      }

      const database = await readLocalDatabase();
      database.ownerMonthlyEarnings.push(normalizedEarning);
      await writeLocalDatabase(database);
      return normalizedEarning;
    },

    async update(id: string, patch: Partial<OwnerMonthlyEarning>) {
      const updatedAt = nowIso();

      if (hasSupabase()) {
        const rows = await supabaseFetch<Record<string, unknown>[]>(
          `owner_monthly_earnings?id=eq.${eq(id)}&select=*`,
          {
            method: "PATCH",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify(toDbRow<OwnerMonthlyEarning>({ ...patch, updatedAt }, ownerMonthlyEarningMap)),
          },
        );
        return rows[0]
          ? normalizeOwnerMonthlyEarning(fromDbRow<OwnerMonthlyEarning>(rows[0], ownerMonthlyEarningMap))
          : null;
      }

      const database = await readLocalDatabase();
      const index = database.ownerMonthlyEarnings.findIndex((earning) => earning.id === id);

      if (index === -1) {
        return null;
      }

      database.ownerMonthlyEarnings[index] = normalizeOwnerMonthlyEarning({
        ...database.ownerMonthlyEarnings[index],
        ...patch,
        updatedAt,
      });
      await writeLocalDatabase(database);
      return database.ownerMonthlyEarnings[index];
    },

    async updateStatus(id: string, payoutStatus: OwnerMonthlyEarning["payoutStatus"]) {
      return this.update(id, { payoutStatus });
    },
  },
};
