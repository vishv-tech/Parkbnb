import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { apiError, apiOk, optionalString, parseJson, requireString } from "@/lib/api";
import { getBookingEndIso, getBookingStartIso } from "@/lib/bookingExpiry";
import { getAdminSession, getSessionUser } from "@/lib/session";
import { db } from "@/lib/store";
import { ISSUE_TYPES } from "@/lib/types";
import type { IssueReport, IssueType, Notification } from "@/lib/types";

export const runtime = "nodejs";

const OVERSTAY_ISSUE_TYPE: IssueType = "Seeker did not remove car on time";
const OVERSTAY_WARNING =
  "Warning: Your parking booking time has ended. Please remove your car as soon as possible. Extra fine may be applied if the vehicle is not removed.";

export async function GET(request: NextRequest) {
  const admin = getAdminSession(request);

  if (!admin) {
    return apiError("Admin login required", 401);
  }

  const issueReports = await db.issueReports.listAll();
  return apiOk({ issueReports });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);

    if (!user || user.userType !== "OWNER") {
      return apiError("Owner login required", 401);
    }

    const body = await parseJson(request);
    const bookingId = requireString(body.bookingId, "Booking");
    const issueType = requireString(body.issueType, "Issue type") as IssueType;
    const message = optionalString(body.message);

    if (!ISSUE_TYPES.includes(issueType)) {
      return apiError("Invalid issue type", 400);
    }

    const booking = await db.bookings.findById(bookingId);

    if (!booking) {
      return apiError("Booking not found", 404);
    }

    const listing = await db.listings.findById(booking.parkingListingId);

    if (!listing) {
      return apiError("Parking listing not found", 404);
    }

    if (booking.ownerId !== user.id || listing.ownerId !== user.id) {
      return apiError("You can only report issues for your own bookings", 403);
    }

    const now = new Date().toISOString();
    const report: IssueReport = {
      id: randomUUID(),
      bookingId: booking.id,
      listingId: listing.id,
      ownerId: user.id,
      seekerId: booking.seekerId,
      issueType,
      message,
      status: "PENDING",
      ownerName: listing.ownerFullName,
      ownerContact: listing.ownerContactNumber,
      seekerName: booking.seekerName,
      seekerContact: booking.seekerContact,
      carModel: booking.carModel,
      carNumber: booking.carNumber,
      listingAddress: listing.buildingAddress,
      bookingStartTime: getBookingStartIso(booking),
      bookingEndTime: getBookingEndIso(booking),
      createdAt: now,
      updatedAt: now,
    };

    const createdReport = await db.issueReports.create(report);

    if (issueType === OVERSTAY_ISSUE_TYPE) {
      const seekerProfile = await db.seekerProfiles.findById(booking.seekerId);

      if (seekerProfile) {
        const notification: Notification = {
          id: randomUUID(),
          userId: seekerProfile.userId,
          bookingId: booking.id,
          type: "OVERSTAY_WARNING",
          title: "Parking booking time ended",
          message: OVERSTAY_WARNING,
          isRead: false,
          createdAt: now,
        };

        await db.notifications.create(notification);
      }
    }

    return apiOk({
      issueReport: createdReport,
      message: "Issue reported successfully. Our team will review it.",
    }, 201);
  } catch (error) {
    return apiError((error as Error).message, 400);
  }
}
