import { NextRequest } from "next/server";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { toSafeUser } from "@/lib/format";
import { getAdminSession } from "@/lib/session";
import { db } from "@/lib/store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const admin = getAdminSession(request);

  if (!admin) {
    return apiError("Admin login required", 401);
  }

  const { id } = await context.params;
  const body = await parseJson(request);
  const updated = await db.users.update(id, { isBlocked: Boolean(body.isBlocked) });

  if (!updated) {
    return apiError("User not found", 404);
  }

  return apiOk({ user: toSafeUser(updated) });
}
