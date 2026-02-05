"use client";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <TooltipProvider delayDuration={0}>
      {children}
      <Toaster 
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          duration: 3000,
        }}
      />
    </TooltipProvider>
  );
}
