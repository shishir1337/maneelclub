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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCartStore } from "@/store/cart-store";
import { formatPrice } from "@/lib/format";
import { checkoutSchema, CheckoutFormData } from "@/schemas/checkout";
import { createOrder } from "@/actions/orders";
import { PaymentMethodSelector } from "@/components/checkout/payment-method-selector";
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

interface CheckoutClientProps {
  merchantNumbers: MerchantNumbers;
  shippingRates: ShippingRates;
}

const OUTSIDE_DHAKA_AREAS =
  "Ashulia, Dhamrai, Dohar, Hemayetpur, Savar, Keraniganj, Nawabganj";

export default function CheckoutClient({ merchantNumbers, shippingRates }: CheckoutClientProps) {
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
  const shippingCost =
    shippingZone === "inside_dhaka" ? shippingRates.dhaka : shippingRates.outside;
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

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/cart" className="hover:text-primary">Cart</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Checkout</span>
      </nav>
      
      <h1 className="text-2xl md:text-3xl font-bold mb-8">Checkout</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="your@email.com" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input 
                              type="tel" 
                              placeholder="01XXXXXXXXX" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Shipping Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Detailed Address *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="House/Flat, Road, Area, Landmark..."
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Area / City *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Dhanmondi, Mirpur, Uttara, Savar"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="altPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alt. Phone</FormLabel>
                          <FormControl>
                            <Input 
                              type="tel" 
                              placeholder="Alternative number (optional)" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="deliveryNote"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Note for Delivery</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any special instructions for delivery..."
                            className="min-h-[60px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Method</CardTitle>
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
              <div className="lg:hidden">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Placing Order...
                    </>
                  ) : (
                    `Place Order - ${formatPrice(total)}`
                  )}
                </Button>
              </div>
        </div>

        {/* Order Summary + Shipping */}
        <div className="lg:col-span-1 space-y-4">
          {/* Shipping options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shipping</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="shippingZone"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="space-y-3"
                      >
                        <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                          <RadioGroupItem value="inside_dhaka" className="mt-0.5" />
                          <div className="flex-1 text-sm">
                            <p className="font-medium">Inside Dhaka City Corporation</p>
                            <p className="text-muted-foreground">
                              Shipping Cost: {formatPrice(shippingRates.dhaka)}
                            </p>
                          </div>
                        </label>
                        <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                          <RadioGroupItem value="outside_dhaka" className="mt-0.5" />
                          <div className="flex-1 text-sm">
                            <p className="font-medium">Outside Dhaka City Corporation</p>
                            <p className="text-muted-foreground text-xs">
                              ({OUTSIDE_DHAKA_AREAS})
                            </p>
                            <p className="text-muted-foreground mt-0.5">
                              Shipping Cost: {formatPrice(shippingRates.outside)}
                            </p>
                          </div>
                        </label>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Items */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.color} / {item.size} × {item.quantity}
                      </p>
                      <p className="text-sm font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>
                    {shippingZone === "inside_dhaka"
                      ? `Inside DCC · ${formatPrice(shippingCost)}`
                      : `Outside DCC · ${formatPrice(shippingCost)}`}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>
              </div>
              
              {/* Submit Button - Desktop */}
              <Button 
                type="submit"
                size="lg" 
                className="w-full hidden lg:flex"
                disabled={isSubmitting}
                onClick={form.handleSubmit(onSubmit)}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Placing Order...
                  </>
                ) : (
                  "Place Order"
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
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
