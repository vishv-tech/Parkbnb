import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api";
import { getCurrentMonthYear, syncOwnerMonthlyEarnings } from "@/lib/earnings";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);

  if (!user || user.userType !== "OWNER") {
    return apiError("Owner login required", 401);
  }

  const { month, year } = getCurrentMonthYear();
  const ownerMonthlyEarning = await syncOwnerMonthlyEarnings(user.id, month, year);

  return apiOk({ ownerMonthlyEarning });
}
