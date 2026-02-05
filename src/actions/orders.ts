"use server";

import { db } from "@/lib/db";
import { generateOrderNumber } from "@/lib/format";
import { getShippingCost } from "@/lib/constants";
import { checkoutSchema, CheckoutFormData } from "@/schemas/checkout";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface CartItem {
  productId: string;
  title: string;
  image: string;
  price: number;
  color: string;
  size: string;
  quantity: number;
}

interface CreateOrderInput {
  formData: CheckoutFormData;
  items: CartItem[];
}

/**
 * Create a new order (saves to database)
 */
export async function createOrder(input: CreateOrderInput) {
  try {
    // Validate form data
    const validatedData = checkoutSchema.safeParse(input.formData);
    
    if (!validatedData.success) {
      return {
        success: false,
        error: validatedData.error.issues[0]?.message || "Invalid form data",
      };
    }
    
    const { items, formData } = input;
    
    if (!items || items.length === 0) {
      return {
        success: false,
        error: "No items in cart",
      };
    }
    
    // Get user if logged in
    let userId: string | null = null;
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      userId = session?.user?.id || null;
    } catch {
      // User not logged in, that's fine for guest checkout
    }
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingCost = getShippingCost(formData.city);
    const total = subtotal + shippingCost;
    
    // Create order in database
    const order = await db.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        customerName: formData.fullName,
        customerEmail: formData.email || null,
        customerPhone: formData.phone,
        shippingAddress: formData.address,
        city: formData.city,
        altPhone: formData.altPhone || null,
        deliveryNote: formData.deliveryNote || null,
        shippingCost,
        subtotal,
        total,
        status: "PENDING",
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            title: item.title,
            color: item.color,
            size: item.size,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: true,
      },
    });
    
    // Revalidate relevant paths
    revalidatePath("/admin/orders");
    if (userId) {
      revalidatePath("/dashboard/orders");
    }
    
    return {
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    };
  } catch (error) {
    console.error("Error creating order:", error);
    return {
      success: false,
      error: "Failed to create order. Please try again.",
    };
  }
}

/**
 * Get order by order number
 */
export async function getOrderByNumber(orderNumber: string) {
  try {
    const order = await db.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    
    if (!order) {
      return {
        success: false,
        error: "Order not found",
        data: null,
      };
    }
    
    return {
      success: true,
      data: order,
    };
  } catch (error) {
    console.error("Error fetching order:", error);
    return {
      success: false,
      error: "Failed to fetch order",
      data: null,
    };
  }
}

/**
 * Get orders for current user
 */
export async function getUserOrders() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user) {
      return {
        success: false,
        error: "Not authenticated",
        data: [],
      };
    }
    
    const orders = await db.order.findMany({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    
    return {
      success: true,
      data: orders,
    };
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return {
      success: false,
      error: "Failed to fetch orders",
      data: [],
    };
  }
}
