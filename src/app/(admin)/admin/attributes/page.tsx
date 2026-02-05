"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Loader2, GripVertical, Palette, X } from "lucide-react";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  getAttributes,
  createAttribute,
  deleteAttribute,
  createAttributeValue,
  updateAttributeValue,
  deleteAttributeValue,
} from "@/actions/admin/attributes";
import { slugify } from "@/lib/format";
import { toast } from "sonner";

interface AttributeValue {
  id: string;
  value: string;
  displayValue: string;
  metadata: { hex?: string } | null;
  sortOrder: number;
}

interface Attribute {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  values: AttributeValue[];
  _count?: { products: number };
}

export default function AdminAttributesPage() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [attributeDialogOpen, setAttributeDialogOpen] = useState(false);
  const [valueDialogOpen, setValueDialogOpen] = useState(false);
  const [deleteAttributeId, setDeleteAttributeId] = useState<string | null>(null);
  const [deleteValueId, setDeleteValueId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states for new attribute
  const [attributeName, setAttributeName] = useState("");
  const [attributeSlug, setAttributeSlug] = useState("");

  // Form states for new value
  const [selectedAttributeId, setSelectedAttributeId] = useState<string | null>(null);
  const [valueDisplayValue, setValueDisplayValue] = useState("");
  const [valueValue, setValueValue] = useState("");
  const [valueHex, setValueHex] = useState("");
  const [editingValueId, setEditingValueId] = useState<string | null>(null);

  useEffect(() => {
    loadAttributes();
  }, []);

  async function loadAttributes() {
    setLoading(true);
    try {
      const result = await getAttributes();
      if (result.success && result.data) {
        setAttributes(result.data as Attribute[]);
      } else {
        toast.error(result.error || "Failed to load attributes");
      }
    } catch (error) {
      toast.error("Failed to load attributes");
    } finally {
      setLoading(false);
    }
  }

  // ==================== ATTRIBUTE HANDLERS ====================

  function openNewAttributeDialog() {
    setAttributeName("");
    setAttributeSlug("");
    setAttributeDialogOpen(true);
  }

  function handleAttributeNameChange(value: string) {
    setAttributeName(value);
    setAttributeSlug(slugify(value));
  }

  async function handleCreateAttribute() {
    if (!attributeName.trim()) {
      toast.error("Attribute name is required");
      return;
    }

    setActionLoading(true);
    try {
      const result = await createAttribute({
        name: attributeName.trim(),
        slug: attributeSlug.trim() || slugify(attributeName),
        sortOrder: attributes.length,
      });

      if (result.success) {
        toast.success("Attribute created successfully");
        setAttributeDialogOpen(false);
        loadAttributes();
      } else {
        toast.error(result.error || "Failed to create attribute");
      }
    } catch (error) {
      toast.error("Failed to create attribute");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteAttribute(id: string) {
    setActionLoading(true);
    try {
      const result = await deleteAttribute(id);
      if (result.success) {
        setAttributes((prev) => prev.filter((a) => a.id !== id));
        toast.success("Attribute deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete attribute");
      }
    } catch (error) {
      toast.error("Failed to delete attribute");
    } finally {
      setActionLoading(false);
      setDeleteAttributeId(null);
    }
  }

  // ==================== VALUE HANDLERS ====================

  function openNewValueDialog(attributeId: string) {
    setSelectedAttributeId(attributeId);
    setValueDisplayValue("");
    setValueValue("");
    setValueHex("");
    setEditingValueId(null);
    setValueDialogOpen(true);
  }

  function openEditValueDialog(attributeId: string, value: AttributeValue) {
    setSelectedAttributeId(attributeId);
    setValueDisplayValue(value.displayValue);
    setValueValue(value.value);
    setValueHex(value.metadata?.hex || "");
    setEditingValueId(value.id);
    setValueDialogOpen(true);
  }

  function handleValueDisplayChange(value: string) {
    setValueDisplayValue(value);
    if (!editingValueId) {
      setValueValue(slugify(value));
    }
  }

  async function handleSaveValue() {
    if (!valueDisplayValue.trim()) {
      toast.error("Display value is required");
      return;
    }
    if (!selectedAttributeId) return;

    setActionLoading(true);
    try {
      const metadata = valueHex ? { hex: valueHex } : null;

      if (editingValueId) {
        // Update existing value
        const result = await updateAttributeValue(editingValueId, {
          displayValue: valueDisplayValue.trim(),
          value: valueValue.trim() || slugify(valueDisplayValue),
          metadata,
        });

        if (result.success) {
          toast.success("Value updated successfully");
          setValueDialogOpen(false);
          loadAttributes();
        } else {
          toast.error(result.error || "Failed to update value");
        }
      } else {
        // Create new value
        const attribute = attributes.find((a) => a.id === selectedAttributeId);
        const result = await createAttributeValue(selectedAttributeId, {
          displayValue: valueDisplayValue.trim(),
          value: valueValue.trim() || slugify(valueDisplayValue),
          metadata,
          sortOrder: attribute?.values.length || 0,
        });

        if (result.success) {
          toast.success("Value created successfully");
          setValueDialogOpen(false);
          loadAttributes();
        } else {
          toast.error(result.error || "Failed to create value");
        }
      }
    } catch (error) {
      toast.error("Failed to save value");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteValue(id: string) {
    setActionLoading(true);
    try {
      const result = await deleteAttributeValue(id);
      if (result.success) {
        toast.success("Value deleted successfully");
        loadAttributes();
      } else {
        toast.error(result.error || "Failed to delete value");
      }
    } catch (error) {
      toast.error("Failed to delete value");
    } finally {
      setActionLoading(false);
      setDeleteValueId(null);
    }
  }

  // Filter attributes
  const filteredAttributes = attributes.filter(
    (attr) =>
      attr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attr.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if attribute is Color type (for hex input)
  function isColorAttribute(attributeId: string) {
    const attr = attributes.find((a) => a.id === attributeId);
    return attr?.slug === "color";
  }

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
          <h1 className="text-2xl font-bold">Attributes</h1>
          <p className="text-muted-foreground">
            Manage product attributes like Color, Size, Material, etc.
          </p>
        </div>
        <Button onClick={openNewAttributeDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Attribute
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search attributes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Attributes List */}
      {filteredAttributes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No attributes found</p>
            <Button onClick={openNewAttributeDialog}>
              Add your first attribute
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {filteredAttributes.map((attribute) => (
            <AccordionItem
              key={attribute.id}
              value={attribute.id}
              className="border rounded-lg bg-card"
            >
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-3 flex-1">
                  <span className="font-semibold">{attribute.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {attribute.values.length} values
                  </Badge>
                  {attribute._count && attribute._count.products > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {attribute._count.products} products
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  {/* Attribute Actions */}
                  <div className="flex items-center justify-between">
                    <code className="text-sm text-muted-foreground">
                      slug: {attribute.slug}
                    </code>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openNewValueDialog(attribute.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Value
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteAttributeId(attribute.id)}
                        disabled={
                          (attribute._count?.products || 0) > 0 ||
                          attribute.values.length > 0
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Values Table */}
                  {attribute.values.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]"></TableHead>
                          <TableHead>Display Value</TableHead>
                          <TableHead>Slug</TableHead>
                          {attribute.slug === "color" && (
                            <TableHead>Color</TableHead>
                          )}
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attribute.values.map((value) => (
                          <TableRow key={value.id}>
                            <TableCell>
                              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                            </TableCell>
                            <TableCell className="font-medium">
                              {value.displayValue}
                            </TableCell>
                            <TableCell>
                              <code className="text-sm">{value.value}</code>
                            </TableCell>
                            {attribute.slug === "color" && (
                              <TableCell>
                                {value.metadata?.hex && (
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-6 h-6 rounded border"
                                      style={{
                                        backgroundColor: value.metadata.hex,
                                      }}
                                    />
                                    <code className="text-xs">
                                      {value.metadata.hex}
                                    </code>
                                  </div>
                                )}
                              </TableCell>
                            )}
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() =>
                                    openEditValueDialog(attribute.id, value)
                                  }
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => setDeleteValueId(value.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}

                  {attribute.values.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No values yet. Add some values to use this attribute.
                    </p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Create Attribute Dialog */}
      <Dialog open={attributeDialogOpen} onOpenChange={setAttributeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Attribute</DialogTitle>
            <DialogDescription>
              Create a new product attribute like Color, Size, or Material.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="attr-name">Name *</Label>
              <Input
                id="attr-name"
                placeholder="e.g., Color, Size, Material"
                value={attributeName}
                onChange={(e) => handleAttributeNameChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attr-slug">Slug</Label>
              <Input
                id="attr-slug"
                placeholder="e.g., color, size, material"
                value={attributeSlug}
                onChange={(e) => setAttributeSlug(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                URL-friendly name. Auto-generated if left empty.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAttributeDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateAttribute} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Attribute"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Value Dialog */}
      <Dialog open={valueDialogOpen} onOpenChange={setValueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingValueId ? "Edit Value" : "Add New Value"}
            </DialogTitle>
            <DialogDescription>
              {editingValueId
                ? "Update the attribute value."
                : "Add a new value to this attribute."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="value-display">Display Value *</Label>
              <Input
                id="value-display"
                placeholder="e.g., Black, XL, Cotton"
                value={valueDisplayValue}
                onChange={(e) => handleValueDisplayChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value-slug">Slug</Label>
              <Input
                id="value-slug"
                placeholder="e.g., black, xl, cotton"
                value={valueValue}
                onChange={(e) => setValueValue(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Internal identifier. Auto-generated if left empty.
              </p>
            </div>
            {selectedAttributeId && isColorAttribute(selectedAttributeId) && (
              <div className="space-y-2">
                <Label htmlFor="value-hex">Color (Hex)</Label>
                <div className="flex gap-2">
                  <Input
                    id="value-hex"
                    type="color"
                    value={valueHex || "#000000"}
                    onChange={(e) => setValueHex(e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    placeholder="#000000"
                    value={valueHex}
                    onChange={(e) => setValueHex(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setValueDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveValue} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingValueId ? (
                "Update Value"
              ) : (
                "Add Value"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Attribute Confirmation */}
      <AlertDialog
        open={!!deleteAttributeId}
        onOpenChange={() => setDeleteAttributeId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attribute</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this attribute? This will also
              delete all its values. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteAttributeId && handleDeleteAttribute(deleteAttributeId)
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

      {/* Delete Value Confirmation */}
      <AlertDialog
        open={!!deleteValueId}
        onOpenChange={() => setDeleteValueId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Value</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this value? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteValueId && handleDeleteValue(deleteValueId)}
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
