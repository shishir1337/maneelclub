// Mock product data for development/testing
// This will be replaced with real database queries

export const mockCategories = [
  {
    id: "cat-1",
    name: "T-Shirts",
    slug: "t-shirts",
    description: "Comfortable and stylish t-shirts for everyday wear",
    image: "/logo.png",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "cat-2",
    name: "Hoodies",
    slug: "hoodie",
    description: "Warm and cozy hoodies for the winter season",
    image: "/logo.png",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "cat-3",
    name: "Winter Collection",
    slug: "winter-collection",
    description: "Stay warm with our exclusive winter collection",
    image: "/logo.png",
    isActive: true,
    sortOrder: 3,
  },
  {
    id: "cat-4",
    name: "New Arrivals",
    slug: "new-arrivals",
    description: "Check out our latest arrivals",
    image: "/logo.png",
    isActive: true,
    sortOrder: 0,
  },
];

export const mockProducts = [
  {
    id: "prod-1",
    title: "Full Sleeve Waffle Semi Drop Tee's",
    slug: "full-sleeve-waffle-semi-drop-tees",
    description: `A full-sleeve tee is a classic layering piece, working well under jackets, vests, or heavier shirts.
✅GSM: 230-250

⭕️ Semi Drop Shoulder Full sleeve T shirt with Cuff design.
✔️Best for winter & regular fit full sleeve T shirt`,
    price: 590,
    discountPrice: 350,
    images: ["/productImage.jpeg", "/productImage.jpeg", "/productImage.jpeg"],
    featured: true,
    isActive: true,
    categoryId: "cat-1",
    category: mockCategories[0],
    variants: [
      { id: "v1", productId: "prod-1", color: "Black", size: "M", stock: 10, sku: "FSWT-BLK-M" },
      { id: "v2", productId: "prod-1", color: "Black", size: "L", stock: 8, sku: "FSWT-BLK-L" },
      { id: "v3", productId: "prod-1", color: "Black", size: "XL", stock: 5, sku: "FSWT-BLK-XL" },
      { id: "v4", productId: "prod-1", color: "Black", size: "XXL", stock: 3, sku: "FSWT-BLK-XXL" },
      { id: "v5", productId: "prod-1", color: "Burgundy Maroon", size: "M", stock: 7, sku: "FSWT-BUR-M" },
      { id: "v6", productId: "prod-1", color: "Burgundy Maroon", size: "L", stock: 6, sku: "FSWT-BUR-L" },
      { id: "v7", productId: "prod-1", color: "Coffee", size: "M", stock: 5, sku: "FSWT-COF-M" },
      { id: "v8", productId: "prod-1", color: "Coffee", size: "L", stock: 4, sku: "FSWT-COF-L" },
      { id: "v9", productId: "prod-1", color: "Dark Gray", size: "M", stock: 6, sku: "FSWT-DGR-M" },
      { id: "v10", productId: "prod-1", color: "Navy", size: "L", stock: 8, sku: "FSWT-NAV-L" },
      { id: "v11", productId: "prod-1", color: "Off White", size: "M", stock: 5, sku: "FSWT-OFW-M" },
      { id: "v12", productId: "prod-1", color: "Sea Blue", size: "XL", stock: 4, sku: "FSWT-SBL-XL" },
      { id: "v13", productId: "prod-1", color: "Teal Green", size: "L", stock: 3, sku: "FSWT-TGR-L" },
    ],
    sizeChart: {
      headers: ["Size", "Chest", "Length", "Shoulder"],
      rows: [
        { size: "M", measurements: ["40\"", "27\"", "18\""] },
        { size: "L", measurements: ["42\"", "28\"", "19\""] },
        { size: "XL", measurements: ["44\"", "29\"", "20\""] },
        { size: "XXL", measurements: ["46\"", "30\"", "21\""] },
      ],
    },
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "prod-2",
    title: "Premium Cotton Polo Shirt",
    slug: "premium-cotton-polo-shirt",
    description: "Classic polo shirt made from 100% premium cotton. Perfect for casual and semi-formal occasions.",
    price: 750,
    discountPrice: 550,
    images: ["/productImage.jpeg", "/productImage.jpeg"],
    featured: true,
    isActive: true,
    categoryId: "cat-1",
    category: mockCategories[0],
    variants: [
      { id: "v14", productId: "prod-2", color: "White", size: "M", stock: 12, sku: "POLO-WHT-M" },
      { id: "v15", productId: "prod-2", color: "White", size: "L", stock: 10, sku: "POLO-WHT-L" },
      { id: "v16", productId: "prod-2", color: "Black", size: "M", stock: 8, sku: "POLO-BLK-M" },
      { id: "v17", productId: "prod-2", color: "Navy", size: "L", stock: 6, sku: "POLO-NAV-L" },
    ],
    sizeChart: null,
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
  {
    id: "prod-3",
    title: "Winter Hoodie - Fleece Lined",
    slug: "winter-hoodie-fleece-lined",
    description: "Stay warm this winter with our fleece-lined hoodie. Soft, comfortable, and stylish.",
    price: 1200,
    discountPrice: 899,
    images: ["/productImage.jpeg", "/productImage.jpeg"],
    featured: true,
    isActive: true,
    categoryId: "cat-2",
    category: mockCategories[1],
    variants: [
      { id: "v18", productId: "prod-3", color: "Black", size: "M", stock: 15, sku: "HOOD-BLK-M" },
      { id: "v19", productId: "prod-3", color: "Black", size: "L", stock: 12, sku: "HOOD-BLK-L" },
      { id: "v20", productId: "prod-3", color: "Gray", size: "XL", stock: 8, sku: "HOOD-GRY-XL" },
    ],
    sizeChart: null,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
  },
  {
    id: "prod-4",
    title: "Casual Drop Shoulder T-Shirt",
    slug: "casual-drop-shoulder-t-shirt",
    description: "Relaxed fit drop shoulder t-shirt. Perfect for everyday casual wear.",
    price: 450,
    discountPrice: null,
    images: ["/productImage.jpeg"],
    featured: false,
    isActive: true,
    categoryId: "cat-1",
    category: mockCategories[0],
    variants: [
      { id: "v21", productId: "prod-4", color: "White", size: "M", stock: 20, sku: "DROP-WHT-M" },
      { id: "v22", productId: "prod-4", color: "Black", size: "L", stock: 18, sku: "DROP-BLK-L" },
    ],
    sizeChart: null,
    createdAt: new Date("2024-02-05"),
    updatedAt: new Date("2024-02-05"),
  },
  {
    id: "prod-5",
    title: "Oversized Graphic Tee",
    slug: "oversized-graphic-tee",
    description: "Trendy oversized t-shirt with unique graphic print. Stand out from the crowd.",
    price: 550,
    discountPrice: 399,
    images: ["/productImage.jpeg"],
    featured: true,
    isActive: true,
    categoryId: "cat-4",
    category: mockCategories[3],
    variants: [
      { id: "v23", productId: "prod-5", color: "Black", size: "M", stock: 10, sku: "OVER-BLK-M" },
      { id: "v24", productId: "prod-5", color: "White", size: "L", stock: 8, sku: "OVER-WHT-L" },
    ],
    sizeChart: null,
    createdAt: new Date("2024-02-10"),
    updatedAt: new Date("2024-02-10"),
  },
  {
    id: "prod-6",
    title: "Zip-Up Winter Jacket",
    slug: "zip-up-winter-jacket",
    description: "Lightweight yet warm zip-up jacket. Perfect layering piece for winter.",
    price: 1500,
    discountPrice: 1199,
    images: ["/productImage.jpeg"],
    featured: false,
    isActive: true,
    categoryId: "cat-3",
    category: mockCategories[2],
    variants: [
      { id: "v25", productId: "prod-6", color: "Navy", size: "M", stock: 5, sku: "JACK-NAV-M" },
      { id: "v26", productId: "prod-6", color: "Black", size: "L", stock: 7, sku: "JACK-BLK-L" },
    ],
    sizeChart: null,
    createdAt: new Date("2024-02-12"),
    updatedAt: new Date("2024-02-12"),
  },
  {
    id: "prod-7",
    title: "Basic Crew Neck T-Shirt",
    slug: "basic-crew-neck-t-shirt",
    description: "Essential crew neck t-shirt. A wardrobe staple that goes with everything.",
    price: 350,
    discountPrice: null,
    images: ["/productImage.jpeg"],
    featured: false,
    isActive: true,
    categoryId: "cat-1",
    category: mockCategories[0],
    variants: [
      { id: "v27", productId: "prod-7", color: "White", size: "S", stock: 25, sku: "BASIC-WHT-S" },
      { id: "v28", productId: "prod-7", color: "Black", size: "M", stock: 22, sku: "BASIC-BLK-M" },
      { id: "v29", productId: "prod-7", color: "Gray", size: "L", stock: 20, sku: "BASIC-GRY-L" },
    ],
    sizeChart: null,
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15"),
  },
  {
    id: "prod-8",
    title: "Premium Sweatshirt",
    slug: "premium-sweatshirt",
    description: "Soft and comfortable premium sweatshirt. Perfect for lounging or going out.",
    price: 850,
    discountPrice: 699,
    images: ["/productImage.jpeg"],
    featured: true,
    isActive: true,
    categoryId: "cat-4",
    category: mockCategories[3],
    variants: [
      { id: "v30", productId: "prod-8", color: "Burgundy", size: "M", stock: 8, sku: "SWEAT-BUR-M" },
      { id: "v31", productId: "prod-8", color: "Navy", size: "L", stock: 6, sku: "SWEAT-NAV-L" },
    ],
    sizeChart: null,
    createdAt: new Date("2024-02-18"),
    updatedAt: new Date("2024-02-18"),
  },
];

// Helper functions to simulate database queries
export function getFeaturedProducts(limit = 4) {
  return mockProducts
    .filter((p) => p.featured && p.isActive)
    .slice(0, limit);
}

export function getNewArrivals(limit = 4) {
  return [...mockProducts]
    .filter((p) => p.isActive)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

export function getProductsByCategory(categorySlug: string) {
  const category = mockCategories.find((c) => c.slug === categorySlug);
  if (!category) return [];
  
  return mockProducts.filter(
    (p) => p.categoryId === category.id && p.isActive
  );
}

export function getProductBySlug(slug: string) {
  return mockProducts.find((p) => p.slug === slug && p.isActive) || null;
}

export function getAllProducts() {
  return mockProducts.filter((p) => p.isActive);
}

export function getAllCategories() {
  return mockCategories.filter((c) => c.isActive);
}
