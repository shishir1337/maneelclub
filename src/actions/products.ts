"use server";

import { db } from "@/lib/db";
import type { Product, Category, ProductVariant } from "@/types";

// Helper to format category name with parent hierarchy (e.g., "Collections > Winter Collection")
function formatCategoryName(category: any): string {
  if (!category) return "";
  if (category.parent) {
    return `${category.parent.name} > ${category.name}`;
  }
  return category.name;
}

// Helper to get primary category from product (prioritizes many-to-many categories, falls back to legacy)
function getPrimaryCategory(dbProduct: any): { category: any; categoryName: string; categorySlug: string } | null {
  // Priority 1: Use first category from many-to-many relationship (if exists)
  if (dbProduct.categories?.length > 0) {
    const firstCategory = dbProduct.categories[0].category;
    if (firstCategory) {
      return {
        category: firstCategory,
        categoryName: formatCategoryName(firstCategory),
        categorySlug: firstCategory.slug || "",
      };
    }
  }
  
  // Priority 2: Fall back to legacy single category (for backward compatibility)
  if (dbProduct.category) {
    return {
      category: dbProduct.category,
      categoryName: formatCategoryName(dbProduct.category),
      categorySlug: dbProduct.category.slug || "",
    };
  }
  
  return null;
}

// Helper to transform DB product to frontend format (including variants with price)
function transformProduct(dbProduct: any): Product {
  let variants: ProductVariant[] | undefined;
  const colorHexMap: Record<string, string> = {};

  if (dbProduct.variants?.length) {
    const withAttrs = dbProduct.variants.some((v: any) => v.attributes?.length);
    if (withAttrs) {
      for (const v of dbProduct.variants) {
        const colorAttr = v.attributes?.find((a: any) => a.attributeValue?.attribute?.slug === "color");
        if (colorAttr?.attributeValue) {
          const name = colorAttr.attributeValue.displayValue;
          const hex = colorAttr.attributeValue.metadata?.hex;
          if (name && hex) colorHexMap[name] = String(hex);
        }
      }
      variants = dbProduct.variants.map((v: any) => {
        const color = v.attributes?.find((a: any) => a.attributeValue?.attribute?.slug === "color")?.attributeValue?.displayValue ?? "";
        const size = v.attributes?.find((a: any) => a.attributeValue?.attribute?.slug === "size")?.attributeValue?.displayValue ?? "";
        return {
          id: v.id,
          productId: v.productId,
          color,
          size,
          stock: v.stock ?? 0,
          sku: v.sku ?? null,
          price: v.price != null ? Number(v.price.toString()) : null,
          images: v.images ?? [],
        };
      });
    } else {
      variants = dbProduct.variants.map((v: any) => ({
        id: v.id,
        productId: v.productId,
        color: "",
        size: "",
        stock: v.stock ?? 0,
        sku: v.sku ?? null,
        price: v.price != null ? Number(v.price.toString()) : null,
        images: v.images ?? [],
      }));
    }
  }

  // Intelligently get primary category (handles both legacy and many-to-many relationships)
  const primaryCategory = getPrimaryCategory(dbProduct);

  return {
    id: dbProduct.id,
    title: dbProduct.title,
    slug: dbProduct.slug,
    description: dbProduct.description || "",
    regularPrice: Number(dbProduct.regularPrice?.toString() || 0),
    salePrice: dbProduct.salePrice ? Number(dbProduct.salePrice.toString()) : null,
    image: dbProduct.images?.[0] || "/productImage.jpeg",
    images: dbProduct.images || ["/productImage.jpeg"],
    colors: dbProduct.colors || [],
    sizes: dbProduct.sizes || [],
    categoryId: dbProduct.categoryId || "",
    categorySlug: primaryCategory?.categorySlug || "",
    categoryName: primaryCategory?.categoryName || "",
    category: primaryCategory?.category ? transformCategory(primaryCategory.category, true) : null,
    stock: dbProduct.stock ?? 0,
    trackInventory: dbProduct.trackInventory ?? false,
    productType: dbProduct.productType ?? (dbProduct.trackInventory ? "VARIABLE" : "SIMPLE"),
    isActive: dbProduct.isActive ?? true,
    isFeatured: dbProduct.isFeatured ?? false,
    sizeChart: dbProduct.sizeChart,
    variants,
    colorHexMap: Object.keys(colorHexMap).length > 0 ? colorHexMap : undefined,
    createdAt: dbProduct.createdAt,
    updatedAt: dbProduct.updatedAt,
  };
}

