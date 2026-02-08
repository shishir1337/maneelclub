"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCartStore } from "@/store/cart-store";
import { formatPrice } from "@/lib/format";
import { checkoutSchema, CheckoutFormData } from "@/schemas/checkout";
import { createOrder } from "@/actions/orders";
import { PaymentMethodSelector } from "@/components/checkout/payment-method-selector";
import { CityCombobox } from "@/components/checkout/city-combobox";
import { toast } from "sonner";
import { trackInitiateCheckout } from "@/lib/data-layer";

interface MerchantNumbers {
  bkash: string;
  nagad: string;
  rocket: string;
}

interface ShippingRates {
  dhaka: number;
  outside: number;
}

interface CityWithZone {
  id: string;
  name: string;
  value: string;
  shippingZone: "inside_dhaka" | "outside_dhaka";
}

interface CheckoutClientProps {
  merchantNumbers: MerchantNumbers;
  shippingRates: ShippingRates;
  cities: CityWithZone[];
  freeShippingMinimum: number;
}

export default function CheckoutClient({ merchantNumbers, shippingRates, cities, freeShippingMinimum }: CheckoutClientProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { items, getSubtotal } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Wait for hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Data layer: InitiateCheckout when checkout page is shown with items
  useEffect(() => {
    if (!mounted || items.length === 0) return;
    trackInitiateCheckout({
      value: getSubtotal(),
      num_items: items.reduce((sum, i) => sum + i.quantity, 0),
      content_ids: items.map((i) => i.productId),
    });
  }, [mounted, items]);
  
  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      shippingZone: "inside_dhaka",
      altPhone: "",
      deliveryNote: "",
      paymentMethod: "COD",
      senderNumber: "",
      transactionId: "",
    },
  });

  const shippingZone = form.watch("shippingZone");
  const subtotal = getSubtotal();
  const zoneRate = shippingZone === "inside_dhaka" ? shippingRates.dhaka : shippingRates.outside;
  const shippingCost =
    freeShippingMinimum > 0 && subtotal >= freeShippingMinimum ? 0 : zoneRate;
  const total = subtotal + shippingCost;
  
  // Show loading during hydration
  if (!mounted) {
    return (
      <div className="container py-8">
        <Skeleton className="h-5 w-48 mb-6" />
        <Skeleton className="h-10 w-32 mb-8" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card>
              <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  // Redirect if cart is empty
  if (items.length === 0) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <p className="text-muted-foreground mb-8">
          Add some items to your cart before checkout.
        </p>
        <Button asChild>
          <Link href="/shop">Continue Shopping</Link>
        </Button>
      </div>
    );
  }
  
  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);
    
    try {
      const result = await createOrder({
        formData: data,
        items: items.map((item) => ({
          productId: item.productId,
          title: item.title,
          image: item.image,
          price: item.price,
          color: item.color,
          size: item.size,
          quantity: item.quantity,
        })),
      });
      
      if (result.success && result.data) {
        // Redirect first; cart is cleared on order-confirmation page to avoid flashing empty cart
        router.push(`/order-confirmation?order=${result.data.orderNumber}`);
      } else {
        toast.error(result.error || "Failed to place order");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "h-12 text-base md:text-base px-4 rounded-lg border-2 focus-visible:ring-2 min-w-0";
  const textareaClass =
    "min-h-[100px] text-base px-4 py-3 rounded-lg border-2 focus-visible:ring-2 resize-y";
  const labelClass = "text-base font-medium";

  return (
    <div className="container py-8 md:py-10 max-w-6xl">
      {/* Breadcrumb */}
      <nav
        className="flex items-center gap-1.5 text-sm md:text-base text-muted-foreground mb-6"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        <Link href="/cart" className="hover:text-primary transition-colors">
          Cart
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        <span className="text-foreground font-medium">Checkout</span>
      </nav>

      <h1 className="text-2xl md:text-4xl font-bold mb-8 md:mb-10 tracking-tight">
        Checkout
      </h1>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid lg:grid-cols-3 gap-8 lg:gap-10"
        >
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* Contact Information */}
            <Card className="rounded-2xl border-2 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl md:text-2xl">
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>Full Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your full name"
                          className={inputClass}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-base" />
                    </FormItem>
                  )}
                />

                <div className="grid sm:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            className={inputClass}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-base" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>
                          Phone Number *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="01XXXXXXXXX"
                            className={inputClass}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-base" />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card className="rounded-2xl border-2 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl md:text-2xl">
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>
                        Detailed Address *
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="House/Flat, Road, Area, Landmark..."
                          className={textareaClass}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-base" />
                    </FormItem>
                  )}
                />

                <div className="grid sm:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>
                          Area / City *
                        </FormLabel>
                        <FormControl>
                          <CityCombobox
                            cities={cities}
                            value={field.value}
                            onChange={(value, shippingZone) => {
                              field.onChange(value);
                              form.setValue("shippingZone", shippingZone);
                            }}
                            placeholder="Search area or city..."
                            aria-invalid={!!form.formState.errors.city}
                            aria-describedby={
                              form.formState.errors.city
                                ? "city-error"
                                : undefined
                            }
                          />
                        </FormControl>
                        <FormMessage id="city-error" className="text-base" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="altPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>
                          Alt. Phone
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="Alternative number (optional)"
                            className={inputClass}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-base" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="deliveryNote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>
                        Note for Delivery
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any special instructions for delivery..."
                          className={textareaClass}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-base" />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="rounded-2xl border-2 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl md:text-2xl">
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentMethodSelector
                  form={form}
                  totalAmount={total}
                  merchantNumbers={merchantNumbers}
                />
              </CardContent>
            </Card>

            {/* Submit Button - Mobile */}
            <div className="lg:hidden pt-2">
              <Button
                type="submit"
                size="lg"
                className="w-full h-14 text-lg font-semibold rounded-xl"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Placing Order...
                  </>
                ) : (
                  `Place Order — ${formatPrice(total)}`
                )}
              </Button>
            </div>
          </div>

          {/* Order Summary + Shipping */}
          <div className="lg:col-span-1 space-y-4 md:space-y-5">
            {/* Shipping */}
            <Card className="rounded-2xl border-2 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg md:text-xl">Shipping</CardTitle>
                <p className="text-sm md:text-base text-muted-foreground mt-1">
                  Zone is set from your selected area/city.
                </p>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border-2 p-4 bg-muted/30">
                  <p className="text-base font-semibold">
                    {shippingZone === "inside_dhaka"
                      ? "Inside Dhaka City Corporation"
                      : "Outside Dhaka City Corporation"}
                  </p>
                  <p className="text-muted-foreground text-base mt-1">
                    {shippingCost === 0 ? (
                      "Shipping: Free"
                    ) : (
                      <>Shipping: {formatPrice(shippingCost)}</>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="sticky top-24 rounded-2xl border-2 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg md:text-xl">
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                          unoptimized={item.image.startsWith("/uploads/")}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium line-clamp-2">
                          {item.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {item.color} / {item.size} × {item.quantity}
                        </p>
                        <p className="text-base font-semibold mt-1">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-1" />

                <div className="space-y-2.5 text-base">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>
                      {shippingCost === 0
                        ? "Free"
                        : shippingZone === "inside_dhaka"
                          ? `Inside Dhaka · ${formatPrice(shippingCost)}`
                          : `Outside Dhaka · ${formatPrice(shippingCost)}`}
                    </span>
                  </div>
                  <Separator className="my-1" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full hidden lg:flex h-14 text-lg font-semibold rounded-xl"
                  disabled={isSubmitting}
                  onClick={form.handleSubmit(onSubmit)}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Placing Order...
                    </>
                  ) : (
                    "Place Order"
                  )}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  By placing this order, you agree to our Terms of Service
                </p>
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
}
