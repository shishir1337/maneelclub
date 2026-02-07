"use client";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataLayerProvider } from "@/components/analytics";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <DataLayerProvider>
        {children}
        <Toaster 
        position="bottom-center"
        richColors
        closeButton
        toastOptions={{
          duration: 3000,
        }}
        mobileOffset={{ bottom: "88px" }}
      />
      </DataLayerProvider>
    </TooltipProvider>
  );
}
