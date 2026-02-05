"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CartItem } from "@/types";

interface CartState {
  items: CartItem[];
  
  // Actions
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  
  // Computed values (as functions)
  getTotalItems: () => number;
  getSubtotal: () => number;
  getItemById: (id: string) => CartItem | undefined;
}

// Generate unique ID for cart items based on product, color, and size
function generateCartItemId(productId: string, color: string, size: string): string {
  return `${productId}-${color}-${size}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        const id = generateCartItemId(item.productId, item.color, item.size);
        
        set((state) => {
          // Check if item already exists
          const existingItem = state.items.find((i) => i.id === id);
          
          if (existingItem) {
            // Update quantity
            return {
              items: state.items.map((i) =>
                i.id === id
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          
          // Add new item
          return {
            items: [...state.items, { ...item, id }],
          };
        });
      },
      
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
      
      updateQuantity: (id, quantity) => {
        if (quantity < 1) {
          get().removeItem(id);
          return;
        }
        
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        }));
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      
      getSubtotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },
      
      getItemById: (id) => {
        return get().items.find((item) => item.id === id);
      },
    }),
    {
      name: "maneel-club-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// Selector hooks for optimized re-renders
export const useCartItems = () => useCartStore((state) => state.items);
export const useCartItemsCount = () => useCartStore((state) => state.getTotalItems());
export const useCartSubtotal = () => useCartStore((state) => state.getSubtotal());
