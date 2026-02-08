"use client";

import { useState, useEffect } from "react";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { UNLIMITED_STOCK } from "@/lib/constants";
import { getAdminProducts, deleteProduct, toggleProductStatus, getAdminCategories } from "@/actions/admin/products";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductVariant {
  id: string;
  stock: number;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  regularPrice: number | string | { toString(): string };
  salePrice: number | string | { toString(): string } | null;
  images: string[];
  stock: number;
  productType: "SIMPLE" | "VARIABLE";
  variants?: ProductVariant[];
  isActive: boolean;
  isFeatured: boolean;
  category?: {
    id: string;
    name: string;
    slug: string;
    parentId?: string | null;
    parent?: { name: string } | null;
  } | null;
  createdAt: Date;
}

// Low stock threshold
const LOW_STOCK_THRESHOLD = 5;

// Calculate total stock (including variants for variable products)
function getTotalStock(product: Product): number {
  if (product.productType === "VARIABLE" && product.variants && product.variants.length > 0) {
    return product.variants.reduce((sum, v) => sum + v.stock, 0);
  }
  return product.stock;
}

// Check if product has low stock
function isLowStock(product: Product): boolean {
  const totalStock = getTotalStock(product);
  return totalStock > 0 && totalStock <= LOW_STOCK_THRESHOLD;
}

