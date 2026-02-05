// ==================== SITE CONFIGURATION ====================

export const siteConfig = {
  name: "Maneel Club",
  description: "Premium clothing brand in Bangladesh",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ogImage: "/og-image.jpg",
  
  // Contact
  whatsapp: "+8801997193518",
  whatsappLink: "https://wa.me/8801997193518",
  facebook: "https://www.facebook.com/maneelclub",
  email: "support@maneelclub.com",
  
  // Currency
  currency: "BDT",
  currencySymbol: "BDT ",
  
  // Location
  country: "Bangladesh",
} as const;

// ==================== SHIPPING ====================

export const SHIPPING_RATES = {
  dhaka: 70,
  outside: 130,
} as const;

// Cities/Districts for checkout dropdown
export const CITIES = [
  { value: "dhaka", label: "Dhaka", shippingCost: SHIPPING_RATES.dhaka },
  { value: "chittagong", label: "Chittagong", shippingCost: SHIPPING_RATES.outside },
  { value: "sylhet", label: "Sylhet", shippingCost: SHIPPING_RATES.outside },
  { value: "rajshahi", label: "Rajshahi", shippingCost: SHIPPING_RATES.outside },
  { value: "khulna", label: "Khulna", shippingCost: SHIPPING_RATES.outside },
  { value: "barishal", label: "Barishal", shippingCost: SHIPPING_RATES.outside },
  { value: "rangpur", label: "Rangpur", shippingCost: SHIPPING_RATES.outside },
  { value: "mymensingh", label: "Mymensingh", shippingCost: SHIPPING_RATES.outside },
  { value: "comilla", label: "Comilla", shippingCost: SHIPPING_RATES.outside },
  { value: "gazipur", label: "Gazipur", shippingCost: SHIPPING_RATES.dhaka },
  { value: "narayanganj", label: "Narayanganj", shippingCost: SHIPPING_RATES.dhaka },
] as const;

export type CityValue = (typeof CITIES)[number]["value"];

// Get shipping cost by city
export function getShippingCost(city: string): number {
  const found = CITIES.find((c) => c.value === city);
  return found?.shippingCost ?? SHIPPING_RATES.outside;
}

// ==================== ORDER STATUS ====================

export const ORDER_STATUS = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { label: "Confirmed", color: "bg-blue-100 text-blue-800" },
  PROCESSING: { label: "Processing", color: "bg-purple-100 text-purple-800" },
  SHIPPED: { label: "Shipped", color: "bg-indigo-100 text-indigo-800" },
  DELIVERED: { label: "Delivered", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-800" },
} as const;

// Array format for dropdowns/selects
export const ORDER_STATUSES = [
  { value: "PENDING", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "CONFIRMED", label: "Confirmed", color: "bg-blue-100 text-blue-800" },
  { value: "PROCESSING", label: "Processing", color: "bg-purple-100 text-purple-800" },
  { value: "SHIPPED", label: "Shipped", color: "bg-indigo-100 text-indigo-800" },
  { value: "DELIVERED", label: "Delivered", color: "bg-green-100 text-green-800" },
  { value: "CANCELLED", label: "Cancelled", color: "bg-red-100 text-red-800" },
] as const;

// ==================== PRODUCT ====================

export const PRODUCT_COLORS = [
  { value: "black", label: "Black", hex: "#000000" },
  { value: "white", label: "White", hex: "#FFFFFF" },
  { value: "offwhite", label: "Off White", hex: "#FAF9F6" },
  { value: "navy", label: "Navy", hex: "#000080" },
  { value: "burgundy-maroon", label: "Burgundy Maroon", hex: "#800020" },
  { value: "bottle-green", label: "Bottle Green", hex: "#006A4E" },
  { value: "coffee", label: "Coffee", hex: "#6F4E37" },
  { value: "dark-gray", label: "Dark Gray", hex: "#4A4A4A" },
  { value: "light-biscuit", label: "Light Biscuit", hex: "#D4A574" },
  { value: "sea-blue", label: "Sea Blue", hex: "#006994" },
  { value: "teal-green", label: "Teal Green", hex: "#008080" },
] as const;

export const PRODUCT_SIZES = ["S", "M", "L", "XL", "XXL"] as const;

export type ProductSize = (typeof PRODUCT_SIZES)[number];

// ==================== PAGINATION ====================

export const PRODUCTS_PER_PAGE = 12;
export const ORDERS_PER_PAGE = 10;

// ==================== ANNOUNCEMENT ====================

export const ANNOUNCEMENT = {
  enabled: true,
  message: "Free shipping on orders over BDT 2000!",
  link: "/shop",
  linkText: "Shop Now",
} as const;
