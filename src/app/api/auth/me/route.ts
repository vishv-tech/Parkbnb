import { NextRequest } from "next/server";
import { apiOk } from "@/lib/api";
import { getAdminSession, getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  const adminEmail = getAdminSession(request);
  return apiOk({ user, admin: adminEmail ? { email: adminEmail } : null });
}
