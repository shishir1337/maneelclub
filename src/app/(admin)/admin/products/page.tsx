"use client";

import { useState, useEffect } from "react";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, Loader2 } from "lucide-react";
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
import { getAdminProducts, deleteProduct, toggleProductStatus, getAdminCategories } from "@/actions/admin/products";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";

interface Product {
  id: string;
  title: string;
  slug: string;
  regularPrice: number | string | { toString(): string };
  salePrice: number | string | { toString(): string } | null;
  images: string[];
  stock: number;
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
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
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
                      <Badge
                        variant={product.stock > 10 ? "secondary" : "destructive"}
                      >
                        {product.stock} in stock
                      </Badge>
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
