// Canonical form: 01XXXXXXXXX (11 digits, local Bangladesh format)
// Valid prefixes: 013, 014, 015, 016, 017, 018, 019
const VALID_RE = /^01[3-9]\d{8}$/;

/**
 * Normalize a Bangladesh mobile number to 01XXXXXXXXX.
 * Accepts: +8801XXXXXXXXX, 8801XXXXXXXXX, 01XXXXXXXXX
 * Returns null if the number is not a valid Bangladesh mobile number.
 */
export function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");

  let local: string;
  if (digits.length === 13 && digits.startsWith("880")) {
    // +8801XXXXXXXXX or 8801XXXXXXXXX → 01XXXXXXXXX
    local = "0" + digits.slice(3);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    local = digits;
  } else {
    return null;
  }

  return VALID_RE.test(local) ? local : null;
}

export function isValidBangladeshPhone(phone: string): boolean {
  return normalizePhone(phone) !== null;
}
