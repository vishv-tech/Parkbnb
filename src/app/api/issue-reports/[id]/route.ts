import { NextRequest } from "next/server";
import { apiError, apiOk, parseJson, requireString } from "@/lib/api";
import { getAdminSession } from "@/lib/session";
import { db } from "@/lib/store";
import { ISSUE_REPORT_STATUSES } from "@/lib/types";
import type { IssueReportStatus } from "@/lib/types";

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
    const status = requireString(body.status, "Status") as IssueReportStatus;

    if (!ISSUE_REPORT_STATUSES.includes(status)) {
      return apiError("Invalid report status", 400);
    }

    const issueReport = await db.issueReports.updateStatus(id, status);

    if (!issueReport) {
      return apiError("Issue report not found", 404);
    }

    return apiOk({ issueReport });
  } catch (error) {
    return apiError((error as Error).message, 400);
  }
}
