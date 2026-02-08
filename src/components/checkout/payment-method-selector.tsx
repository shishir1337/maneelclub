"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import { UseFormReturn } from "react-hook-form";
import { CreditCard, Banknote } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PAYMENT_METHODS, MERCHANT_PHONE } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CheckoutFormData } from "@/schemas/checkout";

interface MerchantNumbers {
  bkash: string;
  nagad: string;
  rocket: string;
}

interface PaymentMethodSelectorProps {
  form: UseFormReturn<CheckoutFormData>;
  totalAmount: number;
  merchantNumbers?: MerchantNumbers;
}

// Get icon for payment method (COD = Banknote, mobile payments = brand logos)
function getPaymentIcon(method: string) {
  switch (method) {
    case "COD":
      return <Banknote className="h-6 w-6 shrink-0" />;
    case "BKASH":
      return (
        <Image
          src="/assets/images/bkash.png"
          alt="bKash"
          width={96}
          height={36}
          className="h-9 w-auto object-contain"
        />
      );
    case "NAGAD":
      return (
        <Image
          src="/assets/images/nagad.webp"
          alt="Nagad"
          width={96}
          height={36}
          className="h-9 w-auto object-contain"
        />
      );
    case "ROCKET":
      return (
        <Image
          src="/assets/images/rocket.webp"
          alt="Rocket"
          width={96}
          height={36}
          className="h-9 w-auto object-contain"
        />
      );
    default:
      return <CreditCard className="h-6 w-6 shrink-0" />;
  }
}

// Get brand color for payment method
function getPaymentColor(method: string): string {
  switch (method) {
    case "BKASH":
      return "border-pink-500 bg-pink-50 dark:bg-pink-950/20";
    case "NAGAD":
      return "border-orange-500 bg-orange-50 dark:bg-orange-950/20";
    case "ROCKET":
      return "border-purple-500 bg-purple-50 dark:bg-purple-950/20";
    default:
      return "border-primary bg-primary/5";
  }
}

