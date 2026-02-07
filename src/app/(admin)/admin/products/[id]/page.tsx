"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Save, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getProductById, updateProduct, getAdminCategories } from "@/actions/admin/products";
import { AttributeSelector, ImageUploader, VariantMatrix, SizeGuideEditor } from "@/components/admin";
import type { SizeChartValue } from "@/components/admin/size-guide-editor";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

const productSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  regularPrice: z.number().min(0, "Price must be positive"),
  salePrice: z.number().min(0).optional().nullable(),
  categoryId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  productType: z.enum(["SIMPLE", "VARIABLE"]).default("SIMPLE"),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  parent?: { name: string } | null;
}

interface SelectedValue {
  id: string;
  value: string;
  displayValue: string;
  metadata?: { hex?: string } | null;
}

interface SelectedAttribute {
  attributeId: string;
  attributeName: string;
  attributeSlug: string;
  values: SelectedValue[];
}

interface VariantStock {
  [key: string]: {
    stock: number;
    sku?: string;
    price?: number;
    images?: string[];
  };
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  
  // Attribute and variant state
  const [selectedAttributes, setSelectedAttributes] = useState<SelectedAttribute[]>([]);
  const [variantStocks, setVariantStocks] = useState<VariantStock>({});
  const [sizeChart, setSizeChart] = useState<SizeChartValue | null>(null);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as Resolver<ProductFormData>,
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      regularPrice: 0,
      salePrice: null,
      categoryId: null,
      isActive: true,
      isFeatured: false,
      productType: "SIMPLE",
    },
  });

  const productType = form.watch("productType");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [productResult, categoriesResult] = await Promise.all([
          getProductById(id),
          getAdminCategories(),
        ]);

        if (!productResult.success || !productResult.data) {
          toast.error("Product not found");
          router.push("/admin/products");
          return;
        }

        const product = productResult.data;
        
        // Convert Prisma Decimal to number for form
        const regularPrice = typeof product.regularPrice === 'object' 
          ? Number(product.regularPrice.toString()) 
          : Number(product.regularPrice);
        const salePrice = product.salePrice 
          ? (typeof product.salePrice === 'object' 
              ? Number(product.salePrice.toString()) 
              : Number(product.salePrice))
          : null;
        
        const productTypeFromDb: "SIMPLE" | "VARIABLE" =
          ((product as { productType?: string }).productType as "SIMPLE" | "VARIABLE" | undefined)
          ?? (product.trackInventory ? "VARIABLE" : "SIMPLE");

        form.reset({
          title: product.title,
          slug: product.slug,
          description: product.description || "",
          regularPrice,
          salePrice,
          categoryId: product.categoryId,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          productType: productTypeFromDb,
        });
        
        setImages(product.images?.length ? product.images : []);

        const existingSizeChart = (product as { sizeChart?: SizeChartValue | null }).sizeChart;
        setSizeChart(
          existingSizeChart &&
            Array.isArray(existingSizeChart.headers) &&
            Array.isArray(existingSizeChart.rows)
            ? existingSizeChart
            : null
        );

        const p = product as unknown as {
          colors?: string[];
          sizes?: string[];
          variants?: Array<{
            attributeValueIds?: string[];
            stock: number;
            sku: string | null;
            price: number | null;
            images?: string[];
            attributes?: Array<{
              attributeValue: { id: string; displayValue: string; value: string; metadata?: { hex?: string } | null; attribute: { id: string; slug: string; name: string } };
            }>;
          }>;
        };

        let attrs: SelectedAttribute[] = [];
        const stocks: VariantStock = {};

        if (p.variants && p.variants.length > 0) {
          const attrMap = new Map<string, SelectedAttribute>();
          for (const v of p.variants) {
            // Key must match VariantMatrix order (attributes by slug, e.g. color then size)
            const key = [...(v.attributes || [])]
              .sort((a, b) => a.attributeValue.attribute.slug.localeCompare(b.attributeValue.attribute.slug))
              .map((a) => a.attributeValue.id)
              .join("-");
            stocks[key] = {
              stock: v.stock,
              sku: v.sku ?? undefined,
              price: v.price != null ? Number(v.price) : undefined,
              images: (v as { images?: string[] }).images ?? [],
            };
            for (const a of v.attributes || []) {
              const attr = a.attributeValue.attribute;
              const val = a.attributeValue;
              if (!attrMap.has(attr.id)) {
                attrMap.set(attr.id, {
                  attributeId: attr.id,
                  attributeName: attr.name,
                  attributeSlug: attr.slug,
                  values: [],
                });
              }
              const entry = attrMap.get(attr.id)!;
              if (!entry.values.some((x) => x.id === val.id)) {
                entry.values.push({
                  id: val.id,
                  value: val.value,
                  displayValue: val.displayValue,
                  metadata: val.metadata as { hex?: string } | null | undefined,
                });
              }
            }
          }
          attrs = Array.from(attrMap.values()).sort((a, b) => a.attributeSlug.localeCompare(b.attributeSlug));
        }

        if (attrs.length === 0 && (product.colors?.length || product.sizes?.length)) {
          if (product.colors && product.colors.length > 0) {
            attrs.push({
              attributeId: "color",
              attributeName: "Color",
              attributeSlug: "color",
              values: product.colors.map((c: string) => ({
                id: c.toLowerCase().replace(/\s+/g, "-"),
                value: c.toLowerCase().replace(/\s+/g, "-"),
                displayValue: c,
              })),
            });
          }
          if (product.sizes && product.sizes.length > 0) {
            attrs.push({
              attributeId: "size",
              attributeName: "Size",
              attributeSlug: "size",
              values: product.sizes.map((s: string) => ({
                id: s.toLowerCase(),
                value: s.toLowerCase(),
                displayValue: s,
              })),
            });
          }
        }

        setSelectedAttributes(attrs);
        setVariantStocks(stocks);

        if (categoriesResult.success) {
          setCategories(categoriesResult.data as Category[]);
        }
      } catch (error) {
        toast.error("Failed to load product");
        router.push("/admin/products");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, router, form]);

  // Stable callback for variant stocks
  const handleVariantStocksChange = useCallback((stocks: VariantStock) => {
    setVariantStocks(stocks);
  }, []);

  async function onSubmit(data: ProductFormData) {
    if (data.productType === "VARIABLE") {
      const attributesWithValues = selectedAttributes.filter((a) => a.values.length > 0);
      if (attributesWithValues.length === 0) {
        toast.error("Variable products require at least one attribute (e.g., Color, Size) with values selected.");
        return;
      }
      const variantCount = Object.keys(variantStocks).length;
      if (variantCount === 0) {
        toast.error("Variable products require at least one variant. Select attribute values above to generate the variant matrix.");
        return;
      }
    }

    setSaving(true);
    try {
      const isVariable = data.productType === "VARIABLE";
      const variantsData = isVariable
        ? Object.entries(variantStocks).map(([key, stockData]) => ({
            attributeValueIds: key.split("-"),
            stock: stockData.stock,
            sku: stockData.sku,
            price: stockData.price != null && stockData.price > 0 ? stockData.price : undefined,
            images: stockData.images && stockData.images.length > 0 ? stockData.images : undefined,
          }))
        : undefined;

      const result = await updateProduct(
        id,
        {
          ...data,
          trackInventory: isVariable,
          images: images.length > 0 ? images : ["/productImage.jpeg"],
          colors: selectedAttributes
            .find((a) => a.attributeSlug === "color")
            ?.values.map((v) => v.displayValue) || [],
          sizes: selectedAttributes
            .find((a) => a.attributeSlug === "size")
            ?.values.map((v) => v.displayValue) || [],
          stock: isVariable
            ? Object.values(variantStocks).reduce((sum, v) => sum + (v?.stock ?? 0), 0)
            : 999,
          sizeChart: sizeChart?.headers?.length && sizeChart?.rows?.length ? sizeChart : null,
        },
        variantsData
      );

      if (result.success) {
        toast.success("Product updated successfully");
        router.push("/admin/products");
      } else {
        toast.error(result.error || "Failed to update product");
      }
    } catch (error) {
      toast.error("Failed to update product");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-32 w-full rounded-lg" />
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-20 rounded-md" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><Skeleton className="h-6 w-24" /></CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Product</h1>
          <p className="text-muted-foreground">
            Update product details
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug *</FormLabel>
                        <FormControl>
                          <Input placeholder="product-slug" {...field} />
                        </FormControl>
                        <FormDescription>
                          URL-friendly version of the title
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter product description..."
                            rows={5}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Product Type</CardTitle>
                  <CardDescription>
                    Choose how this product is sold (WooCommerce-style)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="productType"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex flex-col gap-4">
                            <label className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                              <input
                                type="radio"
                                name={field.name}
                                value="SIMPLE"
                                checked={field.value === "SIMPLE"}
                                onChange={() => field.onChange("SIMPLE")}
                                className="mt-1"
                              />
                              <div>
                                <p className="font-medium">Simple product</p>
                                <p className="text-sm text-muted-foreground">
                                  Single price and stock. You can add attributes for display (e.g. color, size) but they won&apos;t create separate variants.
                                </p>
                              </div>
                            </label>
                            <label className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                              <input
                                type="radio"
                                name={field.name}
                                value="VARIABLE"
                                checked={field.value === "VARIABLE"}
                                onChange={() => field.onChange("VARIABLE")}
                                className="mt-1"
                              />
                              <div>
                                <p className="font-medium">Variable product</p>
                                <p className="text-sm text-muted-foreground">
                                  Each combination of attributes (e.g. Color + Size) will be a variant with its own stock and optional price/SKU.
                                </p>
                              </div>
                            </label>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="regularPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Regular Price (BDT) *</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="salePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sale Price (BDT)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="Leave empty for no discount"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? Number(e.target.value) : null
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Product Attributes</CardTitle>
                  <CardDescription>
                    {productType === "SIMPLE"
                      ? "Optional. Add color, size, etc. for display and filtering (no separate variants)."
                      : "Select attributes and values to generate variants (each combination = one variant)."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AttributeSelector
                    selectedAttributes={selectedAttributes}
                    onAttributesChange={setSelectedAttributes}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Inventory
                  </CardTitle>
                  <CardDescription>
                    {productType === "VARIABLE"
                      ? "Set stock (and optional price/SKU) for each variant"
                      : "Simple product: single stock and price"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {productType === "VARIABLE" ? (
                    selectedAttributes.some((a) => a.values.length > 0) ? (
                      <VariantMatrix
                        selectedAttributes={selectedAttributes}
                        variantStocks={variantStocks}
                        onVariantStocksChange={handleVariantStocksChange}
                      />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        <p>Select attribute values above to generate variants</p>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      <p>Simple product: single stock and price.</p>
                      <p className="text-sm mt-1">
                        Add optional attributes above for display only.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Images</CardTitle>
                  <CardDescription>
                    Upload product images or use the default placeholder
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageUploader images={images} onChange={setImages} maxImages={10} />
                </CardContent>
              </Card>

              <SizeGuideEditor value={sizeChart} onChange={setSizeChart} />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Active</FormLabel>
                          <FormDescription>
                            Product visible in store
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Featured</FormLabel>
                          <FormDescription>
                            Show on homepage
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Organization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          value={field.value ?? "__none__"}
                          onValueChange={(v) => field.onChange(v === "__none__" ? null : v)}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">No category</SelectItem>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.parent
                                  ? `${category.parent.name} › ${category.name}`
                                  : category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
