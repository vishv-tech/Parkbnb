export const CONTACT_NUMBER_ERROR = "Contact number must be exactly 10 digits.";

export function sanitizeContactNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 10);
}

export function isValidContactNumber(value: string) {
  return /^\d{10}$/.test(value);
}

export function requireContactNumber(value: unknown) {
  if (typeof value !== "string" || !isValidContactNumber(value)) {
    throw new Error(CONTACT_NUMBER_ERROR);
  }

  return value;
}
