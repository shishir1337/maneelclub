"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function checkAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export type CityInput = {
  name: string;
  value: string;
  shippingZone: "inside_dhaka" | "outside_dhaka";
  sortOrder?: number;
};

/** Get all cities for admin */
export async function getAdminCities() {
  await checkAdmin();
  return db.city.findMany({
    orderBy: { sortOrder: "asc" },
  });
}

/** Create city */
export async function createCity(input: CityInput): Promise<
  | { success: true; data: Awaited<ReturnType<typeof db.city.create>> }
  | { success: false; error: string }
> {
  await checkAdmin();
  const value = input.value.toLowerCase().trim().replace(/\s+/g, "-");
  const existing = await db.city.findUnique({ where: { value } });
  if (existing) {
    return { success: false as const, error: "A city with this value already exists" };
  }
  const maxOrder = await db.city.aggregate({ _max: { sortOrder: true } });
  const city = await db.city.create({
    data: {
      name: input.name.trim(),
      value,
      shippingZone: input.shippingZone,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
  revalidatePath("/admin/cities");
  revalidatePath("/checkout");
  return { success: true as const, data: city };
}

/** Update city */
export async function updateCity(
  id: string,
  input: Partial<CityInput>
): Promise<
  | { success: true; data: Awaited<ReturnType<typeof db.city.update>> }
  | { success: false; error: string }
> {
  await checkAdmin();
  try {
    const data: Record<string, unknown> = {};
    if (input.name != null) data.name = input.name.trim();
    if (input.value != null) data.value = input.value.toLowerCase().trim().replace(/\s+/g, "-");
    if (input.shippingZone != null) data.shippingZone = input.shippingZone;
    if (input.sortOrder != null) data.sortOrder = input.sortOrder;
    const city = await db.city.update({
      where: { id },
      data,
    });
    revalidatePath("/admin/cities");
    revalidatePath("/checkout");
    return { success: true as const, data: city };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update city";
    if (msg.includes("Unique constraint") || msg.includes("unique")) {
      return { success: false as const, error: "A city with this value already exists" };
    }
    return { success: false as const, error: msg };
  }
}

/** Delete city */
export async function deleteCity(id: string) {
  await checkAdmin();
  await db.city.delete({ where: { id } });
  revalidatePath("/admin/cities");
  revalidatePath("/checkout");
  return { success: true as const };
}
