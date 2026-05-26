import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { apiError, apiOk, parseJson, requireNumber, requireString } from "@/lib/api";
import { nowIso } from "@/lib/format";
import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/store";
import type { SeekerProfile } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);

  if (!user) {
    return apiError("Login required", 401);
  }

  if (user.userType !== "SEEKER") {
    return apiError("Seeker account required", 403);
  }

  const profile = await db.seekerProfiles.findByUserId(user.id);
  return apiOk({ profile });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);

    if (!user) {
      return apiError("Login required", 401);
    }

    if (user.userType !== "SEEKER") {
      return apiError("Seeker account required", 403);
    }

    const body = await parseJson(request);
    const existing = await db.seekerProfiles.findByUserId(user.id);
    const now = nowIso();
    const profile: SeekerProfile = {
      id: existing?.id || randomUUID(),
      userId: user.id,
      name: requireString(body.name, "Name"),
      contactNumber: requireString(body.contactNumber, "Contact number"),
      carModel: requireString(body.carModel, "Car model"),
      carNumber: requireString(body.carNumber, "Car number"),
      currentLatitude:
        body.currentLatitude === undefined || body.currentLatitude === null
          ? existing?.currentLatitude ?? null
          : requireNumber(body.currentLatitude, "Latitude"),
      currentLongitude:
        body.currentLongitude === undefined || body.currentLongitude === null
          ? existing?.currentLongitude ?? null
          : requireNumber(body.currentLongitude, "Longitude"),
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    const saved = await db.seekerProfiles.upsert(profile);
    return apiOk({ profile: saved });
  } catch (error) {
    return apiError((error as Error).message, 400);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getSessionUser(request);

    if (!user) {
      return apiError("Login required", 401);
    }

    if (user.userType !== "SEEKER") {
      return apiError("Seeker account required", 403);
    }

    const body = await parseJson(request);
    const existing = await db.seekerProfiles.findByUserId(user.id);

    if (!existing) {
      return apiError("Add your vehicle details first", 400);
    }

    const updated = await db.seekerProfiles.update(existing.id, {
      currentLatitude: requireNumber(body.currentLatitude, "Latitude"),
      currentLongitude: requireNumber(body.currentLongitude, "Longitude"),
    });

    return apiOk({ profile: updated });
  } catch (error) {
    return apiError((error as Error).message, 400);
  }
}
