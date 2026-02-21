"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  getAdminCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  type CouponRow,
} from "@/actions/admin/coupons";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { formatPrice } from "@/lib/format";

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [value, setValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    loadCoupons();
  }, []);

  async function loadCoupons() {
    setLoading(true);
    try {
      const data = await getAdminCoupons();
      setCoupons(data);
    } catch {
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditId(null);
    setCode("");
    setType("PERCENT");
    setValue("");
    setMinOrderAmount("");
    setMaxUses("");
    setValidFrom("");
    setValidUntil("");
    setIsActive(true);
    setDialogOpen(true);
  }

  function openEdit(c: CouponRow) {
    setEditId(c.id);
    setCode(c.code);
    setType(c.type as "PERCENT" | "FIXED");
    setValue(String(c.value));
    setMinOrderAmount(c.minOrderAmount != null ? String(c.minOrderAmount) : "");
    setMaxUses(c.maxUses != null ? String(c.maxUses) : "");
    setValidFrom(c.validFrom ? new Date(c.validFrom).toISOString().slice(0, 10) : "");
    setValidUntil(c.validUntil ? new Date(c.validUntil).toISOString().slice(0, 10) : "");
    setIsActive(c.isActive);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Code is required");
      return;
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      toast.error("Value must be a positive number");
      return;
    }
    if (type === "PERCENT" && numValue > 100) {
      toast.error("Percentage must be 1–100");
      return;
    }
    setActionLoading(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        type,
        value: numValue,
        minOrderAmount: minOrderAmount.trim() ? parseFloat(minOrderAmount) : undefined,
        maxUses: maxUses.trim() ? parseInt(maxUses, 10) : undefined,
        validFrom: validFrom.trim() || undefined,
        validUntil: validUntil.trim() || undefined,
        isActive,
      };
      if (editId) {
        const result = await updateCoupon(editId, payload);
        if (result.success) {
          toast.success("Coupon updated");
          setDialogOpen(false);
          loadCoupons();
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await createCoupon(payload);
        if (result.success) {
          toast.success("Coupon created");
          setDialogOpen(false);
          loadCoupons();
        } else {
          toast.error(result.error);
        }
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setActionLoading(true);
    try {
      const result = await deleteCoupon(deleteId);
      if (result.success) {
        toast.success("Coupon deleted");
        setDeleteId(null);
        loadCoupons();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to delete");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Coupons</h1>
        <p className="text-muted-foreground mt-1">
          Create discount codes for customers to use at checkout.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Coupons</CardTitle>
            <CardDescription>
              Percent or fixed-amount discounts. Optional min order, usage limit, and validity dates.
            </CardDescription>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Coupon
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Min order</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Valid</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No coupons yet. Add a coupon for customers to use at checkout.
                    </TableCell>
                  </TableRow>
                ) : (
                  coupons.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono font-medium">{c.code}</TableCell>
                      <TableCell>{c.type === "PERCENT" ? "Percent" : "Fixed"}</TableCell>
                      <TableCell>
                        {c.type === "PERCENT" ? `${c.value}%` : formatPrice(c.value)}
                      </TableCell>
                      <TableCell>
                        {c.minOrderAmount != null ? formatPrice(c.minOrderAmount) : "—"}
                      </TableCell>
                      <TableCell>
                        {c.maxUses != null ? `${c.usedCount} / ${c.maxUses}` : `${c.usedCount}`}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(c.validFrom)} – {formatDate(c.validUntil)}
                      </TableCell>
                      <TableCell>
                        <span className={c.isActive ? "text-green-600" : "text-muted-foreground"}>
                          {c.isActive ? "Yes" : "No"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(c.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Coupon" : "Add Coupon"}</DialogTitle>
            <DialogDescription>
              Customers will enter this code at checkout to get a discount.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="coupon-code">Code</Label>
              <Input
                id="coupon-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SAVE10"
                className="font-mono"
                disabled={!!editId}
              />
              {editId && (
                <p className="text-xs text-muted-foreground">Code cannot be changed when editing.</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v: "PERCENT" | "FIXED") => setType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">Percent off</SelectItem>
                    <SelectItem value="FIXED">Fixed amount (BDT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-value">{type === "PERCENT" ? "Percent (1–100)" : "Amount (BDT)"}</Label>
                <Input
                  id="coupon-value"
                  type="number"
                  min={type === "PERCENT" ? 1 : 0.01}
                  max={type === "PERCENT" ? 100 : undefined}
                  step={type === "PERCENT" ? 1 : 0.01}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={type === "PERCENT" ? "10" : "100"}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-order">Min order (BDT, optional)</Label>
                <Input
                  id="min-order"
                  type="number"
                  min="0"
                  step="1"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                  placeholder="No minimum"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-uses">Max uses (optional)</Label>
                <Input
                  id="max-uses"
                  type="number"
                  min="1"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="Unlimited"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid-from">Valid from (optional)</Label>
                <Input
                  id="valid-from"
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid-until">Valid until (optional)</Label>
                <Input
                  id="valid-until"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="active">Active (customers can use this coupon)</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editId ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => !actionLoading && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This cannot be undone. Existing orders that used this coupon are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
