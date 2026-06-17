import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { courierCheckByPhone, type CourierCheckData } from "@/lib/bdcourier";
import { Prisma } from "@prisma/client";

/**
 * Run the BDCourier fraud check for an order's phone and persist the result.
 *
 * Safe to call fire-and-forget (e.g. from `after()`): it never throws, swallows
 * its own errors, and revalidates the admin order views on success so the data
 * table shows the result without a manual refresh.
 *
 * Returns the saved courier data, or null if it couldn't be fetched/saved.
 */
export async function runAndSaveCourierCheck(
  orderId: string
): Promise<CourierCheckData | null> {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { customerPhone: true },
    });

    const phone = order?.customerPhone?.trim();
    if (!phone) return null;

    const result = await courierCheckByPhone(phone);
    if (!result.success) {
      console.warn(`[courier-check] auto check failed for order ${orderId}: ${result.error}`);
      return null;
    }

    await db.order.update({
      where: { id: orderId },
      data: {
        courierCheckData: result.data as unknown as Prisma.InputJsonValue,
        courierCheckCheckedAt: new Date(),
      } as Prisma.OrderUpdateInput,
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);

    return result.data;
  } catch (error) {
    console.error(`[courier-check] auto check errored for order ${orderId}:`, error);
    return null;
  }
}
