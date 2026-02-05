"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { toast } from "sonner";

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
  className,
  disabled = false,
}: AddToCartButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();

  const handleClick = async () => {
    if (!color || !size) {
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
      color,
      size,
      quantity,
    });

    if (variant === "buy-now") {
      router.push("/checkout");
    } else {
      toast.success("Added to cart", {
        description: `${title} - ${color}, ${size}`,
      });
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
