import { NextRequest, NextResponse } from "next/server";
import { apiError, requireString } from "@/lib/api";
import { normalizeEmail, toSafeUser } from "@/lib/format";
import { verifyPassword } from "@/lib/password";
import { setUserSession } from "@/lib/session";
import { db } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const email = normalizeEmail(requireString(body.email, "Email"));
    const password = requireString(body.password, "Password");
    const user = await db.users.findByEmail(email);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return apiError("Invalid email or password", 401);
    }

    if (user.isBlocked) {
      return apiError("This account has been blocked. Contact support.", 403);
    }

    const response = NextResponse.json({ user: toSafeUser(user) });
    setUserSession(response, user.id);
    return response;
  } catch (error) {
    return apiError((error as Error).message, 400);
  }
}
