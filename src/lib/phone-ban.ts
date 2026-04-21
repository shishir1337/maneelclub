import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone-normalize";

/**
 * Check if a phone number is banned. Normalizes input before lookup.
 */
export async function isPhoneBanned(phone: string): Promise<boolean> {
  const normalized = normalizePhone(phone);
  if (!normalized) return false;
  const rows = await db.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "BannedPhone" WHERE "phoneNumber" = ${normalized} LIMIT 1
  `;
  return rows.length > 0;
}
