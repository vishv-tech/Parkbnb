import { NextRequest, NextResponse } from "next/server";
import { apiError, requireString } from "@/lib/api";
import { normalizeEmail } from "@/lib/format";
import { setAdminSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const email = normalizeEmail(requireString(body.email, "Email"));
    const password = requireString(body.password, "Password");
    const expectedEmail = normalizeEmail(process.env.ADMIN_EMAIL || "admin@park2bnb.local");
    const expectedPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (email !== expectedEmail || password !== expectedPassword) {
      return apiError("Invalid admin credentials", 401);
    }

    const response = NextResponse.json({ admin: { email } });
    setAdminSession(response, email);
    return response;
  } catch (error) {
    return apiError((error as Error).message, 400);
  }
}
