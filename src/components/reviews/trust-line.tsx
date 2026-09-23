import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { TRUST_NUMBERS } from "@/lib/reviews-static";

interface TrustLineProps {
  className?: string;
}

/** One-line reassurance for the product page and checkout, next to the buying action. */
export function TrustLine({ className }: TrustLineProps) {
  return (
    <p className={cn("flex items-start gap-2 text-sm text-muted-foreground", className)}>
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <span>
        Trusted by {TRUST_NUMBERS.customers} customers, cash on delivery across Bangladesh.{" "}
        <Link href="/reviews" className="font-medium text-foreground underline-offset-4 hover:underline">
          See their reviews
        </Link>
      </span>
    </p>
  );
}
