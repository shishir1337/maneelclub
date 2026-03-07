"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, FileSearch, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { getStockMovements, type StockMovementRow, type StockMovementReason } from "@/actions/admin/stock-audit";

const STOCK_MOVEMENT_REASONS: StockMovementReason[] = [
  "ORDER_CREATED",
  "ORDER_CANCELLED",
  "ORDER_DELETED",
  "PAYMENT_REJECTED",
  "MANUAL_EDIT",
  "ORDER_REACTIVATED",
];
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 30;

export default function StockAuditPage() {
  const [movements, setMovements] = useState<StockMovementRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [productId, setProductId] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [reason, setReason] = useState<string>("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [applied, setApplied] = useState(0); // bump to re-apply filters

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => setLoading(true));
    getStockMovements({
      productId: productId.trim() || undefined,
      orderNumber: orderNumber.trim() || undefined,
      reason: (reason as StockMovementReason) || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (!res.success) {
        toast.error(res.error);
        setMovements([]);
        setTotal(0);
        return;
      }
      setMovements(res.data.movements);
      setTotal(res.data.total);
    });
    return () => { cancelled = true; };
  }, [page, applied, productId, orderNumber, reason, fromDate, toDate]);

  const handleApply = () => {
    setPage(1);
    setApplied((c) => c + 1);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Stock audit</h1>
        <p className="text-muted-foreground">
          View all stock movements (orders, cancellations, manual edits) to trace discrepancies.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSearch className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter by product ID, order number, reason, or date range. Sum of &quot;Delta&quot; per product should match current stock when starting from a known baseline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Product ID</label>
              <Input
                placeholder="e.g. clxx..."
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Order number</label>
              <Input
                placeholder="e.g. 2524"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <Select value={reason || "all"} onValueChange={(v) => setReason(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All reasons" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All reasons</SelectItem>
                  {STOCK_MOVEMENT_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">From date</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">To date</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleApply} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
            Apply
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Movements</CardTitle>
          <CardDescription>
            {total} record(s). Delta: negative = stock deducted, positive = stock restored or added.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : movements.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No movements match the filters.</p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Delta</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDateTime(m.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/admin/products/${m.productId}`}
                            className="text-primary hover:underline font-medium"
                          >
                            {m.productTitle}
                          </Link>
                          {m.variantId && (
                            <span className="text-muted-foreground text-xs block">Variant ID: {m.variantId.slice(0, 8)}…</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={m.delta < 0 ? "text-destructive font-medium" : "text-green-600 dark:text-green-400 font-medium"}>
                            {m.delta < 0 ? <ArrowDownRight className="h-4 w-4 inline mr-1" /> : <ArrowUpRight className="h-4 w-4 inline mr-1" />}
                            {m.delta > 0 ? "+" : ""}{m.delta}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{m.reason}</span>
                        </TableCell>
                        <TableCell>
                          {m.orderNumber && m.orderId ? (
                            <Link
                              href={`/admin/orders/${m.orderId}`}
                              className="text-primary hover:underline"
                            >
                              #{m.orderNumber}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
