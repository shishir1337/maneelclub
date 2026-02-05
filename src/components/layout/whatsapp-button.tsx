"use client";

import { MessageCircle } from "lucide-react";
import { siteConfig } from "@/lib/constants";

export function WhatsAppButton() {
  const message = encodeURIComponent(
    "Hello! I'm interested in your products from Maneel Club."
  );
  const whatsappUrl = `https://wa.me/${siteConfig.whatsapp.replace("+", "")}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:scale-110 transition-transform duration-200"
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
