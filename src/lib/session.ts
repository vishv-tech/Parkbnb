import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest, NextResponse } from "next/server";
import { db } from "./store";
import { toSafeUser } from "./format";

const SESSION_COOKIE = "park2bnb_session";
const ADMIN_COOKIE = "park2bnb_admin";
const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  sub: string;
  role: "USER" | "ADMIN";
  exp: number;
};

function secret() {
  return process.env.AUTH_SECRET || "park2bnb-local-development-secret";
}

function base64Url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function createToken(payload: SessionPayload) {
  const encodedPayload = base64Url(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

function verifyToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expected = sign(encodedPayload);
  const saved = Buffer.from(signature);
  const candidate = Buffer.from(expected);

  if (saved.length !== candidate.length || !timingSafeEqual(saved, candidate)) {
    return null;
  }

  let payload: SessionPayload;

  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SessionPayload;
  } catch {
    return null;
  }

  if (payload.exp < Date.now()) {
    return null;
  }

  return payload;
}

export function setUserSession(response: NextResponse, userId: string) {
  response.cookies.set(
    SESSION_COOKIE,
    createToken({ sub: userId, role: "USER", exp: Date.now() + ONE_WEEK_SECONDS * 1000 }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ONE_WEEK_SECONDS,
    },
  );
}

export function setAdminSession(response: NextResponse, email: string) {
  response.cookies.set(
    ADMIN_COOKIE,
    createToken({ sub: email, role: "ADMIN", exp: Date.now() + ONE_WEEK_SECONDS * 1000 }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ONE_WEEK_SECONDS,
    },
  );
}

export function clearSessions(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
}

export async function getSessionUser(request: NextRequest) {
  const payload = verifyToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (!payload || payload.role !== "USER") {
    return null;
  }

  const user = await db.users.findById(payload.sub);

  if (!user || user.isBlocked) {
    return null;
  }

  return toSafeUser(user);
}

export function getAdminSession(request: NextRequest) {
  const payload = verifyToken(request.cookies.get(ADMIN_COOKIE)?.value);

  if (!payload || payload.role !== "ADMIN") {
    return null;
  }

  return payload.sub;
}
