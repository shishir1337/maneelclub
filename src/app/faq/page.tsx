import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/constants";

export const metadata: Metadata = {
  title: "FAQ",
  description: `Frequently asked questions about ${siteConfig.name} – orders, shipping, returns, and more.`,
};

export default function FAQPage() {
  return (
    <div className="container max-w-2xl py-12 md:py-16">
      <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
      <p className="text-muted-foreground mb-8">
        Quick answers to common questions. Need more help? <Link href="/contact" className="text-primary hover:underline">Contact us</Link>.
      </p>
      <div className="space-y-6">
        <div>
          <h2 className="font-semibold">How can I pay?</h2>
          <p className="text-muted-foreground text-sm mt-1">
            We accept Cash on Delivery (COD), bKash, Nagad, and Rocket. Choose your preferred method at checkout.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">How long does delivery take?</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Delivery times depend on your location. Dhaka usually receives orders sooner; outside Dhaka may take a few extra days.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">Can I exchange for a different size?</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Yes. See our <Link href="/returns" className="text-primary hover:underline">Return &amp; Exchange Policy</Link> for conditions and how to request a size exchange.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">Do you offer refunds?</h2>
          <p className="text-muted-foreground text-sm mt-1">
            We do not offer cash refunds. We facilitate exchanges for defective or damaged items (at delivery) or size exchanges as per our policy.
          </p>
        </div>
      </div>
      <Button asChild className="mt-8">
        <Link href="/shop">Browse Products</Link>
      </Button>
    </div>
  );
}
