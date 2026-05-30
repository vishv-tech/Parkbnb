export const UPI_ID_ERROR = "Please enter a valid UPI ID.";

export function normalizeUpiId(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isValidUpiId(value: unknown) {
  const upiId = normalizeUpiId(value);

  if (!upiId || !upiId.includes("@")) {
    return false;
  }

  return /^[a-z0-9._-]+@[a-z0-9.-]+$/i.test(upiId);
}

export function requireUpiId(value: unknown) {
  const upiId = normalizeUpiId(value);

  if (!isValidUpiId(upiId)) {
    throw new Error(UPI_ID_ERROR);
  }

  return upiId;
}
