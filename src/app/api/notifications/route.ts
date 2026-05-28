import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api";
import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);

  if (!user) {
    return apiError("Login required", 401);
  }

  const notifications = await db.notifications.listByUserId(user.id);
  return apiOk({ notifications });
}
