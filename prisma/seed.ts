import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";
import { DEFAULT_SETTINGS } from "../src/lib/settings-defaults";

// Load .env.local first (Next.js convention), then .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Use .env.local or .env.");
  }
  console.log("Seeding database...");

  // ==================== SEED SETTINGS ====================
  console.log("Seeding settings...");
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
  }
  console.log(`Seeded ${Object.keys(DEFAULT_SETTINGS).length} settings`);

  // ==================== SEED ATTRIBUTES ====================
  console.log("Seeding attributes...");

  // Create Color attribute
  const colorAttribute = await prisma.attribute.upsert({
    where: { slug: "color" },
    update: {},
    create: {
      name: "Color",
      slug: "color",
      sortOrder: 1,
    },
  });

  // Create Size attribute
  const sizeAttribute = await prisma.attribute.upsert({
    where: { slug: "size" },
    update: {},
    create: {
      name: "Size",
      slug: "size",
      sortOrder: 2,
    },
  });

  // Color values with hex codes
  const colorValues = [
    { value: "black", displayValue: "Black", metadata: { hex: "#000000" }, sortOrder: 1 },
    { value: "white", displayValue: "White", metadata: { hex: "#FFFFFF" }, sortOrder: 2 },
    { value: "offwhite", displayValue: "Off White", metadata: { hex: "#FAF9F6" }, sortOrder: 3 },
    { value: "navy", displayValue: "Navy", metadata: { hex: "#000080" }, sortOrder: 4 },
    { value: "burgundy-maroon", displayValue: "Burgundy Maroon", metadata: { hex: "#800020" }, sortOrder: 5 },
    { value: "coffee", displayValue: "Coffee", metadata: { hex: "#6F4E37" }, sortOrder: 6 },
    { value: "dark-gray", displayValue: "Dark Gray", metadata: { hex: "#4A4A4A" }, sortOrder: 7 },
    { value: "gray", displayValue: "Gray", metadata: { hex: "#808080" }, sortOrder: 8 },
    { value: "heather-gray", displayValue: "Heather Gray", metadata: { hex: "#9E9E9E" }, sortOrder: 9 },
    { value: "light-biscuit", displayValue: "Light Biscuit", metadata: { hex: "#D4A574" }, sortOrder: 10 },
    { value: "sea-blue", displayValue: "Sea Blue", metadata: { hex: "#006994" }, sortOrder: 11 },
    { value: "teal-green", displayValue: "Teal Green", metadata: { hex: "#008080" }, sortOrder: 12 },
    { value: "olive", displayValue: "Olive", metadata: { hex: "#808000" }, sortOrder: 13 },
    { value: "maroon", displayValue: "Maroon", metadata: { hex: "#800000" }, sortOrder: 14 },
    { value: "red", displayValue: "Red", metadata: { hex: "#FF0000" }, sortOrder: 15 },
    { value: "cream", displayValue: "Cream", metadata: { hex: "#FFFDD0" }, sortOrder: 16 },
    { value: "brown", displayValue: "Brown", metadata: { hex: "#8B4513" }, sortOrder: 17 },
    { value: "green", displayValue: "Green", metadata: { hex: "#008000" }, sortOrder: 18 },
  ];

  for (const color of colorValues) {
    await prisma.attributeValue.upsert({
      where: {
        attributeId_value: {
          attributeId: colorAttribute.id,
          value: color.value,
        },
      },
      update: {
        displayValue: color.displayValue,
        metadata: color.metadata,
        sortOrder: color.sortOrder,
      },
      create: {
        attributeId: colorAttribute.id,
        value: color.value,
        displayValue: color.displayValue,
        metadata: color.metadata,
        sortOrder: color.sortOrder,
      },
    });
  }

  console.log(`Created Color attribute with ${colorValues.length} values`);

  // Size values
  const sizeValues = [
    { value: "xs", displayValue: "XS", sortOrder: 1 },
    { value: "s", displayValue: "S", sortOrder: 2 },
    { value: "m", displayValue: "M", sortOrder: 3 },
    { value: "l", displayValue: "L", sortOrder: 4 },
    { value: "xl", displayValue: "XL", sortOrder: 5 },
    { value: "xxl", displayValue: "XXL", sortOrder: 6 },
    { value: "3xl", displayValue: "3XL", sortOrder: 7 },
  ];

  for (const size of sizeValues) {
    await prisma.attributeValue.upsert({
      where: {
        attributeId_value: {
          attributeId: sizeAttribute.id,
          value: size.value,
        },
      },
      update: {
        displayValue: size.displayValue,
        sortOrder: size.sortOrder,
      },
      create: {
        attributeId: sizeAttribute.id,
        value: size.value,
        displayValue: size.displayValue,
        sortOrder: size.sortOrder,
      },
    });
  }

  console.log(`Created Size attribute with ${sizeValues.length} values`);

  // ==================== SEED CATEGORIES ====================
  // Create parent categories first
  const parentCollections = await prisma.category.upsert({
    where: { slug: "collections" },
    update: { parentId: null },
    create: {
      name: "Collections",
      slug: "collections",
      description: "Seasonal and special collections",
      parentId: null,
      sortOrder: 1,
    },
  });

  const parentClothing = await prisma.category.upsert({
    where: { slug: "clothing" },
    update: { parentId: null },
    create: {
      name: "Clothing",
      slug: "clothing",
      description: "Apparel and clothing items",
      parentId: null,
      sortOrder: 2,
    },
  });

  // Create subcategories
  const tShirts = await prisma.category.upsert({
    where: { slug: "t-shirts" },
    update: { parentId: parentClothing.id },
    create: {
      name: "T-Shirts",
      slug: "t-shirts",
      description: "Premium quality t-shirts for everyday wear",
      parentId: parentClothing.id,
      sortOrder: 1,
    },
  });

  const hoodies = await prisma.category.upsert({
    where: { slug: "hoodie" },
    update: { parentId: parentClothing.id },
    create: {
      name: "Hoodies",
      slug: "hoodie",
      description: "Comfortable hoodies for all seasons",
      parentId: parentClothing.id,
      sortOrder: 2,
    },
  });

  const polo = await prisma.category.upsert({
    where: { slug: "polo" },
    update: { parentId: parentClothing.id },
    create: {
      name: "Polo",
      slug: "polo",
      description: "Classic and modern polo shirts",
      parentId: parentClothing.id,
      sortOrder: 3,
    },
  });

  const winterCollection = await prisma.category.upsert({
    where: { slug: "winter-collection" },
    update: { parentId: parentCollections.id },
    create: {
      name: "Winter Collection",
      slug: "winter-collection",
      description: "Stay warm with our winter essentials",
      parentId: parentCollections.id,
      sortOrder: 1,
    },
  });

  const newArrivals = await prisma.category.upsert({
    where: { slug: "new-arrivals" },
    update: { parentId: parentCollections.id },
    create: {
      name: "New Arrivals",
      slug: "new-arrivals",
      description: "Check out our latest products",
      parentId: parentCollections.id,
      sortOrder: 2,
    },
  });

  console.log("Created parent and subcategories");

  // ==================== SEED HERO SLIDES (only if empty) ====================
  const existingSlides = await prisma.heroSlide.count();
  if (existingSlides === 0) {
    await prisma.heroSlide.createMany({
      data: [
        { image: "/sliderimagepolo.png", alt: "Premium Polo Collection - New Collection at Maneel Club", link: "/product-category/polo", sortOrder: 0 },
        { image: "/sliderimagesummersale.png", alt: "Summer Sale - Up to 50% off on selected items", link: "/product-category/sale", sortOrder: 1 },
      ],
    });
    console.log("Seeded 2 default hero slides");
  }

  // Create products (assigned to subcategories only)
  const products = [
    {
      title: "Full Sleeve Waffle Semi Drop Tee's",
      slug: "full-sleeve-waffle-semi-drop-tees",
      description: "A full-sleeve tee is a classic layering piece, working well under jackets, vests, or heavier shirts. GSM: 230-250. Semi Drop Shoulder Full sleeve T shirt with Cuff design. Best for winter & regular fit full sleeve T shirt.",
      regularPrice: 590,
      salePrice: 350,
      images: ["/productImage.jpeg"],
      colors: ["Black", "Burgundy Maroon", "Coffee", "Dark Gray", "Light Biscuit", "Navy", "Off White", "Sea Blue", "Teal Green"],
      sizes: ["M", "L", "XL", "XXL"],
      stock: 100,
      isActive: true,
      isFeatured: true,
      categoryId: tShirts.id,
    },
    {
      title: "Premium Cotton Polo Shirt",
      slug: "premium-cotton-polo-shirt",
      description: "High-quality cotton polo shirt perfect for casual and semi-formal occasions. Breathable fabric with classic collar design.",
      regularPrice: 850,
      salePrice: 650,
      images: ["/productImage.jpeg"],
      colors: ["White", "Black", "Navy", "Maroon"],
      sizes: ["M", "L", "XL", "XXL"],
      stock: 75,
      isActive: true,
      isFeatured: true,
      categoryId: polo.id,
    },
    {
      title: "Winter Hoodie - Fleece Lined",
      slug: "winter-hoodie-fleece-lined",
      description: "Ultra-warm fleece-lined hoodie perfect for cold days. Features kangaroo pocket and adjustable drawstring hood.",
      regularPrice: 1200,
      salePrice: 950,
      images: ["/productImage.jpeg"],
      colors: ["Black", "Gray", "Navy", "Olive"],
      sizes: ["M", "L", "XL", "XXL"],
      stock: 50,
      isActive: true,
      isFeatured: true,
      categoryId: hoodies.id,
    },
    {
      title: "Oversized Graphic Tee",
      slug: "oversized-graphic-tee",
      description: "Trendy oversized fit with unique graphic prints. Made from 100% cotton for maximum comfort.",
      regularPrice: 550,
      salePrice: 450,
      images: ["/productImage.jpeg"],
      colors: ["White", "Black", "Cream"],
      sizes: ["M", "L", "XL"],
      stock: 80,
      isActive: true,
      isFeatured: false,
      categoryId: newArrivals.id,
    },
    {
      title: "Premium Sweatshirt",
      slug: "premium-sweatshirt",
      description: "Classic crewneck sweatshirt with premium cotton blend. Perfect layering piece for transitional weather.",
      regularPrice: 950,
      salePrice: 750,
      images: ["/productImage.jpeg"],
      colors: ["Heather Gray", "Black", "Navy", "Burgundy"],
      sizes: ["M", "L", "XL", "XXL"],
      stock: 60,
      isActive: true,
      isFeatured: true,
      categoryId: winterCollection.id,
    },
    {
      title: "Basic Crew Neck T-Shirt",
      slug: "basic-crew-neck-t-shirt",
      description: "Essential basic tee made from soft cotton. A wardrobe staple that goes with everything.",
      regularPrice: 350,
      salePrice: null,
      images: ["/productImage.jpeg"],
      colors: ["White", "Black", "Gray", "Navy", "Red"],
      sizes: ["S", "M", "L", "XL", "XXL"],
      stock: 200,
      isActive: true,
      isFeatured: false,
      categoryId: tShirts.id,
    },
    {
      title: "Zip-Up Winter Jacket",
      slug: "zip-up-winter-jacket",
      description: "Heavy-duty winter jacket with quilted lining. Features multiple pockets and adjustable cuffs.",
      regularPrice: 2500,
      salePrice: 1990,
      images: ["/productImage.jpeg"],
      colors: ["Black", "Navy", "Olive", "Brown"],
      sizes: ["M", "L", "XL", "XXL"],
      stock: 30,
      isActive: true,
      isFeatured: true,
      categoryId: winterCollection.id,
    },
    {
      title: "Casual Striped Polo",
      slug: "casual-striped-polo",
      description: "Stylish striped polo shirt for a smart-casual look. Features ribbed collar and button placket.",
      regularPrice: 750,
      salePrice: 590,
      images: ["/productImage.jpeg"],
      colors: ["Navy/White", "Black/White", "Green/White"],
      sizes: ["M", "L", "XL"],
      stock: 45,
      isActive: true,
      isFeatured: false,
      categoryId: polo.id,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
  }

  console.log(`Created ${products.length} products`);

  // ==================== SEED CITIES ====================
  console.log("Seeding cities...");
  const citiesSeed = [
    { name: "Dhaka", value: "dhaka", shippingZone: "inside_dhaka" as const, sortOrder: 0 },
    { name: "Gazipur", value: "gazipur", shippingZone: "inside_dhaka" as const, sortOrder: 1 },
    { name: "Narayanganj", value: "narayanganj", shippingZone: "inside_dhaka" as const, sortOrder: 2 },
    { name: "Chittagong", value: "chittagong", shippingZone: "outside_dhaka" as const, sortOrder: 3 },
    { name: "Sylhet", value: "sylhet", shippingZone: "outside_dhaka" as const, sortOrder: 4 },
    { name: "Rajshahi", value: "rajshahi", shippingZone: "outside_dhaka" as const, sortOrder: 5 },
    { name: "Khulna", value: "khulna", shippingZone: "outside_dhaka" as const, sortOrder: 6 },
    { name: "Barishal", value: "barishal", shippingZone: "outside_dhaka" as const, sortOrder: 7 },
    { name: "Rangpur", value: "rangpur", shippingZone: "outside_dhaka" as const, sortOrder: 8 },
    { name: "Mymensingh", value: "mymensingh", shippingZone: "outside_dhaka" as const, sortOrder: 9 },
    { name: "Comilla", value: "comilla", shippingZone: "outside_dhaka" as const, sortOrder: 10 },
  ];
  for (const city of citiesSeed) {
    await prisma.city.upsert({
      where: { value: city.value },
      update: { name: city.name, shippingZone: city.shippingZone, sortOrder: city.sortOrder },
      create: city,
    });
  }
  console.log(`Seeded ${citiesSeed.length} cities`);

  // Create admin user if not exists
  const adminEmail = "admin@maneelclub.com";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    console.log("\n⚠️  No admin user found. Create one by signing up at /sign-up");
    console.log("   Then update the role to ADMIN in the database:");
    console.log(`   UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';\n`);
  }

  console.log("Seeding completed!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
