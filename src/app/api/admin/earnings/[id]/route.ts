import { NextRequest } from "next/server";
import { apiError, apiOk, parseJson, requireString } from "@/lib/api";
import { getAdminSession } from "@/lib/session";
import { db } from "@/lib/store";
import { PAYOUT_STATUSES } from "@/lib/types";
import type { PayoutStatus } from "@/lib/types";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const admin = getAdminSession(request);

  if (!admin) {
    return apiError("Admin login required", 401);
  }

  try {
    const { id } = await context.params;
    const body = await parseJson(request);
    const payoutStatus = requireString(body.payoutStatus, "Payout status") as PayoutStatus;

    if (!PAYOUT_STATUSES.includes(payoutStatus)) {
      return apiError("Invalid payout status", 400);
    }

    const ownerMonthlyEarning = await db.ownerMonthlyEarnings.updateStatus(id, payoutStatus);

    if (!ownerMonthlyEarning) {
      return apiError("Monthly earning not found", 404);
    }

    return apiOk({ ownerMonthlyEarning });
  } catch (error) {
    return apiError((error as Error).message, 400);
  }
}
