"use server";

import { db } from "@/lib/db";

export type CityWithZone = {
  id: string;
  name: string;
  value: string;
  shippingZone: "inside_dhaka" | "outside_dhaka";
};

/** Get all cities for checkout dropdown (public) */
export async function getCities(): Promise<CityWithZone[]> {
  const cities = await db.city.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      value: true,
      shippingZone: true,
    },
  });
  return cities as CityWithZone[];
}
