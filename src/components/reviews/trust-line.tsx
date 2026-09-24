import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustLineProps {
  /** Customer count from Admin → Reviews, e.g. "10,000+". */
  customerCount: string;
  className?: string;
}

/** One-line reassurance for the product page, next to the buying action. */
export function TrustLine({ customerCount, className }: TrustLineProps) {
  return (
    <p className={cn("flex items-start gap-2 text-sm text-muted-foreground", className)}>
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <span>
        Trusted by {customerCount} customers, cash on delivery across Bangladesh.{" "}
        <Link href="/reviews" className="font-medium text-foreground underline-offset-4 hover:underline">
          See their reviews
        </Link>
      </span>
    </p>
  );
}
