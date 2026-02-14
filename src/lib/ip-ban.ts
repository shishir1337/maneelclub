import { db } from "@/lib/db";

/**
 * Normalize IP for storage and lookup (trim; IPv6 could be lowercased if needed).
 */
function normalizeIp(ip: string): string {
  return ip.trim();
}

/**
 * Check if an IP is banned. Use after resolving client IP in createOrder / getCheckoutEligibility.
 */
export async function isIpBanned(ip: string | null): Promise<boolean> {
  if (!ip || !ip.trim()) return false;
  const normalized = normalizeIp(ip);
  const rows = await db.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "BannedIp" WHERE "ipAddress" = ${normalized} LIMIT 1
  `;
  return rows.length > 0;
}