function transformCategory(dbCategory: any, shallow = false): Category {
  const base = {
    id: dbCategory.id,
    name: dbCategory.name,
    slug: dbCategory.slug,
    description: dbCategory.description || "",
    image: dbCategory.image || "/logo.png",
    parentId: dbCategory.parentId ?? null,
    isActive: dbCategory.isActive ?? true,
    sortOrder: dbCategory.sortOrder ?? 0,
    createdAt: dbCategory.createdAt,
    updatedAt: dbCategory.updatedAt,
  };
  if (shallow) return base as Category;
  return {
    ...base,
    parent: dbCategory.parent
      ? transformCategory(dbCategory.parent, true)
      : null,
    children: dbCategory.children?.map((c: any) => transformCategory(c)),
  } as Category;
}

/**
 * Get featured products for homepage
 */
export async function getFeaturedProducts(limit = 4) {
  try {
    const products = await db.product.findMany({
      where: { isFeatured: true, isActive: true },
      include: { 
        category: {
          include: { parent: true },
        },
        categories: {
          include: {
            category: {
              include: { parent: true },
            },
          },
        },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
    
    return { success: true, data: products.map(transformProduct) };
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return { success: false, error: "Failed to fetch products", data: [] };
  }
}

/**
 * Get new arrivals for homepage
 */
export async function getNewArrivals(limit = 4) {
  try {
    const products = await db.product.findMany({
      where: { isActive: true },
      include: { 
        category: {
          include: { parent: true },
        },
        categories: {
          include: {
            category: {
              include: { parent: true },
            },
          },
        },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
    
    return { success: true, data: products.map(transformProduct) };
  } catch (error) {
    console.error("Error fetching new arrivals:", error);
    return { success: false, error: "Failed to fetch products", data: [] };
  }
}

/**
 * Get products by category slug (supports parent slugs: returns products from all child categories)
 */
export async function getProductsByCategory(categorySlug: string) {
  try {
    if (categorySlug === "all") {
      const products = await db.product.findMany({
        where: { isActive: true },
        include: { 
          category: {
            include: { parent: true },
          },
          categories: {
            include: {
              category: {
                include: { parent: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return { success: true, data: products.map(transformProduct) };
    }

    const category = await db.category.findUnique({
      where: { slug: categorySlug },
      include: { children: { select: { id: true } } },
    });

    if (!category) {
      return { success: true, data: [] };
    }

    // If it's a subcategory, search for products in that category
    // If it's a parent category, search for products in that category AND its children
    const categoryIds: string[] = category.parentId
      ? [category.id] // Subcategory: search only this category
      : [category.id, ...(category.children?.map((c) => c.id) ?? [])]; // Parent: search this category + children

    if (categoryIds.length === 0) {
      return { success: true, data: [] };
    }

    // Get products that match via legacy categoryId OR via ProductCategory relationship
    const products = await db.product.findMany({
      where: {
        isActive: true,
        OR: [
          { categoryId: { in: categoryIds } },
          { categories: { some: { categoryId: { in: categoryIds } } } },
        ],
      },
      include: { 
        category: true,
        categories: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: products.map(transformProduct) };
  } catch (error) {
    console.error("Error fetching products by category:", error);
    return { success: false, error: "Failed to fetch products", data: [] };
  }
}

/**
 * Resolve color names to hex from Color attribute values in DB (single source of truth).
 */
async function getColorHexMapFromDb(colorNames: string[]): Promise<Record<string, string>> {
  if (colorNames.length === 0) return {};
  const normalized = [...new Set(colorNames.map((n) => n.trim()).filter(Boolean))];
  const values = await db.attributeValue.findMany({
    where: {
      attribute: { slug: "color" },
      OR: [
        { displayValue: { in: normalized } },
        { value: { in: normalized } },
      ],
    },
    select: { displayValue: true, value: true, metadata: true },
  });
  const map: Record<string, string> = {};
  for (const v of values) {
    const hex = (v.metadata as { hex?: string } | null)?.hex;
    if (hex) {
      map[v.displayValue] = hex;
      if (v.value !== v.displayValue) map[v.value] = hex;
    }
  }
  return map;
}

/**
 * Get all Color attribute values from DB as the single source of truth for storefront.
 * Returns { value, label, hex } so any color added in admin shows everywhere without editing constants.
 */
export async function getColorOptionsFromDb(): Promise<{ value: string; label: string; hex: string }[]> {
  const values = await db.attributeValue.findMany({
    where: { attribute: { slug: "color" } },
    orderBy: { sortOrder: "asc" },
    select: { value: true, displayValue: true, metadata: true },
  });
  return values
    .map((v) => {
      const hex = (v.metadata as { hex?: string } | null)?.hex ?? "#888888";
      return { value: v.value, label: v.displayValue, hex };
    })
    .filter((c) => c.value && c.label);
}

/**
 * Get single product by slug (with variants and attribute values for storefront pricing).
 * Color hex is resolved from DB (Color attribute values with metadata.hex) so any admin-added color shows correctly.
 */
export async function getProductBySlug(slug: string) {
  try {
    const product = await db.product.findUnique({
      where: { slug },
      include: {
        category: {
          include: { parent: true },
        },
        categories: {
          include: {
            category: {
              include: { parent: true },
            },
          },
        },
        variants: {
          include: {
            attributes: {
              include: {
                attributeValue: { include: { attribute: true } },
              },
            },
          },
        },
      },
    });

    if (!product || !product.isActive) {
      return { success: false, error: "Product not found", data: null };
    }

    const data = transformProduct(product);

    // Permanent fix: resolve hex for any product color not yet in colorHexMap (from DB Color attribute values)
    const colorNames = [...new Set([...(data.colors || []), ...Object.keys(data.colorHexMap || {})])];
    const missing = colorNames.filter((name) => !data.colorHexMap?.[name]);
    if (missing.length > 0) {
      const dbHexMap = await getColorHexMapFromDb(missing);
      data.colorHexMap = { ...(data.colorHexMap || {}), ...dbHexMap };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching product:", error);
    return { success: false, error: "Failed to fetch product", data: null };
  }
}

/**
 * Get all products (for shop page)
 */
export async function getAllProducts() {
  try {
    const products = await db.product.findMany({
      where: { isActive: true },
      include: { 
        category: true,
        categories: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    
    return { success: true, data: products.map(transformProduct) };
  } catch (error) {
    console.error("Error fetching all products:", error);
    return { success: false, error: "Failed to fetch products", data: [] };
  }
}

/**
 * Get all categories with hierarchy (parents with children)
 * Returns flat list; parents have children populated. Orphans (subcategories whose parent is inactive) included.
 */
export async function getCategories() {
  try {
    const categories = await db.category.findMany({
      where: { isActive: true },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return { success: true, data: categories.map((c) => transformCategory(c)) };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return { success: false, error: "Failed to fetch categories", data: [] };
  }
}

/**
 * Get featured categories for homepage (top-level categories with images)
 */
export async function getFeaturedCategories(limit = 4) {
  try {
    const categories = await db.category.findMany({
      where: { 
        isActive: true,
        parentId: null, // Top-level categories only
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: limit,
    });

    return { 
      success: true, 
      data: categories.map((c) => transformCategory(c, true)) 
    };
  } catch (error) {
    console.error("Error fetching featured categories:", error);
    return { success: false, error: "Failed to fetch categories", data: [] };
  }
}

/**
 * Get related products (same category, excluding current product)
 */
export async function getRelatedProducts(categoryId: string, excludeProductId: string, limit = 4) {
  try {
    const products = await db.product.findMany({
      where: {
        isActive: true,
        id: { not: excludeProductId },
        OR: [
          { categoryId },
          { categories: { some: { categoryId } } },
        ],
      },
      include: { 
        category: true,
        categories: {
          include: {
            category: true,
          },
        },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
    
    return { success: true, data: products.map(transformProduct) };
  } catch (error) {
    console.error("Error fetching related products:", error);
    return { success: false, error: "Failed to fetch products", data: [] };
  }
}

/**
 * Search products
 */
export async function searchProducts(query: string) {
  try {
    const products = await db.product.findMany({
      where: {
        isActive: true,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      include: { 
        category: {
          include: { parent: true },
        },
        categories: {
          include: {
            category: {
              include: { parent: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    
    return { success: true, data: products.map(transformProduct) };
  } catch (error) {
    console.error("Error searching products:", error);
    return { success: false, error: "Failed to search products", data: [] };
  }
}
