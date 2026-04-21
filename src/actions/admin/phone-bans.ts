"use server";

import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { normalizePhone } from "@/lib/phone-normalize";

async function checkAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }
  return session.user;
}

type BannedPhoneRow = { id: string; phoneNumber: string; reason: string | null; createdAt: Date };

export async function getBannedPhones() {
  try {
    await checkAdmin();
    const list = await db.$queryRaw<BannedPhoneRow[]>`
      SELECT id, "phoneNumber", reason, "createdAt"
      FROM "BannedPhone"
      ORDER BY "createdAt" DESC
    `;
    return { success: true, data: list };
  } catch (error) {
    console.error("Error fetching banned phones:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch banned phones",
      data: [],
    };
  }
}

export async function banPhone(phoneNumber: string, reason?: string) {
  try {
    await checkAdmin();
    const normalized = normalizePhone(phoneNumber);
    if (!normalized) {
      return { success: false, error: "Invalid Bangladesh phone number. Use formats like 01730285500, 8801730285500, or +8801730285500." };
    }
    const id = randomUUID();
    await db.$executeRaw`
      INSERT INTO "BannedPhone" (id, "phoneNumber", reason, "createdAt")
      VALUES (${id}, ${normalized}, ${reason ?? null}, NOW())
      ON CONFLICT ("phoneNumber") DO UPDATE SET reason = EXCLUDED.reason
    `;
    revalidatePath("/admin/phone-bans");
    return { success: true, normalized };
  } catch (error) {
    console.error("Error banning phone:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to ban phone",
    };
  }
}

export async function unbanPhone(phoneNumber: string) {
  try {
    await checkAdmin();
    const normalized = normalizePhone(phoneNumber) ?? phoneNumber.trim();
    await db.$executeRaw`DELETE FROM "BannedPhone" WHERE "phoneNumber" = ${normalized}`;
    revalidatePath("/admin/phone-bans");
    return { success: true };
  } catch (error) {
    console.error("Error unbanning phone:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to unban phone",
    };
  }
}
