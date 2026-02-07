"use client";

import { useEffect, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { Phone, CreditCard, Banknote } from "lucide-react";
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

// Get icon for payment method
function getPaymentIcon(method: string) {
  switch (method) {
    case "COD":
      return <Banknote className="h-5 w-5" />;
    case "BKASH":
    case "NAGAD":
    case "ROCKET":
      return <Phone className="h-5 w-5" />;
    default:
      return <CreditCard className="h-5 w-5" />;
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

  return (
    <div className="space-y-4">
      {/* Payment Method Selection */}
      <FormField
        control={form.control}
        name="paymentMethod"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium">
              Select Payment Method / পেমেন্ট পদ্ধতি নির্বাচন করুন
            </FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="grid gap-3"
              >
                {paymentMethods.map((method) => {
                  const isSelected = field.value === method.value;
                  return (
                    <div key={method.value}>
                      <Label
                        htmlFor={`payment-${method.value}`}
                        className={cn(
                          "flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all",
                          isSelected
                            ? getPaymentColor(method.value)
                            : "border-border hover:border-muted-foreground/50"
                        )}
                      >
                        <RadioGroupItem
                          value={method.value}
                          id={`payment-${method.value}`}
                          className="sr-only"
                        />
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                            isSelected
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/50"
                          )}
                        >
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {getPaymentIcon(method.value)}
                            <span className="font-medium">{method.label}</span>
                            <span className="text-muted-foreground">
                              ({method.labelBn})
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {method.description}
                          </p>
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Mobile Payment Instructions and Fields */}
      {isMobilePayment && selectedPaymentMethod?.instructions && (
        <div
          className={cn(
            "p-4 rounded-lg border-2 space-y-4",
            getPaymentColor(selectedMethod)
          )}
        >
          {/* Amount to Send */}
          <div className="text-center p-3 bg-white dark:bg-background rounded-lg border">
            <p className="text-sm text-muted-foreground">
              You need to send us / আপনাকে পাঠাতে হবে
            </p>
            <p className="text-2xl font-bold text-primary">
              {formatPrice(totalAmount)}
            </p>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <h4 className="font-medium">
              Instructions / নির্দেশাবলী ({selectedPaymentMethod.label}):
            </h4>
            <div className="text-sm whitespace-pre-line bg-white dark:bg-background p-3 rounded-lg border">
              {selectedPaymentMethod.instructions}
            </div>
          </div>

          {/* Input Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="senderNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Your {selectedPaymentMethod.label} Number *
                    <span className="block text-xs text-muted-foreground font-normal">
                      আপনার {selectedPaymentMethod.labelBn} নাম্বার
                    </span>
                  </FormLabel>
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

            <FormField
              control={form.control}
              name="transactionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Transaction ID *
                    <span className="block text-xs text-muted-foreground font-normal">
                      ট্রানজেকশন আইডি
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Transaction ID"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Important Note */}
          <div className="text-xs text-muted-foreground bg-white dark:bg-background p-3 rounded-lg border">
            <p className="font-medium text-foreground mb-1">
              Important / গুরুত্বপূর্ণ:
            </p>
            <p>
              Please ensure you enter the correct sender number and transaction
              ID. Your order will be verified manually before processing.
            </p>
            <p className="mt-1">
              সঠিক সেন্ডার নাম্বার এবং ট্রানজেকশন আইডি লিখুন। আপনার অর্ডার
              প্রসেসিং এর আগে ম্যানুয়ালি যাচাই করা হবে।
            </p>
          </div>
        </div>
      )}

      {/* COD Notice */}
      {selectedMethod === "COD" && (
        <div className="p-4 rounded-lg border-2 border-primary bg-primary/5">
          <p className="text-sm">
            <span className="font-medium">Cash on Delivery:</span> Pay when you
            receive your order. Please keep exact change ready for the delivery
            person.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            ক্যাশ অন ডেলিভারি: অর্ডার হাতে পেলে টাকা দিন। ডেলিভারি ম্যানের জন্য
            সঠিক টাকা প্রস্তুত রাখুন।
          </p>
        </div>
      )}
    </div>
  );
}
