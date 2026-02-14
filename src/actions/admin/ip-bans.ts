"use server";

import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

async function checkAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }
  return session.user;
}

// IPv4 (e.g. 1.2.3.4) or IPv6-like (contains colons; e.g. 2001:db8::1, ::1)
const IPV4_REGEX = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
function isValidIp(ip: string): boolean {
  const normalized = ip.trim();
  if (!normalized || normalized.length > 45) return false;
  if (IPV4_REGEX.test(normalized)) return true;
  if (normalized.includes(":") && /^[a-fA-F0-9:.]+$/.test(normalized)) return true; // IPv6
  return false;
}

function normalizeIp(ip: string): string {
  return ip.trim();
}

type BannedIpRow = { id: string; ipAddress: string; reason: string | null; createdAt: Date };

export async function getBannedIps() {
  try {
    await checkAdmin();
    const list = await db.$queryRaw<BannedIpRow[]>`
      SELECT id, "ipAddress", reason, "createdAt"
      FROM "BannedIp"
      ORDER BY "createdAt" DESC
    `;
    return { success: true, data: list };
  } catch (error) {
    console.error("Error fetching banned IPs:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch banned IPs",
      data: [],
    };
  }
}

export async function banIp(ipAddress: string, reason?: string) {
  try {
    await checkAdmin();
    const normalized = normalizeIp(ipAddress);
    if (!isValidIp(normalized)) {
      return { success: false, error: "Invalid IP address format." };
    }
    const id = randomUUID();
    await db.$executeRaw`
      INSERT INTO "BannedIp" (id, "ipAddress", reason, "createdAt")
      VALUES (${id}, ${normalized}, ${reason ?? null}, NOW())
      ON CONFLICT ("ipAddress") DO UPDATE SET reason = EXCLUDED.reason
    `;
    revalidatePath("/admin/ip-bans");
    return { success: true };
  } catch (error) {
    console.error("Error banning IP:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to ban IP",
    };
  }
}

export async function unbanIp(ipAddress: string) {
  try {
    await checkAdmin();
    const normalized = normalizeIp(ipAddress);
    await db.$executeRaw`DELETE FROM "BannedIp" WHERE "ipAddress" = ${normalized}`;
    revalidatePath("/admin/ip-bans");
    return { success: true };
  } catch (error) {
    console.error("Error unbanning IP:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to unban IP",
    };
  }
}
