"use client";

import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  /** WhatsApp number from admin settings, e.g. "+8801997193518". Renders nothing when empty. */
  whatsappNumber: string;
  /** Store name used in the pre-filled chat message. */
  storeName: string;
}

export function WhatsAppButton({ whatsappNumber, storeName }: WhatsAppButtonProps) {
  const digits = whatsappNumber.replace(/\D/g, "");
  if (!digits) return null;

  const message = encodeURIComponent(
    `Hello! I'm interested in your products from ${storeName}.`
  );
  const whatsappUrl = `https://wa.me/${digits}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-24 right-6 md:bottom-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:scale-110 transition-transform duration-200"
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
