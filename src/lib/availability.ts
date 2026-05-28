import { AVAILABILITY_TYPES, WEEKDAYS } from "./types";
import type { AvailabilityType, ParkingListing } from "./types";

export type AvailabilityFields = Pick<
  ParkingListing,
  | "availabilityType"
  | "availableDays"
  | "dailyStartTime"
  | "dailyEndTime"
  | "oneTimeStartDate"
  | "oneTimeStartTime"
  | "oneTimeEndDate"
  | "oneTimeEndTime"
>;

type AvailabilityInput = Partial<Record<keyof AvailabilityFields, unknown>>;
type ListingAvailability = AvailabilityFields &
  Partial<Pick<ParkingListing, "availabilityStatus" | "listingStatus">>;

const MS_PER_HOUR = 60 * 60 * 1000;
const WEEKDAY_BY_DATE_INDEX = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function isAvailabilityType(value: unknown): value is AvailabilityType {
  return typeof value === "string" && AVAILABILITY_TYPES.includes(value as AvailabilityType);
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeDayList(value: unknown) {
  const values = Array.isArray(value) ? value : [];
  const validDays = new Set<string>(WEEKDAYS);

  return values.filter((day): day is string => typeof day === "string" && validDays.has(day));
}

function normalizeDateValue(value: unknown) {
  const date = stringOrNull(value);

  if (!date) {
    return null;
  }

  const match = date.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

export function normalizeTimeValue(value: unknown) {
  const time = stringOrNull(value);

  if (!time) {
    return null;
  }

  const match = time.match(/^([01]\d|2[0-3]):([0-5]\d)/);
  return match ? `${match[1]}:${match[2]}` : null;
}

export function normalizeAvailabilityFields(input: AvailabilityInput): AvailabilityFields {
  const availabilityType = isAvailabilityType(input.availabilityType)
    ? input.availabilityType
    : "ALWAYS";

  if (availabilityType === "ALWAYS") {
    return {
      availabilityType,
      availableDays: [],
      dailyStartTime: null,
      dailyEndTime: null,
      oneTimeStartDate: null,
      oneTimeStartTime: null,
      oneTimeEndDate: null,
      oneTimeEndTime: null,
    };
  }

  if (availabilityType === "DAILY") {
    return {
      availabilityType,
      availableDays: normalizeDayList(input.availableDays),
      dailyStartTime: normalizeTimeValue(input.dailyStartTime),
      dailyEndTime: normalizeTimeValue(input.dailyEndTime),
      oneTimeStartDate: null,
      oneTimeStartTime: null,
      oneTimeEndDate: null,
      oneTimeEndTime: null,
    };
  }

  return {
    availabilityType,
    availableDays: [],
    dailyStartTime: null,
    dailyEndTime: null,
    oneTimeStartDate: normalizeDateValue(input.oneTimeStartDate),
    oneTimeStartTime: normalizeTimeValue(input.oneTimeStartTime),
    oneTimeEndDate: normalizeDateValue(input.oneTimeEndDate),
    oneTimeEndTime: normalizeTimeValue(input.oneTimeEndTime),
  };
}

function timeToMinutes(time: string | null) {
  const normalized = normalizeTimeValue(time);

  if (!normalized) {
    return null;
  }

  const [hours, minutes] = normalized.split(":").map(Number);
  return hours * 60 + minutes;
}

function combineDateTime(date: string | null, time: string | null) {
  const normalizedDate = normalizeDateValue(date);
  const normalizedTime = normalizeTimeValue(time);

  if (!normalizedDate || !normalizedTime) {
    return null;
  }

  const value = new Date(`${normalizedDate}T${normalizedTime}:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function dailyEndDate(now: Date, endTime: string | null) {
  const endMinutes = timeToMinutes(endTime);

  if (endMinutes === null) {
    return null;
  }

  const end = new Date(now);
  end.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);
  return end;
}

function isSameDate(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatTimeLabel(time: string | null) {
  const minutes = timeToMinutes(time);

  if (minutes === null) {
    return "";
  }

  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const hour12 = hour24 % 12 || 12;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function formatDateTimeLabel(date: Date, showDate: boolean) {
  const time = formatTimeLabel(
    `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`,
  );

  return showDate ? `${formatDateLabel(date)}, ${time}` : time;
}

export function validateAvailabilitySchedule(input: AvailabilityInput) {
  const availability = normalizeAvailabilityFields(input);

  if (availability.availabilityType === "ALWAYS") {
    return null;
  }

  if (availability.availabilityType === "DAILY") {
    if (availability.availableDays.length === 0) {
      return "Select at least one available day.";
    }

    const startMinutes = timeToMinutes(availability.dailyStartTime);
    const endMinutes = timeToMinutes(availability.dailyEndTime);

    if (startMinutes === null) {
      return "Start time is required.";
    }

    if (endMinutes === null) {
      return "End time is required.";
    }

    if (endMinutes <= startMinutes) {
      return "End time must be after start time.";
    }

    return null;
  }

  const start = combineDateTime(availability.oneTimeStartDate, availability.oneTimeStartTime);
  const end = combineDateTime(availability.oneTimeEndDate, availability.oneTimeEndTime);

  if (!availability.oneTimeStartDate || !availability.oneTimeStartTime) {
    return "Start date and start time are required.";
  }

  if (!availability.oneTimeEndDate || !availability.oneTimeEndTime) {
    return "End date and end time are required.";
  }

  if (!start || !end) {
    return "Enter a valid one-time schedule.";
  }

  if (end <= start) {
    return "End date/time must be after start date/time.";
  }

  return null;
}

export function isWithinAvailabilitySchedule(listing: ListingAvailability, now = new Date()) {
  const availability = normalizeAvailabilityFields(listing);

  if (availability.availabilityType === "ALWAYS") {
    return true;
  }

  if (availability.availabilityType === "DAILY") {
    const today = WEEKDAY_BY_DATE_INDEX[now.getDay()];
    const startMinutes = timeToMinutes(availability.dailyStartTime);
    const endMinutes = timeToMinutes(availability.dailyEndTime);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return (
      availability.availableDays.includes(today) &&
      startMinutes !== null &&
      endMinutes !== null &&
      currentMinutes >= startMinutes &&
      currentMinutes < endMinutes
    );
  }

  const start = combineDateTime(availability.oneTimeStartDate, availability.oneTimeStartTime);
  const end = combineDateTime(availability.oneTimeEndDate, availability.oneTimeEndTime);

  return Boolean(start && end && now >= start && now < end);
}

export function getMaxBookableHours(listing: ListingAvailability, now = new Date()) {
  const availability = normalizeAvailabilityFields(listing);

  if (!isWithinAvailabilitySchedule(availability, now)) {
    return 0;
  }

  if (availability.availabilityType === "ALWAYS") {
    return 24;
  }

  const end =
    availability.availabilityType === "DAILY"
      ? dailyEndDate(now, availability.dailyEndTime)
      : combineDateTime(availability.oneTimeEndDate, availability.oneTimeEndTime);

  if (!end) {
    return 0;
  }

  return Math.max(0, Math.floor((end.getTime() - now.getTime()) / MS_PER_HOUR));
}

export function isListingBookableNow(listing: ListingAvailability, now = new Date()) {
  return (
    listing.listingStatus === "LIVE" &&
    listing.availabilityStatus === "VACANT" &&
    getMaxBookableHours(listing, now) >= 1
  );
}

export function readableScheduleLabel(listing: ListingAvailability) {
  const availability = normalizeAvailabilityFields(listing);

  if (availability.availabilityType === "ALWAYS") {
    return "Available 24/7";
  }

  if (availability.availabilityType === "DAILY") {
    const days = availability.availableDays.length
      ? availability.availableDays.join(", ")
      : "No days selected";
    const start = formatTimeLabel(availability.dailyStartTime);
    const end = formatTimeLabel(availability.dailyEndTime);

    return start && end ? `${days}, ${start} to ${end}` : days;
  }

  const start = combineDateTime(availability.oneTimeStartDate, availability.oneTimeStartTime);
  const end = combineDateTime(availability.oneTimeEndDate, availability.oneTimeEndTime);

  if (!start || !end) {
    return "One-time schedule";
  }

  return `${formatDateTimeLabel(start, true)} to ${formatDateTimeLabel(end, true)}`;
}

export function availabilityNowLabel(listing: ListingAvailability, now = new Date()) {
  const availability = normalizeAvailabilityFields(listing);

  if (availability.availabilityType === "ALWAYS") {
    return "Available 24/7";
  }

  if (!isWithinAvailabilitySchedule(availability, now) || getMaxBookableHours(availability, now) < 1) {
    return "Not available right now";
  }

  const end =
    availability.availabilityType === "DAILY"
      ? dailyEndDate(now, availability.dailyEndTime)
      : combineDateTime(availability.oneTimeEndDate, availability.oneTimeEndTime);

  return end ? `Available until ${formatDateTimeLabel(end, !isSameDate(now, end))}` : "Available now";
}

export function formatHourDuration(hours: number) {
  return `${hours} ${hours === 1 ? "Hour" : "Hours"}`;
}

export function parseHourlyDuration(label: string) {
  const match = label.trim().match(/^(\d+)\s+Hours?$/i);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  return Number.isInteger(hours) && hours > 0 ? hours : null;
}

export function durationLabelToHours(label: string) {
  const normalized = label.trim().toLowerCase();
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|days?|weeks?)/);
  const amount = match ? Number(match[1]) : 1;
  const unit = match?.[2] ?? "";

  if (unit.startsWith("hour") || unit.startsWith("hr")) {
    return amount;
  }

  if (unit.startsWith("day") || (!match && normalized.includes("day"))) {
    return amount * 24;
  }

  if (unit.startsWith("week") || (!match && normalized.includes("week"))) {
    return amount * 24 * 7;
  }

  return null;
}
