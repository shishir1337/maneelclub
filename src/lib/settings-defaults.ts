// Default settings values - shared between client and server
export const DEFAULT_SETTINGS = {
  // Store Information
  storeName: "Maneel Club",
  storeDescription: "Premium clothing brand in Bangladesh",
  storeEmail: "support@maneelclub.com",
  storePhone: "+8801997193518",
  
  // Social Links
  facebookUrl: "https://www.facebook.com/maneelclub",
  instagramUrl: "",
  whatsappNumber: "+8801997193518",
  
  // Shipping Rates
  shippingDhaka: "80",
  shippingOutside: "130",
  
  // Payment Merchant Numbers
  bkashNumber: "01854938837",
  nagadNumber: "01854938837",
  rocketNumber: "01854938837",
  
  // Announcements
  announcementEnabled: "true",
  announcementMessage: "Free shipping on orders over BDT 2000!",
  announcementLink: "/shop",
  announcementLinkText: "Shop Now",
  
  // Order Settings
  lowStockThreshold: "5",
  freeShippingMinimum: "2000",

  // Order cooldown (anti-spam: same IP cannot order again within X minutes)
  orderCooldownEnabled: "false",
  orderCooldownMinutes: "10",

  // Meta Pixel / Facebook Tracking (configure in Admin → Settings → Tracking)
  metaPixelEnabled: "false",
  metaPixelId: "",
  metaCapiAccessToken: "",

  // Google Tag Manager (container ID, e.g. GTM-52G5CZNB)
  gtmContainerId: "",

  // Header navigation (JSON array of { name, href })
  headerMenu: JSON.stringify([
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    { name: "New Arrivals", href: "/product-category/new-arrivals" },
    { name: "Winter Collection", href: "/product-category/winter-collection" },
    { name: "Hoodie", href: "/product-category/hoodie" },
  ]),
} as const;

export type SettingsKey = keyof typeof DEFAULT_SETTINGS;
