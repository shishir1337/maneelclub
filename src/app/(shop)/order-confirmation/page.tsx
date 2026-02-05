import Link from "next/link";
import { CheckCircle, Package, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/lib/constants";

interface OrderConfirmationPageProps {
  searchParams: Promise<{ order?: string }>;
}

export default async function OrderConfirmationPage({ searchParams }: OrderConfirmationPageProps) {
  const { order: orderNumber } = await searchParams;
  
  if (!orderNumber) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">No Order Found</h1>
        <p className="text-muted-foreground mb-8">
          We couldn't find your order. Please contact support if you need help.
        </p>
        <Button asChild>
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-2xl mx-auto">
      {/* Success Icon */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-green-600 mb-2">
          Order Placed Successfully!
        </h1>
        <p className="text-muted-foreground">
          Thank you for your order. We'll contact you soon to confirm.
        </p>
      </div>

      {/* Order Details Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground">Order Number</span>
            <span className="font-mono font-bold text-lg">{orderNumber}</span>
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">What's Next?</p>
                <p className="text-sm text-muted-foreground">
                  We'll call you to confirm your order and delivery details.
                  Your order will be delivered within 2-5 business days.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Need Help?</p>
                <p className="text-sm text-muted-foreground">
                  Contact us on WhatsApp for any queries about your order.
                </p>
                <a
                  href={`https://wa.me/${siteConfig.whatsapp.replace("+", "")}?text=Hi, I want to check my order: ${orderNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {siteConfig.whatsapp}
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Reminder */}
      <Card className="mb-8 bg-muted/50">
        <CardContent className="p-6">
          <h3 className="font-medium mb-2">Payment: Cash on Delivery</h3>
          <p className="text-sm text-muted-foreground">
            Please keep the exact amount ready. Our delivery partner will collect 
            the payment when delivering your order.
          </p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild className="flex-1">
          <Link href="/shop">Continue Shopping</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <a
            href={`https://wa.me/${siteConfig.whatsapp.replace("+", "")}?text=Hi, I just placed order ${orderNumber}. Please confirm.`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact on WhatsApp
          </a>
        </Button>
      </div>
    </div>
  );
}
