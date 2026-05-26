import { NextResponse } from "next/server";

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function requireString(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }

  return value.trim();
}

export function optionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function requireNumber(value: unknown, field: string) {
  const number = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(number)) {
    throw new Error(`${field} must be a valid number`);
  }

  return number;
}

export async function parseJson(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    throw new Error("Invalid JSON body");
  }
}
