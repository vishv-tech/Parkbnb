import { NextResponse } from "next/server";
import { clearSessions } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearSessions(response);
  return response;
}