export function PaymentMethodSelector({
  form,
  totalAmount,
  merchantNumbers,
}: PaymentMethodSelectorProps) {
  const selectedMethod = form.watch("paymentMethod");
  
  // Clear mobile payment fields when switching to COD
  useEffect(() => {
    if (selectedMethod === "COD") {
      form.setValue("senderNumber", "");
      form.setValue("transactionId", "");
    }
  }, [selectedMethod, form]);

  // Generate payment methods with dynamic merchant numbers
  const paymentMethods = useMemo(() => {
    const numbers = merchantNumbers || {
      bkash: MERCHANT_PHONE,
      nagad: MERCHANT_PHONE,
      rocket: MERCHANT_PHONE,
    };
    
    return PAYMENT_METHODS.map((method) => {
      if (method.value === "BKASH") {
        return {
          ...method,
          merchantNumber: numbers.bkash,
          instructions: `১. আপনার মোবাইল থেকে *247# ডায়াল করুন
২. প্রদর্শিত মেনু থেকে 3 চাপুন (Send Money)
৩. নম্বরটি লিখুন: বিকাশ পার্সোনাল (${numbers.bkash})
৪. কত টাকা পাঠাতে চান তা লিখুন এবং নিশ্চিত করুন
৫. আপনার bKash PIN লিখুন এবং প্রক্রিয়া সম্পন্ন করুন
৬. নিচে আপনার বিকাশ নাম্বার এবং Transaction ID টি লিখুন`,
        };
      }
      if (method.value === "NAGAD") {
        return {
          ...method,
          merchantNumber: numbers.nagad,
          instructions: `১. আপনার মোবাইল থেকে *167# ডায়াল করুন
২. প্রদর্শিত মেনু থেকে 1 চাপুন (Send Money)
৩. নম্বরটি লিখুন: নগদ পার্সোনাল (${numbers.nagad})
৪. কত টাকা পাঠাতে চান তা লিখুন এবং নিশ্চিত করুন
৫. আপনার নগদ PIN লিখুন এবং প্রক্রিয়া সম্পন্ন করুন
৬. নিচে আপনার নগদ নাম্বার এবং Transaction ID টি লিখুন`,
        };
      }
      if (method.value === "ROCKET") {
        return {
          ...method,
          merchantNumber: numbers.rocket,
          instructions: `১. আপনার মোবাইল থেকে *322# ডায়াল করুন
২. প্রদর্শিত মেনু থেকে 1 চাপুন (Send Money)
৩. নম্বরটি লিখুন: রকেট পার্সোনাল (${numbers.rocket})
৪. কত টাকা পাঠাতে চান তা লিখুন এবং নিশ্চিত করুন
৫. আপনার রকেট PIN লিখুন এবং প্রক্রিয়া সম্পন্ন করুন
৬. নিচে আপনার রকেট নাম্বার এবং Transaction ID টি লিখুন`,
        };
      }
      return method;
    });
  }, [merchantNumbers]);
  
  // Find selected payment method details
  const selectedPaymentMethod = paymentMethods.find(
    (m) => m.value === selectedMethod
  );
  
  const isMobilePayment = selectedMethod && selectedMethod !== "COD";

  const inputClass =
    "h-12 text-base px-4 rounded-lg border-2 focus-visible:ring-2 min-w-0";

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Payment Method Selection */}
      <FormField
        control={form.control}
        name="paymentMethod"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base md:text-lg font-semibold">
              Select Payment Method / পেমেন্ট পদ্ধতি নির্বাচন করুন
            </FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="grid gap-4"
              >
                {paymentMethods.map((method) => {
                  const isSelected = field.value === method.value;
                  return (
                    <div key={method.value}>
                      <Label
                        htmlFor={`payment-${method.value}`}
                        className={cn(
                          "flex items-center gap-4 p-5 md:p-6 border-2 rounded-xl cursor-pointer transition-all min-h-[72px]",
                          isSelected
                            ? getPaymentColor(method.value)
                            : "border-border hover:border-muted-foreground/50 hover:bg-muted/20"
                        )}
                      >
                        <RadioGroupItem
                          value={method.value}
                          id={`payment-${method.value}`}
                          className="sr-only"
                        />
                        <div
                          className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                            isSelected
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/50"
                          )}
                        >
                          {isSelected && (
                            <div className="w-2.5 h-2.5 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            {getPaymentIcon(method.value)}
                            <span className="font-semibold text-base">
                              {method.label}
                            </span>
                            <span className="text-muted-foreground text-base">
                              ({method.labelBn})
                            </span>
                          </div>
                          <p className="text-base text-muted-foreground mt-1">
                            {method.description}
                          </p>
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </FormControl>
            <FormMessage className="text-base" />
          </FormItem>
        )}
      />

      {/* Mobile Payment Instructions and Fields */}
      {isMobilePayment && selectedPaymentMethod?.instructions && (
        <div
          className={cn(
            "p-5 md:p-6 rounded-xl border-2 space-y-5",
            getPaymentColor(selectedMethod)
          )}
        >
          {/* Amount to Send */}
          <div className="text-center p-5 bg-white dark:bg-background rounded-xl border-2">
            <p className="text-base text-muted-foreground">
              You need to send us / আপনাকে পাঠাতে হবে
            </p>
            <p className="text-3xl md:text-4xl font-bold text-primary mt-1">
              {formatPrice(totalAmount)}
            </p>
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            <h4 className="font-semibold text-base md:text-lg">
              Instructions / নির্দেশাবলী ({selectedPaymentMethod.label}):
            </h4>
            <div className="text-base whitespace-pre-line bg-white dark:bg-background p-4 rounded-xl border-2 leading-relaxed">
              {selectedPaymentMethod.instructions}
            </div>
          </div>

          {/* Input Fields */}
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="senderNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    Your {selectedPaymentMethod.label} Number *
                    <span className="block text-sm text-muted-foreground font-normal mt-0.5">
                      আপনার {selectedPaymentMethod.labelBn} নাম্বার
                    </span>
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

            <FormField
              control={form.control}
              name="transactionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    Transaction ID *
                    <span className="block text-sm text-muted-foreground font-normal mt-0.5">
                      ট্রানজেকশন আইডি
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Transaction ID"
                      className={inputClass}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-base" />
                </FormItem>
              )}
            />
          </div>

          {/* Important Note */}
          <div className="text-base text-muted-foreground bg-white dark:bg-background p-4 rounded-xl border-2">
            <p className="font-semibold text-foreground mb-2">
              Important / গুরুত্বপূর্ণ:
            </p>
            <p className="leading-relaxed">
              Please ensure you enter the correct sender number and transaction
              ID. Your order will be verified manually before processing.
            </p>
            <p className="mt-2 leading-relaxed">
              সঠিক সেন্ডার নাম্বার এবং ট্রানজেকশন আইডি লিখুন। আপনার অর্ডার
              প্রসেসিং এর আগে ম্যানুয়ালি যাচাই করা হবে।
            </p>
          </div>
        </div>
      )}

      {/* COD Notice */}
      {selectedMethod === "COD" && (
        <div className="p-5 md:p-6 rounded-xl border-2 border-primary bg-primary/5">
          <p className="text-base leading-relaxed">
            <span className="font-semibold">Cash on Delivery:</span> Pay when you
            receive your order. Please keep exact change ready for the delivery
            person.
          </p>
          <p className="text-base text-muted-foreground mt-2 leading-relaxed">
            ক্যাশ অন ডেলিভারি: অর্ডার হাতে পেলে টাকা দিন। ডেলিভারি ম্যানের জন্য
            সঠিক টাকা প্রস্তুত রাখুন।
          </p>
          <p className="text-base mt-4 text-amber-700 dark:text-amber-400 leading-relaxed">
            <span className="font-semibold">Note:</span> If you want to return or
            cancel the order, you will need to pay the delivery charge for the
            return (as per our policy).
          </p>
          <p className="text-base text-muted-foreground mt-1 leading-relaxed">
            নোট: অর্ডার রিটার্ন বা ক্যানসেল করতে চাইলে রিটার্নের ডেলিভারি চার্জ
            আপনাকে বহন করতে হবে (আমাদের নীতিমালা অনুযায়ী)।
          </p>
        </div>
      )}
    </div>
  );
}
