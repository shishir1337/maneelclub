import Link from "next/link";
import Image from "next/image";
import { Facebook, Mail, Phone, MapPin, Code, ExternalLink } from "lucide-react";
import { siteConfig } from "@/lib/constants";

const footerLinks = {
  shop: [
    { name: "All Products", href: "/shop" },
    { name: "About Us", href: "/about" },
    { name: "New Arrivals", href: "/product-category/new-arrivals" },
    { name: "Winter Collection", href: "/product-category/winter-collection" },
    { name: "Hoodie", href: "/product-category/hoodie" },
  ],
  support: [
    { name: "Contact Us", href: "/contact" },
    { name: "Shipping Info", href: "/shipping" },
    { name: "Returns & Exchange", href: "/returns" },
    { name: "FAQ", href: "/faq" },
  ],
  account: [
    { name: "My Account", href: "/dashboard" },
    { name: "My Orders", href: "/dashboard/orders" },
  ],
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/40 border-t">
      <div className="py-12 md:py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand Info */}
            <div className="space-y-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="relative h-10 w-10">
                  <Image
                    src="/logo.png"
                    alt=""
                    fill
                    sizes="40px"
                    className="object-contain"
                  />
                </div>
                <span className="font-bold text-xl">{siteConfig.name}</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                Premium clothing brand in Bangladesh. Quality fashion at affordable prices.
              </p>
              <div className="flex items-center gap-4">
                <a
                  href={siteConfig.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href={siteConfig.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="WhatsApp"
                >
                  <Phone className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Shop Links */}
            <div>
              <h3 className="font-semibold mb-4">Shop</h3>
              <ul className="space-y-2">
                {footerLinks.shop.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <a
                    href={`tel:${siteConfig.whatsapp}`}
                    className="hover:text-primary transition-colors"
                  >
                    {siteConfig.whatsapp}
                  </a>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <a
                    href={`mailto:${siteConfig.email}`}
                    className="hover:text-primary transition-colors"
                  >
                    {siteConfig.email}
                  </a>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <a
                    href="https://maps.app.goo.gl/eva1uWFvVgVcTaKC9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    <span className="block">Block #A, Muntaha Tower (Grand Floor)</span>
                    <span className="block">Behind Al Baraka Hospital, Model Town</span>
                    <span className="block">Keraniganj, Dhaka- 1310</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t">
        <div className="container">
          <div className="py-6 space-y-4">
            {/* Copyright and Links */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">
                &copy; {currentYear} {siteConfig.name}. All rights reserved.
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
            
            {/* Developer Credit */}
            <div className="pt-4 border-t border-border/50">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Code className="h-3.5 w-3.5" />
                  <span>Developed by</span>
                  <span className="font-medium text-foreground">Md. Shishir Ahmed</span>
                </div>
                <span className="hidden sm:inline">•</span>
                <a
                  href="https://outnet.it.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-medium text-primary hover:underline transition-colors group"
                >
                  <span>Visit Portfolio</span>
                  <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
