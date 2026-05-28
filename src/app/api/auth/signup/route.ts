import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { apiError, requireString } from "@/lib/api";
import { requireContactNumber } from "@/lib/contactNumber";
import { normalizeEmail, nowIso, toSafeUser } from "@/lib/format";
import { hashPassword } from "@/lib/password";
import { setUserSession } from "@/lib/session";
import { db } from "@/lib/store";
import type { User, UserType } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const fullName = requireString(body.fullName, "Full name");
    const email = normalizeEmail(requireString(body.email, "Email"));
    const contactNumber = requireContactNumber(body.contactNumber);
    const password = requireString(body.password, "Password");
    const userType = requireString(body.userType, "User type") as UserType;

    if (!["OWNER", "SEEKER"].includes(userType)) {
      return apiError("User type must be OWNER or SEEKER", 400);
    }

    if (password.length < 6) {
      return apiError("Password must be at least 6 characters", 400);
    }

    const existing = await db.users.findByEmail(email);

    if (existing) {
      return apiError("An account with this email already exists", 409);
    }

    const now = nowIso();
    const user: User = {
      id: randomUUID(),
      fullName,
      email,
      contactNumber,
      passwordHash: hashPassword(password),
      userType,
      isBlocked: false,
      createdAt: now,
      updatedAt: now,
    };

    const created = await db.users.create(user);
    const response = NextResponse.json({ user: toSafeUser(created) }, { status: 201 });
    setUserSession(response, created.id);
    return response;
  } catch (error) {
    return apiError((error as Error).message, 400);
  }
}
