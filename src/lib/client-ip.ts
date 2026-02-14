/**
 * Get client IP from request headers.
 * Uses x-forwarded-for (first hop) or x-real-ip. For use in server actions / API routes.
 * Best-effort only: headers can be spoofed; use for cooldown/anti-spam, not security.
 */
export function getClientIp(headers: { get(name: string): string | null }): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return null;
}
