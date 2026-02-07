"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { toast } from "sonner";
import { trackAddToCart } from "@/lib/data-layer";

interface AddToCartButtonProps {
  productId: string;
  title: string;
  slug: string;
  image: string;
  price: number;
  color: string;
  size: string;
  quantity: number;
  variant?: "default" | "buy-now";
  /** When false, product has no color/size attributes; don't require selection */
  requiresColorSize?: boolean;
  className?: string;
  disabled?: boolean;
}

export function AddToCartButton({
  productId,
  title,
  slug,
  image,
  price,
  color,
  size,
  quantity,
  variant = "default",
  requiresColorSize = true,
  className,
  disabled = false,
}: AddToCartButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();

  const handleClick = async () => {
    if (requiresColorSize && (!color || !size)) {
      toast.error("Please select color and size");
      return;
    }

    setIsLoading(true);

    // Simulate a small delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 300));

    addItem({
      productId,
      title,
      slug,
      image,
      price,
      color: color || "—",
      size: size || "—",
      quantity,
    });

    trackAddToCart({
      content_ids: [productId],
      content_name: title,
      value: price * quantity,
      num_items: quantity,
    });

    if (variant === "buy-now") {
      router.push("/checkout");
    } else {
      const desc = requiresColorSize ? `${title} - ${color}, ${size}` : title;
      toast.success("Added to cart", { description: desc });
    }

    setIsLoading(false);
  };

  if (variant === "buy-now") {
    return (
      <Button
        size="lg"
        variant="outline"
        className={className}
        onClick={handleClick}
        disabled={disabled || isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Buy Now"
        )}
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      className={className}
      onClick={handleClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </>
      )}
    </Button>
  );
}