// Check if product is out of stock
function isOutOfStock(product: Product): boolean {
  return getTotalStock(product) === 0;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  parent?: { name: string } | null;
  _count?: { products: number };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [productsResult, categoriesResult] = await Promise.all([
        getAdminProducts(),
        getAdminCategories(),
      ]);

      if (productsResult.success) {
        setProducts(productsResult.data as Product[]);
      } else {
        toast.error(productsResult.error || "Failed to load products");
      }

      if (categoriesResult.success) {
        setCategories(categoriesResult.data as Category[]);
      }
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setActionLoading(id);
    try {
      const result = await deleteProduct(id);
      if (result.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        toast.success("Product deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete product");
      }
    } catch (error) {
      toast.error("Failed to delete product");
    } finally {
      setActionLoading(null);
      setDeleteProductId(null);
    }
  }

  async function handleToggleStatus(id: string) {
    setActionLoading(id);
    try {
      const result = await toggleProductStatus(id);
      if (result.success) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, isActive: !p.isActive } : p
          )
        );
        toast.success("Product status updated");
      } else {
        toast.error(result.error || "Failed to update product");
      }
    } catch (error) {
      toast.error("Failed to update product");
    } finally {
      setActionLoading(null);
    }
  }

  // Filter products (support parent: show all products in subcategories)
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" ||
      product.category?.id === categoryFilter ||
      product.category?.parentId === categoryFilter;
    
    // Stock filter
    let matchesStock = true;
    if (stockFilter === "low") {
      matchesStock = isLowStock(product);
    } else if (stockFilter === "out") {
      matchesStock = isOutOfStock(product);
    } else if (stockFilter === "in") {
      matchesStock = getTotalStock(product) > LOW_STOCK_THRESHOLD;
    }
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  // Count low stock and out of stock products
  const lowStockCount = products.filter(isLowStock).length;
  const outOfStockCount = products.filter(isOutOfStock).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-28 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-[160px]" />
              <Skeleton className="h-10 w-[160px]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0">
            <TableSkeleton columns={6} rows={10} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Stock Alerts */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="flex flex-wrap gap-3 sm:gap-4">
          {outOfStockCount > 0 && (
            <Card 
              className="flex-1 min-w-[140px] sm:min-w-[200px] border-red-200 bg-red-50 dark:bg-red-950/20 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setStockFilter("out")}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
                </div>
              </CardContent>
            </Card>
          )}
          {lowStockCount > 0 && (
            <Card 
              className="flex-1 min-w-[140px] sm:min-w-[200px] border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setStockFilter("low")}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Low Stock</p>
                  <p className="text-2xl font-bold text-yellow-600">{lowStockCount}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.parent
                      ? `${category.parent.name} › ${category.name}`
                      : category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="in">In Stock</SelectItem>
                <SelectItem value="low">Low Stock ({`≤${LOW_STOCK_THRESHOLD}`})</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mobile: Product cards (small screens only) */}
      <div className="block md:hidden space-y-3">
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No products found</p>
              <Link href="/admin/products/new">
                <Button variant="link" className="mt-2">Add your first product</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          filteredProducts.map((product) => {
            const totalStock = getTotalStock(product);
            const outOfStock = isOutOfStock(product);
            const lowStock = isLowStock(product);
            return (
              <Card key={product.id} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    <div className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                      <Image
                        src={product.images?.[0] || "/productImage.jpeg"}
                        alt={product.title}
                        fill
                        className="object-cover"
                        unoptimized={(product.images?.[0] ?? "").startsWith("/uploads/")}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-2">{product.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {product.category
                          ? product.category.parent
                            ? `${product.category.parent.name} › ${product.category.name}`
                            : product.category.name
                          : "Uncategorized"}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-sm font-medium">
                          {product.salePrice
                            ? formatPrice(Number(product.salePrice.toString()))
                            : formatPrice(Number(product.regularPrice.toString()))}
                        </span>
                        {outOfStock ? (
                          <Badge variant="destructive" className="text-xs">Out</Badge>
                        ) : lowStock ? (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">{totalStock} left</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {totalStock >= UNLIMITED_STOCK ? "Unlimited" : `${totalStock} in stock`}
                          </Badge>
                        )}
                        <Badge
                          variant={product.isActive ? "default" : "secondary"}
                          className="text-xs cursor-pointer"
                          onClick={() => handleToggleStatus(product.id)}
                        >
                          {actionLoading === product.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : product.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                          <Link href={`/product/${product.slug}`} target="_blank">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                          <Link href={`/admin/products/${product.id}`}>
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs text-destructive hover:text-destructive"
                          onClick={() => setDeleteProductId(product.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Desktop: Products Table (md and up) */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">No products found</p>
                    <Link href="/admin/products/new">
                      <Button variant="link">Add your first product</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="relative h-12 w-12 rounded overflow-hidden bg-muted">
                        <Image
                          src={product.images?.[0] || "/productImage.jpeg"}
                          alt={product.title}
                          fill
                          className="object-cover"
                          unoptimized={(product.images?.[0] ?? "").startsWith("/uploads/")}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.title}</p>
                        <p className="text-sm text-muted-foreground">
                          /{product.slug}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {product.category
                          ? product.category.parent
                            ? `${product.category.parent.name} › ${product.category.name}`
                            : product.category.name
                          : "Uncategorized"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        {product.salePrice ? (
                          <>
                            <p className="font-medium">
                              {formatPrice(Number(product.salePrice.toString()))}
                            </p>
                            <p className="text-sm text-muted-foreground line-through">
                              {formatPrice(Number(product.regularPrice.toString()))}
                            </p>
                          </>
                        ) : (
                          <p className="font-medium">
                            {formatPrice(Number(product.regularPrice.toString()))}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const totalStock = getTotalStock(product);
                        const outOfStock = isOutOfStock(product);
                        const lowStock = isLowStock(product);
                        
                        return (
                          <div className="flex items-center gap-2">
                            {outOfStock ? (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Out of stock
                              </Badge>
                            ) : lowStock ? (
                              <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {totalStock} left
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                {totalStock >= UNLIMITED_STOCK ? "Unlimited" : `${totalStock} in stock`}
                              </Badge>
                            )}
                            {product.productType === "VARIABLE" && product.variants && product.variants.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                ({product.variants.length} variants)
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={product.isActive ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => handleToggleStatus(product.id)}
                      >
                        {actionLoading === product.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : product.isActive ? (
                          "Active"
                        ) : (
                          "Inactive"
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/product/${product.slug}`} target="_blank">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/products/${product.id}`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteProductId(product.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteProductId}
        onOpenChange={() => setDeleteProductId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProductId && handleDelete(deleteProductId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
