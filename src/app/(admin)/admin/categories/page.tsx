"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/actions/admin/products";
import { slugify } from "@/lib/format";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  parent?: { id: string; name: string; slug: string } | null;
  children?: Category[];
  _count?: { products: number };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    try {
      const result = await getAdminCategories();
      if (result.success) {
        setCategories(result.data as Category[]);
      } else {
        toast.error(result.error || "Failed to load categories");
      }
    } catch (error) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  const parentCategories = useMemo(
    () => categories.filter((c) => !c.parentId),
    [categories]
  );

  async function handleCreate() {
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setActionLoading(true);
    try {
      const categorySlug = slug.trim() || slugify(name);
      const result = await createCategory(
        name.trim(),
        categorySlug,
        description.trim() || undefined,
        parentId || undefined
      );

      if (result.success) {
        toast.success("Category created successfully");
        setDialogOpen(false);
        resetForm();
        loadCategories();
      } else {
        toast.error(result.error || "Failed to create category");
      }
    } catch (error) {
      toast.error("Failed to create category");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUpdate() {
    if (!editCategoryId || !name.trim()) return;

    setActionLoading(true);
    try {
      const categorySlug = slug.trim() || slugify(name);
      const result = await updateCategory(editCategoryId, {
        name: name.trim(),
        slug: categorySlug,
        description: description.trim() || undefined,
        parentId: parentId || null,
      });

      if (result.success) {
        toast.success("Category updated successfully");
        setDialogOpen(false);
        setEditCategoryId(null);
        resetForm();
        loadCategories();
      } else {
        toast.error(result.error || "Failed to update category");
      }
    } catch (error) {
      toast.error("Failed to update category");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setActionLoading(true);
    try {
      const result = await deleteCategory(id);
      if (result.success) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        toast.success("Category deleted successfully");
        loadCategories();
      } else {
        toast.error(result.error || "Failed to delete category");
      }
    } catch (error) {
      toast.error("Failed to delete category");
    } finally {
      setActionLoading(false);
      setDeleteCategoryId(null);
    }
  }

  function resetForm() {
    setName("");
    setSlug("");
    setDescription("");
    setParentId(null);
  }

  function openNewDialog() {
    resetForm();
    setEditCategoryId(null);
    setDialogOpen(true);
  }

  function openEditDialog(category: Category) {
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description || "");
    setParentId(category.parentId || null);
    setEditCategoryId(category.id);
    setDialogOpen(true);
  }

  function handleNameChange(value: string) {
    setName(value);
    if (!slug || slug === slugify(name)) {
      setSlug(slugify(value));
    }
  }

  // Flatten categories for table: parents first, then children
  const flattenedCategories = useMemo(() => {
    const result: Category[] = [];
    for (const parent of parentCategories) {
      result.push(parent);
      const children = categories.filter((c) => c.parentId === parent.id);
      for (const child of children) {
        result.push(child);
      }
    }
    const orphans = categories.filter((c) => c.parentId && !parentCategories.some((p) => p.id === c.parentId));
    result.push(...orphans);
    return result;
  }, [categories, parentCategories]);

  const filteredCategories = flattenedCategories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (category.parent?.name ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isEdit = !!editCategoryId;
  const parentOptionsForForm = parentCategories.filter(
    (p) => p.id !== editCategoryId
  );

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
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Manage product categories and subcategories
          </p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Products</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">No categories found</p>
                    <Button variant="link" onClick={openNewDialog}>
                      Add your first category
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      {category.parentId ? (
                        <span className="text-muted-foreground pl-4">
                          └ {category.name}
                        </span>
                      ) : (
                        category.name
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                        {category.slug}
                      </code>
                    </TableCell>
                    <TableCell>
                      {category.parent ? (
                        <Badge variant="outline">{category.parent.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {category.description || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {category._count?.products || 0} products
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(category)}
                          title="Edit category"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteCategoryId(category.id)}
                          disabled={(category._count?.products || 0) > 0}
                          title={
                            (category._count?.products || 0) > 0
                              ? "Cannot delete category with products"
                              : "Delete category"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit Category" : "Add New Category"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update category details."
                : "Create a parent category or subcategory."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="parent">Parent Category</Label>
              <Select
                value={parentId || "none"}
                onValueChange={(v) => setParentId(v === "none" ? null : v)}
              >
                <SelectTrigger id="parent" className="w-full">
                  <SelectValue placeholder="None (top-level category)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (top-level category)</SelectItem>
                  {parentOptionsForForm.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Leave empty for a parent category. Products go in subcategories.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Category name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="category-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                URL-friendly name. Auto-generated from name if left empty.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Category description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={isEdit ? handleUpdate : handleCreate}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEdit ? "Updating..." : "Creating..."}
                </>
              ) : isEdit ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteCategoryId}
        onOpenChange={() => setDeleteCategoryId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This action cannot
              be undone. Subcategories will also be deleted if this is a parent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteCategoryId && handleDelete(deleteCategoryId)
              }
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
